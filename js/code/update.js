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

