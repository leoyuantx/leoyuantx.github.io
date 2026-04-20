        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        resize();

        function groundY() { return canvas.height * GROUND_Y; }
        
        // Save/Load System
        function saveGame() {
            const saveData = {
                currentLevel: currentLevel,
                money: player.money,
                arrows: player.arrows,
                maxHp: player.maxHp,
                baseMaxHp: player.baseMaxHp,
                potions: { ...player.potions },
                potionSlots: [...player.potionSlots],
                maxPotionSlots: player.maxPotionSlots,
                swordMaterial: player.swordMaterial,
                swordLevel: player.swordLevel,
                shieldMaterial: player.shieldMaterial,
                shieldLevel: player.shieldLevel,
                armorMaterial: player.armorMaterial,
                armorLevel: player.armorLevel,
                helmetMaterial: player.helmetMaterial,
                helmetLevel: player.helmetLevel,
                bowType: player.bowType,
                arrowType: player.arrowType,
                companionCount: companions.length,
                mercenaryHireCount: mercenaryHireCount,
                tutorialComplete: tutorialComplete,
                hasJetpack: player.hasJetpack,
                jetpackUpgraded: player.jetpackUpgraded,
                hasForceField: player.hasForceField,
                forceFieldLevel: player.forceFieldLevel
            };
            localStorage.setItem('8bitFighterSave', JSON.stringify(saveData));
        }
        
        function loadGame() {
            const saved = localStorage.getItem('8bitFighterSave');
            if (!saved) return false;
            
            try {
                const saveData = JSON.parse(saved);
                player.money = saveData.money || 0;
                player.arrows = saveData.arrows || 10;
                player.maxHp = saveData.maxHp || 20;
                player.baseMaxHp = saveData.baseMaxHp || 20;
                player.hp = player.maxHp;
                
                if (saveData.potions) {
                    player.potions = { ...saveData.potions };
                }
                
                if (saveData.potionSlots) {
                    player.potionSlots = [...saveData.potionSlots];
                } else {
                    player.potionSlots = ['healing', null, null];
                }
                
                player.maxPotionSlots = saveData.maxPotionSlots || 3;
                
                player.swordMaterial = saveData.swordMaterial || 'wooden';
                player.swordLevel = saveData.swordLevel || 1;
                player.shieldMaterial = saveData.shieldMaterial || null;
                player.shieldLevel = saveData.shieldLevel || 0;
                player.armorMaterial = saveData.armorMaterial || null;
                player.armorLevel = saveData.armorLevel || 0;
                player.helmetMaterial = saveData.helmetMaterial || null;
                player.helmetLevel = saveData.helmetLevel || 0;
                player.bowType = saveData.bowType || 'basic';
                player.arrowType = saveData.arrowType || 'basic';
                
                mercenaryHireCount = saveData.mercenaryHireCount || 0;
                tutorialComplete = saveData.tutorialComplete || false;
                
                // Restore jetpack and force field
                player.hasJetpack = saveData.hasJetpack || false;
                player.jetpackUpgraded = saveData.jetpackUpgraded || false;
                player.jetpackFuel = player.maxJetpackFuel;
                player.hasForceField = saveData.hasForceField || false;
                player.forceFieldLevel = saveData.forceFieldLevel || 1;
                
                // Restore companions
                const companionCount = saveData.companionCount || 0;
                companions.length = 0;
                const colors = ['#f97316', '#8b5cf6', '#ec4899', '#14b8a6'];
                const elementTypes = ['fire', 'lightning', 'ice', 'wind'];
                for (let i = 0; i < companionCount; i++) {
                    companions.push({
                        x: player.x - 50 - i * 40,
                        y: groundY() - 48,
                        w: 40,
                        h: 48,
                        vx: 0,
                        vy: 0,
                        color: colors[i % colors.length],
                        attackTimer: 0,
                        target: null,
                        facing: 1,
                        animTime: 0,
                        isWalking: false,
                        attacking: false,
                        element: elementTypes[i % elementTypes.length],
                        killCount: 0,
                        specialReady: false
                    });
                }
                
                console.log('Loaded game: ' + companionCount + ' companions, mercenaryHireCount: ' + mercenaryHireCount);
                
                return true;
            } catch (e) {
                console.error('Failed to load save:', e);
                return false;
            }
        }

        function startTraining() {
            console.log('[startTraining] Called');
            titleScreen.classList.add('hidden');
            hud.classList.remove('hidden');
            potionSlotsElement.classList.remove('hidden');
            tutorialHint.classList.remove('hidden');
            gameState = 'playing';
            isPaused = false;
            arenaMode = false;
            currentLevel = 0;
            // Reset input state
            input.left = false;
            input.right = false;
            input.jump = false;
            setupLevel(0);
            updatePotionSlotsUI();
            updateHUD();
        }
        
        function calculateRecommendedLevel() {
            // Calculate player power based on equipment and stats
            let powerScore = 0;
            
            // Money contributes to power
            powerScore += Math.floor(player.money / 100);
            
            // Material quality (0-5 for wooden to titanium)
            const materialPower = {
                wooden: 0, rock: 5, silver: 10, gold: 20, diamond: 35, titanium: 50
            };
            
            // Sword power
            powerScore += materialPower[player.swordMaterial] || 0;
            powerScore += player.swordLevel * 2;
            
            // Shield power
            if (player.shieldMaterial) {
                powerScore += materialPower[player.shieldMaterial] || 0;
                powerScore += player.shieldLevel * 2;
            }
            
            // Armor power
            if (player.armorMaterial) {
                powerScore += materialPower[player.armorMaterial] || 0;
                powerScore += player.armorLevel * 2;
            }
            
            if (player.helmetMaterial) {
                powerScore += materialPower[player.helmetMaterial] || 0;
                powerScore += player.helmetLevel * 2;
            }
            
            // HP matters
            powerScore += Math.floor((player.maxHp - 20) / 2);
            
            // Arrows
            powerScore += Math.floor(player.arrows / 10);
            
            // Potions
            powerScore += Object.values(player.potions).reduce((sum, count) => sum + count, 0);
            
            // Companions
            powerScore += companions.length * 10;
            
            // Convert power score to recommended level (cap at 99)
            let recommendedLevel = 1;
            if (powerScore < 10) {
                recommendedLevel = 1;
            } else if (powerScore < 50) {
                recommendedLevel = Math.min(3 + Math.floor(powerScore / 4), 15);
            } else if (powerScore < 150) {
                recommendedLevel = Math.min(16 + Math.floor((powerScore - 50) / 3), 40);
            } else {
                recommendedLevel = Math.min(41 + Math.floor((powerScore - 150) / 5), 99);
            }
            
            return recommendedLevel;
        }

        function startAdventure() {
            titleScreen.classList.add('hidden');
            hud.classList.remove('hidden');
            potionSlotsElement.classList.remove('hidden');
            tutorialHint.classList.add('hidden');
            gameState = 'playing';
            isPaused = false;
            arenaMode = false;
            input.left = false;
            input.right = false;
            input.jump = false;
            
            // Try to load saved progress
            const loaded = loadGame();
            if (loaded) {
                // Calculate recommended level based on loaded gear
                const recommendedLevel = calculateRecommendedLevel();
                currentLevel = recommendedLevel;
                
                // Show feedback with level info
                updatePotionSlotsUI();
                updateHUD();
                setTimeout(() => {
                    effects.push({ type: 'pickup', x: canvas.width / 2, y: 80, timer: 2, text: 'PROGRESS LOADED!', color: '#22c55e' });
                    effects.push({ type: 'pickup', x: canvas.width / 2, y: 120, timer: 2, text: `STARTING AT LEVEL ${recommendedLevel}`, color: '#fbbf24' });
                }, 100);
            } else {
                currentLevel = 1;
                updateHUD();
            }
            
            setupLevel(currentLevel);
        }
        
        function openLevelFinder() {
            levelFinder.classList.remove('hidden');
            levelNameInput.value = '';
            levelNameInput.focus();
        }
        
        function closeLevelFinder() {
            levelFinder.classList.add('hidden');
        }
        
        // ARENA MODE FUNCTIONS
        const ARENA_MOBS = {
            basic: ['slime', 'goblin', 'ogre', 'skeleton', 'bat', 'spider', 'ghost'],
            advanced: ['dark_knight', 'wraith', 'demon', 'necromancer', 'gargoyle', 'shade', 'berserker', 'archer', 'mage', 'assassin', 'golem', 'harpy'],
            vehicles: ['tank', 'artillery', 'helicopter', 'armored_car', 'mech', 'drone', 'apc', 'missile_launcher', 'jet', 'hovercraft'],
            legendary: ['troll', 'banshee', 'vampire', 'cyclops', 'werewolf', 'lich', 'elemental', 'hydra', 'dragon_whelp', 'imp', 'wyvern', 'shadow_fiend', 'phoenix', 'chimera', 'kraken', 'frost_giant', 'fire_giant', 'dullahan', 'medusa', 'minotaur']
        };
        
        function enterArenaMode() {
            arenaMode = true;
            arenaActive = false;
            arenaSelectedMob = null;
            gameState = 'playing';
            titleScreen.classList.add('hidden');
            arenaUI.classList.remove('hidden');
            hud.classList.remove('hidden');
            potionSlotsElement.classList.remove('hidden');
            
            // Reset player
            player.x = 200;
            player.y = groundY() - player.h;
            player.hp = player.maxHp;
            player.vx = 0;
            player.vy = 0;
            
            // Clear everything
            enemies.length = 0;
            npcs.length = 0;
            projectiles.length = 0;
            effects.length = 0;
            companions.length = 0;
            
            currentLevel = -1; // Special arena indicator
            levelName.textContent = 'ARENA MODE';
            
            // Populate mob selection UI
            populateArenaUI();
        }
        
        function populateArenaUI() {
            const basicGrid = document.getElementById('basic-mobs');
            const advancedGrid = document.getElementById('advanced-mobs');
            const vehicleGrid = document.getElementById('vehicle-mobs');
            const legendaryGrid = document.getElementById('legendary-mobs');
            
            basicGrid.innerHTML = '';
            advancedGrid.innerHTML = '';
            vehicleGrid.innerHTML = '';
            legendaryGrid.innerHTML = '';
            
            // Create buttons for each mob type
            ARENA_MOBS.basic.forEach(mob => {
                const btn = document.createElement('button');
                btn.className = 'mob-btn';
                btn.textContent = mob.toUpperCase().replace(/_/g, ' ');
                btn.onclick = () => selectArenaMob(mob, btn);
                basicGrid.appendChild(btn);
            });
            
            ARENA_MOBS.advanced.forEach(mob => {
                const btn = document.createElement('button');
                btn.className = 'mob-btn';
                btn.textContent = mob.toUpperCase().replace(/_/g, ' ');
                btn.onclick = () => selectArenaMob(mob, btn);
                advancedGrid.appendChild(btn);
            });
            
            ARENA_MOBS.vehicles.forEach(mob => {
                const btn = document.createElement('button');
                btn.className = 'mob-btn';
                btn.textContent = mob.toUpperCase().replace(/_/g, ' ');
                btn.onclick = () => selectArenaMob(mob, btn);
                vehicleGrid.appendChild(btn);
            });
            
            ARENA_MOBS.legendary.forEach(mob => {
                const btn = document.createElement('button');
                btn.className = 'mob-btn';
                btn.textContent = mob.toUpperCase().replace(/_/g, ' ');
                btn.onclick = () => selectArenaMob(mob, btn);
                legendaryGrid.appendChild(btn);
            });
        }
        
        function selectArenaMob(mobType, btnElement) {
            arenaSelectedMob = mobType;
            // Highlight selected button
            document.querySelectorAll('.mob-btn').forEach(btn => btn.classList.remove('selected'));
            btnElement.classList.add('selected');
        }
        
        arenaStartBtn.addEventListener('click', () => {
            if (enemies.length === 0) {
                effects.push({ type: 'pickup', x: canvas.width / 2, y: 100, timer: 2, text: 'SPAWN SOME ENEMIES FIRST!', color: '#ef4444' });
                return;
            }
            arenaActive = true;
            arenaUI.classList.add('hidden');
            effects.push({ type: 'pickup', x: canvas.width / 2, y: 100, timer: 2, text: 'ARENA BATTLE START!', color: '#22c55e' });
        });
        
        
        arenaClearBtn.addEventListener('click', () => {
            enemies.length = 0;
            effects.push({ type: 'pickup', x: canvas.width / 2, y: 100, timer: 1.5, text: 'ALL ENEMIES CLEARED', color: '#fbbf24' });
        });
        
        arenaExitBtn.addEventListener('click', () => {
            arenaMode = false;
            arenaActive = false;
            arenaSelectedMob = null;
            arenaUI.classList.add('hidden');
            hud.classList.add('hidden');
            potionSlotsElement.classList.add('hidden');
            gameState = 'title';
            titleScreen.classList.remove('hidden');
            enemies.length = 0;
            projectiles.length = 0;
            effects.length = 0;
        });
        
        // Canvas click to spawn mobs in arena mode
        canvas.addEventListener('click', (e) => {
            if (!arenaMode || arenaActive || !arenaSelectedMob) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);
            
            // Spawn enemy at clicked location
            spawnEnemy(arenaSelectedMob, x, y);
            effects.push({ type: 'pickup', x: x, y: y - 40, timer: 1, text: arenaSelectedMob.toUpperCase(), color: '#22c55e' });
        });
        
        window.goToLevel = function() {
            const inputName = levelNameInput.value.trim().toUpperCase();
            const levelNum = LEVEL_NAME_TO_NUMBER[inputName];
            
            if (levelNum !== undefined) {
                closeLevelFinder();
                titleScreen.classList.add('hidden');
                hud.classList.remove('hidden');
                potionSlotsElement.classList.remove('hidden');
                tutorialHint.classList.add('hidden');
                gameState = 'playing';
                isPaused = false;
                arenaMode = false;
                input.left = false;
                input.right = false;
                input.jump = false;
                
                // Load saved progress
                const loaded = loadGame();
                if (loaded) {
                    updatePotionSlotsUI();
                    updateHUD();
                    // Show feedback
                    setTimeout(() => {
                        effects.push({ type: 'pickup', x: canvas.width / 2, y: 100, timer: 2, text: 'PROGRESS LOADED!', color: '#22c55e' });
                    }, 100);
                } else {
                    updateHUD();
                }
                
                currentLevel = levelNum;
                setupLevel(levelNum);
            } else {
                alert('LEVEL NOT FOUND! CHECK YOUR SPELLING AND USE UPPERCASE.');
            }
        };
        
        window.closeLevelFinder = closeLevelFinder;

        function triggerGameEnding() {
            // Clear everything and spawn the master for final dialogue
            enemies.length = 0;
            npcs.length = 0;
            projectiles.length = 0;
            drops.length = 0;
            levelHazards.length = 0;
            shops.length = 0;
            levelComplete = false;
            
            player.x = 200;
            player.y = groundY() - player.h;
            player.vx = 0;
            player.vy = 0;
            
            // Add Master Ren for the final confrontation
            npcs.push({
                name: 'MASTER REN',
                x: canvas.width / 2,
                y: groundY() - 64,
                w: 48,
                h: 64,
                color: '#fbbf24',
                dialogue: [
                    { speaker: 'MASTER REN', text: 'YOU HAVE RETURNED, LEGENDARY CHAMPION!' },
                    { speaker: 'MASTER REN', text: 'I WATCHED YOUR JOURNEY FROM AFAR. YOU HAVE CONQUERED ALL 299 REALMS!' },
                    { speaker: 'MASTER REN', text: 'FROM THE WHISPERING WOODS TO THE ULTIMATE LEGEND ARENA...' },
                    { speaker: 'MASTER REN', text: 'YOU HAVE BATTLED THROUGH ENDLESS HORDES, DEFEATED 20 LEGENDARY BOSSES!' },
                    { speaker: 'MASTER REN', text: 'YOU FACED THE ANCIENT GOLEM, THE VOID REAPER, THE FLAME TITAN...' },
                    { speaker: 'MASTER REN', text: 'THE CHAOS SOVEREIGN, INFINITY DEVOURER, STELLAR COLOSSUS...' },
                    { speaker: 'MASTER REN', text: 'AND FINALLY CONQUERED THE ABSOLUTE VOID, THE ULTIMATE DESTROYER!' },
                    { speaker: 'MASTER REN', text: 'YOU HAVE PROVEN YOURSELF AS THE GREATEST WARRIOR IN ALL THE LANDS!' },
                    { speaker: 'MASTER REN', text: 'THE WORLD IS SAVED BECAUSE OF YOUR COURAGE AND STRENGTH!' },
                    { speaker: 'MASTER REN', text: 'YOUR NAME WILL BE WRITTEN IN THE HALLS OF LEGENDS FOREVER!' },
                    { speaker: 'SYSTEM', text: '=== CONGRATULATIONS ===' },
                    { speaker: 'SYSTEM', text: 'THANK YOU FOR PLAYING 8-BIT FIGHTER!' },
                    { speaker: 'SYSTEM', text: 'YOU HAVE COMPLETED ALL 300 LEVELS AND SAVED THE WORLD!' },
                    { speaker: 'SYSTEM', text: 'YOUR ADVENTURE MAY BE COMPLETE, BUT YOUR LEGEND LIVES ON!' },
                    { speaker: 'SYSTEM', text: '--- THE END ---' }
                ],
                isEnding: true
            });
            
            // Show instruction to talk to master
            tutorialHint.classList.remove('hidden');
            tutorialHint.textContent = '🎉 PRESS E TO CONFRONT MASTER REN FOR THE FINAL WORDS 🎉';
            tutorialHint.style.color = '#fbbf24';
            tutorialHint.style.fontSize = '14px';
        }
        
        function returnToTitle() {
            gameState = 'title';
            titleScreen.classList.remove('hidden');
            hud.classList.add('hidden');
            potionSlotsElement.classList.add('hidden');
            tutorialHint.classList.add('hidden');
            dialogueBox.classList.add('hidden');
            bowIndicator.classList.add('hidden');
            if (tutorialComplete) {
                trainingBtn.style.display = 'none';
                skipBtn.style.display = 'none';
                startBtn.style.display = 'block';
            }
        }

        function setupLevel(lvl) {
            console.log('[setupLevel] Starting setup for level:', lvl, 'canvas:', canvas.width, 'x', canvas.height, 'groundY:', groundY());
            enemies.length = 0;
            npcs.length = 0;
            projectiles.length = 0;
            effects.length = 0;
            drops.length = 0;
            levelHazards.length = 0;
            particles.length = 0;
            dialogueOpen = false;
            dialogueData = null;
            bowMode = false;
            bowTarget = null;
            bowIndicator.classList.add('hidden');
            levelComplete = false;
            shopsMovingIn = false;
            shopsMovingOut = false;
            shopAnimationProgress = 0;
            shopPanel.classList.add('hidden');
            shopDialogue.classList.add('hidden');
            shops.length = 0;
            parallaxOffset = 0;
            
            // Set player position FIRST (before anything that could fail)
            player.x = 200;
            player.y = groundY() - player.h;
            player.vx = 0;
            player.vy = 0;
            player.grounded = true;
            player.hp = player.maxHp;
            player.attacking = false;
            player.attackTimer = 0;
            player.attackCooldown = 0;
            player.attackTimer = 0;
            player.invulnTimer = 0;
            player.jetpackActive = false;
            console.log('[setupLevel] Player positioned at:', player.x, player.y, 'grounded:', player.grounded, 'gameState:', gameState);

            // Generate floating platforms for this level
            try {
                generateFloatingPlatforms();
            } catch(e) {
                console.error('Platform generation error:', e);
                floatingPlatforms = [];
            }

            if (lvl === 0) {
                levelName.textContent = 'TRAINING';
                tutorialStep = 0;
                player.totalMoved = 0;
                player.totalJumps = 0;
                player.totalSwings = 0;
                player.totalShots = 0;
                player.talkedToMaster = false;
                player.dummiesHit = 0;
                player.arrows = 10;

                npcs.push({
                    name: 'MASTER REN',
                    x: canvas.width * 0.75,
                    y: groundY() - 64,
                    w: 48,
                    h: 64,
                    color: '#f59e0b',
                    dialogue: [
                        { speaker: 'MASTER REN', text: 'WELCOME, YOUNG WARRIOR. YOU ARE HERE TO LEARN THE WAYS OF COMBAT.' },
                        { speaker: 'MASTER REN', text: 'FIRST, DESTROY THE SWORD DUMMIES WITH YOUR BLADE. CLICK TO SWING!' },
                        { speaker: 'MASTER REN', text: 'THEN USE YOUR BOW FOR THE ARROW TARGETS. FINALLY, FACE THE SLIMES!' }
                    ]
                });

                // Spawn sword dummies first (can only be killed by sword)
                for (let i = 0; i < 2; i++) {
                    spawnEnemy('sword_dummy', 300 + i * 100, groundY() - 48);
                }

                // Arrow dummies and slimes will spawn later via tutorial progression
            } else if (lvl === 1) {
                levelName.textContent = 'WHISPERING WOODS';
                for (let i = 0; i < 5; i++) {
                    spawnEnemy('slime', canvas.width - 300 - i * 200, groundY() - 40);
                }
                spawnEnemy('goblin', canvas.width - 300, groundY() - 48);
            } else if (lvl === 2) {
                levelName.textContent = 'DARK FOREST';
                for (let i = 0; i < 4; i++) {
                    spawnEnemy('goblin', canvas.width - 300 - i * 180, groundY() - 48);
                }
                spawnEnemy('ogre', canvas.width - 400, groundY() - 80);
                for (let i = 0; i < 3; i++) {
                    spawnEnemy('slime', canvas.width - 200 - i * 150, groundY() - 40);
                }
                // New enemies
                for (let i = 0; i < 2; i++) {
                    spawnEnemy('skeleton', canvas.width - 500 - i * 200, groundY() - 52);
                }
                spawnEnemy('bat', canvas.width - 250, groundY() - 100);
            } else if (lvl === 3) {
                levelName.textContent = 'MOUNTAIN PASS';
                for (let i = 0; i < 2; i++) {
                    spawnEnemy('ogre', canvas.width - 400 - i * 300, groundY() - 80);
                }
                for (let i = 0; i < 6; i++) {
                    spawnEnemy('goblin', canvas.width - 200 - i * 170, groundY() - 48);
                }
                // New enemies
                for (let i = 0; i < 3; i++) {
                    spawnEnemy('spider', canvas.width - 350 - i * 180, groundY() - 36);
                }
                for (let i = 0; i < 2; i++) {
                    spawnEnemy('bat', canvas.width - 150 - i * 250, groundY() - 120);
                }
            } else if (lvl === 4) {
                // SPECIAL VEHICLE SHOWCASE LEVEL 
                levelName.textContent = '⚙️ VEHICLE SHOWDOWN ⚙️';
                // Spawn one of each vehicle type to showcase them
                spawnEnemy('tank', canvas.width - 700, groundY() - 50);
                spawnEnemy('artillery', canvas.width - 600, groundY() - 48);
                spawnEnemy('armored_car', canvas.width - 500, groundY() - 42);
                spawnEnemy('drone', canvas.width - 400, groundY() - 100);
                spawnEnemy('helicopter', canvas.width - 300, groundY() - 150);
                spawnEnemy('hovercraft', canvas.width - 800, groundY() - 58);
                spawnEnemy('apc', canvas.width - 900, groundY() - 48);
                spawnEnemy('missile_launcher', canvas.width - 1000, groundY() - 52);
                spawnEnemy('mech', canvas.width - 1100, groundY() - 95);
                spawnEnemy('jet', canvas.width - 1200, groundY() - 180);
            } else {
                // Use named levels instead of numbered endless battles
                levelName.textContent = LEVEL_NAMES[lvl] || ('ENDLESS BATTLE ' + (lvl - 3));
                
                // Check if this is a boss level (every 10 levels)
                if (lvl % 10 === 0 && BOSSES[lvl]) {
                    const boss = BOSSES[lvl];
                    spawnBoss(boss, lvl);
                } else {
                    // Regular enemies with new types
                    const numSlimes = 3 + Math.floor(lvl / 2);
                    const numGoblins = 2 + Math.floor(lvl / 3);
                    const numOgres = Math.floor(lvl / 4);
                    const numSkeletons = Math.floor(lvl / 2);
                    const numBats = Math.floor(lvl / 3);
                    const numSpiders = Math.floor(lvl / 3);
                    const numWraiths = Math.floor(lvl / 5);
                    const numDarkKnights = Math.floor(lvl / 8);
                    
                    // New enemy types - scaled by level
                    const numGhosts = lvl >= 15 ? Math.floor((lvl - 10) / 4) : 0;
                    const numDemons = lvl >= 25 ? Math.floor((lvl - 20) / 5) : 0;
                    const numNecromancers = lvl >= 30 ? Math.floor((lvl - 25) / 8) : 0;
                    const numMimics = lvl >= 20 ? Math.floor((lvl - 15) / 10) : 0;
                    const numGargoyles = lvl >= 35 ? Math.floor((lvl - 30) / 6) : 0;
                    const numShades = lvl >= 40 ? Math.floor((lvl - 35) / 7) : 0;
                    const numBerserkers = lvl >= 45 ? Math.floor((lvl - 40) / 5) : 0;
                    const numArchers = lvl >= 10 ? Math.floor((lvl - 5) / 4) : 0;
                    const numMages = lvl >= 50 ? Math.floor((lvl - 45) / 6) : 0;
                    const numAssassins = lvl >= 55 ? Math.floor((lvl - 50) / 8) : 0;
                    const numGolems = lvl >= 60 ? Math.floor((lvl - 55) / 10) : 0;
                    const numHarpies = lvl >= 12 ? Math.floor((lvl - 8) / 5) : 0;
                    
                    // BRAND NEW ENEMY TYPES
                    const numTrolls = lvl >= 65 ? Math.floor((lvl - 60) / 7) : 0;
                    const numBanshees = lvl >= 70 ? Math.floor((lvl - 65) / 6) : 0;
                    const numVampires = lvl >= 75 ? Math.floor((lvl - 70) / 8) : 0;
                    const numCyclops = lvl >= 80 ? Math.floor((lvl - 75) / 9) : 0;
                    const numWerewolves = lvl >= 85 ? Math.floor((lvl - 80) / 7) : 0;
                    const numLiches = lvl >= 90 ? Math.floor((lvl - 85) / 10) : 0;
                    const numElementals = lvl >= 95 ? Math.floor((lvl - 90) / 6) : 0;
                    const numHydras = lvl >= 100 ? Math.floor((lvl - 95) / 12) : 0;
                    const numDragonWhelps = lvl >= 110 ? Math.floor((lvl - 105) / 8) : 0;
                    const numImps = lvl >= 105 ? Math.floor((lvl - 100) / 5) : 0;
                    const numWyverns = lvl >= 120 ? Math.floor((lvl - 115) / 9) : 0;
                    const numShadowFiends = lvl >= 130 ? Math.floor((lvl - 125) / 7) : 0;
                    const numPhoenixes = lvl >= 140 ? Math.floor((lvl - 135) / 10) : 0;
                    const numChimeras = lvl >= 150 ? Math.floor((lvl - 145) / 11) : 0;
                    const numKrakens = lvl >= 160 ? Math.floor((lvl - 155) / 15) : 0;
                    const numFrostGiants = lvl >= 170 ? Math.floor((lvl - 165) / 9) : 0;
                    const numFireGiants = lvl >= 175 ? Math.floor((lvl - 170) / 9) : 0;
                    const numDullahans = lvl >= 180 ? Math.floor((lvl - 175) / 8) : 0;
                    const numMedusas = lvl >= 190 ? Math.floor((lvl - 185) / 10) : 0;
                    const numMinotaurs = lvl >= 200 ? Math.floor((lvl - 195) / 12) : 0;
                    
                    for (let i = 0; i < numSlimes; i++) {
                        spawnEnemy('slime', canvas.width - 200 - i * 150, groundY() - 40);
                    }
                    for (let i = 0; i < numGoblins; i++) {
                        spawnEnemy('goblin', canvas.width - 300 - i * 180, groundY() - 48);
                    }
                    for (let i = 0; i < numOgres; i++) {
                        spawnEnemy('ogre', canvas.width - 500 - i * 200, groundY() - 80);
                    }
                    for (let i = 0; i < numSkeletons; i++) {
                        spawnEnemy('skeleton', canvas.width - 250 - i * 170, groundY() - 52);
                    }
                    for (let i = 0; i < numBats; i++) {
                        spawnEnemy('bat', canvas.width - 180 - i * 220, groundY() - (80 + i * 40));
                    }
                    for (let i = 0; i < numSpiders; i++) {
                        spawnEnemy('spider', canvas.width - 350 - i * 160, groundY() - 36);
                    }
                    for (let i = 0; i < numWraiths; i++) {
                        spawnEnemy('wraith', canvas.width - 420 - i * 240, groundY() - 56);
                    }
                    for (let i = 0; i < numDarkKnights; i++) {
                        spawnEnemy('dark_knight', canvas.width - 600 - i * 280, groundY() - 72);
                    }
                    
                    // NEW ENEMIES
                    for (let i = 0; i < numGhosts; i++) {
                        spawnEnemy('ghost', canvas.width - 280 - i * 190, groundY() - 56);
                    }
                    for (let i = 0; i < numDemons; i++) {
                        spawnEnemy('demon', canvas.width - 550 - i * 250, groundY() - 80);
                    }
                    for (let i = 0; i < numNecromancers; i++) {
                        spawnEnemy('necromancer', canvas.width - 700 - i * 300, groundY() - 64);
                    }
                    for (let i = 0; i < numMimics; i++) {
                        spawnEnemy('mimic', canvas.width - 320 - i * 220, groundY() - 44);
                    }
                    for (let i = 0; i < numGargoyles; i++) {
                        spawnEnemy('gargoyle', canvas.width - 480 - i * 260, groundY() - 90);
                    }
                    for (let i = 0; i < numShades; i++) {
                        spawnEnemy('shade', canvas.width - 390 - i * 230, groundY() - 68);
                    }
                    for (let i = 0; i < numBerserkers; i++) {
                        spawnEnemy('berserker', canvas.width - 620 - i * 270, groundY() - 70);
                    }
                    for (let i = 0; i < numArchers; i++) {
                        spawnEnemy('archer', canvas.width - 450 - i * 200, groundY() - 58);
                    }
                    for (let i = 0; i < numMages; i++) {
                        spawnEnemy('mage', canvas.width - 510 - i * 240, groundY() - 62);
                    }
                    for (let i = 0; i < numAssassins; i++) {
                        spawnEnemy('assassin', canvas.width - 370 - i * 210, groundY() - 60);
                    }
                    for (let i = 0; i < numGolems; i++) {
                        spawnEnemy('golem', canvas.width - 800 - i * 350, groundY() - 120);
                    }
                    for (let i = 0; i < numHarpies; i++) {
                        spawnEnemy('harpy', canvas.width - 320 - i * 240, groundY() - 110);
                    }
                    
                    // === VEHICLE ENEMIES - Appear after level 10 ===
                    const numTanks = lvl >= 10 ? Math.floor((lvl - 9) / 4) : 0;
                    const numArtillery = lvl >= 15 ? Math.floor((lvl - 14) / 5) : 0;
                    const numHelicopters = lvl >= 18 ? Math.floor((lvl - 17) / 4) : 0;
                    const numArmoredCars = lvl >= 12 ? Math.floor((lvl - 11) / 3) : 0;
                    const numMechs = lvl >= 25 ? Math.floor((lvl - 24) / 7) : 0;
                    const numDrones = lvl >= 14 ? Math.floor((lvl - 13) / 3) : 0;
                    const numAPCs = lvl >= 20 ? Math.floor((lvl - 19) / 6) : 0;
                    const numMissileLaunchers = lvl >= 28 ? Math.floor((lvl - 27) / 8) : 0;
                    const numJets = lvl >= 30 ? Math.floor((lvl - 29) / 6) : 0;
                    const numHovercrafts = lvl >= 16 ? Math.floor((lvl - 15) / 4) : 0;
                    
                    for (let i = 0; i < numTanks; i++) {
                        spawnEnemy('tank', canvas.width - 650 - i * 320, groundY() - 50);
                    }
                    for (let i = 0; i < numArtillery; i++) {
                        spawnEnemy('artillery', canvas.width - 750 - i * 380, groundY() - 48);
                    }
                    for (let i = 0; i < numHelicopters; i++) {
                        spawnEnemy('helicopter', canvas.width - 400 - i * 280, groundY() - 150);
                    }
                    for (let i = 0; i < numArmoredCars; i++) {
                        spawnEnemy('armored_car', canvas.width - 500 - i * 250, groundY() - 42);
                    }
                    for (let i = 0; i < numMechs; i++) {
                        spawnEnemy('mech', canvas.width - 850 - i * 400, groundY() - 95);
                    }
                    for (let i = 0; i < numDrones; i++) {
                        spawnEnemy('drone', canvas.width - 300 - i * 200, groundY() - (100 + i * 30));
                    }
                    for (let i = 0; i < numAPCs; i++) {
                        spawnEnemy('apc', canvas.width - 700 - i * 340, groundY() - 48);
                    }
                    for (let i = 0; i < numMissileLaunchers; i++) {
                        spawnEnemy('missile_launcher', canvas.width - 800 - i * 380, groundY() - 52);
                    }
                    for (let i = 0; i < numJets; i++) {
                        spawnEnemy('jet', canvas.width - 450 - i * 350, groundY() - 180);
                    }
                    for (let i = 0; i < numHovercrafts; i++) {
                        spawnEnemy('hovercraft', canvas.width - 550 - i * 270, groundY() - 58);
                    }
                    
                    // === NEW ADVANCED ENEMIES ===
                    for (let i = 0; i < numTrolls; i++) {
                        spawnEnemy('troll', canvas.width - 720 - i * 310, groundY() - 85);
                    }
                    for (let i = 0; i < numBanshees; i++) {
                        spawnEnemy('banshee', canvas.width - 340 - i * 250, groundY() - 100);
                    }
                    for (let i = 0; i < numVampires; i++) {
                        spawnEnemy('vampire', canvas.width - 460 - i * 280, groundY() - 110);
                    }
                    for (let i = 0; i < numCyclops; i++) {
                        spawnEnemy('cyclops', canvas.width - 830 - i * 360, groundY() - 88);
                    }
                    for (let i = 0; i < numWerewolves; i++) {
                        spawnEnemy('werewolf', canvas.width - 540 - i * 290, groundY() - 66);
                    }
                    for (let i = 0; i < numLiches; i++) {
                        spawnEnemy('lich', canvas.width - 680 - i * 320, groundY() - 64);
                    }
                    for (let i = 0; i < numElementals; i++) {
                        spawnEnemy('elemental', canvas.width - 420 - i * 260, groundY() - 58);
                    }
                    for (let i = 0; i < numHydras; i++) {
                        spawnEnemy('hydra', canvas.width - 890 - i * 400, groundY() - 76);
                    }
                    for (let i = 0; i < numDragonWhelps; i++) {
                        spawnEnemy('dragon_whelp', canvas.width - 380 - i * 270, groundY() - 130);
                    }
                    for (let i = 0; i < numImps; i++) {
                        spawnEnemy('imp', canvas.width - 240 - i * 180, groundY() - 38);
                    }
                    for (let i = 0; i < numWyverns; i++) {
                        spawnEnemy('wyvern', canvas.width - 520 - i * 300, groundY() - 140);
                    }
                    for (let i = 0; i < numShadowFiends; i++) {
                        spawnEnemy('shadow_fiend', canvas.width - 590 - i * 280, groundY() - 60);
                    }
                    for (let i = 0; i < numPhoenixes; i++) {
                        spawnEnemy('phoenix', canvas.width - 440 - i * 290, groundY() - 125);
                    }
                    for (let i = 0; i < numChimeras; i++) {
                        spawnEnemy('chimera', canvas.width - 780 - i * 350, groundY() - 70);
                    }
                    for (let i = 0; i < numKrakens; i++) {
                        spawnEnemy('kraken', canvas.width - 950 - i * 450, groundY() - 80);
                    }
                    for (let i = 0; i < numFrostGiants; i++) {
                        spawnEnemy('frost_giant', canvas.width - 820 - i * 370, groundY() - 92);
                    }
                    for (let i = 0; i < numFireGiants; i++) {
                        spawnEnemy('fire_giant', canvas.width - 840 - i * 370, groundY() - 92);
                    }
                    for (let i = 0; i < numDullahans; i++) {
                        spawnEnemy('dullahan', canvas.width - 620 - i * 290, groundY() - 70);
                    }
                    for (let i = 0; i < numMedusas; i++) {
                        spawnEnemy('medusa', canvas.width - 560 - i * 280, groundY() - 64);
                    }
                    for (let i = 0; i < numMinotaurs; i++) {
                        spawnEnemy('minotaur', canvas.width - 740 - i * 340, groundY() - 80);
                    }
                }
            }

            updateHUD();
            updateTutorialHint();
        }

        function spawnEnemy(type, x, y) {
            const base = {
                type, x, y, w: 40, h: 40, vx: 0, vy: 0, hp: 3, maxHp: 3, damage: 2, speed: 40, alive: true, attackTimer: 0, jumpTimer: 0, grounded: false
            };
            if (type === 'sword_dummy') {
                base.color = '#dc2626'; // Red dummy - sword only
                base.hp = 2;
                base.speed = 0;
                base.damage = 0;
                base.isDummy = true;
                base.onlyDamageFrom = 'sword';
            }
            else if (type === 'arrow_dummy') {
                base.color = '#3b82f6'; // Blue dummy - arrow only
                base.hp = 2;
                base.speed = 0;
                base.damage = 0;
                base.isDummy = true;
                base.onlyDamageFrom = 'arrow';
            }
            else if (type === 'slime') { base.color = '#4ade80'; base.hp = 3; base.speed = 40; base.damage = 2; base.bouncy = true; }
            else if (type === 'goblin') { base.color = '#a3e635'; base.w = 44; base.h = 48; base.hp = 5; base.speed = 100; base.damage = 4; }
            else if (type === 'ogre') { base.color = '#fb7185'; base.w = 64; base.h = 80; base.hp = 15; base.speed = 50; base.damage = 8; }
            else if (type === 'skeleton') { base.color = '#e0e7ff'; base.w = 36; base.h = 52; base.hp = 4; base.speed = 150; base.damage = 3; }
            else if (type === 'bat') { base.color = '#581c87'; base.w = 38; base.h = 28; base.hp = 2; base.speed = 120; base.damage = 2; base.flying = true; base.hoverHeight = 60 + Math.random() * 80; }
            else if (type === 'dark_knight') { base.color = '#1e1b4b'; base.w = 52; base.h = 72; base.hp = 25; base.speed = 40; base.damage = 10; base.armored = true; }
            else if (type === 'wraith') { base.color = '#6366f1'; base.w = 42; base.h = 56; base.hp = 8; base.speed = 80; base.damage = 5; base.floating = true; base.floatOffset = 0; }
            else if (type === 'spider') { base.color = '#450a0a'; base.w = 48; base.h = 36; base.hp = 6; base.speed = 110; base.damage = 4; base.jumpy = true; }
            else if (type === 'ghost') { base.color = '#c7d2fe'; base.w = 40; base.h = 50; base.hp = 5; base.speed = 90; base.damage = 3; base.floating = true; base.floatOffset = 0; base.phasing = true; }
            else if (type === 'demon') { base.color = '#7f1d1d'; base.w = 56; base.h = 68; base.hp = 20; base.speed = 130; base.damage = 12; base.enraged = false; }
            else if (type === 'necromancer') { base.color = '#4c1d95'; base.w = 44; base.h = 60; base.hp = 10; base.speed = 60; base.damage = 5; base.summonTimer = 0; base.canSummon = true; }
            else if (type === 'mimic') { base.color = '#fbbf24'; base.w = 40; base.h = 40; base.hp = 12; base.speed = 0; base.damage = 15; base.disguised = true; base.activateRange = 80; }
            else if (type === 'gargoyle') { base.color = '#57534e'; base.w = 50; base.h = 60; base.hp = 18; base.speed = 70; base.damage = 8; base.flying = true; base.hoverHeight = 100 + Math.random() * 60; base.armored = true; }
            else if (type === 'shade') { base.color = '#18181b'; base.w = 38; base.h = 54; base.hp = 7; base.speed = 140; base.damage = 6; base.teleportTimer = 0; base.canTeleport = true; }
            else if (type === 'berserker') { base.color = '#b91c1c'; base.w = 50; base.h = 66; base.hp = 16; base.speed = 180; base.damage = 9; base.frenzied = true; }
            else if (type === 'archer') { base.color = '#65a30d'; base.w = 40; base.h = 52; base.hp = 6; base.speed = 70; base.damage = 5; base.ranged = true; base.shootTimer = 0; }
            else if (type === 'mage') { base.color = '#7c3aed'; base.w = 42; base.h = 58; base.hp = 8; base.speed = 50; base.damage = 7; base.magical = true; base.castTimer = 0; }
            else if (type === 'assassin') { base.color = '#0f172a'; base.w = 36; base.h = 50; base.hp = 9; base.speed = 200; base.damage = 11; base.stealthy = true; }
            else if (type === 'golem') { base.color = '#78716c'; base.w = 70; base.h = 90; base.hp = 35; base.speed = 30; base.damage = 14; base.armored = true; base.heavy = true; }
            else if (type === 'harpy') { base.color = '#be123c'; base.w = 42; base.h = 46; base.hp = 7; base.speed = 160; base.damage = 6; base.flying = true; base.hoverHeight = 120 + Math.random() * 60; base.swooping = false; }
            // VEHICLES
            else if (type === 'tank') { base.color = '#4b5563'; base.w = 80; base.h = 50; base.hp = 40; base.speed = 25; base.damage = 15; base.armored = true; base.vehicle = true; base.cannonTimer = 0; base.shootCannon = true; }
            else if (type === 'artillery') { base.color = '#374151'; base.w = 70; base.h = 48; base.hp = 30; base.speed = 0; base.damage = 20; base.vehicle = true; base.artilleryTimer = 0; base.firesArc = true; }
            else if (type === 'helicopter') { base.color = '#0ea5e9'; base.w = 60; base.h = 40; base.hp = 18; base.speed = 90; base.damage = 8; base.vehicle = true; base.flying = true; base.hoverHeight = 100 + Math.random() * 50; base.propellerRotation = 0; base.canShootMissile = true; base.missileTimer = 0; }
            else if (type === 'armored_car') { base.color = '#6b7280'; base.w = 65; base.h = 42; base.hp = 22; base.speed = 140; base.damage = 10; base.vehicle = true; base.ramming = true; base.turretTimer = 0; base.canShootTurret = true; }
            else if (type === 'mech') { base.color = '#dc2626'; base.w = 75; base.h = 95; base.hp = 50; base.speed = 45; base.damage = 18; base.vehicle = true; base.armored = true; base.walking = true; base.legAnimation = 0; base.canLaser = true; base.laserTimer = 0; }
            else if (type === 'drone') { base.color = '#0891b2'; base.w = 35; base.h = 25; base.hp = 8; base.speed = 150; base.damage = 5; base.vehicle = true; base.flying = true; base.hoverHeight = 80 + Math.random() * 70; base.scanTimer = 0; base.machineGunTimer = 0; base.canShootGun = true; }
            else if (type === 'apc') { base.color = '#059669'; base.w = 72; base.h = 48; base.hp = 35; base.speed = 60; base.damage = 12; base.vehicle = true; base.armored = true; base.canDeploy = true; base.deployTimer = 0; base.apcGunTimer = 0; base.canShootAPC = true; }
            else if (type === 'missile_launcher') { base.color = '#7c2d12'; base.w = 68; base.h = 52; base.hp = 28; base.speed = 15; base.damage = 25; base.vehicle = true; base.rocketTimer = 0; base.firesRockets = true; }
            else if (type === 'jet') { base.color = '#1e40af'; base.w = 70; base.h = 35; base.hp = 20; base.speed = 250; base.damage = 14; base.vehicle = true; base.flying = true; base.hoverHeight = 120 + Math.random() * 40; base.strafing = false; base.strafeTimer = 0; }
            else if (type === 'hovercraft') { base.color = '#0d9488'; base.w = 58; base.h = 38; base.hp = 25; base.speed = 110; base.damage = 9; base.vehicle = true; base.hovering = true; base.hoverOffset = 0; base.hoverGunTimer = 0; base.canShootHover = true; }
            // NEW ENEMY TYPES
            else if (type === 'troll') { base.color = '#65a30d'; base.w = 70; base.h = 85; base.hp = 28; base.speed = 35; base.damage = 11; base.regenerating = true; base.regenTimer = 0; base.armored = true; }
            else if (type === 'banshee') { base.color = '#c026d3'; base.w = 40; base.h = 55; base.hp = 9; base.speed = 130; base.damage = 7; base.flying = true; base.hoverHeight = 90 + Math.random() * 70; base.screaming = false; base.screamTimer = 0; }
            else if (type === 'vampire') { base.color = '#831843'; base.w = 46; base.h = 62; base.hp = 22; base.speed = 160; base.damage = 10; base.lifesteal = true; base.flying = true; base.hoverHeight = 70 + Math.random() * 50; }
            else if (type === 'cyclops') { base.color = '#f59e0b'; base.w = 68; base.h = 88; base.hp = 32; base.speed = 40; base.damage = 16; base.throwBoulder = true; base.boulderTimer = 0; }
            else if (type === 'werewolf') { base.color = '#92400e'; base.w = 52; base.h = 66; base.hp = 20; base.speed = 190; base.damage = 13; base.lunging = true; base.lungeTimer = 0; }
            else if (type === 'lich') { base.color = '#4c1d95'; base.w = 46; base.h = 64; base.hp = 18; base.speed = 45; base.damage = 9; base.floating = true; base.floatOffset = 0; base.darkMagic = true; base.spellTimer = 0; }
            else if (type === 'elemental') { base.color = '#14b8a6'; base.w = 50; base.h = 58; base.hp = 15; base.speed = 100; base.damage = 8; base.floating = true; base.floatOffset = 0; base.elementalType = ['fire', 'ice', 'lightning'][Math.floor(Math.random() * 3)]; }
            else if (type === 'hydra') { base.color = '#15803d'; base.w = 80; base.h = 76; base.hp = 36; base.speed = 60; base.damage = 12; base.multiHead = true; base.heads = 3; }
            else if (type === 'dragon_whelp') { base.color = '#dc2626'; base.w = 56; base.h = 50; base.hp = 24; base.speed = 140; base.damage = 11; base.flying = true; base.hoverHeight = 110 + Math.random() * 60; base.breatheFire = true; base.fireTimer = 0; }
            else if (type === 'imp') { base.color = '#dc2626'; base.w = 32; base.h = 38; base.hp = 5; base.speed = 180; base.damage = 4; base.teleporting = true; base.teleportTimer = 0; }
            else if (type === 'wyvern') { base.color = '#7c2d12'; base.w = 64; base.h = 58; base.hp = 26; base.speed = 160; base.damage = 14; base.flying = true; base.hoverHeight = 130 + Math.random() * 50; base.poisonous = true; }
            else if (type === 'shadow_fiend') { base.color = '#18181b'; base.w = 44; base.h = 60; base.hp = 14; base.speed = 170; base.damage = 9; base.floating = true; base.floatOffset = 0; base.invisible = false; base.invisTimer = 0; }
            else if (type === 'phoenix') { base.color = '#f97316'; base.w = 54; base.h = 52; base.hp = 20; base.speed = 150; base.damage = 10; base.flying = true; base.hoverHeight = 120 + Math.random() * 60; base.reviving = true; base.revived = false; }
            else if (type === 'chimera') { base.color = '#b91c1c'; base.w = 72; base.h = 70; base.hp = 30; base.speed = 90; base.damage = 15; base.multiAttack = true; }
            else if (type === 'kraken') { base.color = '#0e7490'; base.w = 90; base.h = 80; base.hp = 45; base.speed = 50; base.damage = 18; base.tentacles = true; base.tentacleTimer = 0; }
            else if (type === 'frost_giant') { base.color = '#3b82f6'; base.w = 76; base.h = 92; base.hp = 38; base.speed = 40; base.damage = 17; base.freezeAura = true; base.iceTimer = 0; }
            else if (type === 'fire_giant') { base.color = '#ea580c'; base.w = 76; base.h = 92; base.hp = 38; base.speed = 40; base.damage = 17; base.burnAura = true; base.fireAuraTimer = 0; }
            else if (type === 'dullahan') { base.color = '#1e293b'; base.w = 48; base.h = 70; base.hp = 21; base.speed = 120; base.damage = 12; base.headless = true; base.cursed = true; }
            else if (type === 'medusa') { base.color = '#16a34a'; base.w = 46; base.h = 64; base.hp = 19; base.speed = 80; base.damage = 10; base.petrify = true; base.gazeTimer = 0; }
            else if (type === 'minotaur') { base.color = '#78350f'; base.w = 66; base.h = 80; base.hp = 34; base.speed = 110; base.damage = 16; base.charging = false; base.chargeTimer = 0; }
            base.maxHp = base.hp;
            enemies.push(base);
        }

        function spawnBoss(bossData, level) {
            const boss = {
                type: bossData.isVehicle ? bossData.vehicle : 'boss',
                name: bossData.name,
                x: canvas.width - 400,
                y: groundY() - (bossData.size * 40),
                w: bossData.size * 40,
                h: bossData.size * 40,
                vx: 0,
                vy: 0,
                hp: bossData.hp,
                maxHp: bossData.hp,
                damage: bossData.damage,
                speed: bossData.isVehicle ? 80 : 60,
                color: bossData.color,
                alive: true,
                attackTimer: 0,
                jumpTimer: 0,
                grounded: false,
                isBoss: true,
                ability: bossData.ability,
                abilityTimer: 0,
                abilityAnimation: null,
                vehicle: bossData.vehicle,
                isVehicle: bossData.isVehicle,
                // Vehicle-specific properties
                charging: false,
                chargeWarning: false,
                chargeWarningTime: 0,
                chargeSpeed: 0,
                propellerRotation: 0,
                armored: true,
                bossLevel: level,
                isReturning: false,
                cannonTimer: 0,
                shootCannon: bossData.isVehicle
            };
            
            // Check if this is a returning boss (10 levels after first appearance)
            const originalBossLevel = level - 10;
            if (originalBossLevel > 0 && BOSSES[originalBossLevel]) {
                boss.isReturning = true;
                boss.name = bossData.name + ' RETURNS';
                boss.hp = Math.floor(boss.hp * 1.5); // 50% more HP when returning
                boss.maxHp = boss.hp;
                boss.damage = Math.floor(boss.damage * 1.3); // 30% more damage
            }
            
            enemies.push(boss);
            
            // Show boss intro
            const introText = boss.isReturning ? '⚠️ ' + boss.name + ' ⚠️' : 'BOSS: ' + bossData.name;
            effects.push({ type: 'pickup', x: canvas.width / 2, y: 100, timer: 3, text: introText, color: bossData.color });
        }
