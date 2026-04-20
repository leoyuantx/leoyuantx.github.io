        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            drawLevelBackground();
            drawLevelHazards();
            drawFloatingPlatforms();
            drawClouds();

            drawShops();
            drawNPCs();
            drawEnemies();
            drawCompanions();
            drawPlayer();
            drawJetpackEffects();
            drawForceFieldEffects();
            drawProjectiles();
            drawDrops();
            drawEffects();
            drawJetpackFuelBar();

            // Slow-mo vignette overlay when aiming bow
            if (bowMode && !bowTarget) {
                ctx.save();
                const grad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.height * 0.3, canvas.width / 2, canvas.height / 2, canvas.height * 0.8);
                grad.addColorStop(0, 'rgba(124, 58, 237, 0)');
                grad.addColorStop(1, 'rgba(124, 58, 237, 0.35)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.restore();
            }

            if (nearbyNPC && !dialogueOpen) {
                ctx.fillStyle = '#fbbf24';
                ctx.font = '12px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.fillText('PRESS E TO TALK', nearbyNPC.x, nearbyNPC.y - 20);
            }

            // Draw potion effects indicators
            let effectY = 100;
            if (player.potionEffects.shield.active) {
                ctx.fillStyle = '#3b82f6';
                ctx.font = '12px "Press Start 2P", monospace';
                ctx.textAlign = 'right';
                ctx.fillText(`SHIELD: ${Math.ceil(player.potionEffects.shield.timer)}S`, canvas.width - 20, effectY);
                effectY += 20;
            }
            if (player.potionEffects.damage.active) {
                ctx.fillStyle = '#f59e0b';
                ctx.font = '12px "Press Start 2P", monospace';
                ctx.textAlign = 'right';
                ctx.fillText(`2X DMG: ${Math.ceil(player.potionEffects.damage.timer)}S`, canvas.width - 20, effectY);
                effectY += 20;
            }
            if (player.potionEffects.speed.active) {
                ctx.fillStyle = '#10b981';
                ctx.font = '12px "Press Start 2P", monospace';
                ctx.textAlign = 'right';
                ctx.fillText(`SPEED: ${Math.ceil(player.potionEffects.speed.timer)}S`, canvas.width - 20, effectY);
                effectY += 20;
            }
            
            // Draw level complete indicator
            if (levelComplete && !insideShop && !shopsMovingOut) {
                if (shopsMovingIn) {
                    ctx.fillStyle = '#22c55e';
                    ctx.font = '16px "Press Start 2P", monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText('SHOPS ARRIVING...', canvas.width / 2, 50);
                } else {
                    ctx.fillStyle = '#22c55e';
                    ctx.font = '16px "Press Start 2P", monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText('VISIT SHOPS, THEN GO RIGHT →', canvas.width / 2, 50);
                }
            } else if (currentLevel > 0 && enemies.every(e => !e.alive) && !insideShop && !levelComplete) {
                ctx.fillStyle = '#fbbf24';
                ctx.font = '14px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.fillText('GO TO THE RIGHT →', canvas.width / 2, 50);
            }
            
            // Draw shop interior if inside
            if (insideShop) {
                drawShopInterior();
            }
        }

        function drawLevelBackground() {
            const levelName = LEVEL_NAMES[currentLevel] || 'ENDLESS BATTLE';
            const ground = groundY();
            
            // Default sky and ground
            let skyColor1 = '#60a5fa', skyColor2 = '#93c5fd';
            let groundColor1 = '#22c55e', groundColor2 = '#16a34a';
            
            // Level-specific backgrounds
            if (levelName === 'TRAINING' || levelName === 'WHISPERING WOODS') {
                skyColor1 = '#60a5fa'; skyColor2 = '#93c5fd';
                groundColor1 = '#22c55e'; groundColor2 = '#16a34a';
            } else if (levelName === 'DARK FOREST' || levelName === 'CURSED SWAMP') {
                skyColor1 = '#1e293b'; skyColor2 = '#374151';
                groundColor1 = '#065f46'; groundColor2 = '#064e3b';
            } else if (levelName === 'MOUNTAIN PASS' || levelName === 'THUNDER PEAKS') {
                skyColor1 = '#475569'; skyColor2 = '#64748b';
                groundColor1 = '#78716c'; groundColor2 = '#57534e';
            } else if (levelName === 'CRIMSON CANYON' || levelName === 'VOLCANIC WASTES') {
                skyColor1 = '#7c2d12'; skyColor2 = '#991b1b';
                groundColor1 = '#450a0a'; groundColor2 = '#7f1d1d';
            } else if (levelName === 'FROZEN TUNDRA') {
                skyColor1 = '#bae6fd'; skyColor2 = '#e0f2fe';
                groundColor1 = '#e0f2fe'; groundColor2 = '#bae6fd';
            } else if (levelName === 'SHADOW REALM' || levelName === 'VOID CHASM' || levelName === 'OBLIVION GATE') {
                skyColor1 = '#0f172a'; skyColor2 = '#1e1b4b';
                groundColor1 = '#1e1b4b'; groundColor2 = '#312e81';
            } else if (levelName === 'CRYSTAL CAVERNS') {
                skyColor1 = '#1e3a5f'; skyColor2 = '#172554';
                groundColor1 = '#334155'; groundColor2 = '#1e293b';
            } else if (levelName === 'ANCIENT RUINS' || levelName === 'MYSTIC TEMPLE') {
                skyColor1 = '#fde68a'; skyColor2 = '#fbbf24';
                groundColor1 = '#d97706'; groundColor2 = '#b45309';
            } else if (levelName === 'DESERT DUNES') {
                skyColor1 = '#fef3c7'; skyColor2 = '#fde68a';
                groundColor1 = '#fbbf24'; groundColor2 = '#f59e0b';
            } else if (levelName === 'SKY FORTRESS' || levelName === 'CELESTIAL PLAINS') {
                skyColor1 = '#ddd6fe'; skyColor2 = '#c4b5fd';
                groundColor1 = '#e0e7ff'; groundColor2 = '#c7d2fe';
            } else if (levelName === 'NETHER DIMENSION' || levelName === 'CHAOS REALM') {
                skyColor1 = '#7f1d1d'; skyColor2 = '#450a0a';
                groundColor1 = '#450a0a'; groundColor2 = '#1c0a00';
            } else if (levelName === 'IRON CITADEL') {
                skyColor1 = '#52525b'; skyColor2 = '#71717a';
                groundColor1 = '#3f3f46'; groundColor2 = '#27272a';
            } else if (levelName === 'EMERALD GARDENS') {
                skyColor1 = '#86efac'; skyColor2 = '#4ade80';
                groundColor1 = '#16a34a'; groundColor2 = '#15803d';
            } else if (levelName === 'TWILIGHT ZONE') {
                skyColor1 = '#a855f7'; skyColor2 = '#6b21a8';
                groundColor1 = '#581c87'; groundColor2 = '#3b0764';
            } else if (levelName === 'BONE VALLEY') {
                skyColor1 = '#a1a1aa'; skyColor2 = '#d4d4d8';
                groundColor1 = '#e7e5e4'; groundColor2 = '#d6d3d1';
            } else if (levelName === 'DRAGONS LAIR') {
                skyColor1 = '#ea580c'; skyColor2 = '#b91c1c';
                groundColor1 = '#78350f'; groundColor2 = '#451a03';
            } else if (levelName === 'INFINITY ARENA' || levelName === 'ETERNAL BATTLEGROUND') {
                skyColor1 = '#4338ca'; skyColor2 = '#3730a3';
                groundColor1 = '#312e81'; groundColor2 = '#1e1b4b';
            } else if (levelName === 'COSMIC NEXUS' || levelName === 'DIVINE SANCTUM') {
                skyColor1 = '#fdf4ff'; skyColor2 = '#fae8ff';
                groundColor1 = '#e9d5ff'; groundColor2 = '#d8b4fe';
            } else if (levelName === 'APOCALYPSE ZONE') {
                skyColor1 = '#44403c'; skyColor2 = '#1c1917';
                groundColor1 = '#000000'; groundColor2 = '#1c1917';
            }
            
            // Draw sky
            const skyGrad = ctx.createLinearGradient(0, 0, 0, ground);
            skyGrad.addColorStop(0, skyColor1);
            skyGrad.addColorStop(1, skyColor2);
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, canvas.width, ground);
            
            // Draw special background elements for caves
            if (levelName === 'CRYSTAL CAVERNS') {
                // Draw crystals
                for (let i = 0; i < 8; i++) {
                    const x = 100 + i * 150;
                    const y = 50 + Math.sin(i) * 30;
                    ctx.fillStyle = ['#0ea5e9', '#06b6d4', '#8b5cf6'][i % 3];
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x - 15, y + 30);
                    ctx.lineTo(x, y + 50);
                    ctx.lineTo(x + 15, y + 30);
                    ctx.closePath();
                    ctx.fill();
                }
            } else if (levelName === 'BONE VALLEY') {
                // Draw bones
                for (let i = 0; i < 10; i++) {
                    const x = 80 + i * 120;
                    const y = ground - 40;
                    ctx.fillStyle = '#f5f5f4';
                    ctx.fillRect(x, y, 50, 8);
                    ctx.fillRect(x - 5, y - 5, 12, 18);
                    ctx.fillRect(x + 43, y - 5, 12, 18);
                }
            }
            
            // Draw ground
            ctx.fillStyle = groundColor1;
            ctx.fillRect(0, ground, canvas.width, canvas.height - ground);
            
            // Ground details
            ctx.fillStyle = groundColor2;
            for (let x = 0; x < canvas.width; x += 24) ctx.fillRect(x, ground, 12, 8);
        }
        
        function drawLevelHazards() {
            // Draw and update hazards
            for (let i = levelHazards.length - 1; i >= 0; i--) {
                const hazard = levelHazards[i];
                
                if (hazard.type === 'meteor') {
                    ctx.fillStyle = '#ea580c';
                    ctx.beginPath();
                    ctx.arc(hazard.x, hazard.y, hazard.size, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Trail
                    ctx.fillStyle = '#fb923c';
                    for (let j = 1; j < 5; j++) {
                        ctx.beginPath();
                        ctx.arc(hazard.x - hazard.vx * j * 2, hazard.y - hazard.vy * j * 2, hazard.size * (1 - j * 0.15), 0, Math.PI * 2);
                        ctx.fill();
                    }
                } else if (hazard.type === 'lava') {
                    ctx.fillStyle = '#dc2626';
                    ctx.beginPath();
                    ctx.arc(hazard.x, hazard.y, hazard.size, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Inner glow
                    ctx.fillStyle = '#fb923c';
                    ctx.beginPath();
                    ctx.arc(hazard.x, hazard.y, hazard.size * 0.6, 0, Math.PI * 2);
                    ctx.fill();
                } else if (hazard.type === 'spike') {
                    // Ground spikes
                    ctx.fillStyle = '#374151';
                    ctx.beginPath();
                    ctx.moveTo(hazard.x, groundY() - 25);
                    ctx.lineTo(hazard.x - 15, groundY());
                    ctx.lineTo(hazard.x + 15, groundY());
                    ctx.closePath();
                    ctx.fill();
                    ctx.fillStyle = '#6b7280';
                    ctx.beginPath();
                    ctx.moveTo(hazard.x, groundY() - 25);
                    ctx.lineTo(hazard.x - 8, groundY() - 12);
                    ctx.lineTo(hazard.x, groundY());
                    ctx.closePath();
                    ctx.fill();
                } else if (hazard.type === 'poison_cloud') {
                    // Poison gas cloud
                    ctx.save();
                    ctx.globalAlpha = 0.6;
                    ctx.fillStyle = '#84cc16';
                    for (let j = 0; j < 5; j++) {
                        const offset = Math.sin(Date.now() / 200 + j) * 15;
                        ctx.beginPath();
                        ctx.arc(hazard.x + offset, hazard.y + j * 10, 25, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.globalAlpha = 1.0;
                    ctx.restore();
                } else if (hazard.type === 'lightning') {
                    // Lightning strike warning then bolt
                    if (hazard.timer > hazard.strikeTime) {
                        // Warning indicator
                        ctx.strokeStyle = '#eab308';
                        ctx.lineWidth = 3;
                        ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.5;
                        ctx.beginPath();
                        ctx.moveTo(hazard.x, 0);
                        ctx.lineTo(hazard.x, canvas.height);
                        ctx.stroke();
                        ctx.globalAlpha = 1.0;
                    } else {
                        // Actual lightning bolt
                        ctx.strokeStyle = '#fef08a';
                        ctx.lineWidth = 8;
                        ctx.shadowBlur = 20;
                        ctx.shadowColor = '#eab308';
                        ctx.beginPath();
                        ctx.moveTo(hazard.x, 0);
                        let y = 0;
                        while (y < canvas.height) {
                            const nextY = y + 20;
                            const offsetX = (Math.random() - 0.5) * 30;
                            ctx.lineTo(hazard.x + offsetX, nextY);
                            y = nextY;
                        }
                        ctx.stroke();
                        ctx.shadowBlur = 0;
                    }
                } else if (hazard.type === 'fireball') {
                    // Fireball projectile
                    ctx.save();
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = '#ef4444';
                    ctx.fillStyle = '#ef4444';
                    ctx.beginPath();
                    ctx.arc(hazard.x, hazard.y, 15, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#fbbf24';
                    ctx.beginPath();
                    ctx.arc(hazard.x - 5, hazard.y - 5, 8, 0, Math.PI * 2);
                    ctx.fill();
                    // Trail
                    ctx.fillStyle = '#fb923c';
                    for (let j = 1; j < 4; j++) {
                        ctx.globalAlpha = 1 - j * 0.25;
                        ctx.beginPath();
                        ctx.arc(hazard.x - hazard.vx * j * 0.1, hazard.y - hazard.vy * j * 0.1, 12 - j * 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.shadowBlur = 0;
                    ctx.restore();
                } else if (hazard.type === 'ice_spike') {
                    // Ice spike rising from ground
                    const height = Math.min(hazard.timer * 30, 40);
                    ctx.fillStyle = '#3b82f6';
                    ctx.save();
                    ctx.globalAlpha = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(hazard.x, groundY() - height);
                    ctx.lineTo(hazard.x - 12, groundY());
                    ctx.lineTo(hazard.x + 12, groundY());
                    ctx.closePath();
                    ctx.fill();
                    ctx.fillStyle = '#93c5fd';
                    ctx.beginPath();
                    ctx.moveTo(hazard.x, groundY() - height);
                    ctx.lineTo(hazard.x - 6, groundY() - height + 15);
                    ctx.lineTo(hazard.x, groundY());
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
            }
        }
        
        function updateLevelHazards() {
            const levelName = LEVEL_NAMES[currentLevel] || '';
            
            // Update existing hazards
            for (let i = levelHazards.length - 1; i >= 0; i--) {
                const hazard = levelHazards[i];
                const dt = 1/60;
                
                if (hazard.type === 'meteor') {
                    hazard.x += hazard.vx;
                    hazard.y += hazard.vy;
                    if (hazard.y > groundY() + 50) levelHazards.splice(i, 1);
                    // Damage player on contact
                    if (Math.hypot(hazard.x - player.x, hazard.y - player.y) < hazard.size + 20 && player.invulnTimer <= 0) {
                        player.hp -= 10;
                        player.invulnTimer = 0.8;
                        effects.push({ type: 'hit', x: player.x, y: player.y, timer: 0.3 });
                    }
                } else if (hazard.type === 'lava') {
                    hazard.y += hazard.vy;
                    hazard.vy += 0.5; // gravity
                    if (hazard.y > groundY()) levelHazards.splice(i, 1);
                    if (Math.hypot(hazard.x - player.x, hazard.y - player.y) < hazard.size + 15 && player.invulnTimer <= 0) {
                        player.hp -= 5;
                        player.invulnTimer = 0.8;
                        effects.push({ type: 'fire', x: player.x, y: player.y, timer: 0.3, color: '#dc2626' });
                    }
                } else if (hazard.type === 'spike') {
                    // Static spikes on ground
                    if (Math.abs(player.x - hazard.x) < 30 && player.y >= groundY() - player.h - 5 && player.invulnTimer <= 0) {
                        player.hp -= 8;
                        player.invulnTimer = 0.8;
                        effects.push({ type: 'hit', x: player.x, y: player.y, timer: 0.3 });
                    }
                } else if (hazard.type === 'poison_cloud') {
                    hazard.timer -= dt;
                    if (hazard.timer <= 0) levelHazards.splice(i, 1);
                    if (Math.hypot(hazard.x - player.x, hazard.y - player.y) < 80 && player.invulnTimer <= 0) {
                        player.hp -= 2;
                        player.invulnTimer = 0.5;
                        effects.push({ type: 'poison', x: player.x, y: player.y, timer: 0.3, color: '#84cc16' });
                    }
                } else if (hazard.type === 'lightning') {
                    hazard.timer -= dt;
                    if (hazard.timer <= 0) levelHazards.splice(i, 1);
                    if (hazard.timer === hazard.strikeTime && Math.abs(player.x - hazard.x) < 40 && player.invulnTimer <= 0) {
                        player.hp -= 15;
                        player.invulnTimer = 0.8;
                        effects.push({ type: 'lightning', x: player.x, y: player.y - 50, timer: 0.4, color: '#eab308' });
                    }
                } else if (hazard.type === 'fireball') {
                    hazard.x += hazard.vx;
                    hazard.y += hazard.vy;
                    if (hazard.x < -50 || hazard.x > canvas.width + 50) levelHazards.splice(i, 1);
                    if (Math.hypot(hazard.x - player.x, hazard.y - player.y) < 25 && player.invulnTimer <= 0) {
                        player.hp -= 12;
                        player.invulnTimer = 0.8;
                        effects.push({ type: 'fire', x: player.x, y: player.y, timer: 0.5, color: '#ef4444' });
                        levelHazards.splice(i, 1);
                    }
                } else if (hazard.type === 'ice_spike') {
                    hazard.timer -= dt;
                    if (hazard.timer <= 0) levelHazards.splice(i, 1);
                    if (Math.hypot(hazard.x - player.x, hazard.y - player.y) < 30 && player.invulnTimer <= 0) {
                        player.hp -= 7;
                        player.invulnTimer = 0.8;
                        player.speed *= 0.5;
                        setTimeout(() => { player.speed = 220; }, 2000);
                        effects.push({ type: 'ice', x: player.x, y: player.y, timer: 0.5, color: '#3b82f6' });
                        levelHazards.splice(i, 1);
                    }
                }
            }
            
            // Spawn meteors in certain levels
            if ((levelName === 'COSMIC NEXUS' || levelName === 'APOCALYPSE ZONE' || levelName === 'METEOR VALLEY') && Math.random() < 0.01) {
                levelHazards.push({
                    type: 'meteor',
                    x: Math.random() * canvas.width,
                    y: -50,
                    vx: (Math.random() - 0.5) * 4,
                    vy: 6 + Math.random() * 3,
                    size: 15 + Math.random() * 10
                });
            }
            
            // Spawn lava in volcanic levels
            if ((levelName === 'VOLCANIC WASTES' || levelName === 'CRIMSON CANYON' || levelName === 'DRAGONS LAIR' || levelName === 'LAVA CITADEL' || levelName === 'ETERNAL FLAMES') && Math.random() < 0.015) {
                levelHazards.push({
                    type: 'lava',
                    x: Math.random() * canvas.width,
                    y: groundY(),
                    vy: -15 - Math.random() * 5,
                    size: 8 + Math.random() * 6
                });
            }
            
            // Poison clouds in swamp levels
            if ((levelName === 'CURSED SWAMP' || levelName === 'PLAGUE MARSH' || levelName === 'VENOM SWAMP') && Math.random() < 0.008) {
                levelHazards.push({
                    type: 'poison_cloud',
                    x: Math.random() * canvas.width,
                    y: groundY() - 60,
                    timer: 5 + Math.random() * 3,
                    size: 50
                });
            }
            
            // Lightning strikes in storm levels
            if ((levelName === 'THUNDER PEAKS' || levelName === 'STORM FRONT' || levelName === 'TEMPEST PEAK' || levelName === 'ETERNAL STORM') && Math.random() < 0.012) {
                levelHazards.push({
                    type: 'lightning',
                    x: Math.random() * canvas.width,
                    y: 0,
                    timer: 1.5,
                    strikeTime: 1.0
                });
            }
            
            // Fireballs in inferno levels
            if ((levelName === 'HELLFIRE BASIN' || levelName === 'INFERNO DEPTHS' || levelName === 'DEMON GATE') && Math.random() < 0.01) {
                const fromRight = Math.random() > 0.5;
                levelHazards.push({
                    type: 'fireball',
                    x: fromRight ? canvas.width + 30 : -30,
                    y: groundY() - 100 - Math.random() * 100,
                    vx: fromRight ? -8 : 8,
                    vy: 0,
                    size: 20
                });
            }
            
            // Ice spikes in frozen levels
            if ((levelName === 'FROZEN TUNDRA' || levelName === 'FROZEN HELL' || levelName === 'ICE PALACE' || levelName === 'GLACIER PEAK') && Math.random() < 0.01) {
                levelHazards.push({
                    type: 'ice_spike',
                    x: Math.random() * canvas.width,
                    y: groundY() - 50,
                    timer: 2,
                    size: 15
                });
            }
        }

        function drawClouds() {
            const levelName = LEVEL_NAMES[currentLevel] || '';
            // Don't draw clouds in caves or dark levels
            if (levelName === 'CRYSTAL CAVERNS' || levelName === 'SHADOW REALM' || 
                levelName === 'VOID CHASM' || levelName === 'NETHER DIMENSION' || 
                levelName === 'OBLIVION GATE') return;
                
            ctx.fillStyle = '#f8fafc';
            [100, 300, 550, 750, 950].forEach((x, i) => {
                const y = 60 + (i % 3) * 40;
                [[1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2], [2, 2]].forEach(([bx, by]) => ctx.fillRect(x + bx * 16, y + by * 12, 16, 12));
            });
        }

        function drawShops() {
            for (const shop of shops) {
                // Calculate animated position
                let shopX = shop.baseX;
                
                if (shopsMovingIn) {
                    // Shops come from right side to their target position
                    const startX = canvas.width + shop.w;
                    const targetX = shop.baseX;
                    shopX = startX + (targetX - startX) * easeOutCubic(shopAnimationProgress);
                } else if (shopsMovingOut) {
                    // Shops quickly move away to the right
                    const targetX = canvas.width + shop.w;
                    shopX = shop.baseX + (targetX - shop.baseX) * easeInCubic(shopAnimationProgress - 1.0);
                }
                
                const x = shopX, y = shop.y;
                const w = shop.w, h = shop.h;
                
                // Main wooden wall
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(x, y, w, h);
                
                // Horizontal wood planks
                ctx.strokeStyle = '#5D3A1A';
                ctx.lineWidth = 2;
                for (let py = y + 20; py < y + h; py += 25) {
                    ctx.beginPath();
                    ctx.moveTo(x, py);
                    ctx.lineTo(x + w, py);
                    ctx.stroke();
                }
                
                // Vertical wood grain lines
                ctx.strokeStyle = '#6B4423';
                ctx.lineWidth = 1;
                for (let px = x + 15; px < x + w; px += 30) {
                    ctx.beginPath();
                    ctx.moveTo(px, y);
                    ctx.lineTo(px, y + h);
                    ctx.stroke();
                }
                
                // Wood corner posts
                ctx.fillStyle = '#5D3A1A';
                ctx.fillRect(x, y, 12, h);
                ctx.fillRect(x + w - 12, y, 12, h);
                
                // Roof (wooden shingles)
                ctx.fillStyle = '#654321';
                ctx.beginPath();
                ctx.moveTo(x - 20, y);
                ctx.lineTo(x + w / 2, y - 70);
                ctx.lineTo(x + w + 20, y);
                ctx.closePath();
                ctx.fill();
                
                // Roof shingle lines
                ctx.strokeStyle = '#4A3520';
                ctx.lineWidth = 2;
                for (let ry = y - 10; ry > y - 60; ry -= 15) {
                    const progress = (y - ry) / 70;
                    const leftX = x - 20 + (w / 2 + 20) * progress;
                    const rightX = x + w + 20 - (w / 2 + 20) * progress;
                    ctx.beginPath();
                    ctx.moveTo(leftX, ry);
                    ctx.lineTo(rightX, ry);
                    ctx.stroke();
                }
                
                // Roof peak highlight
                ctx.strokeStyle = '#7B5B3A';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(x - 20, y);
                ctx.lineTo(x + w / 2, y - 70);
                ctx.lineTo(x + w + 20, y);
                ctx.stroke();
                
                // Big door
                ctx.fillStyle = '#4A3520';
                ctx.fillRect(x + w / 2 - 30, y + h - 90, 60, 90);
                
                // Door wood grain
                ctx.strokeStyle = '#3A2810';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x + w / 2, y + h - 90);
                ctx.lineTo(x + w / 2, y + h);
                ctx.stroke();
                
                // Door handle
                ctx.fillStyle = '#fbbf24';
                ctx.beginPath();
                ctx.arc(x + w / 2 + 18, y + h - 45, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#d97706';
                ctx.beginPath();
                ctx.arc(x + w / 2 + 18, y + h - 45, 3, 0, Math.PI * 2);
                ctx.fill();
                
                // Windows (with warm glow)
                ctx.fillStyle = '#fef3c7';
                ctx.fillRect(x + 25, y + 30, 50, 45);
                ctx.fillRect(x + w - 75, y + 30, 50, 45);
                
                // Window frames (wood)
                ctx.strokeStyle = '#4A3520';
                ctx.lineWidth = 4;
                ctx.strokeRect(x + 25, y + 30, 50, 45);
                ctx.strokeRect(x + w - 75, y + 30, 50, 45);
                
                // Window panes
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x + 50, y + 30);
                ctx.lineTo(x + 50, y + 75);
                ctx.moveTo(x + 25, y + 52);
                ctx.lineTo(x + 75, y + 52);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x + w - 50, y + 30);
                ctx.lineTo(x + w - 50, y + 75);
                ctx.moveTo(x + w - 75, y + 52);
                ctx.lineTo(x + w - 25, y + 52);
                ctx.stroke();
                
                // Sign board
                ctx.fillStyle = '#2D1F0F';
                ctx.fillRect(x + w / 2 - 60, y - 40, 120, 35);
                
                // Sign border
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 3;
                ctx.strokeRect(x + w / 2 - 60, y - 40, 120, 35);
                
                // Sign text
                ctx.fillStyle = '#fbbf24';
                ctx.font = '12px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(shop.signText, x + w / 2, y - 18);
                
                // Icon above door
                ctx.font = '24px sans-serif';
                ctx.fillText(shop.icon, x + w / 2, y + h - 100);
            }
            
            // Show prompt if near a shop
            const nearShop = getNearbyShop();
            if (nearShop && !dialogueOpen && !insideShop && !shopsMovingIn && !shopsMovingOut) {
                ctx.fillStyle = '#22c55e';
                ctx.font = '14px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                let shopX = nearShop.baseX;
                if (shopsMovingIn) {
                    const startX = canvas.width + nearShop.w;
                    shopX = startX + (nearShop.baseX - startX) * easeOutCubic(shopAnimationProgress);
                } else if (shopsMovingOut) {
                    const targetX = canvas.width + nearShop.w;
                    shopX = nearShop.baseX + (targetX - nearShop.baseX) * easeInCubic(shopAnimationProgress - 1.0);
                }
                ctx.fillText('PRESS Q TO ENTER', shopX + nearShop.w / 2, nearShop.y - 80);
            }
        }
        
        // Easing functions for smooth animations
        function easeOutCubic(t) {
            return 1 - Math.pow(1 - t, 3);
        }
        
        function easeInCubic(t) {
            return t * t * t;
        }

        function drawShopInterior() {
            if (!insideShop) return;
            
            // Dark overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Interior wooden walls
            const ix = 100, iy = 80;
            const iw = canvas.width - 200, ih = canvas.height - 160;
            
            // Floor
            ctx.fillStyle = '#654321';
            ctx.fillRect(ix, iy + ih - 100, iw, 100);
            
            // Floor planks
            ctx.strokeStyle = '#4A3520';
            ctx.lineWidth = 2;
            for (let fx = ix; fx < ix + iw; fx += 60) {
                ctx.beginPath();
                ctx.moveTo(fx, iy + ih - 100);
                ctx.lineTo(fx, iy + ih);
                ctx.stroke();
            }
            
            // Back wall
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(ix, iy, iw, ih - 100);
            
            // Wall planks horizontal
            ctx.strokeStyle = '#5D3A1A';
            for (let wy = iy + 30; wy < iy + ih - 100; wy += 40) {
                ctx.beginPath();
                ctx.moveTo(ix, wy);
                ctx.lineTo(ix + iw, wy);
                ctx.stroke();
            }
            
            // Counter
            ctx.fillStyle = '#5D3A1A';
            ctx.fillRect(ix + 100, iy + ih - 180, iw - 200, 30);
            ctx.fillRect(ix + 100, iy + ih - 150, 20, 50);
            ctx.fillRect(ix + iw - 120, iy + ih - 150, 20, 50);
            
            // Shopkeeper
            const skx = ix + iw / 2, sky = iy + ih - 220;
            ctx.fillStyle = '#fcd34d'; // Head
            ctx.fillRect(skx - 20, sky, 40, 35);
            ctx.fillStyle = '#1e293b'; // Eyes
            ctx.fillRect(skx - 12, sky + 12, 8, 8);
            ctx.fillRect(skx + 4, sky + 12, 8, 8);
            ctx.fillStyle = insideShop.shopType === 'weapon' ? '#dc2626' : 
                           insideShop.shopType === 'armor' ? '#3b82f6' : 
                           insideShop.shopType === 'potion' ? '#e91e63' : '#22c55e';
            ctx.fillRect(skx - 25, sky + 35, 50, 50); // Body
            
            // Shop name
            ctx.fillStyle = '#fbbf24';
            ctx.font = '20px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(insideShop.name, canvas.width / 2, iy + 50);
            
            // Exit hint
            ctx.fillStyle = '#94a3b8';
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillText('PRESS Q OR ESC TO EXIT', canvas.width / 2, iy + ih - 20);
        }
