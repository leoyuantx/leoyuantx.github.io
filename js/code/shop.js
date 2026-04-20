        function checkTutorial() {
            if (currentLevel !== 0) return;
            if (tutorialStep < tutorialSteps.length && tutorialSteps[tutorialStep].check()) {
                const step = tutorialSteps[tutorialStep];
                // Handle onComplete actions
                if (step.onComplete === 'spawnArrowDummies') {
                    spawnArrowDummies();
                } else if (step.onComplete === 'spawnSlimes') {
                    spawnSlimes();
                }
                tutorialStep++;
                updateTutorialHint();
            }
            if (tutorialStep >= tutorialSteps.length && enemies.filter(e => e.alive && e.type === 'slime').length === 0) {
                tutorialComplete = true;
                // Master talks to you when you pass!
                showMasterCongrats();
            }
        }

        function spawnArrowDummies() {
            // Spawn arrow dummies after sword dummies are done
            for (let i = 0; i < 2; i++) {
                spawnEnemy('arrow_dummy', 450 + i * 120, groundY() - 48);
            }
        }

        function spawnSlimes() {
            // Spawn slimes after talking to master
            for (let i = 0; i < 3; i++) {
                spawnEnemy('slime', 300 + i * 150, groundY() - 40);
            }
        }

        function showMasterCongrats() {
            // Find master NPC and open congratulations dialogue
            const master = npcs.find(n => n.name === 'MASTER REN');
            if (master) {
                master.dialogue = [
                    { speaker: 'MASTER REN', text: 'EXCELLENT WORK, YOUNG WARRIOR! YOU HAVE COMPLETED YOUR TRAINING!' },
                    { speaker: 'MASTER REN', text: 'YOU HAVE SHOWN SKILL WITH BOTH SWORD AND BOW.' },
                    { speaker: 'MASTER REN', text: 'NOW YOU ARE READY FOR THE REAL ADVENTURE. GO TO THE WHISPERING WOODS!' }
                ];
                dialogueOpen = true;
                dialogueData = { npc: master, index: 0, onComplete: () => {
                    tutorialComplete = true;
                    currentLevel = 1;
                    setupLevel(1);
                } };
                showDialogueLine();
            } else {
                tutorialComplete = true;
                currentLevel = 1;
                setupLevel(1);
            }
        }

        function updateTutorialHint() {
            if (tutorialStep < tutorialSteps.length) tutorialHint.textContent = tutorialSteps[tutorialStep].text;
            else tutorialHint.textContent = 'TRAINING ALMOST DONE...';
        }

        function updateHUD() {
            const ratio = Math.max(0, player.hp / player.maxHp);
            hpFill.style.width = (ratio * 100) + '%';
            hpText.textContent = `${Math.max(0, Math.floor(player.hp))}/${player.maxHp}`;
            arrowsText.textContent = player.arrows;
            moneyText.textContent = player.money;
            const matName = player.swordMaterial.toUpperCase();
            swordInfoText.textContent = `${matName} Lv${player.swordLevel}`;
            partyInfoText.textContent = `${1 + companions.length}/5`;
            updatePotionSlotsUI();
            updateForceFieldHUD();
        }
        
        function updateForceFieldHUD() {
            const ffHud = document.getElementById('forcefield-hud');
            if (!player.hasForceField) {
                ffHud.classList.add('hidden');
                return;
            }
            
            ffHud.classList.remove('hidden');
            
            if (player.forceFieldRespawnTimer > 0) {
                ffHud.classList.add('respawning');
                ffHud.textContent = `⏳ ${Math.ceil(player.forceFieldRespawnTimer)}S`;
            } else {
                ffHud.classList.remove('respawning');
                ffHud.textContent = `🛡️ ${Math.floor(player.forceFieldHP)}/${player.forceFieldMaxHP}`;
            }
        }

        function openDialogue(npc) { dialogueOpen = true; dialogueData = { npc, index: 0 }; showDialogueLine(); }

        function showDialogueLine() {
            if (!dialogueData) return;
            const lines = dialogueData.npc.dialogue;
            if (dialogueData.index >= lines.length) { closeDialogue(); return; }
            const line = lines[dialogueData.index];
            dialogueBox.innerHTML = `<div class="speaker">${line.speaker}</div><div>${line.text}</div><div class="hint"></div>`;
            dialogueBox.classList.remove('hidden');
        }

        function advanceDialogue() {
            if (!dialogueData) return;
            dialogueData.index++;
            if (dialogueData.index >= dialogueData.npc.dialogue.length) {
                const onComplete = dialogueData.onComplete;
                const npcName = dialogueData.npc.name;
                const wasEnding = dialogueData.npc.isEnding;
                closeDialogue();
                if (npcName === 'MASTER REN') player.talkedToMaster = true;
                if (onComplete) onComplete();
                
                // If this was the ending dialogue, return to title
                if (wasEnding) {
                    setTimeout(() => {
                        gameState = 'title';
                        titleScreen.classList.remove('hidden');
                        hud.classList.add('hidden');
                        potionSlotsElement.classList.add('hidden');
                        tutorialHint.classList.add('hidden');
                        
                        // Clear save data to start fresh
                        localStorage.removeItem('8bitFighterSave');
                        
                        // Show completion message
                        alert('🎉 GAME COMPLETE! 🎉\n\nYou are the Eternal Champion!\n\nYour progress has been reset.\nStart a new journey to relive the adventure!');
                    }, 500);
                }
            } else showDialogueLine();
        }

        function closeDialogue() { dialogueOpen = false; dialogueData = null; dialogueBox.classList.add('hidden'); }

        // ===== SHOP SYSTEM =====
        let insideShop = null; // Currently inside this shop
        
        function spawnShops() {
            shops.length = 0;
            
            const shopW = 160;
            const shopH = 180;
            const spacing = 200;
            const startX = (canvas.width - spacing * 3) / 2 - shopW / 2;
            
            // Weapon Shop Building
            shops.push({
                name: 'WEAPON SHOP',
                baseX: startX,
                x: startX,
                y: groundY() - shopH,
                w: shopW,
                h: shopH,
                shopType: 'weapon',
                icon: '⚔️',
                signText: 'WEAPONS'
            });
            
            // Armor Shop Building
            shops.push({
                name: 'ARMOR SHOP',
                baseX: startX + spacing,
                x: startX + spacing,
                y: groundY() - shopH,
                w: shopW,
                h: shopH,
                shopType: 'armor',
                icon: '🛡️',
                signText: 'ARMOR'
            });
            
            // Potion Shop Building
            shops.push({
                name: 'POTION SHOP',
                baseX: startX + spacing * 2,
                x: startX + spacing * 2,
                y: groundY() - shopH,
                w: shopW,
                h: shopH,
                shopType: 'potion',
                icon: '🧪',
                signText: 'POTIONS'
            });
            
            // Mercenary Shop Building
            shops.push({
                name: 'MERCENARY GUILD',
                baseX: startX + spacing * 3,
                x: startX + spacing * 3,
                y: groundY() - shopH,
                w: shopW,
                h: shopH,
                shopType: 'mercenary',
                icon: '👥',
                signText: 'GUILD'
            });
            
            // Special Equipment Store
            shops.push({
                name: 'TECH STORE',
                baseX: startX + spacing * 4,
                x: startX + spacing * 4,
                y: groundY() - shopH,
                w: shopW,
                h: shopH,
                shopType: 'store',
                icon: '⚙️',
                signText: 'TECH'
            });
        }

        function getNearbyShop() {
            for (const shop of shops) {
                // Calculate current animated position
                let shopX = shop.baseX;
                if (shopsMovingIn) {
                    const startX = canvas.width + shop.w;
                    shopX = startX + (shop.baseX - startX) * easeOutCubic(shopAnimationProgress);
                } else if (shopsMovingOut) {
                    const targetX = canvas.width + shop.w;
                    shopX = shop.baseX + (targetX - shop.baseX) * easeInCubic(shopAnimationProgress - 1.0);
                }
                
                const doorX = shopX + shop.w / 2;
                if (Math.abs(player.x - doorX) < 60 && player.y + player.h > groundY() - 30) {
                    return shop;
                }
            }
            return null;
        }

        function enterShop(shop) {
            insideShop = shop;
            dialogueOpen = true;
        }

        function exitShop() {
            insideShop = null;
            dialogueOpen = false;
            closeShopPanel();
            closeShopDialogue();
        }
        window.exitShop = exitShop;

        function openShopDialogue(shop) {
            shopNPC = shop;
            
            if (shop.shopType === 'mercenary') {
                showMercenaryShop();
                return;
            }
            
            if (shop.shopType === 'potion') {
                showPotionShop();
                return;
            }
            
            if (shop.shopType === 'store') {
                showTechStore();
                return;
            }
            
            const choices = ['BYE'];
            // Add material choices
            MATERIALS.forEach(mat => {
                if (mat !== 'wooden' || shop.shopType === 'armor') {
                    choices.unshift(mat.toUpperCase());
                }
            });
            if (shop.shopType === 'weapon') {
                choices.unshift('UPGRADE SWORD');
            } else {
                choices.unshift('UPGRADE HELMET');
                choices.unshift('UPGRADE SHIELD');
                choices.unshift('UPGRADE ARMOR');
            }
            
            let html = `<div class="speaker">${shop.name}</div>`;
            html += `<div>WHAT CAN I HELP YOU WITH TODAY?</div>`;
            html += `<div class="choices">`;
            choices.forEach(choice => {
                html += `<div class="choice" onclick="handleShopChoice('${choice}')">${choice}</div>`;
            });
            html += `</div>`;
            shopDialogue.innerHTML = html;
            shopDialogue.classList.remove('hidden');
            dialogueOpen = true;
        }

        function showMercenaryShop() {
            const hireCost = 200 * Math.pow(2, mercenaryHireCount);
            const canAfford = player.money >= hireCost;
            const canHire = companions.length < 4;
            
            let html = `<h2 style="color:#22c55e">MERCENARY GUILD</h2>`;
            
            // Add visual mercenary display
            html += `<div style="background:#1e293b;padding:12px;margin-bottom:12px;border:2px solid #475569;text-align:center">`;
            html += `<div style="font-size:10px;color:#94a3b8;margin-bottom:8px">--- AVAILABLE WARRIORS ---</div>`;
            html += `<div style="display:flex;justify-content:space-around;align-items:center">`;
            html += `<span style="font-size:28px">🧙</span>`;
            html += `<span style="font-size:28px">⚔️</span>`;
            html += `<span style="font-size:28px">💂</span>`;
            html += `<span style="font-size:28px">🏹</span>`;
            html += `</div></div>`;
            
            html += `<div class="shop-section">`;
            html += `<p>MERCENARIES HIRED: ${companions.length}/4</p>`;
            
            if (canHire) {
                html += `<div class="shop-item ${canAfford ? '' : 'disabled'}" onclick="${canAfford ? 'hireMercenary()' : ''}">`;
                html += `<span>HIRE MERCENARY</span>`;
                html += `<span class="price">${hireCost} MONEY</span>`;
                html += `</div>`;
            } else {
                html += `<div class="shop-item disabled">PARTY IS FULL!</div>`;
            }
            
            html += `</div>`;
            html += `<p style="font-size:9px;color:#94a3b8;margin-top:12px">MERCENARIES FIGHT BY YOUR SIDE!</p>`;
            html += `<button class="close-btn" onclick="exitShop()">LEAVE</button>`;
            shopPanel.innerHTML = html;
            shopPanel.classList.remove('hidden');
            dialogueOpen = true;
        }

        window.hireMercenary = function() {
            const hireCost = 200 * Math.pow(2, mercenaryHireCount);
            if (player.money >= hireCost && companions.length < 4) {
                player.money -= hireCost;
                mercenaryHireCount++;
                saveGame();
                
                // Create a companion
                const colors = ['#f97316', '#8b5cf6', '#ec4899', '#14b8a6'];
                const elementTypes = ['fire', 'lightning', 'ice', 'wind'];
                const companionIndex = companions.length;
                companions.push({
                    x: player.x - 50 - companionIndex * 40,
                    y: groundY() - 48,
                    w: 40,
                    h: 48,
                    vx: 0,
                    vy: 0,
                    color: colors[companionIndex % colors.length],
                    attackTimer: 0,
                    target: null,
                    facing: 1,
                    animTime: 0,
                    isWalking: false,
                    attacking: false,
                    element: elementTypes[companionIndex % elementTypes.length],
                    killCount: 0,
                    specialReady: false
                });
                
                updateHUD();
                showMercenaryShop(); // Refresh
            }
        };
        
        function showPotionShop() {
            let html = `<h2 style="color:#e91e63">POTION SHOP</h2>`;
            
            // Add visual potion shelves
            html += `<div style="background:#1e293b;padding:12px;margin-bottom:12px;border:2px solid #475569;text-align:center">`;
            html += `<div style="font-size:10px;color:#94a3b8;margin-bottom:8px">--- POTION SHELVES ---</div>`;
            html += `<div style="display:flex;justify-content:space-around;align-items:flex-end">`;
            html += `<span style="font-size:24px" title="Healing Potion">🧪</span>`;
            html += `<span style="font-size:24px" title="Shield Potion">🛡️</span>`;
            html += `<span style="font-size:24px" title="Strength Potion">💪</span>`;
            html += `<span style="font-size:24px" title="Speed Potion">💨</span>`;
            html += `<span style="font-size:24px" title="Vitality Potion">❤️</span>`;
            html += `</div></div>`;
            
            html += `<div class="shop-section">`;
            
            // Pouch upgrades
            if (player.maxPotionSlots < 5) {
                const pouchPrice = player.maxPotionSlots === 3 ? 150 : 300;
                const pouchName = player.maxPotionSlots === 3 ? 'MEDIUM POUCH' : 'LARGE POUCH';
                const nextSlots = player.maxPotionSlots + 1;
                const canAffordPouch = player.money >= pouchPrice;
                html += `<div class="shop-item ${canAffordPouch ? '' : 'disabled'}" onclick="${canAffordPouch ? 'buyPouch()' : ''}" style="background:#2d1b4e;border-color:#7c3aed">`;
                html += `<span>🎒 ${pouchName} (${nextSlots} SLOTS)</span>`;
                html += `<span class="price">${pouchPrice} MONEY</span>`;
                html += `</div>`;
            } else {
                html += `<div class="shop-item disabled" style="background:#1e3a2e;border-color:#22c55e">`;
                html += `<span>🎒 MAX CAPACITY REACHED!</span>`;
                html += `<span style="color:#22c55e">5 SLOTS</span>`;
                html += `</div>`;
            }
            
            Object.keys(POTIONS).forEach(potionType => {
                const potion = POTIONS[potionType];
                const canAfford = player.money >= potion.price;
                
                html += `<div class="shop-item ${canAfford ? '' : 'disabled'}" onclick="${canAfford ? `buyPotion('${potionType}')` : ''}">`;
                html += `<span>${potion.icon} ${potion.name}</span>`;
                html += `<span class="price">${potion.price} MONEY</span>`;
                html += `</div>`;
                html += `<p style="font-size:8px;color:#94a3b8;margin:2px 0 8px 0">${potion.description}</p>`;
            });
            
            html += `</div>`;
            html += `<p style="font-size:9px;color:#94a3b8;margin-top:12px">POTION SLOTS: ${player.maxPotionSlots}/5</p>`;
            html += `<p style="font-size:8px;color:#fbbf24;margin-top:8px">PRESS 1,2,3 TO USE POTIONS IN BATTLE!</p>`;
            html += `<button class="close-btn" onclick="exitShop()">LEAVE</button>`;
            shopPanel.innerHTML = html;
            shopPanel.classList.remove('hidden');
            dialogueOpen = true;
        }
        
        window.buyPouch = function() {
            const pouchPrice = player.maxPotionSlots === 3 ? 150 : 300;
            if (player.money >= pouchPrice && player.maxPotionSlots < 5) {
                player.money -= pouchPrice;
                player.maxPotionSlots++;
                saveGame();
                updateHUD();
                updatePotionSlotsUI();
                showPotionShop(); // Refresh
                effects.push({ type: 'pickup', x: player.x, y: player.y - 30, timer: 1.5, text: '+1 POTION SLOT!', color: '#7c3aed' });
            }
        };
        
        window.buyPotion = function(potionType) {
            const potion = POTIONS[potionType];
            if (player.money >= potion.price) {
                // Try to add to a slot
                const success = addPotionToSlot(potionType);
                if (success) {
                    player.money -= potion.price;
                    saveGame();
                    updateHUD();
                    showPotionShop(); // Refresh
                } else {
                    // Show message that slots are full
                    alert('YOUR POTION SLOTS ARE FULL!\n\nYou can only carry 3 potions at a time.\nUse a potion first to make room.');
                }
            }
        };
        
        function showTechStore() {
            let html = `<h2 style="color:#fbbf24">⚙️ TECH STORE ⚙️</h2>`;
            html += `<p style="color:#94a3b8;font-size:10px;margin-bottom:16px">ADVANCED EQUIPMENT FOR WARRIORS</p>`;
            
            html += `<div class="shop-section">`;
            
            // Jetpack
            const jetpackPrice = 5000;
            const canAffordJetpack = player.money >= jetpackPrice;
            const hasJetpack = player.hasJetpack;
            
            html += `<div class="shop-item ${hasJetpack ? 'disabled' : (canAffordJetpack ? '' : 'disabled')}" 
                     style="${hasJetpack ? 'background:#1e3a2e;border-color:#22c55e' : ''}" 
                     onclick="${hasJetpack ? '' : (canAffordJetpack ? 'purchaseJetpack()' : '')}">`;
            html += `<span>🚀 JETPACK ${hasJetpack ? '✔️' : ''}</span>`;
            html += `<span class="price">${hasJetpack ? 'OWNED' : jetpackPrice + ' MONEY'}</span>`;
            html += `</div>`;
            html += `<p style="font-size:8px;color:#94a3b8;margin:2px 0 12px 0">HOLD W IN AIR TO FLY! 7S FUEL (10S UPGRADED)</p>`;
            
            // Jetpack Upgrade (only show if jetpack owned and not yet upgraded)
            if (hasJetpack) {
                const upgradePrice = 8000;
                const canAffordUpgrade = player.money >= upgradePrice;
                const isUpgraded = player.jetpackUpgraded;
                
                html += `<div class="shop-item ${isUpgraded ? 'disabled' : (canAffordUpgrade ? '' : 'disabled')}" 
                         style="${isUpgraded ? 'background:#1e3a2e;border-color:#22c55e' : ''}" 
                         onclick="${isUpgraded ? '' : (canAffordUpgrade ? 'purchaseJetpackUpgrade()' : '')}">`;
                html += `<span>🔧 JETPACK UPGRADE ${isUpgraded ? '✔️' : ''}</span>`;
                html += `<span class="price">${isUpgraded ? 'MAX' : upgradePrice + ' MONEY'}</span>`;
                html += `</div>`;
                html += `<p style="font-size:8px;color:#94a3b8;margin:2px 0 12px 0">EXTENDS FUEL TO 10 SECONDS!</p>`;
            }
            
            // Force Field
            const forceFieldPrices = [3000, 7000, 0];
            const forceFieldNames = ['FORCE FIELD', 'FORCE FIELD LV2', 'FORCE FIELD LV3'];
            const forceFieldHP = [5, 10, 20];
            
            for (let i = 1; i <= 3; i++) {
                const isOwned = player.forceFieldLevel >= i;
                const canBuy = player.forceFieldLevel === i - 1;
                const price = forceFieldPrices[i - 1];
                const canAfford = player.money >= price;
                const isMaxLevel = i === 3 && isOwned;
                
                html += `<div class="shop-item ${isOwned ? 'disabled' : (canBuy && canAfford ? '' : 'disabled')}" 
                         style="${isOwned ? 'background:#1e3a2e;border-color:#22c55e' : ''}" 
                         onclick="${isOwned ? '' : (canBuy && canAfford ? 'purchaseForceFieldUpgrade()' : '')}">`;
                html += `<span>🛡️ ${forceFieldNames[i - 1]} ${isOwned ? '✔️' : ''}</span>`;
                html += `<span class="price">${isOwned ? 'OWNED' : price + ' MONEY'}</span>`;
                html += `</div>`;
                html += `<p style="font-size:8px;color:#94a3b8;margin:2px 0 12px 0">ABSORBS ${forceFieldHP[i - 1]}HP DAMAGE | RESPAWNS AFTER 10S</p>`;
            }
            
            html += `</div>`;
            html += `<p style="font-size:9px;color:#fbbf24;margin-top:16px">💡 TIP: FORCE FIELD BLOCKS DAMAGE AUTOMATICALLY!</p>`;
            html += `<button class="close-btn" onclick="exitShop()">LEAVE</button>`;
            shopPanel.innerHTML = html;
            shopPanel.classList.remove('hidden');
            dialogueOpen = true;
        }
        
        function usePotion(potionType) {
            if (player.potions[potionType] <= 0) return false;
            
            player.potions[potionType]--;
            
            switch(potionType) {
                case 'healing':
                    player.hp = Math.min(player.hp + 15, player.maxHp);
                    effects.push({ type: 'pickup', x: player.x, y: player.y - 20, timer: 1, text: '+15 HP', color: '#ef4444' });
                    break;
                    
                case 'shield':
                    player.potionEffects.shield.active = true;
                    player.potionEffects.shield.timer = 30;
                    player.potionEffects.shield.strength = 0.6;
                    effects.push({ type: 'pickup', x: player.x, y: player.y - 20, timer: 1, text: 'SHIELD ACTIVE!', color: '#3b82f6' });
                    break;
                    
                case 'damage':
                    player.potionEffects.damage.active = true;
                    player.potionEffects.damage.timer = 45;
                    player.potionEffects.damage.multiplier = 2;
                    effects.push({ type: 'pickup', x: player.x, y: player.y - 20, timer: 1, text: '2X DAMAGE!', color: '#f59e0b' });
                    break;
                    
                case 'speed':
                    player.potionEffects.speed.active = true;
                    player.potionEffects.speed.timer = 40;
                    player.potionEffects.speed.multiplier = 1.5;
                    effects.push({ type: 'pickup', x: player.x, y: player.y - 20, timer: 1, text: 'SPEED BOOST!', color: '#10b981' });
                    break;
                    
                case 'extraHealth':
                    const tempHp = player.maxHp + 10;
                    player.hp = tempHp;
                    player.maxHp = tempHp;
                    effects.push({ type: 'pickup', x: player.x, y: player.y - 20, timer: 1, text: 'VITALITY!', color: '#ec4899' });
                    // Temp health wears off after 60 seconds
                    setTimeout(() => {
                        player.maxHp -= 10;
                        player.hp = Math.min(player.hp, player.maxHp);
                        updateHUD();
                    }, 60000);
                    break;
            }
            
            updateHUD();
            return true;
        }

        // === POTION SLOT SYSTEM ===
        function addPotionToSlot(potionType) {
            // Find first empty slot within max limit
            for (let i = 0; i < player.maxPotionSlots; i++) {
                if (i >= player.potionSlots.length) {
                    player.potionSlots.push(potionType);
                    updatePotionSlotsUI();
                    return true;
                }
                if (player.potionSlots[i] === null) {
                    player.potionSlots[i] = potionType;
                    updatePotionSlotsUI();
                    return true;
                }
            }
            // All slots full - only show message if enough time has passed (1 second cooldown)
            const now = Date.now();
            if (now - lastSlotFullMessage > 1000) {
                effects.push({ type: 'pickup', x: player.x, y: player.y - 20, timer: 1, text: 'SLOTS FULL!', color: '#ef4444' });
                lastSlotFullMessage = now;
            }
            return false;
        }

        function usePotionSlot(slotIndex) {
            if (slotIndex < 0 || slotIndex >= player.potionSlots.length) return;
            const potionType = player.potionSlots[slotIndex];
            if (!potionType) return;
            
            // Use the potion
            switch(potionType) {
                case 'healing':
                    player.hp = Math.min(player.hp + 15, player.maxHp);
                    effects.push({ type: 'pickup', x: player.x, y: player.y - 20, timer: 1, text: '+15 HP', color: '#ef4444' });
                    break;
                    
                case 'shield':
                    player.potionEffects.shield.active = true;
                    player.potionEffects.shield.timer = 30;
                    player.potionEffects.shield.strength = 0.6;
                    effects.push({ type: 'pickup', x: player.x, y: player.y - 20, timer: 1, text: 'SHIELD ACTIVE!', color: '#3b82f6' });
                    break;
                    
                case 'damage':
                    player.potionEffects.damage.active = true;
                    player.potionEffects.damage.timer = 45;
                    player.potionEffects.damage.multiplier = 2;
                    effects.push({ type: 'pickup', x: player.x, y: player.y - 20, timer: 1, text: '2X DAMAGE!', color: '#f59e0b' });
                    break;
                    
                case 'speed':
                    player.potionEffects.speed.active = true;
                    player.potionEffects.speed.timer = 40;
                    player.potionEffects.speed.multiplier = 1.5;
                    effects.push({ type: 'pickup', x: player.x, y: player.y - 20, timer: 1, text: 'SPEED BOOST!', color: '#10b981' });
                    break;
                    
                case 'extraHealth':
                    const tempHp = player.maxHp + 10;
                    player.hp = tempHp;
                    player.maxHp = tempHp;
                    effects.push({ type: 'pickup', x: player.x, y: player.y - 20, timer: 1, text: 'VITALITY!', color: '#ec4899' });
                    setTimeout(() => {
                        player.maxHp -= 10;
                        player.hp = Math.min(player.hp, player.maxHp);
                        updateHUD();
                    }, 60000);
                    break;
            }
            
            // Remove potion from slot
            player.potionSlots[slotIndex] = null;
            updatePotionSlotsUI();
            updateHUD();
            saveGame();
        }

        function updatePotionSlotsUI() {
            potionSlotDivs.forEach((slotDiv, index) => {
                // Show/hide slots based on maxPotionSlots
                if (index >= player.maxPotionSlots) {
                    slotDiv.style.display = 'none';
                    return;
                }
                slotDiv.style.display = 'flex';
                
                const potionType = player.potionSlots[index];
                if (potionType && POTIONS[potionType]) {
                    // Show potion icon
                    slotDiv.innerHTML = `<div style="font-size:28px">${POTIONS[potionType].icon}</div><div class="key-hint">${index + 1}</div>`;
                    slotDiv.classList.remove('empty');
                    slotDiv.style.borderColor = POTIONS[potionType].color;
                } else {
                    // Show empty dot
                    slotDiv.innerHTML = `<div class="dot"></div><div class="key-hint">${index + 1}</div>`;
                    slotDiv.classList.add('empty');
                    slotDiv.style.borderColor = '#475569';
                }
            });
        }

        // Add click handlers for potion slots
        potionSlotDivs.forEach((slotDiv, index) => {
            slotDiv.addEventListener('click', () => {
                if (!player.potionSlots[index]) return;
                usePotionSlot(index);
            });
        });

        function handleShopChoice(choice) {
            if (choice === 'BYE') {
                exitShop();
                return;
            }
            if (choice === 'UPGRADE SWORD') {
                showUpgradePanel('sword');
                return;
            }
            if (choice === 'UPGRADE SHIELD') {
                showUpgradePanel('shield');
                return;
            }
            if (choice === 'UPGRADE ARMOR') {
                showUpgradePanel('armor');
                return;
            }
            if (choice === 'UPGRADE HELMET') {
                showUpgradePanel('helmet');
                return;
            }
            // Material purchase
            const material = choice.toLowerCase();
            if (MATERIALS.includes(material)) {
                showMaterialPurchase(material);
            }
        }

        function showMaterialPurchase(material) {
            const price = MATERIAL_PRICES[material] || 0;
            const canAfford = player.money >= price;
            const matColor = MATERIAL_COLORS[material];
            
            let itemType = shopNPC.shopType === 'weapon' ? 'SWORD' : 'SHIELD/ARMOR/HELMET';
            
            let html = `<h2 style="color:${matColor}">${material.toUpperCase()} ${itemType}</h2>`;
            
            // Add visual equipment display
            if (shopNPC.shopType === 'weapon') {
                html += `<div style="background:#1e293b;padding:12px;margin-bottom:12px;border:2px solid #475569;text-align:center">`;
                html += `<div style="font-size:10px;color:#94a3b8;margin-bottom:8px">--- WEAPON RACK ---</div>`;
                html += `<div style="display:flex;justify-content:space-around;align-items:center">`;
                html += `<span style="font-size:28px">🗡️</span>`;
                html += `<span style="font-size:28px">⚔️</span>`;
                html += `<span style="font-size:28px">🏹</span>`;
                html += `<span style="font-size:28px">🪓</span>`;
                html += `</div></div>`;
            } else {
                html += `<div style="background:#1e293b;padding:12px;margin-bottom:12px;border:2px solid #475569;text-align:center">`;
                html += `<div style="font-size:10px;color:#94a3b8;margin-bottom:8px">--- ARMOR DISPLAY ---</div>`;
                html += `<div style="display:flex;justify-content:space-around;align-items:center">`;
                html += `<span style="font-size:28px">🛡️</span>`;
                html += `<span style="font-size:28px">🦺</span>`;
                html += `<span style="font-size:28px">⛑️</span>`;
                html += `<span style="font-size:28px">👑</span>`;
                html += `</div></div>`;
            }
            
            html += `<div class="shop-section">`;
            
            if (shopNPC.shopType === 'weapon') {
                const hasSword = player.swordMaterial === material;
                if (hasSword) {
                    html += `<div class="shop-item disabled">YOU ALREADY HAVE THIS SWORD</div>`;
                } else {
                    html += `<div class="shop-item ${canAfford ? '' : 'disabled'}" onclick="${canAfford ? `buyItem('sword','${material}')` : ''}">`;
                    html += `<span>${material.toUpperCase()} SWORD</span>`;
                    html += `<span class="price">${price} MONEY</span>`;
                    html += `</div>`;
                }
                
                // Add special bows
                html += `</div><h3 style="color:#f59e0b;margin-top:16px">SPECIAL BOWS</h3><div class="shop-section">`;
                
                Object.keys(BOW_TYPES).forEach(bowType => {
                    if (bowType === 'basic') return; // Skip basic bow
                    const bowData = BOW_TYPES[bowType];
                    const hasBow = player.bowType === bowType;
                    const canAffordBow = player.money >= bowData.price;
                    
                    html += `<div class="shop-item ${canAffordBow && !hasBow ? '' : 'disabled'}" onclick="${canAffordBow && !hasBow ? `buyBow('${bowType}')` : ''}">`;
                    html += `<span>${bowData.icon} ${bowData.name}${hasBow ? ' (OWNED)' : ''}</span>`;
                    html += `<span class="price">${bowData.price} MONEY</span>`;
                    html += `</div>`;
                    html += `<p style="font-size:9px;color:#64748b;margin:4px 0">${bowData.description}</p>`;
                });
                
                // Add arrow types
                html += `</div><h3 style="color:#06b6d4;margin-top:16px">ARROW TYPES</h3><div class="shop-section">`;
                
                Object.keys(ARROW_TYPES).forEach(arrowType => {
                    if (arrowType === 'basic') return; // Skip basic arrows
                    const arrowData = ARROW_TYPES[arrowType];
                    const hasArrowType = player.arrowType === arrowType;
                    // Arrow types cost based on their power
                    const arrowPrice = arrowType === 'steel' ? 300 : arrowType === 'diamond' ? 800 : 1200;
                    const canAffordArrows = player.money >= arrowPrice;
                    
                    html += `<div class="shop-item ${canAffordArrows && !hasArrowType ? '' : 'disabled'}" onclick="${canAffordArrows && !hasArrowType ? `buyArrowType('${arrowType}')` : ''}">`;
                    html += `<span>🏹 ${arrowData.name}${hasArrowType ? ' (OWNED)' : ''}</span>`;
                    html += `<span class="price">${arrowPrice} MONEY</span>`;
                    html += `</div>`;
                    html += `<p style="font-size:9px;color:#64748b;margin:4px 0">${arrowData.description}</p>`;
                });
                
                // Add arrow bundles
                html += `</div><h3 style="color:#3b82f6;margin-top:16px">ARROW BUNDLES</h3><div class="shop-section">`;
                
                const arrow1Price = 2;
                const arrow5Price = 8;
                const arrow10Price = 15;
                
                html += `<div class="shop-item ${player.money >= arrow1Price ? '' : 'disabled'}" onclick="${player.money >= arrow1Price ? 'buyArrows(1)' : ''}">`;
                html += `<span>🏹 1 ARROW</span>`;
                html += `<span class="price">${arrow1Price} MONEY</span>`;
                html += `</div>`;
                
                html += `<div class="shop-item ${player.money >= arrow5Price ? '' : 'disabled'}" onclick="${player.money >= arrow5Price ? 'buyArrows(5)' : ''}">`;
                html += `<span>🏹 5 ARROWS</span>`;
                html += `<span class="price">${arrow5Price} MONEY</span>`;
                html += `</div>`;
                
                html += `<div class="shop-item ${player.money >= arrow10Price ? '' : 'disabled'}" onclick="${player.money >= arrow10Price ? 'buyArrows(10)' : ''}">`;
                html += `<span>🏹 10 ARROWS</span>`;
                html += `<span class="price">${arrow10Price} MONEY</span>`;
                html += `</div>`;
            } else {
                // Shield
                const hasShield = player.shieldMaterial === material;
                html += `<div class="shop-item ${canAfford && !hasShield ? '' : 'disabled'}" onclick="${canAfford && !hasShield ? `buyItem('shield','${material}')` : ''}">`;
                html += `<span>${material.toUpperCase()} SHIELD${hasShield ? ' (OWNED)' : ''}</span>`;
                html += `<span class="price">${price} MONEY</span>`;
                html += `</div>`;
                
                // Armor
                const hasArmor = player.armorMaterial === material;
                const armorPrice = Math.floor(price * 1.5);
                const canAffordArmor = player.money >= armorPrice;
                html += `<div class="shop-item ${canAffordArmor && !hasArmor ? '' : 'disabled'}" onclick="${canAffordArmor && !hasArmor ? `buyItem('armor','${material}')` : ''}">`;
                html += `<span>${material.toUpperCase()} ARMOR${hasArmor ? ' (OWNED)' : ''}</span>`;
                html += `<span class="price">${armorPrice} MONEY</span>`;
                html += `</div>`;
                
                // Helmet
                const hasHelmet = player.helmetMaterial === material;
                const helmetPrice = Math.floor(price * 1.2);
                const canAffordHelmet = player.money >= helmetPrice;
                html += `<div class="shop-item ${canAffordHelmet && !hasHelmet ? '' : 'disabled'}" onclick="${canAffordHelmet && !hasHelmet ? `buyItem('helmet','${material}')` : ''}">`;
                html += `<span>${material.toUpperCase()} HELMET${hasHelmet ? ' (OWNED)' : ''}</span>`;
                html += `<span class="price">${helmetPrice} MONEY</span>`;
                html += `</div>`;
                html += `<p style="font-size:9px;color:#94a3b8;margin-top:8px">⛑️ HELMETS PROTECT FROM AERIAL ATTACKS!</p>`;
            }
            
            html += `</div>`;
            html += `<button class="close-btn" onclick="closeShopPanel()">BACK</button>`;
            shopPanel.innerHTML = html;
            shopPanel.classList.remove('hidden');
        }

        function showUpgradePanel(type) {
            const currentLevel = type === 'sword' ? player.swordLevel : (type === 'shield' ? player.shieldLevel : (type === 'armor' ? player.armorLevel : player.helmetLevel));
            const currentMat = type === 'sword' ? player.swordMaterial : (type === 'shield' ? player.shieldMaterial : (type === 'armor' ? player.armorMaterial : player.helmetMaterial));
            const maxLevel = 20;
            
            if (!currentMat && type !== 'sword') {
                let html = `<h2>NO ${type.toUpperCase()} EQUIPPED</h2>`;
                html += `<p style="margin:16px 0">You need to buy a ${type} first!</p>`;
                html += `<button class="close-btn" onclick="closeShopPanel()">BACK</button>`;
                shopPanel.innerHTML = html;
                shopPanel.classList.remove('hidden');
                return;
            }
            
            const upgradeCost = 20 + currentLevel * 15; // Increases with level
            const canAfford = player.money >= upgradeCost;
            const canUpgrade = currentLevel < maxLevel;
            
            let html = `<h2>UPGRADE ${type.toUpperCase()}</h2>`;
            html += `<div class="shop-section">`;
            html += `<p>Current: ${(currentMat || 'none').toUpperCase()} Lv${currentLevel}</p>`;
            
            if (canUpgrade) {
                html += `<div class="shop-item ${canAfford ? '' : 'disabled'}" onclick="${canAfford ? `upgradeItem('${type}')` : ''}">`;
                html += `<span>LEVEL UP TO Lv${currentLevel + 1}</span>`;
                html += `<span class="price">${upgradeCost} MONEY</span>`;
                html += `</div>`;
            } else {
                html += `<div class="shop-item disabled">MAX LEVEL REACHED!</div>`;
            }
            
            html += `</div>`;
            html += `<button class="close-btn" onclick="closeShopPanel()">BACK</button>`;
            shopPanel.innerHTML = html;
            shopPanel.classList.remove('hidden');
        }

        window.buyArrows = function(amount) {
            const prices = { 1: 2, 5: 8, 10: 15 };
            const price = prices[amount];
            
            if (player.money >= price) {
                player.money -= price;
                player.arrows += amount;
                saveGame();
                updateHUD();
                // Refresh the shop display
                const currentMaterial = player.swordMaterial || 'wooden';
                showMaterialPurchase(currentMaterial);
            }
        };
        
        window.buyBow = function(bowType) {
            const bowData = BOW_TYPES[bowType];
            if (player.money >= bowData.price) {
                player.money -= bowData.price;
                player.bowType = bowType;
                saveGame();
                updateHUD();
                effects.push({ type: 'pickup', x: player.x, y: player.y - 30, timer: 1.5, text: 'BOW UPGRADED!', color: bowData.color });
                // Refresh the shop display
                const currentMaterial = player.swordMaterial || 'wooden';
                showMaterialPurchase(currentMaterial);
            }
        };
        
        window.buyArrowType = function(arrowType) {
            const arrowData = ARROW_TYPES[arrowType];
            const prices = { steel: 300, diamond: 800, explosive: 1200 };
            const price = prices[arrowType];
            
            if (player.money >= price) {
                player.money -= price;
                player.arrowType = arrowType;
                saveGame();
                updateHUD();
                effects.push({ type: 'pickup', x: player.x, y: player.y - 30, timer: 1.5, text: 'ARROWS UPGRADED!', color: arrowData.color });
                // Refresh the shop display
                const currentMaterial = player.swordMaterial || 'wooden';
                showMaterialPurchase(currentMaterial);
            }
        };
        
        window.buyItem = function(type, material) {
            const price = MATERIAL_PRICES[material] || 0;
            const actualPrice = type === 'armor' ? Math.floor(price * 1.5) : (type === 'helmet' ? Math.floor(price * 1.2) : price);
            
            if (player.money >= actualPrice) {
                player.money -= actualPrice;
                saveGame();
                if (type === 'sword') {
                    player.swordMaterial = material;
                    player.swordLevel = 1; // Reset level when changing material
                } else if (type === 'shield') {
                    player.shieldMaterial = material;
                    player.shieldLevel = 1;
                } else if (type === 'armor') {
                    player.armorMaterial = material;
                    player.armorLevel = 1;
                    // Armor adds max HP based on material
                    const hpBonus = (MATERIALS.indexOf(material) + 1) * 5;
                    player.maxHp = player.baseMaxHp + hpBonus;
                    player.hp = Math.min(player.hp + hpBonus, player.maxHp);
                } else if (type === 'helmet') {
                    player.helmetMaterial = material;
                    player.helmetLevel = 1;
                    // Helmet adds 3 max HP based on material
                    const hpBonus = (MATERIALS.indexOf(material) + 1) * 3;
                    player.maxHp = player.baseMaxHp + hpBonus;
                    player.hp = Math.min(player.hp + hpBonus, player.maxHp);
                }
                updateHUD();
                closeShopPanel();
                openShopDialogue(shopNPC); // Return to main shop
            }
        };

        window.upgradeItem = function(type) {
            const currentLevel = type === 'sword' ? player.swordLevel : (type === 'shield' ? player.shieldLevel : (type === 'armor' ? player.armorLevel : player.helmetLevel));
            const upgradeCost = 20 + currentLevel * 15;
            
            if (player.money >= upgradeCost && currentLevel < 20) {
                player.money -= upgradeCost;
                saveGame();
                if (type === 'sword') player.swordLevel++;
                else if (type === 'shield') player.shieldLevel++;
                else if (type === 'armor') {
                    player.armorLevel++;
                    // Each armor level adds 1 max HP
                    player.maxHp++;
                    player.hp = Math.min(player.hp + 1, player.maxHp);
                } else if (type === 'helmet') {
                    player.helmetLevel++;
                    // Each helmet level adds 0.5 max HP (rounded down each other level)
                    if (player.helmetLevel % 2 === 0) {
                        player.maxHp++;
                        player.hp = Math.min(player.hp + 1, player.maxHp);
                    }
                }
                updateHUD();
                showUpgradePanel(type); // Refresh panel
            }
        };

        function closeShopPanel() {
            shopPanel.classList.add('hidden');
        }

        function closeShopDialogue() {
            shopDialogue.classList.add('hidden');
            shopNPC = null;
            dialogueOpen = false;
        }
