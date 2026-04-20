
        // ==================== FLOATING PLATFORMS ====================
        let floatingPlatforms = [];
        
        function generateFloatingPlatforms() {
            floatingPlatforms = [];
            if (currentLevel <= 0) return; // No platforms on training level
            
            const numPlatforms = 3 + Math.floor(currentLevel / 20); // More platforms as you progress
            const groundLevel = groundY();
            
            for (let i = 0; i < numPlatforms; i++) {
                const platform = {
                    x: Math.random() * (canvas.width - 200) + 100,
                    y: groundLevel - 150 - Math.random() * 200, // Platforms between 150-350 pixels above ground
                    width: 120 + Math.random() * 100,
                    height: 20,
                    vx: (Math.random() - 0.5) * 30, // Slow horizontal movement
                    vy: Math.sin(Date.now() * 0.001 + i) * 20 // Gentle bobbing
                };
                floatingPlatforms.push(platform);
            }
        }
        
        function updateFloatingPlatforms(dt) {
            for (const platform of floatingPlatforms) {
                // Gentle bobbing motion
                platform.vy = Math.sin(Date.now() * 0.001) * 15;
                platform.y += platform.vy * dt;
                
                // Horizontal drift
                platform.x += platform.vx * dt;
                
                // Bounce off edges
                if (platform.x < 0) {
                    platform.x = 0;
                    platform.vx = Math.abs(platform.vx);
                } else if (platform.x + platform.width > canvas.width) {
                    platform.x = canvas.width - platform.width;
                    platform.vx = -Math.abs(platform.vx);
                }
            }
        }
        
        function checkPlatformCollision(obj) {
            for (const platform of floatingPlatforms) {
                // Check if object is falling onto platform from above
                if (obj.vy >= 0 && 
                    obj.x + obj.w > platform.x && 
                    obj.x < platform.x + platform.width &&
                    obj.y + obj.h >= platform.y && 
                    obj.y + obj.h <= platform.y + platform.height + 10) {
                    obj.y = platform.y - obj.h;
                    obj.vy = 0;
                    obj.grounded = true;
                    return true;
                }
            }
            return false;
        }
        
        // ==================== JETPACK SYSTEM ====================
        function updateJetpack(dt) {
            if (!player.hasJetpack) return;
            
            // Jetpack fuel duration: 7 seconds base (100 fuel / ~14.29 per sec), 10 seconds upgraded (100 / 10)
            const fuelDrainRate = player.jetpackUpgraded ? (100 / 10) : (100 / 7); // fuel units per second
            
            if (player.jetpackActive && input.jump && player.jetpackFuel > 0) {
                // Jetpack is active and player is holding W
                player.vy = -180; // Strong upward force
                player.jetpackFuel -= fuelDrainRate * dt;
                if (player.jetpackFuel < 0) player.jetpackFuel = 0;
                
                // When fuel runs out, deactivate immediately
                if (player.jetpackFuel <= 0) {
                    player.jetpackActive = false;
                }
                
                
                // Jetpack particles
                if (Math.random() < 0.3) {
                    particles.push({
                        x: player.x + player.w / 2,
                        y: player.y + player.h,
                        vx: (Math.random() - 0.5) * 50,
                        vy: Math.random() * 100,
                        life: 0.5,
                        color: '#f97316',
                        size: 4
                    });
                }
            } else if (!input.jump) {
                player.jetpackActive = false;
            }
            
            // Refuel when grounded
            if (player.grounded && player.jetpackFuel < player.maxJetpackFuel) {
                player.jetpackFuel += 25 * dt;
                if (player.jetpackFuel > player.maxJetpackFuel) player.jetpackFuel = player.maxJetpackFuel;
            }
            
            // Update particles
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.life -= dt;
                if (p.life <= 0) particles.splice(i, 1);
            }
        }
        
        // ==================== FORCE FIELD SYSTEM ====================
        function updateForceField(dt) {
            if (!player.hasForceField) return;
            
            // Handle respawn timer
            if (player.forceFieldRespawnTimer > 0) {
                player.forceFieldRespawnTimer -= dt;
                if (player.forceFieldRespawnTimer <= 0) {
                    player.forceFieldActive = true;
                    player.forceFieldHP = player.forceFieldMaxHP;
                }
            }
            
            // Visual pulse effect
            if (player.forceFieldActive && Math.random() < 0.1) {
                particles.push({
                    x: player.x + Math.random() * player.w,
                    y: player.y + Math.random() * player.h,
                    vx: (Math.random() - 0.5) * 20,
                    vy: (Math.random() - 0.5) * 20,
                    life: 0.3,
                    color: '#3b82f6',
                    size: 3
                });
            }
        }
        
        function damagePlayer(amount) {
            // First try to damage force field
            const overflowDamage = damageForceField(amount);
            
            // Apply any overflow damage to player HP
            if (overflowDamage > 0) {
                player.hp -= overflowDamage;
            }
            
            // Show visual feedback
            if (overflowDamage > 0) {
                effects.push({ type: 'damage', x: player.x, y: player.y - 40, timer: 0.8, text: `-${Math.floor(overflowDamage)}`, color: '#ef4444' });
            } else {
                effects.push({ type: 'damage', x: player.x, y: player.y - 40, timer: 0.8, text: 'BLOCKED!', color: '#3b82f6' });
            }
        }
        
        function damageForceField(amount) {
            if (!player.hasForceField || !player.forceFieldActive) return amount;
            
            player.forceFieldHP -= amount;
            
            if (player.forceFieldHP <= 0) {
                player.forceFieldActive = false;
                player.forceFieldRespawnTimer = 10; // 10 second respawn
                effects.push({ type: 'pickup', x: player.x, y: player.y - 50, timer: 2, text: 'SHIELD DOWN!', color: '#ef4444' });
                return Math.abs(player.forceFieldHP); // Return overflow damage
            }
            
            return 0; // Force field absorbed all damage
        }
        
        // ==================== WORLD MAP SYSTEM ====================
        function openWorldMap() {
            isPaused = true;
            gameState = 'worldmap';
            document.getElementById('world-map').classList.remove('hidden');
            updateWorldMapUI();
        }
        
        function closeWorldMap() {
            document.getElementById('world-map').classList.add('hidden');
            isPaused = false;
            gameState = 'playing';
        }
        
        function updateWorldMapUI() {
            // Update each area card
            for (const [areaId, areaData] of Object.entries(WORLD_AREAS)) {
                const card = document.querySelector(`[data-area="${areaId}"]`);
                if (!card) continue;
                
                const progress = areaProgress[areaId] || 0;
                const progressText = card.querySelector('.area-progress');
                if (progressText) {
                    progressText.textContent = `PROGRESS: ${progress}/300 LEVELS`;
                }
                
                // Update locked/unlocked state
                if (areaData.unlocked) {
                    card.classList.remove('locked');
                    card.querySelector('.lock-icon').style.display = 'none';
                } else {
                    card.classList.add('locked');
                    card.querySelector('.lock-icon').style.display = 'block';
                }
                
                // Highlight current area
                if (areaId === currentArea) {
                    card.classList.add('current');
                } else {
                    card.classList.remove('current');
                }
            }
        }
        
        function selectArea(areaId) {
            const areaData = WORLD_AREAS[areaId];
            if (!areaData.unlocked) {
                effects.push({ type: 'pickup', x: canvas.width / 2, y: canvas.height / 2, timer: 2, text: 'LOCKED! COMPLETE LEVEL 100', color: '#ef4444' });
                return;
            }
            
            currentArea = areaId;
            level = areaData.startLevel + areaProgress[areaId];
            closeWorldMap();
            startLevel();
        }
        
        function checkAreaUnlock() {
            const localLevel = level % 300;
            
            // Unlock next area at level 100 of current area
            if (localLevel === 100) {
                if (currentArea === 'grassy' && !WORLD_AREAS.ice.unlocked) {
                    WORLD_AREAS.ice.unlocked = true;
                    effects.push({ type: 'pickup', x: canvas.width / 2, y: 100, timer: 3, text: '🎉 ICE PALACE UNLOCKED! 🎉', color: '#3b82f6' });
                    grantRegionalArmor('ice');
                } else if (currentArea === 'ice' && !WORLD_AREAS.lava.unlocked) {
                    WORLD_AREAS.lava.unlocked = true;
                    effects.push({ type: 'pickup', x: canvas.width / 2, y: 100, timer: 3, text: '🎉 LAVA MOUNTAIN UNLOCKED! 🎉', color: '#dc2626' });
                    grantRegionalArmor('lava');
                } else if (currentArea === 'lava' && !WORLD_AREAS.lightning.unlocked) {
                    WORLD_AREAS.lightning.unlocked = true;
                    effects.push({ type: 'pickup', x: canvas.width / 2, y: 100, timer: 3, text: '🎉 LIGHTNING CLOUD UNLOCKED! 🎉', color: '#facc15' });
                    grantRegionalArmor('lightning');
                }
            }
        }
        
        function grantRegionalArmor(areaId) {
            if (regionalArmor[areaId]) return; // Already granted
            
            regionalArmor[areaId] = true;
            
            // Grant area-specific armor
            if (areaId === 'ice') {
                player.armorMaterial = 'ice-crystal';
                player.armorLevel = 10;
                player.maxHp += 30;
                player.hp = player.maxHp;
                effects.push({ type: 'pickup', x: player.x, y: player.y - 70, timer: 3, text: 'ICE CRYSTAL ARMOR ACQUIRED!', color: '#60a5fa' });
            } else if (areaId === 'lava') {
                player.armorMaterial = 'obsidian';
                player.armorLevel = 20;
                player.maxHp += 50;
                player.hp = player.maxHp;
                effects.push({ type: 'pickup', x: player.x, y: player.y - 70, timer: 3, text: 'OBSIDIAN ARMOR ACQUIRED!', color: '#dc2626' });
            } else if (areaId === 'lightning') {
                player.armorMaterial = 'plasma';
                player.armorLevel = 30;
                player.maxHp += 70;
                player.hp = player.maxHp;
                effects.push({ type: 'pickup', x: player.x, y: player.y - 70, timer: 3, text: 'PLASMA ARMOR ACQUIRED!', color: '#facc15' });
            }
        }
        
        function getAreaTheme() {
            return WORLD_AREAS[currentArea].theme;
        }
        
        // ==================== PAUSE MENU ====================
        
        function showTitleScreen() {
            gameState = 'title';
            isPaused = false;
            titleScreen.classList.remove('hidden');
            hud.classList.add('hidden');
            potionSlotsElement.classList.add('hidden');
            tutorialHint.classList.add('hidden');
            document.getElementById('pause-menu').classList.add('hidden');
            document.getElementById('world-map').classList.add('hidden');
            arenaUI.classList.add('hidden');
        }
        window.showTitleScreen = showTitleScreen;
        
        function openPauseMenu() {
            isPaused = true;
            gameState = 'paused';
            document.getElementById('pause-menu').classList.remove('hidden');
            updatePauseMenuUI();
        }
        
        function closePauseMenu() {
            document.getElementById('pause-menu').classList.add('hidden');
            isPaused = false;
            gameState = 'playing';
        }
        
        function resumeGame() {
            closePauseMenu();
        }
        window.resumeGame = resumeGame;
        
        function openWorldMapFromPause() {
            closePauseMenu();
            openWorldMap();
        }
        window.openWorldMapFromPause = openWorldMapFromPause;
        
        function quitToTitle() {
            closePauseMenu();
            showTitleScreen();
        }
        window.quitToTitle = quitToTitle;
        
        function updatePauseMenuUI() {
            // Update equipment display
            updateEquipmentSlot('jetpack', player.hasJetpack, `FUEL: ${Math.floor(player.jetpackFuel)}%${player.jetpackUpgraded ? ' (MAX)' : ''}`);
            updateEquipmentSlot('forcefield', player.hasForceField, `LV${player.forceFieldLevel} (${player.forceFieldMaxHP}HP)`);
        }
        
        function updateEquipmentSlot(slotId, owned, levelText) {
            const slot = document.querySelector(`[data-equip="${slotId}"]`);
            if (!slot) return;
            
            if (owned) {
                slot.classList.remove('locked');
                const levelEl = slot.querySelector('.equip-level');
                if (levelEl) levelEl.textContent = levelText;
            } else {
                slot.classList.add('locked');
                const levelEl = slot.querySelector('.equip-level');
                if (levelEl) levelEl.textContent = 'NOT OWNED';
            }
        }
        
        // ==================== STORE SYSTEM ====================
        function purchaseJetpack() {
            if (player.hasJetpack) {
                effects.push({ type: 'pickup', x: player.x, y: player.y - 50, timer: 2, text: 'ALREADY OWNED!', color: '#fbbf24' });
                return;
            }
            
            const price = 5000;
            if (player.money >= price) {
                player.money -= price;
                player.hasJetpack = true;
                player.jetpackFuel = 100;
                effects.push({ type: 'pickup', x: player.x, y: player.y - 50, timer: 3, text: 'JETPACK ACQUIRED!', color: '#22c55e' });
                effects.push({ type: 'pickup', x: player.x, y: player.y - 80, timer: 2, text: 'HOLD W TO FLY!', color: '#fbbf24' });
                showTechStore(); // Refresh shop UI
            } else {
                effects.push({ type: 'pickup', x: player.x, y: player.y - 50, timer: 2, text: `NEED $${price - player.money} MORE!`, color: '#ef4444' });
            }
        }
        window.purchaseJetpack = purchaseJetpack;
        
        function purchaseJetpackUpgrade() {
            if (player.jetpackUpgraded) {
                effects.push({ type: 'pickup', x: player.x, y: player.y - 50, timer: 2, text: 'ALREADY UPGRADED!', color: '#fbbf24' });
                return;
            }
            if (!player.hasJetpack) {
                effects.push({ type: 'pickup', x: player.x, y: player.y - 50, timer: 2, text: 'BUY JETPACK FIRST!', color: '#ef4444' });
                return;
            }
            
            const price = 8000;
            if (player.money >= price) {
                player.money -= price;
                player.jetpackUpgraded = true;
                player.jetpackFuel = 100; // Refill
                effects.push({ type: 'pickup', x: player.x, y: player.y - 50, timer: 3, text: 'JETPACK UPGRADED!', color: '#22c55e' });
                effects.push({ type: 'pickup', x: player.x, y: player.y - 80, timer: 2, text: 'FUEL NOW LASTS 10S!', color: '#fbbf24' });
                showTechStore(); // Refresh shop UI
            } else {
                effects.push({ type: 'pickup', x: player.x, y: player.y - 50, timer: 2, text: `NEED $${price - player.money} MORE!`, color: '#ef4444' });
            }
        }
        window.purchaseJetpackUpgrade = purchaseJetpackUpgrade;
        
        function purchaseForceFieldUpgrade() {
            const upgradeCosts = { 1: 3000, 2: 7000, 3: 0 };
            const maxHPValues = { 1: 5, 2: 10, 3: 20 };
            
            if (player.forceFieldLevel >= 3) {
                effects.push({ type: 'pickup', x: player.x, y: player.y - 50, timer: 2, text: 'MAX LEVEL!', color: '#fbbf24' });
                return;
            }
            
            const currentLevel = player.hasForceField ? player.forceFieldLevel : 0;
            const nextLevel = currentLevel + 1;
            const price = upgradeCosts[nextLevel];
            
            if (player.money >= price) {
                player.money -= price;
                player.hasForceField = true;
                player.forceFieldLevel = nextLevel;
                player.forceFieldMaxHP = maxHPValues[nextLevel];
                player.forceFieldHP = player.forceFieldMaxHP;
                player.forceFieldActive = true;
                effects.push({ type: 'pickup', x: player.x, y: player.y - 50, timer: 3, text: `FORCE FIELD LV${nextLevel}!`, color: '#3b82f6' });
                effects.push({ type: 'pickup', x: player.x, y: player.y - 80, timer: 2, text: `SHIELD: ${maxHPValues[nextLevel]}HP`, color: '#60a5fa' });
                showTechStore(); // Refresh shop UI
            } else {
                effects.push({ type: 'pickup', x: player.x, y: player.y - 50, timer: 2, text: `NEED $${price - player.money} MORE!`, color: '#ef4444' });
            }
        }
        window.purchaseForceFieldUpgrade = purchaseForceFieldUpgrade;
