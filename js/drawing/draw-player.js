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
