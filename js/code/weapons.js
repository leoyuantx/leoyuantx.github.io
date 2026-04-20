        function updateProjectiles(dt) {
            for (let i = projectiles.length - 1; i >= 0; i--) {
                const proj = projectiles[i];
                proj.x += proj.vx * dt;
                proj.y += proj.vy * dt;
                
                // Apply gravity to appropriate projectiles
                if (!proj.enemyArrow && !proj.magicBolt && !proj.laser && !proj.missile && !proj.cannonBall && !proj.jetBullet) {
                    proj.vy += 200 * dt;
                }
                
                // Apply gravity to artillery shells and rockets (high arc)
                if (proj.artilleryShell || proj.rocket) {
                    proj.vy += 400 * dt;
                }
                
                // Slight gravity for cannon balls
                if (proj.cannonBall) {
                    proj.vy += 150 * dt;
                }

                if (proj.x < -50 || proj.x > canvas.width + 50 || proj.y > canvas.height + 50) { projectiles.splice(i, 1); continue; }

                // Enemy projectiles hit player (including vehicle projectiles)
                if (proj.enemyArrow || proj.magicBolt || proj.cannonBall || proj.artilleryShell || 
                    proj.missile || proj.laser || proj.rocket || proj.jetBullet) {
                    const hitPlayer = proj.x > player.x - player.w / 2 && proj.x < player.x + player.w / 2 && 
                                      proj.y > player.y && proj.y < player.y + player.h;
                    if (hitPlayer && player.invulnTimer <= 0) {
                        let damage = proj.damage || 5;
                        if (proj.magicBolt) damage = 8;
                        if (!proj.damage && proj.enemyArrow) damage = 5;
                        
                        player.hp -= damage;
                        player.invulnTimer = 0.8;
                        
                        // Different explosion effects for different projectile types
                        if (proj.artilleryShell || proj.rocket) {
                            effects.push({ type: 'fire', x: player.x, y: player.y, timer: 0.8, color: '#dc2626' });
                        } else if (proj.laser) {
                            effects.push({ type: 'lightning', x: player.x, y: player.y, timer: 0.3, color: '#dc2626' });
                        } else {
                            effects.push({ type: 'hit', x: player.x, y: player.y, timer: 0.3 });
                        }
                        
                        projectiles.splice(i, 1);
                        if (player.hp <= 0) {
                            gameState = 'dead';
                            setTimeout(() => { alert('YOU DIED! PRESS OK TO TRY AGAIN.'); setupLevel(currentLevel); gameState = 'playing'; }, 100);
                        }
                        continue;
                    }
                }

                // Player arrows hit enemies
                if (!proj.enemyArrow && !proj.magicBolt) {
                    for (const enemy of enemies) {
                        if (!enemy.alive) continue;
                        
                        let hitEnemy = false;
                        
                        // Check collision with main enemy body
                        if (proj.x > enemy.x - enemy.w / 2 && proj.x < enemy.x + enemy.w / 2 && proj.y > enemy.y && proj.y < enemy.y + enemy.h) {
                            hitEnemy = true;
                        }
                        
                        // Also check collision with ejected boss pilot (smaller hitbox)
                        if (enemy.ejected && enemy.isBoss) {
                            if (proj.x > enemy.ejectedX - 8 && proj.x < enemy.ejectedX + 8 && 
                                proj.y > enemy.ejectedY && proj.y < enemy.ejectedY + 24) {
                                hitEnemy = true;
                            }
                        }
                        
                        if (hitEnemy) {
                            // Get arrow damage
                            const arrowData = ARROW_TYPES[proj.arrowType || 'basic'];
                            const bowData = BOW_TYPES[proj.bowType || 'basic'];
                            let damage = arrowData.damage * bowData.damageMultiplier;
                        
                        // Apply bow special effects
                        if (proj.bowType === 'fire') {
                            // Fire bow sets enemies on fire
                            enemy.burning = true;
                            enemy.burnTimer = 3;
                            enemy.burnDamage = 2;
                            effects.push({ type: 'fire', x: enemy.x, y: enemy.y, timer: 0.5, color: '#ef4444' });
                        } else if (proj.bowType === 'lightning') {
                            // Lightning bow creates lightning strike
                            effects.push({ type: 'lightning', x: enemy.x, y: enemy.y - 80, timer: 0.4, color: '#eab308' });
                            // Chain to nearby enemies
                            for (const nearEnemy of enemies) {
                                if (nearEnemy !== enemy && nearEnemy.alive && Math.abs(nearEnemy.x - enemy.x) < 150) {
                                    damageEnemy(nearEnemy, damage * 0.5, 'arrow');
                                    effects.push({ type: 'lightning', x: nearEnemy.x, y: nearEnemy.y - 60, timer: 0.3, color: '#eab308' });
                                }
                            }
                        } else if (proj.bowType === 'ice') {
                            // Ice bow freezes enemy
                            enemy.frozen = true;
                            enemy.freezeTimer = 5;
                            enemy.originalSpeed = enemy.speed;
                            enemy.speed = 0;
                            effects.push({ type: 'ice', x: enemy.x, y: enemy.y, timer: 0.5, color: '#3b82f6' });
                        }
                        
                        damageEnemy(enemy, damage, 'arrow');
                        projectiles.splice(i, 1);
                        break;
                    }
                }
            }
            }
        }

        function updateEffects(dt) { for (let i = effects.length - 1; i >= 0; i--) { effects[i].timer -= dt; if (effects[i].timer <= 0) effects.splice(i, 1); } }

        function updateDrops(dt) {
            for (let i = drops.length - 1; i >= 0; i--) {
                const drop = drops[i];
                drop.y += 100 * dt;
                if (drop.y > groundY() - 16) drop.y = groundY() - 16;
                const dx = player.x - drop.x, dy = (player.y + player.h / 2) - drop.y;
                if (Math.hypot(dx, dy) < 40) {
                    if (drop.type === 'gold') { 
                        const goldValue = drop.value || 5;
                        player.money += goldValue; 
                        effects.push({ type: 'pickup', x: drop.x, y: drop.y - 20, timer: 0.5, text: '+' + goldValue + ' MONEY', color: '#FFD700' }); 
                        saveGame(); 
                    }
                    if (drop.type === 'silver') { player.money += 1; effects.push({ type: 'pickup', x: drop.x, y: drop.y - 20, timer: 0.5, text: '+1 MONEY', color: '#C0C0C0' }); saveGame(); }
                    if (drop.type === 'arrow') { player.arrows += 3; saveGame(); }
                    if (drop.type === 'potion') {
                        const success = addPotionToSlot(drop.potionType);
                        if (success) {
                            const potion = POTIONS[drop.potionType];
                            effects.push({ type: 'pickup', x: drop.x, y: drop.y - 20, timer: 0.8, text: potion.name, color: potion.color });
                            saveGame();
                        } else {
                            // Can't pick up, slots are full - don't remove the drop yet
                            continue;
                        }
                    }
                    drops.splice(i, 1);
                }
            }
            
            // Update shop animation
            if (shopsMovingIn) {
                shopAnimationProgress += dt * 0.8; // Animation speed
                if (shopAnimationProgress >= 1.0) {
                    shopAnimationProgress = 1.0;
                    shopsMovingIn = false;
                }
            } else if (shopsMovingOut) {
                shopAnimationProgress += dt * 3.0; // Faster exit animation
                if (shopAnimationProgress >= 2.0) {
                    shopAnimationProgress = 2.0;
                    shopsMovingOut = false;
                    // Move to next level
                    // Check if game is complete
                    if (currentLevel >= 299) {
                        triggerGameEnding();
                        return;
                    }
                    currentLevel++;
                    setupLevel(currentLevel);
                }
            }
            
            // Start shop exit animation when player goes far right
            if (levelComplete && !shopsMovingOut && !shopsMovingIn && player.x > canvas.width * 0.8) {
                shopsMovingOut = true;
                shopAnimationProgress = 1.0;
            }
        }

        function performSwordAttack() {
            if (player.attackCooldown > 0) return;
            player.attacking = true;
            player.attackTimer = 0.25;
            player.attackCooldown = 0.4;
            player.totalSwings++;

            const reach = 60;
            const hitX = player.x + player.facing * reach;
            const hitY = player.y + player.h / 2;

            effects.push({ type: 'slash', x: hitX, y: hitY, facing: player.facing, timer: 0.15 });

            for (const enemy of enemies) {
                if (!enemy.alive) continue;
                
                // Check collision with main enemy body
                if (Math.hypot(enemy.x - hitX, (enemy.y + enemy.h / 2) - hitY) < 70) {
                    damageEnemy(enemy, 3, 'sword');
                }
                
                // Also check collision with ejected boss pilot
                if (enemy.ejected && enemy.isBoss) {
                    if (Math.hypot(enemy.ejectedX - hitX, (enemy.ejectedY + 12) - hitY) < 40) {
                        damageEnemy(enemy, 3, 'sword');
                    }
                }
            }
        }

        function shootArrow() {
            if (!bowTarget || player.arrows <= 0) return;
            player.arrows--;
            player.totalShots++;

            const dx = bowTarget.x - player.x;
            const dy = (bowTarget.y + bowTarget.h / 2) - (player.y + player.h / 2);
            const dist = Math.hypot(dx, dy);
            
            // Get arrow type properties
            const arrowData = ARROW_TYPES[player.arrowType];
            const speed = arrowData.speed;

            projectiles.push({
                x: player.x,
                y: player.y + player.h / 2,
                vx: (dx / dist) * speed,
                vy: (dy / dist) * speed * 0.5,
                bowType: player.bowType,
                arrowType: player.arrowType,
                target: bowTarget
            });

            bowMode = false;
            bowTarget = null;
            bowIndicator.classList.add('hidden');
            bowIndicator.classList.remove('targeted');
            bowIndicator.textContent = 'BOW MODE - CLICK ENEMY TO TARGET';
        }

        function getSwordDamage() {
            const materialIndex = MATERIALS.indexOf(player.swordMaterial);
            const baseDamage = 3 + materialIndex * 2; // wooden=3, rock=5, silver=7, etc.
            const levelBonus = (player.swordLevel - 1) * 0.5; // Each level adds 0.5 damage
            const potionMultiplier = player.potionEffects.damage.multiplier;
            return (baseDamage + levelBonus) * potionMultiplier;
        }

        function getShieldBlock() {
            if (!player.shieldMaterial) {
                // Check for shield potion effect
                if (player.potionEffects.shield.active) {
                    return player.potionEffects.shield.strength;
                }
                return 0;
            }
            const materialIndex = MATERIALS.indexOf(player.shieldMaterial);
            const baseBlock = 0.1 + materialIndex * 0.1; // wooden=10%, rock=20%, etc.
            const levelBonus = player.shieldLevel * 0.02; // Each level adds 2%
            let block = Math.min(0.9, baseBlock + levelBonus);
            // Add shield potion effect
            if (player.potionEffects.shield.active) {
                block = Math.min(1.0, block + player.potionEffects.shield.strength);
            }
            // Holding C with shield raised blocks 50% more (additive)
            if (player.shieldUp) block = Math.min(1.0, block + 0.5);
            // Fully upgraded titanium = 100% block
            if (player.shieldMaterial === 'titanium' && player.shieldLevel >= 20) return 1.0;
            return block;
        }

        function damageEnemy(enemy, amount, source = 'any', attackingCompanion = null) {
            // Check if enemy can only be damaged by specific source
            if (enemy.onlyDamageFrom && enemy.onlyDamageFrom !== source) {
                effects.push({ type: 'miss', x: enemy.x, y: enemy.y, timer: 0.4 });
                return;
            }
            
            // Apply sword damage bonus
            if (source === 'sword') amount = getSwordDamage();
            
            // Critical Hit System (30% chance)
            const isCritical = Math.random() < 0.30;
            if (isCritical) {
                amount = Math.ceil(amount * 1.5); // 50% extra damage on crit
                effects.push({ type: 'pickup', x: enemy.x, y: enemy.y - 30, timer: 0.7, text: 'CRITICAL!', color: '#fbbf24' });
                
                // Eject boss from vehicle on critical hit (if they're in a vehicle)
                if (enemy.isBoss && enemy.isVehicle && !enemy.ejected) {
                    enemy.ejected = true;
                    enemy.ejectedX = enemy.x + enemy.w / 2;
                    enemy.ejectedY = enemy.y;
                    enemy.ejectedVy = -300; // Launch them upward
                    enemy.ejectedVx = (Math.random() - 0.5) * 200;
                    enemy.ejectedGrounded = false;
                    effects.push({ type: 'pickup', x: enemy.x, y: enemy.y - 50, timer: 1.5, text: 'EJECTED!', color: '#ef4444' });
                }
            }
            
            // Double damage if hitting ejected boss
            if (enemy.ejected && enemy.isBoss) {
                amount *= 2;
                effects.push({ type: 'pickup', x: enemy.ejectedX, y: enemy.ejectedY - 20, timer: 0.5, text: '2X!', color: '#f97316' });
            }
            
            // Armored enemies take reduced damage (but ejected bosses lose armor)
            if (enemy.armored && !enemy.ejected) {
                amount = Math.ceil(amount * 0.6); // Dark knights take 40% less damage
                effects.push({ type: 'block', x: enemy.x, y: enemy.y - 20, timer: 0.3, blocked: 40 });
            }
            
            enemy.hp -= amount;
            effects.push({ type: 'hit', x: enemy.x, y: enemy.y + enemy.h / 2, timer: 0.2 });
            
            // Knockback - push enemy away from player
            const knockbackForce = 150;
            const knockbackDir = Math.sign(enemy.x - player.x) || 1;
            enemy.knockbackVx = knockbackDir * knockbackForce;
            enemy.knockbackTimer = 0.2;
            
            if (enemy.hp <= 0) {
                enemy.alive = false;
                if (enemy.isDummy) player.dummiesHit++;
                
                // Boss defeat dialogue
                if (enemy.isBoss) {
                    const bossDefeats = [
                        'YOU HAVE DEFEATED ME... BUT I WILL RETURN!',
                        'THIS IS NOT OVER... I SHALL HAVE MY REVENGE!',
                        'NO! HOW COULD I LOSE?! I WILL COME BACK STRONGER!',
                        'IMPOSSIBLE! BUT MARK MY WORDS... WE WILL MEET AGAIN!',
                        'YOU MAY HAVE WON THIS BATTLE, BUT THE WAR IS NOT OVER!',
                        'CURSE YOU! I WILL RETURN IN 10 LEVELS... STRONGER THAN EVER!',
                        'THIS DEFEAT... ONLY MAKES ME HUNGRIER FOR REVENGE!',
                        'NOOOO! BUT THIS IS JUST A TEMPORARY SETBACK!'
                    ];
                    const randomDefeat = bossDefeats[Math.floor(Math.random() * bossDefeats.length)];
                    effects.push({ type: 'pickup', x: enemy.x, y: enemy.y - 50, timer: 3, text: randomDefeat, color: enemy.color });
                    effects.push({ type: 'pickup', x: enemy.x, y: enemy.y - 80, timer: 2.5, text: '*FADES AWAY*', color: '#64748b' });
                }
                
                // Track companion kills
                if (attackingCompanion) {
                    attackingCompanion.killCount++;
                    // Special ready every 5-10 kills (random per companion)
                    const specialThreshold = 5 + Math.floor(Math.random() * 6);
                    if (attackingCompanion.killCount >= specialThreshold) {
                        attackingCompanion.specialReady = true;
                        attackingCompanion.killCount = 0;
                        effects.push({ type: 'pickup', x: attackingCompanion.x, y: attackingCompanion.y - 30, timer: 1.5, text: ELEMENTS[attackingCompanion.element].icon + ' READY!', color: ELEMENTS[attackingCompanion.element].color });
                    }
                }
                
                // Drop gold or silver coins randomly
                const goldChance = 0.3 
                    + (enemy.type === 'goblin' ? 0.2 : 0) 
                    + (enemy.type === 'ogre' ? 0.4 : 0) 
                    + (enemy.type === 'skeleton' ? 0.15 : 0)
                    + (enemy.type === 'spider' ? 0.2 : 0)
                    + (enemy.type === 'bat' ? 0.1 : 0)
                    + (enemy.type === 'wraith' ? 0.5 : 0)
                    + (enemy.type === 'dark_knight' ? 0.7 : 0)
                    + (enemy.isBoss ? 1.0 : 0);
                if (Math.random() < goldChance) {
                    const value = enemy.isBoss ? 100 + Math.floor(Math.random() * 100) 
                        : enemy.type === 'dark_knight' ? 40 + Math.floor(Math.random() * 30)
                        : enemy.type === 'wraith' ? 25 + Math.floor(Math.random() * 15)
                        : 10 + Math.floor(Math.random() * 10);
                    drops.push({ type: 'gold', x: enemy.x, y: enemy.y, value });
                } else {
                    drops.push({ type: 'silver', x: enemy.x, y: enemy.y, value: 3 + Math.floor(Math.random() * 5) });
                }
                if (Math.random() < 0.4) drops.push({ type: 'arrow', x: enemy.x + 20, y: enemy.y });
                
                // Rare potion drop (8% chance, higher for bosses and tough enemies)
                const potionChance = enemy.isBoss ? 0.5 
                    : enemy.type === 'dark_knight' ? 0.25
                    : enemy.type === 'wraith' ? 0.15
                    : 0.08;
                if (Math.random() < potionChance) {
                    const potionTypes = ['healing', 'shield', 'damage', 'speed', 'extraHealth'];
                    const randomPotion = potionTypes[Math.floor(Math.random() * potionTypes.length)];
                    drops.push({ type: 'potion', potionType: randomPotion, x: enemy.x, y: enemy.y - 10 });
                }
            }
        }
