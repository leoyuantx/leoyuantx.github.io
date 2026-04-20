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
