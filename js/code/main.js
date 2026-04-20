        function loop(timestamp) {
            try {
                let dt = Math.min(0.05, (timestamp - lastTime) / 1000 || 0);
                lastTime = timestamp;
                // Slow-motion when aiming with bow
                if (bowMode && !bowTarget) dt *= 0.25;
                update(dt);
                draw();
            } catch(e) {
                console.error('Game loop error:', e);
            }
            requestAnimationFrame(loop);
        }

        window.addEventListener('keydown', e => {
            // Don't intercept keys if typing in level finder
            const isTypingInLevelFinder = document.activeElement === levelNameInput;
            
            if (e.key === 'a' || e.key === 'A') input.left = true;
            if (e.key === 'd' || e.key === 'D') input.right = true;
            if (e.key === ' ' || e.key === 'w' || e.key === 'W') { 
                if (!isTypingInLevelFinder) {
                    e.preventDefault(); 
                    input.jump = true; 
                }
            }
            if (e.key === 'r' || e.key === 'R') {
                if (bowMode && bowTarget) shootArrow();
                else if (bowMode) {
                    bowMode = false;
                    bowTarget = null;
                    bowIndicator.classList.add('hidden');
                    bowIndicator.classList.remove('targeted');
                    bowIndicator.textContent = 'BOW MODE - CLICK ENEMY TO TARGET';
                }
                else {
                    bowMode = true;
                    bowIndicator.classList.remove('hidden');
                    bowIndicator.classList.remove('targeted');
                    bowIndicator.textContent = 'BOW MODE - CLICK ENEMY TO TARGET';
                }
            }
            if (e.key === 'e' || e.key === 'E') {
                if (shopDialogue.classList.contains('hidden') === false) return;
                if (dialogueOpen) advanceDialogue();
                else if (nearbyNPC) openDialogue(nearbyNPC);
            }
            if (e.key === 'q' || e.key === 'Q') {
                if (insideShop) {
                    // Exit shop
                    exitShop();
                } else {
                    const nearShop = getNearbyShop();
                    if (nearShop) {
                        // Enter shop
                        enterShop(nearShop);
                        openShopDialogue(nearShop);
                    }
                }
            }
            if (e.key === 'Escape') {
                if (isPaused) {
                    closePauseMenu();
                } else if (insideShop) {
                    exitShop();
                } else if (gameState === 'worldmap') {
                    closeWorldMap();
                } else if (gameState === 'playing') {
                    openPauseMenu();
                } else {
                    closeShopPanel();
                    closeShopDialogue();
                }
            }
            // W key also activates jetpack when in air
            if ((e.key === 'w' || e.key === 'W') && player.hasJetpack && !player.grounded && !dialogueOpen && !insideShop && player.jetpackFuel > 0) {
                player.jetpackActive = true;
            }
            if (e.key === 'm' || e.key === 'M') {
                if (!dialogueOpen && !insideShop && gameState === 'playing') {
                    openWorldMap();
                }
            }
            if (e.key === 'c' || e.key === 'C') {
                if (player.shieldMaterial) player.shieldUp = true;
            }
            // Potion usage keys
            if (e.key === 'p' || e.key === 'P') {
                if (!dialogueOpen && !insideShop) {
                    // Cycle through potions and use the first available one
                    const potionOrder = ['healing', 'shield', 'damage', 'speed', 'extraHealth'];
                    for (const potionType of potionOrder) {
                        if (player.potions[potionType] > 0) {
                            usePotion(potionType);
                            break;
                        }
                    }
                }
            }
            // Individual potion slot hotkeys (1, 2, 3, 4, 5)
            if (e.key === '1' && !isTypingInLevelFinder) usePotionSlot(0);
            if (e.key === '2' && !isTypingInLevelFinder) usePotionSlot(1);
            if (e.key === '3' && !isTypingInLevelFinder) usePotionSlot(2);
            if (e.key === '4' && !isTypingInLevelFinder) usePotionSlot(3);
            if (e.key === '5' && !isTypingInLevelFinder) usePotionSlot(4);
        });

        window.addEventListener('keyup', e => {
            if (e.key === 'a' || e.key === 'A') input.left = false;
            if (e.key === 'd' || e.key === 'D') input.right = false;
            if (e.key === ' ' || e.key === 'w' || e.key === 'W') input.jump = false;
            if (e.key === 'w' || e.key === 'W') {
                player.jetpackActive = false;
            }
            if (e.key === 'c' || e.key === 'C') player.shieldUp = false;
        });

        canvas.addEventListener('mousemove', e => {
            const rect = canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        });

        canvas.addEventListener('click', e => {
            if (gameState !== 'playing') return;
            if (dialogueOpen) return;

            if (bowMode) {
                for (const enemy of enemies) {
                    if (!enemy.alive) continue;
                    const ex = enemy.x - enemy.w / 2, ey = enemy.y;
                    if (mouseX >= ex && mouseX <= ex + enemy.w && mouseY >= ey && mouseY <= ey + enemy.h) {
                        bowTarget = enemy;
                        bowIndicator.textContent = 'TARGET LOCKED - PRESS R TO FIRE';
                        bowIndicator.classList.add('targeted');
                        return;
                    }
                }
            } else performSwordAttack();
        });

        // Add event listeners with error handling and event delegation
        document.addEventListener('click', function(event) {
            try {
                if (event.target.id === 'training-btn') {
                    event.preventDefault();
                    startTraining();
                } else if (event.target.id === 'start-btn') {
                    event.preventDefault();
                    startAdventure();
                } else if (event.target.id === 'skip-btn') {
                    event.preventDefault();
                    startAdventure();
                } else if (event.target.id === 'find-level-btn') {
                    event.preventDefault();
                    openLevelFinder();
                } else if (event.target.id === 'arena-btn') {
                    event.preventDefault();
                    enterArenaMode();
                }
            } catch (error) {
                console.error('Button click error:', error);
            }
        });

        // Backup direct event listeners
        try {
            if (trainingBtn) trainingBtn.addEventListener('click', startTraining);
            if (startBtn) startBtn.addEventListener('click', startAdventure);
            if (skipBtn) skipBtn.addEventListener('click', startAdventure);
            if (findLevelBtn) findLevelBtn.addEventListener('click', openLevelFinder);
            if (arenaBtn) arenaBtn.addEventListener('click', enterArenaMode);
        } catch (error) {
            console.error('Event listener error:', error);
        }
        
        // Allow Enter key to submit level name
        if (levelNameInput) {
            levelNameInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    goToLevel();
                }
            });
        }
        
        // World Map event listeners
        const worldMapCloseBtn = document.querySelector('.map-close-btn');
        if (worldMapCloseBtn) {
            worldMapCloseBtn.addEventListener('click', closeWorldMap);
        }
        
        // Area card event listeners
        const grassyCard = document.querySelector('[data-area="grassy"]');
        const iceCard = document.querySelector('[data-area="ice"]');
        const lavaCard = document.querySelector('[data-area="lava"]');
        const lightningCard = document.querySelector('[data-area="lightning"]');
        
        if (grassyCard) grassyCard.addEventListener('click', () => selectArea('grassy'));
        if (iceCard) iceCard.addEventListener('click', () => selectArea('ice'));
        if (lavaCard) lavaCard.addEventListener('click', () => selectArea('lava'));
        if (lightningCard) lightningCard.addEventListener('click', () => selectArea('lightning'));
        
        // Pause menu event listeners
        const resumeBtn = document.querySelector('.pause-btn.resume');
        const menuBtn = document.querySelector('.pause-btn.menu');
        
        if (resumeBtn) resumeBtn.addEventListener('click', closePauseMenu);
        if (menuBtn) menuBtn.addEventListener('click', () => {
            closePauseMenu();
            showTitleScreen();
        });

        requestAnimationFrame(loop);
