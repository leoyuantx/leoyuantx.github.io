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

        function drawCompanions() {
            for (const comp of companions) {
                const x = comp.x - comp.w / 2, y = comp.y;
                
                ctx.save();
                // Flip for facing direction
                if (comp.facing < 0) {
                    ctx.translate(comp.x, 0);
                    ctx.scale(-1, 1);
                    ctx.translate(-comp.x, 0);
                }
                
                // Walking animation offsets
                const bodyBob = comp.isWalking ? Math.sin(comp.animTime * 0.7) * 1 : 0;
                const leftLegOffset = comp.isWalking ? Math.sin(comp.animTime) * 3 : 0;
                const rightLegOffset = comp.isWalking ? Math.sin(comp.animTime + Math.PI) * 3 : 0;
                
                // Body with walking bob
                ctx.fillStyle = comp.color;
                ctx.fillRect(x + 6, y + 18 + bodyBob, 28, 22);
                
                // Head with walking bob
                ctx.fillStyle = '#fcd34d';
                ctx.fillRect(x + 10, y + 2 + bodyBob, 20, 16);
                
                // Eyes
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(x + 14, y + 8 + bodyBob, 4, 4);
                ctx.fillRect(x + 22, y + 8 + bodyBob, 4, 4);
                
                // Animated legs during walking
                ctx.fillStyle = '#475569';
                const leftLegY = y + 40 + leftLegOffset;
                const rightLegY = y + 40 + rightLegOffset;
                const leftLegHeight = 8 - Math.abs(leftLegOffset * 0.3);
                const rightLegHeight = 8 - Math.abs(rightLegOffset * 0.3);
                ctx.fillRect(x + 10, leftLegY, 8, leftLegHeight);
                ctx.fillRect(x + 22, rightLegY, 8, rightLegHeight);
                
                // Sword (attacking or idle)
                if (comp.attacking) {
                    // Sword swing animation
                    ctx.fillStyle = '#d1d5db';
                    ctx.fillRect(x + comp.w, y + 16 + bodyBob, 32, 4);
                    ctx.fillStyle = '#92400e';
                    ctx.fillRect(x + comp.w - 4, y + 14 + bodyBob, 6, 8);
                } else {
                    // Sword at side
                    ctx.fillStyle = '#d1d5db';
                    ctx.fillRect(x + comp.w - 2, y + 20 + bodyBob, 16, 4);
                    ctx.fillStyle = '#92400e';
                    ctx.fillRect(x + comp.w - 6, y + 18 + bodyBob, 6, 8);
                }
                
                ctx.restore();
            }
        }

        function drawPlayer() {
            const x = player.x - player.w / 2, y = player.y;
            const flash = player.invulnTimer > 0 && Math.floor(player.invulnTimer * 10) % 2 === 0;
            
            // Get equipment colors
            const armorColor = player.armorMaterial ? MATERIAL_COLORS[player.armorMaterial] : '#64748b';
            const swordColor = player.swordMaterial ? MATERIAL_COLORS[player.swordMaterial] : '#d1d5db';
            const shieldColor = player.shieldMaterial ? MATERIAL_COLORS[player.shieldMaterial] : null;

            ctx.save();
            if (player.facing < 0) { ctx.translate(player.x, 0); ctx.scale(-1, 1); ctx.translate(-player.x, 0); }

            // Walking animation offsets
            const bodyBob = player.isWalking ? Math.sin(player.animTime * 0.7) * 1 : 0;
            const leftLegOffset = player.isWalking ? Math.sin(player.animTime) * 3 : 0;
            const rightLegOffset = player.isWalking ? Math.sin(player.animTime + Math.PI) * 3 : 0;

            // Body (armor or training outfit) with walking bob
            ctx.fillStyle = flash ? '#f8fafc' : armorColor;
            ctx.fillRect(x + 8, y + 24 + bodyBob, 32, 28);
            // Armor highlights if wearing armor
            if (player.armorMaterial && !flash) {
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.fillRect(x + 8, y + 24 + bodyBob, 8, 28);
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.fillRect(x + 32, y + 24 + bodyBob, 8, 28);
            }

            // Head with walking bob
            ctx.fillStyle = flash ? '#f8fafc' : '#fcd34d';
            ctx.fillRect(x + 12, y + 4 + bodyBob, 24, 20);

            // Eyes
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(x + 16, y + 10 + bodyBob, 6, 6);
            ctx.fillRect(x + 26, y + 10 + bodyBob, 6, 6);

            // Animated legs during walking
            ctx.fillStyle = flash ? '#f8fafc' : '#475569';
            const leftLegY = y + 52 + leftLegOffset;
            const rightLegY = y + 52 + rightLegOffset;
            const leftLegHeight = 12 - Math.abs(leftLegOffset * 0.3);
            const rightLegHeight = 12 - Math.abs(rightLegOffset * 0.3);
            ctx.fillRect(x + 12, leftLegY, 10, leftLegHeight);
            ctx.fillRect(x + 26, rightLegY, 10, rightLegHeight);
            
            // Draw shield if raised (adjust position for body bob)
            if (player.shieldUp && shieldColor) {
                ctx.fillStyle = shieldColor;
                ctx.fillRect(x - 6, y + 16 + bodyBob, 14, 32);
                // Shield border
                ctx.strokeStyle = '#1e293b';
                ctx.lineWidth = 2;
                ctx.strokeRect(x - 6, y + 16 + bodyBob, 14, 32);
                // Shield emblem
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.beginPath();
                ctx.arc(x + 1, y + 32 + bodyBob, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            if (player.attacking) {
                // Sword swing animation - use sword material color (adjust for body bob)
                ctx.fillStyle = flash ? '#f8fafc' : swordColor;
                ctx.fillRect(x + player.w, y + 18 + bodyBob, 44, 6);
                ctx.fillStyle = 'rgba(255,255,255,0.5)'; // Blade highlight
                ctx.fillRect(x + player.w + 4, y + 18 + bodyBob, 36, 2);
                ctx.fillStyle = 'rgba(0,0,0,0.2)'; // Blade edge
                ctx.fillRect(x + player.w + 40, y + 16 + bodyBob, 8, 10);
                // Guard (cross-piece)
                ctx.fillStyle = '#fbbf24'; // Gold guard
                ctx.fillRect(x + player.w - 6, y + 14 + bodyBob, 10, 14);
                ctx.fillStyle = '#f59e0b'; // Guard shadow
                ctx.fillRect(x + player.w - 6, y + 24 + bodyBob, 10, 4);
            } else if (bowMode) {
                // Holding bow (adjust for body bob)
                ctx.fillStyle = '#92400e'; // Bow wood
                ctx.fillRect(x + player.w - 4, y + 16 + bodyBob, 6, 32);
                // Bow curve top
                ctx.fillRect(x + player.w + 2, y + 12 + bodyBob, 12, 6);
                // Bow curve bottom
                ctx.fillRect(x + player.w + 2, y + 44 + bodyBob, 12, 6);
                // Bow string
                ctx.fillStyle = '#e5e7eb';
                ctx.fillRect(x + player.w + 12, y + 16 + bodyBob, 2, 32);
                // Arrow nocked on bow
                if (bowTarget) {
                    ctx.fillStyle = '#78350f';
                    ctx.fillRect(x + player.w + 14, y + 30 + bodyBob, 20, 3);
                    ctx.fillStyle = '#94a3b8';
                    ctx.beginPath();
                    ctx.moveTo(x + player.w + 34, y + 31.5 + bodyBob);
                    ctx.lineTo(x + player.w + 42, y + 28 + bodyBob);
                    ctx.lineTo(x + player.w + 42, y + 35 + bodyBob);
                    ctx.closePath();
                    ctx.fill();
                    // Pulled back string
                    ctx.fillStyle = '#e5e7eb';
                    ctx.fillRect(x + player.w + 8, y + 30 + bodyBob, 6, 2);
                }
            } else {
                // Sheathed sword at side - use sword material color (adjust for body bob)
                ctx.fillStyle = '#92400e'; // Handle
                ctx.fillRect(x + player.w - 10, y + 20 + bodyBob, 6, 14);
                ctx.fillStyle = '#fbbf24'; // Pommel
                ctx.fillRect(x + player.w - 11, y + 32 + bodyBob, 8, 4);
                ctx.fillStyle = flash ? '#f8fafc' : swordColor; // Blade peeking out
                ctx.fillRect(x + player.w - 10, y + 36 + bodyBob, 4, 18);
                ctx.fillStyle = 'rgba(255,255,255,0.5)'; // Blade shine
                ctx.fillRect(x + player.w - 10, y + 36, 2, 18);
                
                // Draw shield at side if owned but not raised
                if (shieldColor && !player.shieldUp) {
                    ctx.fillStyle = shieldColor;
                    ctx.fillRect(x - 4, y + 30, 10, 20);
                    ctx.strokeStyle = '#1e293b';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x - 4, y + 30, 10, 20);
                }
            }

            ctx.restore();
            
            // Draw shield potion effect (after restore so it's not affected by flipping)
            if (player.potionEffects.shield.active) {
                const time = Date.now() * 0.003;
                const pulseScale = 1 + Math.sin(time * 2) * 0.05;
                const shieldRadius = 45 * pulseScale;
                
                // Shield dome glow
                const gradient = ctx.createRadialGradient(player.x, player.y + player.h / 2, shieldRadius * 0.5, player.x, player.y + player.h / 2, shieldRadius);
                gradient.addColorStop(0, 'rgba(59, 130, 246, 0)');
                gradient.addColorStop(0.7, 'rgba(59, 130, 246, 0.3)');
                gradient.addColorStop(1, 'rgba(59, 130, 246, 0.6)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(player.x, player.y + player.h / 2, shieldRadius, 0, Math.PI * 2);
                ctx.fill();
                
                // Shield dome outline with animated rotation
                ctx.strokeStyle = `rgba(96, 165, 250, ${0.6 + Math.sin(time * 3) * 0.2})`;
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.lineDashOffset = -time * 20;
                ctx.beginPath();
                ctx.arc(player.x, player.y + player.h / 2, shieldRadius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Hexagonal shield pattern
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i + time;
                    const hexRadius = shieldRadius * 0.7;
                    const hx = player.x + Math.cos(angle) * hexRadius;
                    const hy = player.y + player.h / 2 + Math.sin(angle) * hexRadius;
                    
                    ctx.fillStyle = `rgba(147, 197, 253, ${0.3 + Math.sin(time * 4 + i) * 0.2})`;
                    ctx.beginPath();
                    ctx.arc(hx, hy, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        function drawFloatingPlatforms() {
            ctx.fillStyle = '#64748b';
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 3;
            
            for (const platform of floatingPlatforms) {
                // Platform base
                ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
                
                // Platform highlights
                ctx.fillStyle = '#94a3b8';
                ctx.fillRect(platform.x + 5, platform.y + 3, platform.width - 10, 4);
                
                // Reset fill style
                ctx.fillStyle = '#64748b';
            }
        }

        function drawJetpackEffects() {
            if (!player.hasJetpack || !player.jetpackActive || player.jetpackFuel <= 0) return;
            
            // Jetpack on player's back
            const x = player.x - player.w / 2;
            const y = player.y;
            
            ctx.save();
            ctx.fillStyle = '#71717a';
            ctx.fillRect(x + 12, y + 15, 24, 30);
            
            // Fuel tanks
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(x + 14, y + 18, 8, 20);
            ctx.fillRect(x + 26, y + 18, 8, 20);
            
            // Thruster flames
            if (player.jetpackActive) {
                const flameLength = 15 + Math.random() * 10;
                const gradient = ctx.createLinearGradient(x + 24, y + 45, x + 24, y + 45 + flameLength);
                gradient.addColorStop(0, '#fbbf24');
                gradient.addColorStop(0.5, '#f97316');
                gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(x + 16, y + 45, 6, flameLength);
                ctx.fillRect(x + 26, y + 45, 6, flameLength);
            }
            
            ctx.restore();
            
            // Draw jetpack particles
            for (const p of particles) {
                ctx.globalAlpha = Math.max(0, p.life / 0.5);
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            }
            ctx.globalAlpha = 1;
        }

        // Draw fuel bar on right side of screen (always visible when jetpack owned)
        function drawJetpackFuelBar() {
            if (!player.hasJetpack) return;
            
            const barWidth = 16;
            const barHeight = 180;
            const barX = canvas.width - 40;
            const barY = canvas.height / 2 - barHeight / 2;
            const fuelPercent = player.jetpackFuel / player.maxJetpackFuel;
            const fuelColor = fuelPercent > 0.5 ? '#22c55e' : fuelPercent > 0.25 ? '#fbbf24' : '#ef4444';
            const filledHeight = barHeight * fuelPercent;
            
            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(barX - 3, barY - 3, barWidth + 6, barHeight + 6);
            
            // Empty portion
            ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Filled fuel (fills from bottom up)
            ctx.fillStyle = fuelColor;
            ctx.fillRect(barX, barY + barHeight - filledHeight, barWidth, filledHeight);
            
            // Glow effect when active
            if (player.jetpackActive && player.jetpackFuel > 0) {
                ctx.shadowColor = fuelColor;
                ctx.shadowBlur = 10;
                ctx.fillRect(barX, barY + barHeight - filledHeight, barWidth, filledHeight);
                ctx.shadowBlur = 0;
            }
            
            // Border
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 2;
            ctx.strokeRect(barX - 3, barY - 3, barWidth + 6, barHeight + 6);
            
            // Tick marks
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            for (let i = 1; i < 4; i++) {
                const tickY = barY + (barHeight * i / 4);
                ctx.beginPath();
                ctx.moveTo(barX, tickY);
                ctx.lineTo(barX + barWidth, tickY);
                ctx.stroke();
            }
            
            // Label
            ctx.fillStyle = '#f8fafc';
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('FUEL', barX + barWidth / 2, barY - 8);
            
            // Percentage
            ctx.fillText(Math.floor(fuelPercent * 100) + '%', barX + barWidth / 2, barY + barHeight + 14);
            
            // Show upgraded label
            if (player.jetpackUpgraded) {
                ctx.fillStyle = '#fbbf24';
                ctx.fillText('MAX', barX + barWidth / 2, barY + barHeight + 26);
            }
        }

        function drawForceFieldEffects() {
            if (!player.hasForceField) return;
            
            if (player.forceFieldActive && player.forceFieldHP > 0) {
                const time = Date.now() * 0.002;
                const pulseScale = 1 + Math.sin(time * 3) * 0.08;
                const fieldRadius = 50 * pulseScale;
                
                // Shield bubble
                const gradient = ctx.createRadialGradient(
                    player.x, player.y + player.h / 2, fieldRadius * 0.4,
                    player.x, player.y + player.h / 2, fieldRadius
                );
                gradient.addColorStop(0, 'rgba(59, 130, 246, 0)');
                gradient.addColorStop(0.7, 'rgba(59, 130, 246, 0.25)');
                gradient.addColorStop(1, 'rgba(59, 130, 246, 0.5)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(player.x, player.y + player.h / 2, fieldRadius, 0, Math.PI * 2);
                ctx.fill();
                
                // Shield outline with hexagon pattern
                ctx.strokeStyle = `rgba(96, 165, 250, ${0.7 + Math.sin(time * 4) * 0.3})`;
                ctx.lineWidth = 2.5;
                ctx.setLineDash([8, 4]);
                ctx.lineDashOffset = -time * 15;
                ctx.beginPath();
                ctx.arc(player.x, player.y + player.h / 2, fieldRadius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Energy nodes spinning around shield
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI / 4) * i + time;
                    const nx = player.x + Math.cos(angle) * (fieldRadius - 5);
                    const ny = player.y + player.h / 2 + Math.sin(angle) * (fieldRadius - 5);
                    
                    ctx.fillStyle = `rgba(147, 197, 253, ${0.6 + Math.sin(time * 5 + i) * 0.4})`;
                    ctx.beginPath();
                    ctx.arc(nx, ny, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else if (player.forceFieldRespawnTimer > 0) {
                // Show recharge progress
                const progress = 1 - (player.forceFieldRespawnTimer / 10);
                const barWidth = 80;
                const barHeight = 6;
                const barX = player.x - barWidth / 2;
                const barY = player.y - 40;
                
                // Background
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
                
                // Progress
                ctx.fillStyle = '#3b82f6';
                ctx.fillRect(barX, barY, barWidth * progress, barHeight);
                
                // Border
                ctx.strokeStyle = '#60a5fa';
                ctx.lineWidth = 1;
                ctx.strokeRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
                
                // Text
                ctx.fillStyle = '#93c5fd';
                ctx.font = '8px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.fillText('RECHARGING', player.x, barY - 6);
            }
        }

        function drawNPCs() {
            for (const npc of npcs) {
                const x = npc.x - npc.w / 2, y = npc.y;
                ctx.fillStyle = npc.color;
                ctx.fillRect(x + 4, y + 20, 40, 44);
                ctx.fillStyle = '#fcd34d';
                ctx.fillRect(x + 10, y + 2, 28, 20);
                ctx.fillStyle = '#9ca3af';
                ctx.fillRect(x + 14, y + 18, 20, 12);
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(x + 14, y + 8, 6, 6);
                ctx.fillRect(x + 28, y + 8, 6, 6);
            }
        }

        function drawEnemies() {
            for (const enemy of enemies) {
                if (!enemy.alive) continue;
                const x = enemy.x - enemy.w / 2, y = enemy.y;

                ctx.fillStyle = enemy.color;
                if (enemy.type === 'sword_dummy' || enemy.type === 'arrow_dummy') {
                    // Training dummy - wooden post with colored target
                    const isArrowDummy = enemy.type === 'arrow_dummy';
                    const targetColor = isArrowDummy ? '#3b82f6' : '#dc2626'; // Blue for arrow, Red for sword
                    const labelColor = isArrowDummy ? '#60a5fa' : '#f87171';
                    
                    // Wooden post
                    ctx.fillStyle = '#92400e';
                    ctx.fillRect(x + 12, y + 8, 16, 40);
                    // Post base
                    ctx.fillStyle = '#78350f';
                    ctx.fillRect(x + 8, y + 40, 24, 8);
                    // Target circle (head)
                    ctx.fillStyle = '#fbbf24';
                    ctx.beginPath();
                    ctx.arc(enemy.x, y + 12, 14, 0, Math.PI * 2);
                    ctx.fill();
                    // Target rings
                    ctx.strokeStyle = targetColor;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(enemy.x, y + 12, 10, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(enemy.x, y + 12, 5, 0, Math.PI * 2);
                    ctx.stroke();
                    // Bullseye
                    ctx.fillStyle = targetColor;
                    ctx.beginPath();
                    ctx.arc(enemy.x, y + 12, 3, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Icon to show what weapon to use
                    ctx.fillStyle = labelColor;
                    ctx.font = '12px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(isArrowDummy ? '🏹' : '⚔️', enemy.x, y - 8);
                } else if (enemy.type === 'slime') {
                    ctx.beginPath();
                    ctx.ellipse(enemy.x, y + enemy.h * 0.7, enemy.w / 2, enemy.h * 0.5, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(x + 10, y + 12, 8, 8);
                    ctx.fillRect(x + enemy.w - 18, y + 12, 8, 8);
                } else if (enemy.type === 'skeleton') {
                    // Skull head
                    ctx.fillStyle = '#f8fafc';
                    ctx.fillRect(x + 8, y + 4, 20, 20);
                    // Eye sockets
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(x + 10, y + 8, 6, 8);
                    ctx.fillRect(x + 20, y + 8, 6, 8);
                    // Ribs body
                    ctx.fillStyle = '#e0e7ff';
                    ctx.fillRect(x + 10, y + 24, 16, 24);
                    ctx.fillStyle = '#0f172a';
                    for (let i = 0; i < 3; i++) {
                        ctx.fillRect(x + 8, y + 26 + i * 6, 20, 2);
                    }
                    // Legs
                    ctx.fillStyle = '#f8fafc';
                    ctx.fillRect(x + 10, y + 48, 6, 4);
                    ctx.fillRect(x + 20, y + 48, 6, 4);
                } else if (enemy.type === 'bat') {
                    // Bat body
                    ctx.fillStyle = enemy.color;
                    ctx.fillRect(x + 14, y + 8, 10, 12);
                    // Animated wings
                    const wingFlap = Math.sin(Date.now() * 0.015) * 5;
                    ctx.beginPath();
                    ctx.moveTo(x + 14, y + 12);
                    ctx.lineTo(x + 4, y + 8 + wingFlap);
                    ctx.lineTo(x + 4, y + 18 + wingFlap);
                    ctx.closePath();
                    ctx.fill();
                    ctx.beginPath();
                    ctx.moveTo(x + 24, y + 12);
                    ctx.lineTo(x + 34, y + 8 + wingFlap);
                    ctx.lineTo(x + 34, y + 18 + wingFlap);
                    ctx.closePath();
                    ctx.fill();
                    // Eyes
                    ctx.fillStyle = '#dc2626';
                    ctx.fillRect(x + 16, y + 10, 2, 2);
                    ctx.fillRect(x + 20, y + 10, 2, 2);
                } else if (enemy.type === 'dark_knight') {
                    // Helmet
                    ctx.fillStyle = '#6b7280';
                    ctx.fillRect(x + 8, y + 4, 36, 28);
                    // Visor slit
                    ctx.fillStyle = '#dc2626';
                    ctx.fillRect(x + 12, y + 14, 28, 6);
                    // Armor body
                    ctx.fillStyle = enemy.color;
                    ctx.fillRect(x + 4, y + 32, 44, 36);
                    // Shoulder plates
                    ctx.fillStyle = '#6b7280';
                    ctx.fillRect(x, y + 32, 10, 12);
                    ctx.fillRect(x + 42, y + 32, 10, 12);
                    // Belt
                    ctx.fillStyle = '#78350f';
                    ctx.fillRect(x + 8, y + 52, 36, 4);
                } else if (enemy.type === 'wraith') {
                    // Ghostly transparency effect with aura
                    ctx.globalAlpha = 0.8;
                    // Hooded head
                    ctx.fillStyle = '#312e81';
                    ctx.fillRect(x + 8, y + 4, 26, 24);
                    // Face shadow
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(x + 12, y + 12, 18, 14);
                    // Glowing eyes
                    ctx.fillStyle = '#c7d2fe';
                    ctx.fillRect(x + 14, y + 14, 6, 6);
                    ctx.fillRect(x + 22, y + 14, 6, 6);
                    // Flowing robes
                    ctx.fillStyle = enemy.color;
                    ctx.beginPath();
                    ctx.moveTo(x + 21, y + 28);
                    ctx.lineTo(x + 4, y + 56);
                    ctx.lineTo(x + 38, y + 56);
                    ctx.closePath();
                    ctx.fill();
                    // Wispy bottom
                    ctx.fillStyle = '#818cf8';
                    const wispOffset = Math.sin(Date.now() * 0.005 + enemy.x * 0.01) * 3;
                    ctx.fillRect(x + 8 + wispOffset, y + 52, 8, 4);
                    ctx.fillRect(x + 24 - wispOffset, y + 52, 8, 4);
                    ctx.globalAlpha = 1.0;
                } else if (enemy.type === 'spider') {
                    // Spider body
                    ctx.fillStyle = enemy.color;
                    ctx.beginPath();
                    ctx.ellipse(enemy.x, y + enemy.h / 2, enemy.w / 2.5, enemy.h / 2.5, 0, 0, Math.PI * 2);
                    ctx.fill();
                    // Head segment
                    ctx.beginPath();
                    ctx.ellipse(enemy.x, y + 10, 10, 8, 0, 0, Math.PI * 2);
                    ctx.fill();
                    // Legs (4 pairs)
                    ctx.strokeStyle = '#7f1d1d';
                    ctx.lineWidth = 2;
                    const legOffset = Math.sin(Date.now() * 0.01) * 3;
                    for (let i = 0; i < 4; i++) {
                        const legY = y + 12 + i * 6;
                        // Left legs
                        ctx.beginPath();
                        ctx.moveTo(x + 10, legY);
                        ctx.lineTo(x - 6, legY + legOffset);
                        ctx.stroke();
                        // Right legs
                        ctx.beginPath();
                        ctx.moveTo(x + enemy.w - 10, legY);
                        ctx.lineTo(x + enemy.w + 6, legY - legOffset);
                        ctx.stroke();
                    }
                    // Eyes
                    ctx.fillStyle = '#dc2626';
                    for (let i = 0; i < 4; i++) {
                        ctx.fillRect(enemy.x - 6 + (i % 2) * 10, y + 8 + Math.floor(i / 2) * 4, 2, 2);
                    }
                } else if (enemy.type === 'ghost') {
                    // Ghostly semi-transparent
                    ctx.globalAlpha = 0.7;
                    ctx.fillStyle = enemy.color;
                    // Flowing ghost body
                    ctx.beginPath();
                    ctx.ellipse(enemy.x, y + enemy.h * 0.4, enemy.w / 2.2, enemy.h * 0.4, 0, 0, Math.PI * 2);
                    ctx.fill();
                    // Wavy bottom
                    const waveOffset = Math.sin(Date.now() * 0.008 + enemy.x * 0.05) * 4;
                    for (let i = 0; i < 3; i++) {
                        ctx.fillRect(x + 8 + i * 10, y + enemy.h - 8 + (i % 2) * waveOffset, 8, 8);
                    }
                    // Eyes
                    ctx.fillStyle = '#1e1b4b';
                    ctx.fillRect(x + 10, y + 12, 6, 8);
                    ctx.fillRect(x + 24, y + 12, 6, 8);
                    ctx.globalAlpha = 1.0;
                } else if (enemy.type === 'demon') {
                    // Muscular demon body
                    ctx.fillStyle = enemy.color;
                    ctx.fillRect(x + 8, y + 20, enemy.w - 16, enemy.h - 20);
                    // Horned head
                    ctx.fillRect(x + 12, y + 4, enemy.w - 24, 20);
                    // Horns
                    ctx.fillStyle = '#450a0a';
                    ctx.fillRect(x + 8, y, 8, 12);
                    ctx.fillRect(x + enemy.w - 16, y, 8, 12);
                    // Glowing eyes
                    ctx.fillStyle = '#fbbf24';
                    ctx.fillRect(x + 14, y + 10, 6, 6);
                    ctx.fillRect(x + enemy.w - 20, y + 10, 6, 6);
                    // Claws
                    ctx.fillStyle = '#450a0a';
                    ctx.fillRect(x, y + 30, 8, 12);
                    ctx.fillRect(x + enemy.w - 8, y + 30, 8, 12);
                } else if (enemy.type === 'necromancer') {
                    // Hooded robe
                    ctx.fillStyle = enemy.color;
                    ctx.fillRect(x + 8, y + 8, enemy.w - 16, enemy.h - 8);
                    // Hood
                    ctx.fillRect(x + 6, y, enemy.w - 12, 16);
                    // Face shadow
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(x + 12, y + 8, enemy.w - 24, 12);
                    // Glowing eyes
                    ctx.fillStyle = '#10b981';
                    ctx.fillRect(x + 14, y + 12, 4, 4);
                    ctx.fillRect(x + enemy.w - 18, y + 12, 4, 4);
                    // Staff
                    ctx.fillStyle = '#78350f';
                    ctx.fillRect(x + enemy.w - 12, y + 20, 4, 30);
                    // Orb
                    ctx.fillStyle = '#10b981';
                    ctx.fillRect(x + enemy.w - 14, y + 16, 8, 8);
                } else if (enemy.type === 'mimic') {
                    if (enemy.disguised) {
                        // Look like a treasure chest
                        ctx.fillStyle = '#78350f';
                        ctx.fillRect(x + 4, y + 12, enemy.w - 8, enemy.h - 12);
                        ctx.fillStyle = '#fbbf24';
                        ctx.fillRect(x + 8, y + 8, enemy.w - 16, 8);
                        ctx.fillRect(x + enemy.w / 2 - 4, y + 20, 8, 8);
                    } else {
                        // Revealed with teeth
                        ctx.fillStyle = enemy.color;
                        ctx.fillRect(x + 4, y + 12, enemy.w - 8, enemy.h - 12);
                        // Teeth
                        ctx.fillStyle = '#f8fafc';
                        for (let i = 0; i < 5; i++) {
                            ctx.fillRect(x + 8 + i * 6, y + 24, 4, 8);
                        }
                        // Eye
                        ctx.fillStyle = '#dc2626';
                        ctx.fillRect(x + enemy.w / 2 - 4, y + 16, 8, 8);
                    }
                } else if (enemy.type === 'gargoyle') {
                    // Stone winged creature
                    ctx.fillStyle = enemy.color;
                    // Body
                    ctx.fillRect(x + 12, y + 16, enemy.w - 24, enemy.h - 24);
                    // Head
                    ctx.fillRect(x + 14, y + 4, enemy.w - 28, 16);
                    // Wings
                    ctx.fillRect(x, y + 20, 10, 16);
                    ctx.fillRect(x + enemy.w - 10, y + 20, 10, 16);
                    // Horns
                    ctx.fillRect(x + 12, y, 6, 8);
                    ctx.fillRect(x + enemy.w - 18, y, 6, 8);
                    // Eyes
                    ctx.fillStyle = '#ef4444';
                    ctx.fillRect(x + 16, y + 8, 4, 4);
                    ctx.fillRect(x + enemy.w - 20, y + 8, 4, 4);
                } else if (enemy.type === 'shade') {
                    // Dark shadow creature
                    ctx.globalAlpha = 0.8;
                    ctx.fillStyle = enemy.color;
                    ctx.fillRect(x + 6, y + 4, enemy.w - 12, enemy.h - 4);
                    // Wispy edges
                    const shimmer = Math.sin(Date.now() * 0.01) * 2;
                    ctx.fillRect(x + shimmer, y + 10, 6, 20);
                    ctx.fillRect(x + enemy.w - 6 - shimmer, y + 10, 6, 20);
                    // Red eyes
                    ctx.globalAlpha = 1.0;
                    ctx.fillStyle = '#dc2626';
                    ctx.fillRect(x + 12, y + 14, 6, 6);
                    ctx.fillRect(x + enemy.w - 18, y + 14, 6, 6);
                } else if (enemy.type === 'berserker') {
                    // Muscular warrior
                    ctx.fillStyle = enemy.color;
                    // Body
                    ctx.fillRect(x + 8, y + 24, enemy.w - 16, enemy.h - 24);
                    // Head
                    ctx.fillRect(x + 12, y + 8, enemy.w - 24, 20);
                    // Arms (raised)
                    ctx.fillRect(x, y + 28, 12, 16);
                    ctx.fillRect(x + enemy.w - 12, y + 28, 12, 16);
                    // Eyes (glowing with rage)
                    ctx.fillStyle = '#fbbf24';
                    ctx.fillRect(x + 16, y + 14, 6, 6);
                    ctx.fillRect(x + enemy.w - 22, y + 14, 6, 6);
                    // Weapon
                    ctx.fillStyle = '#71717a';
                    ctx.fillRect(x + enemy.w - 8, y + 20, 4, 24);
                } else if (enemy.type === 'archer') {
                    // Archer with bow
                    ctx.fillStyle = enemy.color;
                    // Body
                    ctx.fillRect(x + 10, y + 20, enemy.w - 20, enemy.h - 20);
                    // Head
                    ctx.fillRect(x + 12, y + 8, enemy.w - 24, 16);
                    // Bow
                    ctx.strokeStyle = '#78350f';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(x + enemy.w - 8, y + 28, 12, -Math.PI / 4, Math.PI / 4);
                    ctx.stroke();
                    // Eyes
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(x + 14, y + 12, 4, 4);
                    ctx.fillRect(x + enemy.w - 18, y + 12, 4, 4);
                } else if (enemy.type === 'mage') {
                    // Mage with robe and staff
                    ctx.fillStyle = enemy.color;
                    // Robe
                    ctx.fillRect(x + 6, y + 16, enemy.w - 12, enemy.h - 16);
                    // Hood
                    ctx.fillRect(x + 8, y + 4, enemy.w - 16, 16);
                    // Face
                    ctx.fillStyle = '#f8fafc';
                    ctx.fillRect(x + 12, y + 10, enemy.w - 24, 12);
                    // Eyes
                    ctx.fillStyle = '#7c3aed';
                    ctx.fillRect(x + 14, y + 12, 4, 4);
                    ctx.fillRect(x + enemy.w - 18, y + 12, 4, 4);
                    // Staff with orb
                    ctx.fillStyle = '#78350f';
                    ctx.fillRect(x + 4, y + 20, 4, 30);
                    ctx.fillStyle = '#c084fc';
                    ctx.fillRect(x + 2, y + 16, 8, 8);
                } else if (enemy.type === 'assassin') {
                    // Stealthy ninja-like
                    ctx.globalAlpha = enemy.stealthy ? 0.6 : 1.0;
                    ctx.fillStyle = enemy.color;
                    // Body
                    ctx.fillRect(x + 8, y + 16, enemy.w - 16, enemy.h - 16);
                    // Head/mask
                    ctx.fillRect(x + 10, y + 4, enemy.w - 20, 16);
                    // Eyes only
                    ctx.fillStyle = '#ef4444';
                    ctx.fillRect(x + 14, y + 10, 4, 3);
                    ctx.fillRect(x + enemy.w - 18, y + 10, 4, 3);
                    // Daggers
                    ctx.fillStyle = '#71717a';
                    ctx.fillRect(x + 2, y + 24, 6, 12);
                    ctx.fillRect(x + enemy.w - 8, y + 24, 6, 12);
                    ctx.globalAlpha = 1.0;
                } else if (enemy.type === 'golem') {
                    // Large stone golem
                    ctx.fillStyle = enemy.color;
                    // Body (blocky)
                    ctx.fillRect(x + 10, y + 30, enemy.w - 20, enemy.h - 30);
                    // Head
                    ctx.fillRect(x + 16, y + 10, enemy.w - 32, 24);
                    // Arms
                    ctx.fillRect(x, y + 36, 14, 24);
                    ctx.fillRect(x + enemy.w - 14, y + 36, 14, 24);
                    // Stone cracks
                    ctx.strokeStyle = '#57534e';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(x + 20, y + 40);
                    ctx.lineTo(x + 30, y + 50);
                    ctx.moveTo(x + enemy.w - 30, y + 45);
                    ctx.lineTo(x + enemy.w - 20, y + 55);
                    ctx.stroke();
                    // Glowing core
                    ctx.fillStyle = '#fbbf24';
                    ctx.fillRect(x + enemy.w / 2 - 6, y + 50, 12, 12);
                } else if (enemy.type === 'harpy') {
                    // Bird-woman hybrid
                    ctx.fillStyle = enemy.color;
                    // Body
                    ctx.fillRect(x + 12, y + 16, enemy.w - 24, enemy.h - 24);
                    // Head
                    ctx.fillRect(x + 14, y + 6, enemy.w - 28, 14);
                    // Beak
                    ctx.fillStyle = '#fbbf24';
                    ctx.fillRect(x + enemy.w / 2 - 3, y + 14, 6, 6);
                    // Wings (flapping)
                    const wingFlap = Math.sin(Date.now() * 0.02) * 8;
                    ctx.fillStyle = '#9f1239';
                    ctx.fillRect(x - 4, y + 20 + wingFlap, 12, 20);
                    ctx.fillRect(x + enemy.w - 8, y + 20 + wingFlap, 12, 20);
                    // Eyes
                    ctx.fillStyle = '#fef2f2';
                    ctx.fillRect(x + 16, y + 10, 4, 4);
                    ctx.fillRect(x + enemy.w - 20, y + 10, 4, 4);
                }
                // === VEHICLES ===
                else if (enemy.type === 'tank') {
                    // Tank body (gray armor)
                    ctx.fillStyle = '#4b5563';
                    ctx.fillRect(x + 8, y + 24, enemy.w - 16, enemy.h - 24);
                    // Turret
                    ctx.fillStyle = '#374151';
                    ctx.fillRect(x + 18, y + 12, enemy.w - 36, 16);
                    // Cannon barrel
                    ctx.fillStyle = '#1f2937';
                    ctx.fillRect(x + enemy.w - 8, y + 16, 20, 6);
                    // Cannon tip highlight
                    ctx.fillStyle = '#6b7280';
                    ctx.fillRect(x + enemy.w - 8, y + 16, 16, 3);
                    // Treads
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(x + 4, y + 40, enemy.w - 8, 10);
                    ctx.fillStyle = '#6b7280';
                    for (let i = 0; i < 6; i++) {
                        ctx.fillRect(x + 6 + i * 12, y + 42, 8, 6);
                    }
                } else if (enemy.type === 'artillery') {
                    // Artillery gun platform
                    ctx.fillStyle = '#374151';
                    ctx.fillRect(x + 12, y + 28, enemy.w - 24, 20);
                    // Large angled cannon
                    ctx.save();
                    ctx.translate(x + enemy.w / 2, y + 28);
                    ctx.rotate(-Math.PI / 6); // Angled upward
                    ctx.fillStyle = '#1f2937';
                    ctx.fillRect(0, -4, 32, 8);
                    ctx.fillStyle = '#6b7280';
                    ctx.fillRect(0, -4, 28, 4);
                    ctx.restore();
                    // Base wheels
                    ctx.fillStyle = '#0f172a';
                    ctx.beginPath();
                    ctx.arc(x + 18, y + 48, 8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(x + enemy.w - 18, y + 48, 8, 0, Math.PI * 2);
                    ctx.fill();
                } else if (enemy.type === 'helicopter') {
                    // Helicopter body
                    ctx.fillStyle = enemy.color;
                    ctx.fillRect(x + 12, y + 16, enemy.w - 24, 20);
                    // Cockpit window
                    ctx.fillStyle = '#075985';
                    ctx.fillRect(x + 18, y + 18, 24, 12);
                    // Tail
                    ctx.fillStyle = '#0ea5e9';
                    ctx.fillRect(x + enemy.w - 16, y + 22, 16, 6);
                    // Tail rotor
                    ctx.fillStyle = '#0c4a6e';
                    ctx.fillRect(x + enemy.w - 2, y + 20, 4, 10);
                    // Landing skids
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(x + 10, y + 36, enemy.w - 20, 3);
                    // Main rotor (spinning)
                    ctx.save();
                    ctx.translate(x + enemy.w / 2, y + 8);
                    ctx.rotate(enemy.propellerRotation);
                    ctx.fillStyle = 'rgba(31, 41, 55, 0.4)';
                    ctx.fillRect(-enemy.w / 2, -2, enemy.w, 4);
                    ctx.fillRect(-2, -enemy.w / 2, 4, enemy.w);
                    ctx.restore();
                } else if (enemy.type === 'armored_car') {
                    // Armored car body
                    ctx.fillStyle = enemy.color;
                    ctx.fillRect(x + 8, y + 18, enemy.w - 16, 20);
                    // Cabin
                    ctx.fillStyle = '#4b5563';
                    ctx.fillRect(x + 16, y + 10, enemy.w - 32, 12);
                    // Windows
                    ctx.fillStyle = '#1e293b';
                    ctx.fillRect(x + 20, y + 12, 12, 8);
                    ctx.fillRect(x + enemy.w - 32, y + 12, 12, 8);
                    // Gun turret
                    ctx.fillStyle = '#374151';
                    ctx.fillRect(x + enemy.w / 2 - 4, y + 6, 8, 8);
                    ctx.fillRect(x + enemy.w / 2 + 4, y + 8, 12, 4);
                    // Wheels
                    ctx.fillStyle = '#0f172a';
                    ctx.beginPath();
                    ctx.arc(x + 14, y + 40, 6, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(x + enemy.w - 14, y + 40, 6, 0, Math.PI * 2);
                    ctx.fill();
                } else if (enemy.type === 'mech') {
                    // Large walking mech
                    ctx.fillStyle = enemy.color;
                    // Torso
                    ctx.fillRect(x + 16, y + 24, enemy.w - 32, 36);
                    // Head/cockpit
                    ctx.fillStyle = '#991b1b';
                    ctx.fillRect(x + 22, y + 12, enemy.w - 44, 16);
                    // Cockpit window
                    ctx.fillStyle = '#fef3c7';
                    ctx.fillRect(x + 26, y + 16, enemy.w - 52, 8);
                    // Shoulder weapons
                    ctx.fillStyle = '#6b7280';
                    ctx.fillRect(x + 8, y + 28, 10, 12);
                    ctx.fillRect(x + enemy.w - 18, y + 28, 10, 12);
                    // Arms
                    ctx.fillStyle = '#dc2626';
                    ctx.fillRect(x + 6, y + 44, 12, 24);
                    ctx.fillRect(x + enemy.w - 18, y + 44, 12, 24);
                    // Legs (animated walking)
                    const legPos = Math.sin(enemy.legAnimation) * 4;
                    ctx.fillStyle = '#991b1b';
                    ctx.fillRect(x + 20, y + 60, 12, 30 + legPos);
                    ctx.fillRect(x + enemy.w - 32, y + 60, 12, 30 - legPos);
                    // Feet
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(x + 18, y + 88 + legPos, 16, 6);
                    ctx.fillRect(x + enemy.w - 34, y + 88 - legPos, 16, 6);
                } else if (enemy.type === 'drone') {
                    // Small drone
                    ctx.fillStyle = enemy.color;
                    // Body
                    ctx.fillRect(x + 10, y + 8, enemy.w - 20, 12);
                    // Propellers (4)
                    ctx.fillStyle = '#164e63';
                    const propellerSpin = Date.now() * 0.05;
                    for (let i = 0; i < 4; i++) {
                        const px = x + 8 + (i % 2) * (enemy.w - 16);
                        const py = y + 4 + Math.floor(i / 2) * 16;
                        ctx.save();
                        ctx.translate(px, py);
                        ctx.rotate(propellerSpin);
                        ctx.fillRect(-6, -1, 12, 2);
                        ctx.fillRect(-1, -6, 2, 12);
                        ctx.restore();
                    }
                    // Camera/sensor
                    ctx.fillStyle = '#dc2626';
                    ctx.beginPath();
                    ctx.arc(x + enemy.w / 2, y + 14, 3, 0, Math.PI * 2);
                    ctx.fill();
                } else if (enemy.type === 'apc') {
                    // Armored Personnel Carrier
                    ctx.fillStyle = enemy.color;
                    // Main body
                    ctx.fillRect(x + 6, y + 16, enemy.w - 12, 28);
                    // Angled front
                    ctx.beginPath();
                    ctx.moveTo(x + 6, y + 16);
                    ctx.lineTo(x + 6, y + 44);
                    ctx.lineTo(x, y + 44);
                    ctx.lineTo(x + 12, y + 16);
                    ctx.closePath();
                    ctx.fill();
                    // Troop compartment
                    ctx.fillStyle = '#047857';
                    ctx.fillRect(x + 16, y + 18, enemy.w - 32, 24);
                    // Weapon mount
                    ctx.fillStyle = '#374151';
                    ctx.fillRect(x + enemy.w / 2 - 4, y + 10, 8, 10);
                    // Treads
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(x + 4, y + 44, enemy.w - 8, 4);
                    for (let i = 0; i < 7; i++) {
                        ctx.fillRect(x + 6 + i * 10, y + 42, 6, 6);
                    }
                } else if (enemy.type === 'missile_launcher') {
                    // Missile launcher vehicle
                    ctx.fillStyle = enemy.color;
                    // Chassis
                    ctx.fillRect(x + 8, y + 32, enemy.w - 16, 16);
                    // Launcher platform
                    ctx.fillStyle = '#9a3412';
                    ctx.fillRect(x + 12, y + 16, enemy.w - 24, 20);
                    // 3 Missiles in tubes
                    ctx.fillStyle = '#71717a';
                    for (let i = 0; i < 3; i++) {
                        ctx.fillRect(x + 18 + i * 14, y + 8, 8, 18);
                        // Missile tips
                        ctx.fillStyle = '#dc2626';
                        ctx.fillRect(x + 20 + i * 14, y + 4, 4, 8);
                        ctx.fillStyle = '#71717a';
                    }
                    // Wheels
                    ctx.fillStyle = '#0f172a';
                    for (let i = 0; i < 3; i++) {
                        ctx.beginPath();
                        ctx.arc(x + 14 + i * 22, y + 50, 5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                } else if (enemy.type === 'jet') {
                    // Fighter jet
                    ctx.fillStyle = enemy.color;
                    // Fuselage
                    ctx.fillRect(x + 16, y + 12, enemy.w - 32, 16);
                    // Nose
                    ctx.fillStyle = '#1e3a8a';
                    ctx.beginPath();
                    ctx.moveTo(x + 16, y + 14);
                    ctx.lineTo(x + 4, y + 20);
                    ctx.lineTo(x + 16, y + 26);
                    ctx.closePath();
                    ctx.fill();
                    // Cockpit
                    ctx.fillStyle = '#fef3c7';
                    ctx.fillRect(x + 22, y + 14, 12, 10);
                    // Wings
                    ctx.fillStyle = '#1e40af';
                    ctx.fillRect(x + 26, y + 4, 20, 6);
                    ctx.fillRect(x + 26, y + 28, 20, 6);
                    // Tail fins
                    ctx.fillRect(x + enemy.w - 18, y + 8, 12, 4);
                    ctx.fillRect(x + enemy.w - 18, y + 24, 12, 4);
                    // Engines
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(x + enemy.w - 20, y + 16, 16, 6);
                    // Afterburner effect
                    ctx.fillStyle = '#fb923c';
                    ctx.fillRect(x + enemy.w - 4, y + 18, 6, 2);
                } else if (enemy.type === 'hovercraft') {
                    // Hovercraft vehicle
                    ctx.fillStyle = enemy.color;
                    // Main body
                    ctx.fillRect(x + 10, y + 10, enemy.w - 20, 20);
                    // Cabin
                    ctx.fillStyle = '#0f766e';
                    ctx.fillRect(x + 16, y + 4, enemy.w - 32, 12);
                    // Windows
                    ctx.fillStyle = '#cffafe';
                    ctx.fillRect(x + 20, y + 6, 8, 8);
                    ctx.fillRect(x + enemy.w - 28, y + 6, 8, 8);
                    // Hover skirt (animated)
                    const hoverOffset = Math.sin(enemy.hoverOffset) * 2;
                    ctx.globalAlpha = 0.3;
                    ctx.fillStyle = '#06b6d4';
                    ctx.fillRect(x + 6, y + 30 + hoverOffset, enemy.w - 12, 6);
                    ctx.globalAlpha = 1.0;
                    // Fans/propellers
                    ctx.fillStyle = '#134e4a';
                    ctx.fillRect(x + 14, y + 14, 8, 12);
                    ctx.fillRect(x + enemy.w - 22, y + 14, 8, 12);
                } else {
                    ctx.fillRect(x, y, enemy.w, enemy.h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(x + 8, y + 10, 8, 8);
                    ctx.fillRect(x + enemy.w - 16, y + 10, 8, 8);
                }

                // Render ejected boss pilot for ALL vehicle types
                if (enemy.ejected && enemy.isBoss) {
                    const px = enemy.ejectedX;
                    const py = enemy.ejectedY;
                    // Pilot body (small soldier)
                    ctx.fillStyle = '#dc2626';
                    ctx.fillRect(px - 8, py + 4, 16, 20);
                    // Head
                    ctx.fillStyle = '#fbbf24';
                    ctx.fillRect(px - 6, py - 4, 12, 10);
                    // Arms
                    ctx.fillStyle = '#dc2626';
                    ctx.fillRect(px - 12, py + 8, 4, 12);
                    ctx.fillRect(px + 8, py + 8, 4, 12);
                    // Helmet
                    ctx.fillStyle = '#374151';
                    ctx.fillRect(px - 7, py - 6, 14, 4);
                    // Target indicator (since they're vulnerable)
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(px - 12, py - 8, 24, 32);
                }

                const barW = 40, hpRatio = enemy.hp / enemy.maxHp;
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(enemy.x - barW / 2, y - 12, barW, 6);
                // Color HP bars based on enemy type
                let hpColor = '#ef4444'; // Default red
                if (enemy.type === 'sword_dummy') hpColor = '#dc2626'; // Red for sword
                else if (enemy.type === 'arrow_dummy') hpColor = '#3b82f6'; // Blue for arrow
                else if (enemy.type === 'slime') hpColor = '#4ade80'; // Green for slime
                ctx.fillStyle = hpColor;
                ctx.fillRect(enemy.x - barW / 2, y - 12, barW * hpRatio, 6);
                
                // === CHARGE WARNING INDICATOR ===
                if (enemy.chargeWarning) {
                    // Flashing red warning indicator
                    const flashIntensity = Math.abs(Math.sin(Date.now() * 0.015));
                    ctx.strokeStyle = `rgba(239, 68, 68, ${flashIntensity})`;
                    ctx.lineWidth = 4;
                    ctx.strokeRect(x - 8, y - 8, enemy.w + 16, enemy.h + 16);
                    
                    // Warning exclamation marks
                    ctx.fillStyle = `rgba(251, 191, 36, ${flashIntensity})`;
                    ctx.font = '24px "Press Start 2P", monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText('!', x - 20, y + enemy.h / 2);
                    ctx.fillText('!', x + enemy.w + 20, y + enemy.h / 2);
                    
                    // Speed lines indicating direction
                    ctx.strokeStyle = `rgba(239, 68, 68, ${flashIntensity * 0.6})`;
                    ctx.lineWidth = 3;
                    const chargeDir = Math.sign(player.x - enemy.x);
                    for (let i = 0; i < 3; i++) {
                        ctx.beginPath();
                        ctx.moveTo(x + (chargeDir > 0 ? 0 : enemy.w), y + 20 + i * 10);
                        ctx.lineTo(x + (chargeDir > 0 ? -30 : enemy.w + 30), y + 20 + i * 10);
                        ctx.stroke();
                    }
                }
                
                // Stun indicator
                if (enemy.stunned) {
                    ctx.fillStyle = '#fbbf24';
                    ctx.font = '16px "Press Start 2P", monospace';
                    ctx.textAlign = 'center';
                    const stunOffset = Math.sin(Date.now() * 0.01) * 5;
                    ctx.fillText('***', enemy.x, y - 20 + stunOffset);
                }
                
                // Boss name display
                if (enemy.isBoss && enemy.name) {
                    ctx.fillStyle = enemy.color;
                    ctx.font = 'bold 12px "Press Start 2P", monospace';
                    ctx.textAlign = 'center';
                    ctx.shadowColor = '#000';
                    ctx.shadowBlur = 4;
                    ctx.fillText(enemy.name, enemy.x, y - 25);
                    ctx.shadowBlur = 0;
                }

                if (bowTarget === enemy) {
                    ctx.strokeStyle = '#a78bfa';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(x - 4, y - 4, enemy.w + 8, enemy.h + 8);
                }
            }
        }

        function drawProjectiles() {
            for (const proj of projectiles) {
                ctx.save();
                ctx.translate(proj.x, proj.y);
                ctx.rotate(Math.atan2(proj.vy, proj.vx));
                
                // Draw enemy arrows differently
                if (proj.enemyArrow) {
                    // Enemy arrow - dark and menacing
                    ctx.fillStyle = '#18181b';
                    ctx.fillRect(-10, -1, 20, 2);
                    ctx.fillStyle = '#dc2626';
                    ctx.beginPath();
                    ctx.moveTo(10, 0);
                    ctx.lineTo(16, -3);
                    ctx.lineTo(18, 0);
                    ctx.lineTo(16, 3);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                    continue;
                }
                
                // Draw magic bolts differently
                if (proj.magicBolt) {
                    // Magic projectile - purple energy
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = '#c084fc';
                    ctx.fillStyle = '#c084fc';
                    ctx.beginPath();
                    ctx.arc(0, 0, 8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#e9d5ff';
                    ctx.beginPath();
                    ctx.arc(-2, -2, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    ctx.restore();
                    continue;
                }
                
                // === VEHICLE PROJECTILES ===
                
                // Cannon ball
                if (proj.cannonBall) {
                    ctx.fillStyle = '#1f2937';
                    ctx.beginPath();
                    ctx.arc(0, 0, 6, 0, Math.PI * 2);
                    ctx.fill();
                    // Highlight
                    ctx.fillStyle = '#4b5563';
                    ctx.beginPath();
                    ctx.arc(-2, -2, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                    continue;
                }
                
                // Artillery shell
                if (proj.artilleryShell) {
                    ctx.fillStyle = '#7c2d12';
                    ctx.fillRect(-8, -3, 16, 6);
                    ctx.fillStyle = '#dc2626';
                    ctx.fillRect(-8, -2, 16, 4);
                    // Shell tip
                    ctx.beginPath();
                    ctx.moveTo(8, 0);
                    ctx.lineTo(12, -4);
                    ctx.lineTo(14, 0);
                    ctx.lineTo(12, 4);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                    continue;
                }
                
                // Missile
                if (proj.missile) {
                    ctx.fillStyle = '#71717a';
                    ctx.fillRect(-12, -2, 24, 4);
                    // Fins
                    ctx.fillStyle = '#d4d4d8';
                    ctx.fillRect(-12, -4, 6, 2);
                    ctx.fillRect(-12, 2, 6, 2);
                    // Nose cone
                    ctx.fillStyle = '#dc2626';
                    ctx.beginPath();
                    ctx.moveTo(12, 0);
                    ctx.lineTo(18, -3);
                    ctx.lineTo(18, 3);
                    ctx.closePath();
                    ctx.fill();
                    // Exhaust
                    ctx.fillStyle = '#fb923c';
                    ctx.beginPath();
                    ctx.arc(-12, 0, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                    continue;
                }
                
                // Laser beam
                if (proj.laser) {
                    ctx.strokeStyle = '#dc2626';
                    ctx.lineWidth = 3;
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = '#dc2626';
                    ctx.beginPath();
                    ctx.moveTo(-20, 0);
                    ctx.lineTo(20, 0);
                    ctx.stroke();
                    // Inner bright core
                    ctx.strokeStyle = '#fef2f2';
                    ctx.lineWidth = 1;
                    ctx.shadowBlur = 5;
                    ctx.shadowColor = '#fff';
                    ctx.beginPath();
                    ctx.moveTo(-20, 0);
                    ctx.lineTo(20, 0);
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                    ctx.restore();
                    continue;
                }
                
                // Rocket
                if (proj.rocket) {
                    ctx.fillStyle = '#ef4444';
                    ctx.fillRect(-10, -3, 20, 6);
                    // Warhead
                    ctx.fillStyle = '#991b1b';
                    ctx.beginPath();
                    ctx.moveTo(10, 0);
                    ctx.lineTo(16, -4);
                    ctx.lineTo(16, 4);
                    ctx.closePath();
                    ctx.fill();
                    // Flame trail
                    ctx.fillStyle = '#fb923c';
                    for (let i = 0; i < 3; i++) {
                        ctx.beginPath();
                        ctx.arc(-10 - i * 5, 0, 4 - i, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.restore();
                    continue;
                }
                
                // Jet bullet
                if (proj.jetBullet) {
                    ctx.fillStyle = '#fbbf24';
                    ctx.beginPath();
                    ctx.arc(0, 0, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#fef3c7';
                    ctx.beginPath();
                    ctx.arc(-1, -1, 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                    continue;
                }
                
                // Get colors based on arrow and bow type
                const arrowData = ARROW_TYPES[proj.arrowType || 'basic'];
                const bowData = BOW_TYPES[proj.bowType || 'basic'];
                const shaftColor = arrowData.color;
                let glowColor = null;
                
                // Helper function to draw hexagon
                const drawHexagon = (x, y, size, fillColor) => {
                    ctx.beginPath();
                    for (let i = 0; i < 6; i++) {
                        const angle = (Math.PI / 3) * i;
                        const hx = x + size * Math.cos(angle);
                        const hy = y + size * Math.sin(angle);
                        if (i === 0) ctx.moveTo(hx, hy);
                        else ctx.lineTo(hx, hy);
                    }
                    ctx.closePath();
                    ctx.fillStyle = fillColor;
                    ctx.fill();
                };
                
                // Add glow effect and hexagon trails for special bows
                if (proj.bowType === 'fire') {
                    glowColor = '#ef4444';
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = glowColor;
                    
                    // Red hexagon trail behind fire arrow
                    for (let i = 0; i < 5; i++) {
                        const offset = -25 - i * 10;
                        const size = 5 - i * 0.5;
                        const alpha = 0.9 - i * 0.15;
                        ctx.globalAlpha = alpha;
                        
                        // Gradient of red colors
                        const colors = ['#fbbf24', '#fb923c', '#ef4444', '#dc2626', '#991b1b'];
                        drawHexagon(offset, 0, size, colors[i % colors.length]);
                        
                        // Add small sparkles around hexagons
                        if (i < 3 && Math.random() > 0.5) {
                            drawHexagon(offset + (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, 2, '#fbbf24');
                        }
                    }
                    ctx.globalAlpha = 1.0;
                } else if (proj.bowType === 'lightning') {
                    glowColor = '#eab308';
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = glowColor;
                    
                    // Yellow hexagon trail with electric effect
                    for (let i = 0; i < 5; i++) {
                        const offset = -25 - i * 10;
                        const size = 5 - i * 0.5;
                        const alpha = 0.9 - i * 0.15;
                        ctx.globalAlpha = alpha;
                        
                        // Gradient of yellow/electric colors
                        const colors = ['#fef3c7', '#fde047', '#eab308', '#facc15', '#ca8a04'];
                        drawHexagon(offset, 0, size, colors[i % colors.length]);
                        
                        // Add electric sparkle hexagons
                        if (i < 3) {
                            const sparkOffset = (Math.random() - 0.5) * 12;
                            drawHexagon(offset + sparkOffset * 0.5, sparkOffset, 2.5, '#fef3c7');
                        }
                    }
                    ctx.globalAlpha = 1.0;
                } else if (proj.bowType === 'ice') {
                    glowColor = '#3b82f6';
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = glowColor;
                    
                    // Blue hexagon trail with icy effect
                    for (let i = 0; i < 5; i++) {
                        const offset = -25 - i * 10;
                        const size = 5 - i * 0.5;
                        const alpha = 0.9 - i * 0.15;
                        ctx.globalAlpha = alpha;
                        
                        // Gradient of blue/ice colors
                        const colors = ['#dbeafe', '#93c5fd', '#3b82f6', '#2563eb', '#1e40af'];
                        drawHexagon(offset, 0, size, colors[i % colors.length]);
                        
                        // Add frost crystal hexagons
                        if (i < 3) {
                            const rotation = (Date.now() * 0.002 + i) % (Math.PI * 2);
                            const cx = offset + Math.cos(rotation) * 8;
                            const cy = Math.sin(rotation) * 8;
                            drawHexagon(cx, cy, 2, '#dbeafe');
                        }
                    }
                    ctx.globalAlpha = 1.0;
                }
                
                // Arrow shaft
                ctx.fillStyle = shaftColor;
                ctx.fillRect(-14, -2, 28, 4);
                
                // Shaft highlight
                ctx.fillStyle = shaftColor === '#78350f' ? '#a16207' : shaftColor;
                ctx.globalAlpha = 0.6;
                ctx.fillRect(-12, -2, 24, 2);
                ctx.globalAlpha = 1.0;
                
                // Arrowhead (metallic, colored by arrow type)
                const headColor = proj.arrowType === 'diamond' ? '#06b6d4' : proj.arrowType === 'explosive' ? '#dc2626' : '#94a3b8';
                ctx.fillStyle = headColor;
                ctx.beginPath();
                ctx.moveTo(14, 0);
                ctx.lineTo(22, -5);
                ctx.lineTo(24, 0);
                ctx.lineTo(22, 5);
                ctx.closePath();
                ctx.fill();
                
                // Arrowhead shine
                ctx.fillStyle = '#e5e7eb';
                ctx.beginPath();
                ctx.moveTo(14, -1);
                ctx.lineTo(20, -4);
                ctx.lineTo(21, -2);
                ctx.lineTo(15, 0);
                ctx.closePath();
                ctx.fill();
                
                // Fletching (feathers) - colored by bow type
                const fletchColor = glowColor || '#dc2626';
                ctx.fillStyle = fletchColor;
                ctx.fillRect(-16, -6, 8, 4);
                ctx.fillRect(-16, 2, 8, 4);
                
                // Fletching detail
                ctx.fillStyle = '#fef2f2';
                ctx.globalAlpha = 0.8;
                ctx.fillRect(-14, -5, 4, 2);
                ctx.fillRect(-14, 3, 4, 2);
                ctx.globalAlpha = 1.0;
                
                ctx.shadowBlur = 0;
                ctx.restore();
            }
        }

        function drawDrops() {
            for (const drop of drops) {
                if (drop.type === 'gold') {
                    ctx.fillStyle = '#FFD700';
                    ctx.beginPath();
                    ctx.arc(drop.x, drop.y, 10, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#FFF8DC';
                    ctx.beginPath();
                    ctx.arc(drop.x - 2, drop.y - 2, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#B8860B';
                    ctx.font = '10px "Press Start 2P"';
                    ctx.textAlign = 'center';
                    ctx.fillText('G', drop.x + 1, drop.y + 4);
                } else if (drop.type === 'silver') {
                    ctx.fillStyle = '#C0C0C0';
                    ctx.beginPath();
                    ctx.arc(drop.x, drop.y, 8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#E8E8E8';
                    ctx.beginPath();
                    ctx.arc(drop.x - 2, drop.y - 2, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#696969';
                    ctx.font = '8px "Press Start 2P"';
                    ctx.textAlign = 'center';
                    ctx.fillText('S', drop.x + 1, drop.y + 3);
                } else if (drop.type === 'arrow') {
                    // Arrow pickup - detailed
                    ctx.fillStyle = '#78350f';
                    ctx.fillRect(drop.x - 10, drop.y - 2, 20, 4);
                    // Arrowhead
                    ctx.fillStyle = '#94a3b8';
                    ctx.beginPath();
                    ctx.moveTo(drop.x + 10, drop.y);
                    ctx.lineTo(drop.x + 16, drop.y - 4);
                    ctx.lineTo(drop.x + 16, drop.y + 4);
                    ctx.closePath();
                    ctx.fill();
                    // Fletching
                    ctx.fillStyle = '#dc2626';
                    ctx.fillRect(drop.x - 12, drop.y - 5, 6, 3);
                    ctx.fillRect(drop.x - 12, drop.y + 2, 6, 3);
                } else if (drop.type === 'potion') {
                    // Draw potion bottle
                    const potion = POTIONS[drop.potionType];
                    if (potion) {
                        // Bottle outline
                        ctx.fillStyle = '#1e293b';
                        ctx.fillRect(drop.x - 6, drop.y - 12, 12, 16);
                        // Liquid color
                        ctx.fillStyle = potion.color;
                        ctx.fillRect(drop.x - 5, drop.y - 10, 10, 12);
                        // Cork/cap
                        ctx.fillStyle = '#78350f';
                        ctx.fillRect(drop.x - 4, drop.y - 14, 8, 3);
                        // Highlight
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                        ctx.fillRect(drop.x - 4, drop.y - 9, 3, 6);
                        // Glow effect
                        ctx.shadowColor = potion.color;
                        ctx.shadowBlur = 8;
                        ctx.fillStyle = potion.color;
                        ctx.fillRect(drop.x - 5, drop.y - 10, 10, 12);
                        ctx.shadowBlur = 0;
                    }
                }
            }
        }

        function drawEffects() {
            for (const fx of effects) {
                ctx.save();
                ctx.translate(fx.x, fx.y);
                if (fx.type === 'slash') {
                    // Sword slash arc - multiple layers for cool effect
                    const progress = 1 - (fx.timer / 0.15);
                    const spread = 0.3 + progress * 0.4;
                    
                    // Outer glow
                    ctx.strokeStyle = `rgba(251, 191, 36, ${0.4 * (1 - progress)})`;
                    ctx.lineWidth = 12;
                    ctx.beginPath();
                    ctx.arc(0, 0, 50 + progress * 10, -spread, spread);
                    ctx.stroke();
                    
                    // Main slash
                    ctx.strokeStyle = `rgba(249, 115, 22, ${0.9 * (1 - progress)})`;
                    ctx.lineWidth = 8;
                    ctx.beginPath();
                    ctx.arc(0, 0, 45, -spread * 0.8, spread * 0.8);
                    ctx.stroke();
                    
                    // Inner white core
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 * (1 - progress)})`;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(0, 0, 42, -spread * 0.6, spread * 0.6);
                    ctx.stroke();
                    
                    // Sparks
                    ctx.fillStyle = `rgba(251, 191, 36, ${1 - progress})`;
                    for (let i = 0; i < 4; i++) {
                        const angle = (i / 4) * spread * 2 - spread;
                        const dist = 45 + progress * 20;
                        ctx.fillRect(Math.cos(angle) * dist, Math.sin(angle) * dist, 4, 4);
                    }
                } else if (fx.type === 'hit') {
                    const progress = 1 - (fx.timer / 0.2);
                    // Expanding ring
                    ctx.strokeStyle = `rgba(239, 68, 68, ${0.8 * (1 - progress)})`;
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(0, 0, 16 + progress * 20, 0, Math.PI * 2);
                    ctx.stroke();
                    // Inner burst
                    ctx.fillStyle = `rgba(252, 165, 165, ${0.6 * (1 - progress)})`;
                    ctx.beginPath();
                    ctx.arc(0, 0, 12 * (1 - progress * 0.5), 0, Math.PI * 2);
                    ctx.fill();
                    // Pixel particles
                    ctx.fillStyle = `rgba(239, 68, 68, ${1 - progress})`;
                    for (let i = 0; i < 6; i++) {
                        const angle = (i / 6) * Math.PI * 2;
                        const dist = 8 + progress * 30;
                        ctx.fillRect(Math.cos(angle) * dist - 2, Math.sin(angle) * dist - 2, 4, 4);
                    }
                } else if (fx.type === 'miss') {
                    // "Immune" or "Wrong weapon" effect
                    const progress = 1 - (fx.timer / 0.4);
                    ctx.fillStyle = `rgba(148, 163, 184, ${1 - progress})`;
                    ctx.font = '10px "Press Start 2P", monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText('IMMUNE!', 0, -20 - progress * 20);
                } else if (fx.type === 'block') {
                    // Shield block effect
                    const progress = 1 - (fx.timer / 0.3);
                    ctx.strokeStyle = `rgba(59, 130, 246, ${1 - progress})`;
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(0, 0, 30 + progress * 10, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = `rgba(96, 165, 250, ${0.8 * (1 - progress)})`;
                    ctx.font = '8px "Press Start 2P", monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(`BLOCKED ${fx.blocked}%`, 0, -30 - progress * 15);
                } else if (fx.type === 'pickup') {
                    // Coin pickup text
                    const progress = 1 - (fx.timer / 0.5);
                    ctx.fillStyle = fx.color || '#FFD700';
                    ctx.globalAlpha = 1 - progress;
                    ctx.font = '10px "Press Start 2P", monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(fx.text, 0, -progress * 30);
                    ctx.globalAlpha = 1;
                }
                ctx.restore();
            }
        }
