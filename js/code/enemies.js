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

