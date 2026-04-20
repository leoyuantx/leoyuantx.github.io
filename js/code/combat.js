        function update(dt) {
            if (gameState !== 'playing') return;
            if (dialogueOpen) return;
            if (!window._updateLogged) {
                console.log('[update] First update tick. Player pos:', player.x, player.y, 'grounded:', player.grounded, 'input:', JSON.stringify(input));
                window._updateLogged = true;
            }
            updatePlayer(dt);
            updateFloatingPlatforms(dt);
            updateEnemies(dt);
            updateCompanions(dt);
            updateProjectiles(dt);
            updateEffects(dt);
            updateLevelHazards();
            updateDrops(dt);
            checkTutorial();
            checkLevelTransition();
            checkAreaUnlock();
            updateHUD();
        }

        function updateCompanions(dt) {
            for (const comp of companions) {
                // Find nearest enemy
                let nearestEnemy = null;
                let nearestDist = Infinity;
                for (const enemy of enemies) {
                    if (!enemy.alive) continue;
                    const dist = Math.abs(enemy.x - comp.x);
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearestEnemy = enemy;
                    }
                }
                
                if (nearestEnemy && nearestDist < 400) {
                    // Move towards enemy
                    const dx = nearestEnemy.x - comp.x;
                    if (Math.abs(dx) > 40) {
                        comp.vx = Math.sign(dx) * 180;
                        comp.facing = Math.sign(dx);
                    } else {
                        comp.vx = 0;
                        // Face the enemy
                        comp.facing = Math.sign(dx) || 1;
                        // Attack if close enough
                        if (comp.attackTimer <= 0) {
                            comp.attackTimer = 0.8;
                            comp.attacking = true;
                            
                            // Use special attack if ready
                            if (comp.specialReady) {
                                useCompanionSpecial(comp, nearestEnemy);
                                comp.specialReady = false;
                            } else {
                                damageEnemy(nearestEnemy, 2, 'any', comp);
                                effects.push({ type: 'slash', x: nearestEnemy.x, y: nearestEnemy.y + 20, facing: Math.sign(dx) || 1, timer: 0.15 });
                            }
                        }
                    }
                } else {
                    // Follow player if no enemies nearby
                    const followDist = 60 + companions.indexOf(comp) * 30;
                    const dx = (player.x - followDist * player.facing) - comp.x;
                    if (Math.abs(dx) > 20) {
                        comp.vx = Math.sign(dx) * 200;
                        comp.facing = Math.sign(dx);
                    } else {
                        comp.vx = 0;
                    }
                }
                
                // Update walking animation
                const grounded = comp.y >= groundY() - comp.h;
                comp.isWalking = comp.vx !== 0 && grounded;
                if (comp.isWalking) {
                    comp.animTime += dt * 8;
                } else {
                    comp.animTime = 0;
                }
                
                // Apply physics
                comp.vy = (comp.vy || 0) + GRAVITY * dt;
                comp.x += comp.vx * dt;
                comp.y += comp.vy * dt;
                
                const ground = groundY() - comp.h;
                if (comp.y >= ground) {
                    comp.y = ground;
                    comp.vy = 0;
                }
                
                // Screen bounds
                comp.x = Math.max(comp.w / 2, Math.min(canvas.width - comp.w / 2, comp.x));
                
                // Attack cooldown
                if (comp.attackTimer > 0) {
                    comp.attackTimer -= dt;
                } else {
                    comp.attacking = false;
                }
            }
        }

        function useCompanionSpecial(comp, targetEnemy) {
            const element = comp.element;
            const elementData = ELEMENTS[element];
            
            effects.push({ type: 'pickup', x: comp.x, y: comp.y - 40, timer: 1.5, text: elementData.name + ' ATTACK!', color: elementData.color });
            
            switch(element) {
                case 'fire':
                    // Fire: Burn damage over time to target
                    damageEnemy(targetEnemy, 10, 'any', comp);
                    effects.push({ type: 'fire', x: targetEnemy.x, y: targetEnemy.y, timer: 1.5, color: '#ef4444' });
                    // Apply burn effect
                    if (!targetEnemy.burning) {
                        targetEnemy.burning = true;
                        targetEnemy.burnTimer = 3;
                        targetEnemy.burnDamage = 1;
                    }
                    break;
                    
                case 'lightning':
                    // Lightning: Chain to nearby enemies
                    damageEnemy(targetEnemy, 8, 'any', comp);
                    effects.push({ type: 'lightning', x: targetEnemy.x, y: targetEnemy.y, timer: 0.5, color: '#eab308' });
                    // Chain to 2 more enemies
                    const nearbyEnemies = enemies.filter(e => e.alive && e !== targetEnemy && Math.abs(e.x - targetEnemy.x) < 200);
                    for (let i = 0; i < Math.min(2, nearbyEnemies.length); i++) {
                        damageEnemy(nearbyEnemies[i], 4, 'any', comp);
                        effects.push({ type: 'lightning', x: nearbyEnemies[i].x, y: nearbyEnemies[i].y, timer: 0.5, color: '#eab308' });
                    }
                    break;
                    
                case 'ice':
                    // Ice: Freeze and damage
                    damageEnemy(targetEnemy, 8, 'any', comp);
                    effects.push({ type: 'ice', x: targetEnemy.x, y: targetEnemy.y, timer: 1.5, color: '#3b82f6' });
                    // Slow enemy
                    if (!targetEnemy.frozen) {
                        targetEnemy.frozen = true;
                        targetEnemy.freezeTimer = 2;
                        targetEnemy.originalSpeed = targetEnemy.speed;
                        targetEnemy.speed *= 0.3;
                    }
                    break;
                    
                case 'wind':
                    // Wind: Knockback blast
                    damageEnemy(targetEnemy, 6, 'any', comp);
                    effects.push({ type: 'wind', x: targetEnemy.x, y: targetEnemy.y, timer: 1, color: '#10b981' });
                    // Strong knockback
                    targetEnemy.knockbackVx = Math.sign(targetEnemy.x - comp.x) * 400;
                    targetEnemy.knockbackTimer = 0.5;
                    // Knockback nearby enemies too
                    const nearbyForWind = enemies.filter(e => e.alive && e !== targetEnemy && Math.abs(e.x - targetEnemy.x) < 150);
                    for (const nearby of nearbyForWind) {
                        nearby.knockbackVx = Math.sign(nearby.x - comp.x) * 300;
                        nearby.knockbackTimer = 0.5;
                        damageEnemy(nearby, 3, 'any', comp);
                    }
                    break;
            }
        }

        function checkLevelTransition() {
            // After visiting shops, go right to next level
            if (levelComplete && player.x > canvas.width - 30) {
                // Check if game is complete (reached level 149 - the last level)
                if (currentLevel >= 149) {
                    triggerGameEnding();
                    return;
                }
                currentLevel++;
                setupLevel(currentLevel);
            }
            
            // Check if player reaches right edge of normal level (not in shops mode)
            if (!levelComplete && currentLevel > 0 && player.x > canvas.width - 50) {
                const allDead = enemies.every(e => !e.alive);
                if (allDead) {
                    // Start shop sequence - reset player to left, begin shop animation
                    player.x = 100;
                    levelComplete = true;
                    shopsMovingIn = true;
                    shopsMovingOut = false;
                    shopAnimationProgress = 0;
                    spawnShops();
                }
            }
        }

        function updatePlayer(dt) {
            const prevX = player.x;
            player.vx = 0;
            if (input.left) { player.vx = -player.speed * player.potionEffects.speed.multiplier; player.facing = -1; }
            if (input.right) { player.vx = player.speed * player.potionEffects.speed.multiplier; player.facing = 1; }

            // Update walking animation
            player.isWalking = player.vx !== 0 && player.grounded;
            if (player.isWalking) {
                player.animTime += dt * 8; // Animation speed multiplier
                player.walkCycle = Math.sin(player.animTime);
            } else {
                player.animTime = 0;
                player.walkCycle = 0;
            }

            // Update potion effects
            updatePotionEffects(dt);
            
            // Update jetpack - activate when holding W in air
            if (player.hasJetpack && input.jump && !player.grounded && player.jetpackFuel > 0) {
                player.jetpackActive = true;
            }
            updateJetpack(dt);
            
            // Update force field
            updateForceField(dt);

            if (input.jump && player.grounded && !player.jetpackActive) {
                player.vy = JUMP_FORCE;
                player.grounded = false;
                player.totalJumps++;
                input.jump = false;
            }

            player.vy += GRAVITY * dt;
            const prevPlayerX = player.x;
            player.x += player.vx * dt;
            player.y += player.vy * dt;
            
            // Update parallax offset for background shops
            parallaxOffset -= (player.x - prevPlayerX) * 0.3;

            // Check floating platform collisions first
            player.grounded = checkPlatformCollision(player);

            // Then check ground collision
            const ground = groundY() - player.h;
            if (player.y >= ground) { player.y = ground; player.vy = 0; player.grounded = true; }

            player.x = Math.max(player.w / 2, Math.min(canvas.width - player.w / 2, player.x));
            player.totalMoved += Math.abs(player.x - prevX);

            if (player.attackCooldown > 0) player.attackCooldown -= dt;
            if (player.attackTimer > 0) { player.attackTimer -= dt; if (player.attackTimer <= 0) player.attacking = false; }
            if (player.invulnTimer > 0) player.invulnTimer -= dt;

            nearbyNPC = null;
            for (const npc of npcs) { if (Math.abs(npc.x - player.x) < 80) { nearbyNPC = npc; break; } }
        }
        
        function updatePotionEffects(dt) {
            // Shield potion effect
            if (player.potionEffects.shield.active) {
                player.potionEffects.shield.timer -= dt;
                if (player.potionEffects.shield.timer <= 0) {
                    player.potionEffects.shield.active = false;
                    player.potionEffects.shield.strength = 0;
                }
            }
            
            // Damage potion effect
            if (player.potionEffects.damage.active) {
                player.potionEffects.damage.timer -= dt;
                if (player.potionEffects.damage.timer <= 0) {
                    player.potionEffects.damage.active = false;
                    player.potionEffects.damage.multiplier = 1;
                }
            }
            
            // Speed potion effect
            if (player.potionEffects.speed.active) {
                player.potionEffects.speed.timer -= dt;
                if (player.potionEffects.speed.timer <= 0) {
                    player.potionEffects.speed.active = false;
                    player.potionEffects.speed.multiplier = 1;
                }
            }
        }

        function updateEnemies(dt) {
            for (const enemy of enemies) {
                if (!enemy.alive) continue;
                
                // Handle status effects
                if (enemy.burning) {
                    enemy.burnTimer -= dt;
                    if (enemy.burnTimer <= 0) {
                        enemy.burning = false;
                    } else {
                        // Apply burn damage every half second
                        if (!enemy.lastBurnTick) enemy.lastBurnTick = 0;
                        enemy.lastBurnTick += dt;
                        if (enemy.lastBurnTick >= 0.5) {
                            enemy.hp -= enemy.burnDamage || 1;
                            effects.push({ type: 'fire', x: enemy.x, y: enemy.y, timer: 0.3, color: '#ef4444' });
                            enemy.lastBurnTick = 0;
                            if (enemy.hp <= 0) {
                                enemy.alive = false;
                                continue;
                            }
                        }
                    }
                }
                
                if (enemy.frozen) {
                    enemy.freezeTimer -= dt;
                    if (enemy.freezeTimer <= 0) {
                        enemy.frozen = false;
                        enemy.speed = enemy.originalSpeed || enemy.speed;
                    }
                }
                
                // In arena mode, enemies don't move until arena is active
                if (arenaMode && !arenaActive) {
                    enemy.vx = 0;
                    enemy.vy = (enemy.vy || 0) + GRAVITY * dt;
                    enemy.y += enemy.vy * dt;
                    const ground = groundY() - enemy.h;
                    if (enemy.y >= ground) {
                        enemy.y = ground;
                        enemy.vy = 0;
                        enemy.grounded = true;
                    }
                    continue;
                }
                
                // Dummies don't move or attack
                if (enemy.isDummy) {
                    // Just apply gravity for dummies
                    enemy.vy = (enemy.vy || 0) + GRAVITY * dt;
                    enemy.y += enemy.vy * dt;
                    const ground = groundY() - enemy.h;
                    if (enemy.y >= ground) { enemy.y = ground; enemy.vy = 0; enemy.grounded = true; }
                    continue;
                }
                
                const dx = player.x - enemy.x;
                const dist = Math.abs(dx);

                // Boss special abilities
                if (enemy.isBoss && enemy.ability) {
                    enemy.abilityTimer -= dt;
                    if (enemy.abilityTimer <= 0) {
                        enemy.abilityTimer = 5 + Math.random() * 3; // Use ability every 5-8 seconds
                        executeBossAbility(enemy);
                    }
                }
                
                // === VEHICLE BOSS CHARGING MECHANICS ===
                if (enemy.isBoss && enemy.isVehicle) {
                    // Update charge warning timer
                    if (enemy.chargeWarning) {
                        enemy.chargeWarningTime -= dt;
                        if (enemy.chargeWarningTime <= 0) {
                            enemy.chargeWarning = false;
                        }
                    }
                    
                    // Handle charging
                    if (enemy.charging) {
                        enemy.vx = enemy.chargeDirection * enemy.chargeSpeed;
                        enemy.x += enemy.vx * dt;
                        
                        // Check collision with player during charge
                        const hitPlayer = Math.abs(enemy.x - player.x) < (enemy.w / 2 + player.w / 2) &&
                                         Math.abs(enemy.y - player.y) < (enemy.h / 2 + player.h / 2);
                        
                        if (hitPlayer && player.invulnTimer <= 0) {
                            // Check if player is jumping over (player is higher than enemy top)
                            if (player.y + player.h < enemy.y + enemy.h / 3) {
                                // Successfully jumped over!
                                effects.push({ type: 'pickup', x: player.x, y: player.y - 40, timer: 1, text: 'DODGED!', color: '#22c55e' });
                            } else {
                                // Check shield block
                                const blocked = getShieldBlock();
                                
                                if (blocked >= 1.0) {
                                    // Fully blocked - stop the charge and stun the boss
                                    effects.push({ type: 'block', x: player.x, y: player.y, timer: 0.8, blocked: 100 });
                                    effects.push({ type: 'pickup', x: player.x, y: player.y - 40, timer: 1.2, text: 'BLOCKED!', color: '#fbbf24' });
                                    enemy.charging = false;
                                    enemy.stunned = true;
                                    enemy.stunTimer = 2; // Stunned for 2 seconds
                                    enemy.vx = 0;
                                } else if (blocked > 0) {
                                    // Partial block - reduced damage
                                    const chargeDamage = enemy.damage * 2; // Charge does 2x damage
                                    const finalDamage = Math.ceil(chargeDamage * (1 - blocked));
                                    player.hp -= finalDamage;
                                    player.invulnTimer = 1.2;
                                    effects.push({ type: 'block', x: player.x, y: player.y, timer: 0.5, blocked: Math.round(blocked * 100) });
                                    effects.push({ type: 'hit', x: player.x, y: player.y, timer: 0.6 });
                                    // Knockback
                                    player.x += enemy.chargeDirection * 50;
                                } else {
                                    // No block - full damage and knockback
                                    const chargeDamage = enemy.damage * 2;
                                    player.hp -= chargeDamage;
                                    player.invulnTimer = 1.2;
                                    effects.push({ type: 'hit', x: player.x, y: player.y, timer: 0.8 });
                                    effects.push({ type: 'pickup', x: player.x, y: player.y - 40, timer: 1, text: '-' + chargeDamage, color: '#dc2626' });
                                    // Strong knockback
                                    player.x += enemy.chargeDirection * 100;
                                }
                                
                                if (player.hp <= 0) {
                                    gameState = 'dead';
                                    setTimeout(() => { alert('YOU DIED! PRESS OK TO TRY AGAIN.'); setupLevel(currentLevel); gameState = 'playing'; }, 100);
                                }
                            }
                        }
                        
                        // Fire laser while charging (mega charge ability)
                        if (enemy.firingWhileCharging && Math.random() < 0.03) {
                            const dx = player.x - enemy.x;
                            const dy = (player.y + player.h / 2) - (enemy.y + enemy.h / 2);
                            const distance = Math.hypot(dx, dy);
                            projectiles.push({
                                x: enemy.x,
                                y: enemy.y + enemy.h / 2,
                                vx: (dx / distance) * 600,
                                vy: (dy / distance) * 600 * 0.3,
                                laser: true,
                                damage: 20
                            });
                        }
                        
                        // Stop charging if hit wall or charged far enough
                        if (enemy.x < 50 || enemy.x > canvas.width - 50 || 
                            Math.abs(enemy.x - player.x) > 600) {
                            enemy.charging = false;
                            enemy.firingWhileCharging = false;
                            enemy.vx = 0;
                        }
                    }
                    
                    // Handle stun
                    if (enemy.stunned) {
                        enemy.stunTimer -= dt;
                        enemy.vx = 0;
                        if (enemy.stunTimer <= 0) {
                            enemy.stunned = false;
                        }
                        // Skip normal movement while stunned
                        enemy.vy = (enemy.vy || 0) + GRAVITY * dt;
                        enemy.y += enemy.vy * dt;
                        const ground = groundY() - enemy.h;
                        if (enemy.y >= ground) { enemy.y = ground; enemy.vy = 0; enemy.grounded = true; }
                        continue;
                    }
                    
                    // Jet strafing
                    if (enemy.strafing && enemy.vehicle === 'jet') {
                        enemy.strafeTimer -= dt;
                        enemy.vx = enemy.strafeDirection * 300;
                        // Fire bullets while strafing
                        if (Math.random() < 0.08) {
                            projectiles.push({
                                x: enemy.x,
                                y: enemy.y + enemy.h,
                                vx: enemy.strafeDirection * 120,
                                vy: 350,
                                jetBullet: true,
                                damage: 15
                            });
                        }
                        if (enemy.strafeTimer <= 0) {
                            enemy.strafing = false;
                            enemy.vx = 0;
                        }
                    }
                    
                    // Helicopter propeller
                    if (enemy.vehicle === 'helicopter') {
                        enemy.propellerRotation += dt * 35;
                    }
                }

                if (enemy.bouncy) {
                    enemy.jumpTimer -= dt;
                    if (enemy.jumpTimer <= 0 && enemy.grounded) { enemy.vy = -400; enemy.grounded = false; enemy.jumpTimer = 1.5 + Math.random(); }
                }

                // Flying enemies (bats) - hover at certain height
                if (enemy.flying) {
                    const targetY = groundY() - enemy.hoverHeight;
                    const distY = targetY - enemy.y;
                    if (Math.abs(distY) > 5) {
                        enemy.vy = distY * 2; // Gentle hover movement
                    } else {
                        enemy.vy = Math.sin(Date.now() * 0.003) * 20; // Gentle bobbing
                    }
                }

                // Floating enemies (wraiths) - sinusoidal floating
                if (enemy.floating) {
                    enemy.floatOffset += dt * 2;
                    enemy.y = groundY() - enemy.h - 40 + Math.sin(enemy.floatOffset) * 15;
                    enemy.vy = 0; // Override gravity for floating enemies
                }

                // Jumpy enemies (spiders) - jump towards player occasionally
                if (enemy.jumpy) {
                    enemy.jumpTimer -= dt;
                    if (enemy.jumpTimer <= 0 && enemy.grounded && dist < 300) { 
                        enemy.vy = -350; 
                        enemy.grounded = false; 
                        enemy.jumpTimer = 2 + Math.random(); 
                    }
                }
                
                // Necromancer - summons skeletons
                if (enemy.canSummon && enemy.type === 'necromancer') {
                    enemy.summonTimer -= dt;
                    if (enemy.summonTimer <= 0 && dist < 400 && enemies.length < 30) {
                        enemy.summonTimer = 8 + Math.random() * 4;
                        spawnEnemy('skeleton', enemy.x + (Math.random() - 0.5) * 100, groundY() - 52);
                        effects.push({ type: 'pickup', x: enemy.x, y: enemy.y - 30, timer: 1, text: 'SUMMON!', color: '#10b981' });
                    }
                }
                
                // Mimic - activates when player is close
                if (enemy.disguised && enemy.type === 'mimic') {
                    if (dist < enemy.activateRange) {
                        enemy.disguised = false;
                        enemy.speed = 80;
                        effects.push({ type: 'hit', x: enemy.x, y: enemy.y, timer: 0.3 });
                    }
                }
                
                // Shade - teleports behind player
                if (enemy.canTeleport && enemy.type === 'shade') {
                    enemy.teleportTimer -= dt;
                    if (enemy.teleportTimer <= 0 && dist < 500) {
                        enemy.teleportTimer = 5 + Math.random() * 3;
                        enemy.x = player.x + (Math.random() > 0.5 ? 100 : -100);
                        effects.push({ type: 'pickup', x: enemy.x, y: enemy.y, timer: 0.5, text: 'TELEPORT!', color: '#18181b' });
                    }
                }
                
                // Archer - shoots arrows at player
                if (enemy.ranged && enemy.type === 'archer') {
                    enemy.shootTimer -= dt;
                    if (enemy.shootTimer <= 0 && dist < 400 && dist > 150) {
                        enemy.shootTimer = 3 + Math.random() * 2;
                        const dx = player.x - enemy.x;
                        const dy = (player.y + player.h / 2) - (enemy.y + enemy.h / 2);
                        const dist = Math.hypot(dx, dy);
                        projectiles.push({
                            x: enemy.x,
                            y: enemy.y + enemy.h / 2,
                            vx: (dx / dist) * 400,
                            vy: (dy / dist) * 400 * 0.5,
                            enemyArrow: true
                        });
                    }
                }
                
                // Mage - casts magic projectiles
                if (enemy.magical && enemy.type === 'mage') {
                    enemy.castTimer -= dt;
                    if (enemy.castTimer <= 0 && dist < 500) {
                        enemy.castTimer = 4 + Math.random() * 2;
                        const dx = player.x - enemy.x;
                        const dy = (player.y + player.h / 2) - (enemy.y + enemy.h / 2);
                        const dist = Math.hypot(dx, dy);
                        projectiles.push({
                            x: enemy.x,
                            y: enemy.y + enemy.h / 2,
                            vx: (dx / dist) * 350,
                            vy: (dy / dist) * 350 * 0.5,
                            magicBolt: true
                        });
                        effects.push({ type: 'pickup', x: enemy.x, y: enemy.y - 20, timer: 0.5, text: '✨', color: '#c084fc' });
                    }
                }
                
                // Harpy - swoops down at player
                if (enemy.type === 'harpy' && enemy.flying) {
                    if (!enemy.swooping && dist < 200 && Math.abs(enemy.y - player.y) > 60) {
                        enemy.swooping = true;
                        enemy.swoopTarget = player.x;
                    }
                    if (enemy.swooping) {
                        enemy.vy = 300; // Dive downTowards
                        if (enemy.y >= groundY() - enemy.h - 20) {
                            enemy.swooping = false;
                            enemy.vy = -300; // Fly back up
                        }
                    }
                }
                
                // === VEHICLE BEHAVIORS ===
                
                // Tank - fires cannon shots
                if (enemy.type === 'tank' && enemy.shootCannon) {
                    enemy.cannonTimer -= dt;
                    if (enemy.cannonTimer <= 0 && dist < 450) {
                        enemy.cannonTimer = 3.5 + Math.random() * 1.5;
                        const dx = player.x - enemy.x;
                        const dy = (player.y + player.h / 2) - (enemy.y + enemy.h / 2);
                        const distance = Math.hypot(dx, dy);
                        projectiles.push({
                            x: enemy.x,
                            y: enemy.y + enemy.h / 3,
                            vx: (dx / distance) * 320,
                            vy: (dy / distance) * 320 * 0.4,
                            cannonBall: true,
                            damage: 15
                        });
                        effects.push({ type: 'fire', x: enemy.x, y: enemy.y + enemy.h / 3, timer: 0.3, color: '#f97316' });
                    }
                }
                
                // Artillery - fires high-arc projectiles
                if (enemy.type === 'artillery' && enemy.firesArc) {
                    enemy.artilleryTimer -= dt;
                    if (enemy.artilleryTimer <= 0 && dist < 600) {
                        enemy.artilleryTimer = 5 + Math.random() * 2;
                        const dx = player.x - enemy.x;
                        projectiles.push({
                            x: enemy.x,
                            y: enemy.y + 10,
                            vx: Math.sign(dx) * 250,
                            vy: -500, // High arc
                            artilleryShell: true,
                            damage: 20
                        });
                        effects.push({ type: 'fire', x: enemy.x, y: enemy.y + 10, timer: 0.4, color: '#dc2626' });
                    }
                }
                
                // Helicopter - fires missiles and hovers
                if (enemy.type === 'helicopter' && enemy.canShootMissile) {
                    enemy.propellerRotation += dt * 30; // Spin propeller
                    enemy.missileTimer -= dt;
                    if (enemy.missileTimer <= 0 && dist < 400) {
                        enemy.missileTimer = 4 + Math.random() * 2;
                        const dx = player.x - enemy.x;
                        const dy = (player.y + player.h / 2) - (enemy.y + enemy.h / 2);
                        const distance = Math.hypot(dx, dy);
                        projectiles.push({
                            x: enemy.x,
                            y: enemy.y + enemy.h / 2,
                            vx: (dx / distance) * 380,
                            vy: (dy / distance) * 380 * 0.6,
                            missile: true,
                            damage: 12
                        });
                        effects.push({ type: 'fire', x: enemy.x, y: enemy.y + enemy.h / 2, timer: 0.2, color: '#eab308' });
                    }
                }
                
                // Armored Car - fast ramming vehicle with turret gun
                if (enemy.type === 'armored_car' && enemy.canShootTurret) {
                    enemy.turretTimer -= dt;
                    if (enemy.turretTimer <= 0 && dist < 400) {
                        enemy.turretTimer = 2.8 + Math.random() * 1.5;
                        const dx = player.x - enemy.x;
                        const dy = (player.y + player.h / 2) - (enemy.y + enemy.h / 3);
                        const distance = Math.hypot(dx, dy);
                        projectiles.push({
                            x: enemy.x,
                            y: enemy.y + enemy.h / 3,
                            vx: (dx / distance) * 400,
                            vy: (dy / distance) * 400 * 0.5,
                            enemyArrow: true,
                            damage: 12
                        });
                        effects.push({ type: 'fire', x: enemy.x, y: enemy.y + enemy.h / 3, timer: 0.15, color: '#6b7280' });
                    }
                }
                
                // Mech - walks and fires lasers
                if (enemy.type === 'mech' && enemy.canLaser) {
                    enemy.laserTimer -= dt;
                    if (enemy.walking && enemy.grounded) {
                        enemy.legAnimation += dt * 5;
                    }
                    if (enemy.laserTimer <= 0 && dist < 500 && dist > 80) {
                        enemy.laserTimer = 3 + Math.random() * 2;
                        const dx = player.x - enemy.x;
                        const dy = (player.y + player.h / 2) - (enemy.y + enemy.h / 2);
                        const distance = Math.hypot(dx, dy);
                        projectiles.push({
                            x: enemy.x,
                            y: enemy.y + enemy.h / 2,
                            vx: (dx / distance) * 500,
                            vy: (dy / distance) * 500 * 0.3,
                            laser: true,
                            damage: 18
                        });
                        effects.push({ type: 'lightning', x: enemy.x, y: enemy.y + enemy.h / 2, timer: 0.15, color: '#dc2626' });
                    }
                }
                
                // Drone - fast scanning drone with machine gun
                if (enemy.type === 'drone' && enemy.canShootGun) {
                    enemy.scanTimer += dt;
                    enemy.machineGunTimer -= dt;
                    // Erratic movement pattern
                    if (Math.floor(enemy.scanTimer) % 2 === 0) {
                        enemy.vy = Math.sin(enemy.scanTimer * 3) * 40;
                    }
                    // Machine gun bursts
                    if (enemy.machineGunTimer <= 0 && dist < 350) {
                        enemy.machineGunTimer = 2.5 + Math.random() * 1.5;
                        const dx = player.x - enemy.x;
                        const dy = (player.y + player.h / 2) - (enemy.y + enemy.h / 2);
                        const distance = Math.hypot(dx, dy);
                        projectiles.push({
                            x: enemy.x,
                            y: enemy.y + enemy.h / 2,
                            vx: (dx / distance) * 450,
                            vy: (dy / distance) * 450 * 0.4,
                            enemyArrow: true,
                            damage: 6
                        });
                        effects.push({ type: 'fire', x: enemy.x, y: enemy.y + enemy.h / 2, timer: 0.1, color: '#0891b2' });
                    }
                }
                
                // APC - deploys troops and shoots from turret
                if (enemy.type === 'apc') {
                    if (enemy.canDeploy) {
                        enemy.deployTimer -= dt;
                        if (enemy.deployTimer <= 0 && dist < 350 && enemies.length < 30) {
                            enemy.deployTimer = 12 + Math.random() * 5;
                            spawnEnemy('goblin', enemy.x + 40, groundY() - 48);
                            spawnEnemy('goblin', enemy.x - 40, groundY() - 48);
                            effects.push({ type: 'pickup', x: enemy.x, y: enemy.y - 30, timer: 1.2, text: 'DEPLOY!', color: '#10b981' });
                        }
                    }
                    if (enemy.canShootAPC) {
                        enemy.apcGunTimer -= dt;
                        if (enemy.apcGunTimer <= 0 && dist < 420) {
                            enemy.apcGunTimer = 3 + Math.random() * 1.5;
                            const dx = player.x - enemy.x;
                            const dy = (player.y + player.h / 2) - (enemy.y + enemy.h / 3);
                            const distance = Math.hypot(dx, dy);
                            projectiles.push({
                                x: enemy.x,
                                y: enemy.y + enemy.h / 3,
                                vx: (dx / distance) * 360,
                                vy: (dy / distance) * 360 * 0.45,
                                cannonBall: true,
                                damage: 14
                            });
                            effects.push({ type: 'fire', x: enemy.x, y: enemy.y + enemy.h / 3, timer: 0.25, color: '#059669' });
                        }
                    }
                }
                
                // Missile Launcher - fires multiple rockets
                if (enemy.type === 'missile_launcher' && enemy.firesRockets) {
                    enemy.rocketTimer -= dt;
                    if (enemy.rocketTimer <= 0 && dist < 550) {
                        enemy.rocketTimer = 6 + Math.random() * 3;
                        // Fire 3 rockets in succession
                        for (let i = 0; i < 3; i++) {
                            setTimeout(() => {
                                const dx = player.x - enemy.x;
                                const dy = (player.y + player.h / 2) - (enemy.y + enemy.h / 2);
                                const distance = Math.hypot(dx, dy);
                                projectiles.push({
                                    x: enemy.x,
                                    y: enemy.y + 20,
                                    vx: (dx / distance) * (400 + i * 20),
                                    vy: (dy / distance) * (400 + i * 20) * 0.5 - (i * 30),
                                    rocket: true,
                                    damage: 22
                                });
                                effects.push({ type: 'fire', x: enemy.x, y: enemy.y + 20, timer: 0.3, color: '#fb923c' });
                            }, i * 300);
                        }
                    }
                }
                
                // Jet - high-speed strafing runs
                if (enemy.type === 'jet' && enemy.flying) {
                    enemy.strafeTimer -= dt;
                    if (!enemy.strafing && dist < 500) {
                        if (enemy.strafeTimer <= 0) {
                            enemy.strafing = true;
                            enemy.strafeTimer = 4;
                            enemy.strafeDirection = Math.sign(player.x - enemy.x);
                        }
                    }
                    if (enemy.strafing) {
                        enemy.vx = enemy.strafeDirection * enemy.speed * 1.5;
                        // Fire bullets while strafing
                        if (Math.random() < 0.05) {
                            projectiles.push({
                                x: enemy.x,
                                y: enemy.y + enemy.h,
                                vx: enemy.strafeDirection * 100,
                                vy: 300,
                                jetBullet: true,
                                damage: 8
                            });
                        }
                        if (enemy.strafeTimer <= 0) {
                            enemy.strafing = false;
                            enemy.strafeTimer = 3 + Math.random() * 2;
                        }
                    }
                }
                
                // Hovercraft - fast hover vehicle with dual guns
                if (enemy.type === 'hovercraft') {
                    if (enemy.hovering) {
                        enemy.hoverOffset += dt * 3;
                        // Hover at 15-25 pixels above ground
                        const targetY = groundY() - enemy.h - 20 + Math.sin(enemy.hoverOffset) * 8;
                        enemy.y = targetY;
                        enemy.vy = 0;
                    }
                    if (enemy.canShootHover) {
                        enemy.hoverGunTimer -= dt;
                        if (enemy.hoverGunTimer <= 0 && dist < 380) {
                            enemy.hoverGunTimer = 2.8 + Math.random() * 1.2;
                            const dx = player.x - enemy.x;
                            const dy = (player.y + player.h / 2) - (enemy.y + enemy.h / 2);
                            const distance = Math.hypot(dx, dy);
                            projectiles.push({
                                x: enemy.x,
                                y: enemy.y + enemy.h / 2,
                                vx: (dx / distance) * 420,
                                vy: (dy / distance) * 420 * 0.5,
                                laser: true,
                                damage: 10
                            });
                            effects.push({ type: 'lightning', x: enemy.x, y: enemy.y + enemy.h / 2, timer: 0.15, color: '#0d9488' });
                        }
                    }
                }

                // Update ejected boss physics (they get knocked out of vehicle on critical hit)
                if (enemy.ejected && enemy.isBoss) {
                    // Apply gravity to ejected pilot
                    enemy.ejectedVy += GRAVITY * dt;
                    enemy.ejectedX += enemy.ejectedVx * dt;
                    enemy.ejectedY += enemy.ejectedVy * dt;
                    
                    // Ground collision for ejected pilot
                    const pilotGround = groundY() - 24; // Pilot is 24px tall
                    if (enemy.ejectedY >= pilotGround) {
                        enemy.ejectedY = pilotGround;
                        enemy.ejectedVy = 0;
                        enemy.ejectedGrounded = true;
                        enemy.ejectedVx *= 0.7; // Friction on landing
                    }
                    
                    // Ejected pilot tries to run away from player
                    if (enemy.ejectedGrounded) {
                        const escapeDir = Math.sign(enemy.ejectedX - player.x);
                        enemy.ejectedVx = escapeDir * 120;
                    }
                }

                // Apply knockback if active
                if (enemy.knockbackTimer > 0) {
                    enemy.knockbackTimer -= dt;
                    enemy.x += (enemy.knockbackVx || 0) * dt;
                    enemy.knockbackVx *= 0.9; // Friction
                } else {
                    if (dist > 30) enemy.vx = Math.sign(dx) * enemy.speed; else enemy.vx = 0;
                    enemy.x += enemy.vx * dt;
                }

                // Apply gravity only for non-floating/non-flying enemies
                if (!enemy.flying && !enemy.floating) {
                    enemy.vy = (enemy.vy || 0) + GRAVITY * dt;
                }
                
                enemy.y += enemy.vy * dt;

                const ground = groundY() - enemy.h;
                if (enemy.y >= ground && !enemy.flying && !enemy.floating) { 
                    enemy.y = ground; 
                    enemy.vy = 0; 
                    enemy.grounded = true; 
                }

                const attackRange = enemy.isBoss ? 80 : 50;
                if (dist < attackRange && enemy.attackTimer <= 0) {
                    enemy.attackTimer = enemy.isBoss ? 1.5 : 1;
                    if (player.invulnTimer <= 0) {
                        // Apply shield damage reduction
                        const blocked = getShieldBlock();
                        
                        // Apply helmet defense against aerial enemies
                        let helmetBlock = 0;
                        if ((enemy.flying || enemy.floating) && player.helmetMaterial) {
                            const materialIndex = MATERIALS.indexOf(player.helmetMaterial);
                            const baseBlock = 0.1 + materialIndex * 0.08; // 10% to 50% based on material
                            const levelBonus = player.helmetLevel * 0.02; // 2% per level
                            helmetBlock = Math.min(0.8, baseBlock + levelBonus); // Max 80% aerial defense
                        }
                        
                        const totalBlock = Math.min(0.95, blocked + helmetBlock); // Combined, max 95%
                        const finalDamage = Math.ceil(enemy.damage * (1 - totalBlock));
                        player.hp -= finalDamage;
                        player.invulnTimer = 0.8;
                        if (totalBlock > 0) {
                            effects.push({ type: 'block', x: player.x, y: player.y, timer: 0.3, blocked: Math.round(totalBlock * 100) });
                            if (helmetBlock > 0) effects.push({ type: 'pickup', x: player.x, y: player.y - 40, timer: 0.5, text: '⛑️', color: '#22c55e' });
                        } else {
                            effects.push({ type: 'hit', x: player.x, y: player.y, timer: 0.2 });
                        }
                        if (player.hp <= 0) {
                            gameState = 'dead';
                            setTimeout(() => { alert('YOU DIED! PRESS OK TO TRY AGAIN.'); setupLevel(currentLevel); gameState = 'playing'; }, 100);
                        }
                    }
                }
                if (enemy.attackTimer > 0) enemy.attackTimer -= dt;
            }
        }

        function executeBossAbility(boss) {
            effects.push({ type: 'pickup', x: boss.x, y: boss.y - 50, timer: 1.5, text: boss.ability.toUpperCase() + '!', color: boss.color });
            
            switch(boss.ability) {
                case 'slam':
                    // Ground slam - damage player if nearby
                    if (Math.abs(boss.x - player.x) < 200) {
                        player.hp -= 15;
                        effects.push({ type: 'hit', x: player.x, y: player.y, timer: 0.5 });
                    }
                    break;
                case 'teleport':
                    // Teleport behind player
                    boss.x = player.x + (Math.random() > 0.5 ? 150 : -150);
                    effects.push({ type: 'pickup', x: boss.x, y: boss.y, timer: 0.5, text: 'TELEPORT!', color: '#7c3aed' });
                    break;
                case 'firewall':
                    // Create fire hazards
                    for (let i = 0; i < 3; i++) {
                        effects.push({ type: 'fire', x: player.x + (i - 1) * 100, y: groundY() - 20, timer: 3, color: '#dc2626' });
                    }
                    break;
                case 'iceblast':
                    // Freeze player temporarily
                    player.speed *= 0.5;
                    setTimeout(() => { player.speed = 220; }, 2000);
                    effects.push({ type: 'ice', x: player.x, y: player.y, timer: 2, color: '#0ea5e9' });
                    break;
                case 'lightning':
                    // Lightning strikes
                    if (Math.abs(boss.x - player.x) < 300) {
                        player.hp -= 20;
                        effects.push({ type: 'lightning', x: player.x, y: player.y - 50, timer: 0.5, color: '#eab308' });
                    }
                    break;
                case 'shadowclone':
                    // Spawn a mini shadow clone
                    spawnEnemy('goblin', boss.x + 100, groundY() - 48);
                    break;
                case 'chaos':
                    // Random damage to player
                    const chaosDamage = 10 + Math.floor(Math.random() * 20);
                    player.hp -= chaosDamage;
                    effects.push({ type: 'hit', x: player.x, y: player.y, timer: 1, color: '#dc2626' });
                    break;
                case 'divine':
                    // Boss heals
                    boss.hp = Math.min(boss.hp + 50, boss.maxHp);
                    effects.push({ type: 'pickup', x: boss.x, y: boss.y - 30, timer: 1, text: '+50 HP', color: '#fbbf24' });
                    break;
                case 'meteor':
                    // Meteors fall from sky
                    for (let i = 0; i < 5; i++) {
                        const meteorX = player.x + (Math.random() - 0.5) * 400;
                        effects.push({ type: 'fire', x: meteorX, y: 50, timer: 2, color: '#7c3aed' });
                    }
                    break;
                case 'vortex':
                    // Pull player towards boss
                    const pullForce = 300;
                    const dx = boss.x - player.x;
                    player.x += Math.sign(dx) * pullForce * 0.1;
                    effects.push({ type: 'pickup', x: player.x, y: player.y - 30, timer: 1, text: 'PULLED!', color: '#8b5cf6' });
                    break;
                case 'blackhole':
                    // Massive damage and pull
                    player.hp -= 25;
                    player.x += Math.sign(boss.x - player.x) * 100;
                    effects.push({ type: 'hit', x: player.x, y: player.y, timer: 1, color: '#000000' });
                    break;
                case 'supernova':
                    // AOE explosion
                    if (Math.abs(boss.x - player.x) < 350) {
                        player.hp -= 40;
                        effects.push({ type: 'fire', x: boss.x, y: boss.y, timer: 1.5, color: '#f97316' });
                    }
                    break;
                case 'timerift':
                    // Slow player and teleport boss
                    player.speed *= 0.3;
                    setTimeout(() => { player.speed = 220; }, 3000);
                    boss.x = Math.random() * (canvas.width - 200) + 100;
                    effects.push({ type: 'ice', x: player.x, y: player.y, timer: 3, color: '#06b6d4' });
                    break;
                case 'genesis':
                    // Spawn multiple enemies and heal boss
                    spawnEnemy('dark_knight', boss.x + 150, groundY() - 72);
                    spawnEnemy('wraith', boss.x - 150, groundY() - 56);
                    boss.hp = Math.min(boss.hp + 100, boss.maxHp);
                    effects.push({ type: 'pickup', x: boss.x, y: boss.y - 50, timer: 1.5, text: 'GENESIS!', color: '#a855f7' });
                    break;
                case 'armageddon':
                    // Massive screen-wide attack
                    player.hp -= 50;
                    for (let i = 0; i < 10; i++) {
                        const x = Math.random() * canvas.width;
                        effects.push({ type: 'fire', x, y: Math.random() * 200, timer: 2, color: '#ef4444' });
                    }
                    effects.push({ type: 'hit', x: player.x, y: player.y, timer: 2, color: '#ef4444' });
                    break;
                    
                // === VEHICLE BOSS ABILITIES ===
                
                case 'tankcharge':
                    // Tank charges at player (can be blocked or jumped over)
                    boss.chargeWarning = true;
                    boss.chargeWarningTime = 1.5; // 1.5 second warning
                    effects.push({ type: 'pickup', x: boss.x, y: boss.y - 60, timer: 1.5, text: '⚠️ CHARGING! ⚠️', color: '#fbbf24' });
                    setTimeout(() => {
                        if (boss.alive) {
                            boss.charging = true;
                            boss.chargeSpeed = 400;
                            boss.chargeDirection = Math.sign(player.x - boss.x);
                        }
                    }, 1500);
                    break;
                    
                case 'artillery':
                    // Multiple artillery shells
                    for (let i = 0; i < 5; i++) {
                        setTimeout(() => {
                            if (boss.alive) {
                                const dx = player.x - boss.x;
                                projectiles.push({
                                    x: boss.x,
                                    y: boss.y + 20,
                                    vx: Math.sign(dx) * (300 + Math.random() * 100),
                                    vy: -550 - Math.random() * 50,
                                    artilleryShell: true,
                                    damage: 25
                                });
                                effects.push({ type: 'fire', x: boss.x, y: boss.y + 20, timer: 0.4, color: '#dc2626' });
                            }
                        }, i * 400);
                    }
                    break;
                    
                case 'airassault':
                    // Helicopter drops multiple missiles
                    for (let i = 0; i < 4; i++) {
                        setTimeout(() => {
                            if (boss.alive) {
                                const dx = player.x - boss.x;
                                const dy = (player.y + player.h / 2) - (boss.y + boss.h / 2);
                                const distance = Math.hypot(dx, dy);
                                projectiles.push({
                                    x: boss.x,
                                    y: boss.y + boss.h / 2,
                                    vx: (dx / distance) * 420,
                                    vy: (dy / distance) * 420 * 0.6,
                                    missile: true,
                                    damage: 18
                                });
                                effects.push({ type: 'fire', x: boss.x, y: boss.y + boss.h / 2, timer: 0.3, color: '#eab308' });
                            }
                        }, i * 300);
                    }
                    break;
                    
                case 'mechstomp':
                    // Mech stomps creating shockwave
                    boss.chargeWarning = true;
                    boss.chargeWarningTime = 1.2;
                    effects.push({ type: 'pickup', x: boss.x, y: boss.y - 80, timer: 1.2, text: '⚠️ STOMP! ⚠️', color: '#ef4444' });
                    setTimeout(() => {
                        if (boss.alive) {
                            // Shockwave damage in area
                            const dist = Math.abs(boss.x - player.x);
                            if (dist < 250 && player.grounded) {
                                // Can't block stomp if on ground, must jump
                                player.hp -= 30;
                                effects.push({ type: 'hit', x: player.x, y: player.y, timer: 0.8 });
                                effects.push({ type: 'pickup', x: player.x, y: player.y - 40, timer: 1, text: 'SHOCKWAVE!', color: '#dc2626' });
                            }
                            // Visual shockwave
                            for (let i = 0; i < 360; i += 30) {
                                const angle = (i * Math.PI) / 180;
                                effects.push({ 
                                    type: 'fire', 
                                    x: boss.x + Math.cos(angle) * 150, 
                                    y: groundY() - 20, 
                                    timer: 0.6, 
                                    color: '#78716c' 
                                });
                            }
                        }
                    }, 1200);
                    break;
                    
                case 'jetstrafe':
                    // Jet strafes across screen firing
                    boss.strafing = true;
                    boss.strafeDirection = Math.sign(player.x - boss.x);
                    boss.strafeTimer = 3;
                    effects.push({ type: 'pickup', x: boss.x, y: boss.y - 60, timer: 1, text: '✈️ STRAFE RUN! ✈️', color: '#60a5fa' });
                    break;
                    
                case 'missilestorm':
                    // Fires barrage of rockets
                    effects.push({ type: 'pickup', x: boss.x, y: boss.y - 60, timer: 2, text: '🚀 MISSILE STORM! 🚀', color: '#f97316' });
                    for (let i = 0; i < 8; i++) {
                        setTimeout(() => {
                            if (boss.alive) {
                                const dx = player.x - boss.x + (Math.random() - 0.5) * 200;
                                const dy = (player.y + player.h / 2) - (boss.y + boss.h / 2);
                                const distance = Math.hypot(dx, dy);
                                projectiles.push({
                                    x: boss.x,
                                    y: boss.y + 30,
                                    vx: (dx / distance) * (450 + Math.random() * 100),
                                    vy: (dy / distance) * (450 + Math.random() * 100) * 0.5,
                                    rocket: true,
                                    damage: 28
                                });
                                effects.push({ type: 'fire', x: boss.x, y: boss.y + 30, timer: 0.3, color: '#fb923c' });
                            }
                        }, i * 250);
                    }
                    break;
                    
                case 'megacharge':
                    // Mech charges with laser firing
                    boss.chargeWarning = true;
                    boss.chargeWarningTime = 1.8;
                    effects.push({ type: 'pickup', x: boss.x, y: boss.y - 80, timer: 1.8, text: '⚠️ MEGA CHARGE! ⚠️', color: '#dc2626' });
                    setTimeout(() => {
                        if (boss.alive) {
                            boss.charging = true;
                            boss.chargeSpeed = 350;
                            boss.chargeDirection = Math.sign(player.x - boss.x);
                            boss.firingWhileCharging = true;
                        }
                    }, 1800);
                    break;
                    
                case 'multicharge':
                    // Tank does multiple short charges
                    for (let i = 0; i < 3; i++) {
                        setTimeout(() => {
                            if (boss.alive) {
                                boss.chargeWarning = true;
                                boss.chargeWarningTime = 0.8;
                                effects.push({ type: 'pickup', x: boss.x, y: boss.y - 60, timer: 0.8, text: '⚠️!', color: '#fbbf24' });
                                setTimeout(() => {
                                    if (boss.alive) {
                                        boss.charging = true;
                                        boss.chargeSpeed = 500;
                                        boss.chargeDirection = Math.sign(player.x - boss.x);
                                    }
                                }, 800);
                            }
                        }, i * 2500);
                    }
                    break;
                    
                // === NEW ADVANCED BOSS ABILITIES ===
                
                case 'laserstorm':
                    // Multiple laser beams sweep the area
                    for (let i = 0; i < 6; i++) {
                        setTimeout(() => {
                            if (boss.alive) {
                                const dx = player.x - boss.x;
                                const dy = (player.y + player.h / 2) - (boss.y + boss.h / 2);
                                const distance = Math.hypot(dx, dy);
                                projectiles.push({
                                    x: boss.x,
                                    y: boss.y + boss.h / 2,
                                    vx: (dx / distance) * 700 + (Math.random() - 0.5) * 200,
                                    vy: (dy / distance) * 700 * 0.4,
                                    laser: true,
                                    damage: 22
                                });
                                effects.push({ type: 'lightning', x: boss.x, y: boss.y, timer: 0.2, color: '#dc2626' });
                            }
                        }, i * 200);
                    }
                    break;
                    
                case 'voidpulse':
                    // Continuous damage and push effect
                    for (let i = 0; i <4; i++) {
                        setTimeout(() => {
                            if (boss.alive && Math.abs(boss.x - player.x) < 400) {
                                player.hp -= 15;
                                player.x += Math.sign(player.x - boss.x) * 80;
                                effects.push({ type: 'hit', x: player.x, y: player.y, timer: 0.5, color: '#000000' });
                            }
                        }, i * 600);
                    }
                    break;
                    
                case 'tankbarrage':
                    // Rapid fire cannon shots
                    for (let i = 0; i < 10; i++) {
                        setTimeout(() => {
                            if (boss.alive) {
                                const dx = player.x - boss.x + (Math.random() - 0.5) * 150;
                                const dy = (player.y + player.h / 2) - (boss.y + boss.h / 2);
                                const distance = Math.hypot(dx, dy);
                                projectiles.push({
                                    x: boss.x,
                                    y: boss.y + boss.h / 3,
                                    vx: (dx / distance) * 400,
                                    vy: (dy / distance) * 400 * 0.4,
                                    cannonBall: true,
                                    damage: 18
                                });
                                effects.push({ type: 'fire', x: boss.x, y: boss.y + boss.h / 3, timer: 0.2, color: '#f97316' });
                            }
                        }, i * 300);
                    }
                    break;
                    
                case 'chronofreeze':
                    // Freeze time for player
                    player.speed *= 0.15;
                    setTimeout(() => { player.speed = 220; }, 5000);
                    effects.push({ type: 'ice', x: player.x, y: player.y, timer: 5, color: '#06b6d4' });
                    effects.push({ type: 'pickup', x: player.x, y: player.y - 50, timer: 2, text: 'TIME STOPPED!', color: '#0ea5e9' });
                    break;
                    
                case 'voidexplosion':
                    // Massive void explosion
                    if (Math.abs(boss.x - player.x) < 500) {
                        player.hp -= 45;
                        effects.push({ type: 'hit', x: player.x, y: player.y, timer: 1.5, color: '#7c3aed' });
                    }
                    for (let i = 0; i < 12; i++) {
                        const angle = (i / 12) * Math.PI * 2;
                        effects.push({ type: 'fire', x: boss.x + Math.cos(angle) * 200, y: boss.y + Math.sin(angle) * 200, timer: 1, color: '#7c3aed' });
                    }
                    break;
                    
                case 'divinelight':
                    // Heal boss and damage player
                    boss.hp = Math.min(boss.hp + 150, boss.maxHp);
                    player.hp -= 30;
                    effects.push({ type: 'pickup', x: boss.x, y: boss.y - 50, timer: 1.5, text: '+150 HP', color: '#fbbf24' });
                    effects.push({ type: 'lightning', x: player.x, y: player.y - 50, timer: 0.8, color: '#fbbf24' });
                    break;
                    
                case 'quantumsplit':
                    // Boss creates phantom copy
                    spawnEnemy('wraith', boss.x + 200, groundY() - 56);
                    spawnEnemy('shade', boss.x - 200, groundY() - 68);
                    effects.push({ type: 'pickup', x: boss.x + 200, y: groundY() - 100, timer: 1, text: 'PHANTOM!', color: '#ec4899' });
                    break;
                    
                case 'starfall':
                    // Stars fall from the sky
                    for (let i = 0; i < 15; i++) {
                        setTimeout(() => {
                            const x = Math.random() * canvas.width;
                            effects.push({ type: 'lightning', x, y: 0, timer: 2, color: '#3b82f6' });
                            if (Math.abs(x - player.x) < 80) {
                                player.hp -= 12;
                                effects.push({ type: 'hit', x: player.x, y: player.y, timer: 0.3 });
                            }
                        }, i * 200);
                    }
                    break;
                    
                case 'omegablast':
                    // Ultimate attack
                    player.hp -= 60;
                    player.x += Math.sign(player.x - boss.x) * 150;
                    for (let i = 0; i < 20; i++) {
                        const x = Math.random() * canvas.width;
                        const y = Math.random() * canvas.height;
                        effects.push({ type: 'fire', x, y, timer: 1.5, color: '#000000' });
                    }
                    effects.push({ type: 'hit', x: player.x, y: player.y, timer: 2, color: '#000000' });
                    break;
                    
                case 'titanstomp':
                    // Ultra mech stomp
                    boss.chargeWarning = true;
                    boss.chargeWarningTime = 1.5;
                    effects.push({ type: 'pickup', x: boss.x, y: boss.y - 100, timer: 1.5, text: '⚠️ TITAN STOMP! ⚠️', color: '#dc2626' });
                    setTimeout(() => {
                        if (boss.alive) {
                            const dist = Math.abs(boss.x - player.x);
                            if (dist < 350 && player.grounded) {
                                player.hp -= 50;
                                effects.push({ type: 'hit', x: player.x, y: player.y, timer: 1 });
                            }
                            for (let i = 0; i < 500; i += 40) {
                                effects.push({ type: 'fire', x: boss.x - 250 + i, y: groundY() - 20, timer: 1, color: '#dc2626' });
                            }
                        }
                    }, 1500);
                    break;
                    
                case 'realitybreak':
                    // Breaks reality - teleport and confuse
                    boss.x = Math.random() * (canvas.width - 300) + 150;
                    player.x += (Math.random() - 0.5) * 300;
                    player.speed *= 0.2;
                    setTimeout(() => { player.speed = 220; }, 4000);
                    effects.push({ type: 'pickup', x: boss.x, y: boss.y - 50, timer: 2, text: 'REALITY BROKEN!', color: '#06b6d4' });
                    break;
                    
                case 'chaosrain':
                    // Rain of chaos
                    for (let i = 0; i < 25; i++) {
                        setTimeout(() => {
                            const x = player.x + (Math.random() - 0.5) * 500;
                            effects.push({ type: 'fire', x, y: Math.random() * 150, timer: 1.5, color: '#a855f7' });
                            if (Math.abs(x - player.x) < 60) {
                                player.hp -= 8;
                            }
                        }, i * 150);
                    }
                    break;
                    
                case 'infinitywave':
                    // Waves of energy
                    for (let wave = 0; wave < 5; wave++) {
                        setTimeout(() => {
                            if (boss.alive) {
                                for (let i = 0; i < 8; i++) {
                                    const angle = (i / 8) * Math.PI * 2;
                                    projectiles.push({
                                        x: boss.x,
                                        y: boss.y + boss.h / 2,
                                        vx: Math.cos(angle) * 350,
                                        vy: Math.sin(angle) * 350 * 0.5,
                                        energyBall: true,
                                        damage: 25
                                    });
                                }
                            }
                        }, wave * 800);
                    }
                    break;
                    
                case 'transcendence':
                    // Ultimate final boss ability
                    boss.hp = Math.min(boss.hp + 500, boss.maxHp);
                    player.hp -= 80;
                    player.speed *= 0.1;
                    setTimeout(() => { player.speed = 220; }, 6000);
                    for (let i = 0; i < 30; i++) {
                        const x = Math.random() * canvas.width;
                        const y = Math.random() * canvas.height;
                        setTimeout(() => {
                            effects.push({ type: 'lightning', x, y, timer: 2, color: '#ffffff' });
                        }, i * 100);
                    }
                    effects.push({ type: 'pickup', x: canvas.width / 2, y: 150, timer: 3, text: 'TRANSCENDENT POWER!', color: '#ffffff' });
                    break;
            }
        }

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
