// Shop System: data, 3D-look preview renderer, shop UI
import G from './globals.js';
import { applyActiveEffect, saveShopData } from './effects.js';

// ---- Shop Items ----
export const SHOP_ITEMS = [
  { id: 'golden_ball', name: 'Golden Ball', desc: 'Your ball gleams with pure gold', price: 75 },
  { id: 'crystal_ball', name: 'Crystal Ball', desc: 'Translucent crystal ball with inner glow', price: 150 },
  { id: 'marble_ball', name: 'Marble Ball', desc: 'Swirling stone marble texture', price: 40 },
  { id: 'ice_ball', name: 'Ice Ball', desc: 'Frosted ice ball that sparkles', price: 90 },
  { id: 'lava_ball', name: 'Lava Ball', desc: 'Cracked surface with molten glow', price: 110 },
  { id: 'bubble_ball', name: 'Bubble Ball', desc: 'Iridescent soap bubble ball', price: 130 },
  { id: 'sunset_ball', name: 'Sunset Ball', desc: 'Amber and rose tones like dusk', price: 65 },
  { id: 'emerald_ball', name: 'Emerald Ball', desc: 'Rich green sheen with soft glow', price: 80 },
  { id: 'moonstone_ball', name: 'Moonstone Ball', desc: 'Pale opal shimmer with cool highlights', price: 95 },
  { id: 'citrus_ball', name: 'Citrus Ball', desc: 'Bright orange-yellow energy with a fresh shine', price: 55 },
  { id: 'obsidian_ball', name: 'Obsidian Ball', desc: 'Dark volcanic glass with a subtle ember glow', price: 140 },
  { id: 'pearl_ball', name: 'Pearl Ball', desc: 'Soft pearly sheen with rainbow reflections', price: 85 },
  { id: 'coral_ball', name: 'Coral Ball', desc: 'Warm coral tones with a glossy finish', price: 70 },
  { id: 'rainbow_trail', name: 'Rainbow Trail', desc: 'Ball trail shimmers in rainbow colors', price: 50 },
  { id: 'comet_trail', name: 'Comet Trail', desc: 'Fiery orange trail at high speed', price: 120 },
  { id: 'snowflake_trail', name: 'Snow Trail', desc: 'Icy crystals scatter behind', price: 65 },
  { id: 'sakura_trail', name: 'Sakura Trail', desc: 'Drifting cherry blossom petals', price: 80 },
  { id: 'electric_trail', name: 'Electric Trail', desc: 'Crackling lightning sparks', price: 95 },
  { id: 'ember_trail', name: 'Ember Trail', desc: 'Glowing embers drift and fade', price: 70 },
  { id: 'stardust_aura', name: 'Stardust Aura', desc: 'Sparkling particles orbit the ball', price: 100 },
  { id: 'neon_glow', name: 'Neon Glow', desc: 'Ball casts a soft neon light below', price: 60 },
  { id: 'pulse_glow', name: 'Pulse Glow', desc: 'Rhythmic pulsing purple aura', price: 70 },
  { id: 'firefly_aura', name: 'Firefly Aura', desc: 'Tiny fireflies circle the ball', price: 85 },
  { id: 'music_notes', name: 'Music Notes', desc: 'Musical notes float around the ball', price: 55 },
  { id: 'heart_aura', name: 'Heart Aura', desc: 'Tiny hearts orbit the ball', price: 45 },
  { id: 'sun_glow', name: 'Sun Glow', desc: 'Warm amber light radiates outward', price: 75 },
];

export const EXCLUSIVE_SHOP_ITEMS = [
  { id: 'aurora_trail', name: 'Aurora Trail', desc: 'Northern lights shimmer behind the ball', price: 2, exclusive: true },
  { id: 'galaxy_ball', name: 'Galaxy Ball', desc: 'A swirling galaxy trapped inside the ball', price: 3, exclusive: true },
  { id: 'eclipse_ball', name: 'Eclipse Ball', desc: 'Dark ball with a blazing corona', price: 4, exclusive: true },
  { id: 'phoenix_trail', name: 'Phoenix Trail', desc: 'Majestic flame wings trail behind', price: 5, exclusive: true },
  { id: 'void_ball', name: 'Void Ball', desc: 'Ball warps space around it', price: 3, exclusive: true },
  { id: 'prism_trail', name: 'Prism Trail', desc: 'Geometric light fragments scatter', price: 4, exclusive: true },
  { id: 'lightning_ball', name: 'Lightning Ball', desc: 'Crackling energy ball with arcs', price: 5, exclusive: true },
  { id: 'celestial_aura', name: 'Celestial Aura', desc: 'Orbiting stars and moons', price: 6, exclusive: true },
  { id: 'dragon_trail', name: 'Dragon Trail', desc: 'Mythic dragon fire and scales', price: 7, exclusive: true },
  { id: 'diamond_ball', name: 'Diamond Ball', desc: 'Prismatic diamond with light refractions', price: 8, exclusive: true },
  { id: 'nebula_ball', name: 'Nebula Ball', desc: 'Clouds of color swirl under the surface', price: 4, exclusive: true },
  { id: 'royal_trail', name: 'Royal Trail', desc: 'Deep blue and gold particles drift behind', price: 5, exclusive: true },
  { id: 'holo_ball', name: 'Holo Ball', desc: 'A translucent holographic ball with neon shimmer', price: 6, exclusive: true },
  { id: 'starfield_ball', name: 'Starfield Ball', desc: 'Tiny stars drift across a deep space surface', price: 6, exclusive: true },
  { id: 'aurora_ball', name: 'Aurora Ball', desc: 'Soft waves of green and blue light ripple inside', price: 7, exclusive: true },
  { id: 'silver_trail', name: 'Silver Trail', desc: 'Clean silver sparks stream behind the ball', price: 4, exclusive: true },
];

// ---- Preview Configs ----
const PREVIEW_SIZE = 320;

export const PREVIEW_CONFIGS = {
  golden_ball:     { ball: '#c8941a', hi: '#fff8cc', glow: '#996600', ring: '#ffcc33' },
  crystal_ball:    { ball: '#7aadcc', hi: '#edf8ff', glow: '#2e6b99', alpha: 0.7, ring: '#4da6cc' },
  marble_ball:     { ball: '#697a7a', hi: '#c0cccc', glow: '#2e3d3d', ring: '#556666' },
  ice_ball:        { ball: '#55aaee', hi: '#d8efff', glow: '#1a66aa', alpha: 0.75, ring: '#3399dd' },
  lava_ball:       { ball: '#991500', hi: '#ff8844', glow: '#ee2200', ring: '#ff5500' },
  bubble_ball:     { ball: '#99bbdd', hi: '#ffffff', glow: '#5588aa', alpha: 0.32, ring: '#77aacc' },
  sunset_ball:     { ball: '#cc6644', hi: '#fff0cc', glow: '#994422', ring: '#ff9966' },
  emerald_ball:    { ball: '#2f7a4b', hi: '#eaffee', glow: '#145a34', ring: '#63cc8a' },
  moonstone_ball:  { ball: '#b7c6da', hi: '#ffffff', glow: '#6b7c99', alpha: 0.82, ring: '#dbe7f7' },
  citrus_ball:     { ball: '#ffb13b', hi: '#fff6d2', glow: '#cc7a00', ring: '#ffd25c' },
  obsidian_ball:   { ball: '#120f16', hi: '#5a445e', glow: '#ff6a1a', ring: '#aa5533' },
  pearl_ball:      { ball: '#f2efe9', hi: '#ffffff', glow: '#a8b8d8', alpha: 0.9, ring: '#dfe5f2' },
  coral_ball:      { ball: '#ee8d76', hi: '#fff0ea', glow: '#bb5e46', ring: '#ffb1a0' },
  galaxy_ball:     { ball: '#0a0020', hi: '#8866ee', glow: '#2a0088', ring: '#6633dd' },
  eclipse_ball:    { ball: '#080808', hi: '#664433', glow: '#cc2800', ring: '#ee4400' },
  void_ball:       { ball: '#030310', hi: '#221155', glow: '#440099', ring: '#6600cc' },
  lightning_ball:  { ball: '#7799dd', hi: '#eef5ff', glow: '#2255cc', ring: '#3377ee' },
  diamond_ball:    { ball: '#bbbcdd', hi: '#ffffff', glow: '#7788cc', alpha: 0.8, ring: '#99aaee' },
  rainbow_trail:   { ball: '#ddd8e8', hi: '#ffffff', glow: '#998899', trail: ['#ee2233','#ff8811','#ffdd22','#11dd55','#1188ff','#7722ee'], ring: '#9977aa' },
  comet_trail:     { ball: '#e8ddd4', hi: '#ffffff', glow: '#aa8866', trail: ['#ff8822','#ff5511','#ee3300','#bb1100','#882200'], ring: '#cc7744' },
  snowflake_trail: { ball: '#d4e4f0', hi: '#ffffff', glow: '#6699bb', trail: ['#aaddff','#77ccff','#44aaff','#2299ee'], ring: '#5599cc' },
  sakura_trail:    { ball: '#f0dce4', hi: '#ffffff', glow: '#aa6688', trail: ['#ffaacc','#ff88bb','#ff55aa','#ee3399'], ring: '#dd6699' },
  electric_trail:  { ball: '#d4e0f0', hi: '#ffffff', glow: '#5588bb', trail: ['#2299ff','#44bbff','#66ddff','#2299ff'], ring: '#3399ee' },
  ember_trail:     { ball: '#e8d8cc', hi: '#ffffff', glow: '#aa6633', trail: ['#ff8833','#ff5500','#dd3300','#bb2200'], ring: '#ee6622' },
  aurora_trail:    { ball: '#d4e8e0', hi: '#ffffff', glow: '#448866', trail: ['#22ee88','#22aaff','#5544ff','#aa22ff'], ring: '#44aa77' },
  phoenix_trail:   { ball: '#f0dcc8', hi: '#ffffff', glow: '#bb7733', trail: ['#ffcc00','#ff9900','#ff5500','#ff2200','#cc0000'], ring: '#ff8800' },
  prism_trail:     { ball: '#e0d8ec', hi: '#ffffff', glow: '#887799', trail: ['#ee22ee','#22eeff','#eeff22','#ff0088','#0088ff'], ring: '#aa66cc' },
  dragon_trail:    { ball: '#e8d4c8', hi: '#ffffff', glow: '#aa5533', trail: ['#ff5500','#ff7700','#ffbb00','#ff3300','#cc0000'], ring: '#ee5522' },
  stardust_aura:   { ball: '#e8e4d0', hi: '#ffffff', glow: '#aa9944', aura: ['#ffee88','#ffcc44','#ffaa22'], ring: '#ddbb44' },
  neon_glow:       { ball: '#dcd0e8', hi: '#ffffff', glow: '#7744aa', ring: '#bb55ff' },
  pulse_glow:      { ball: '#dccce8', hi: '#ffffff', glow: '#6622aa', ring: '#9933ff' },
  firefly_aura:    { ball: '#dce8d0', hi: '#ffffff', glow: '#668833', aura: ['#ccff44','#aaee22','#88cc00'], ring: '#88bb22' },
  music_notes:     { ball: '#e4d8e8', hi: '#ffffff', glow: '#886688', aura: ['#ff66aa','#66aaff','#ffcc44'], ring: '#cc77aa' },
  heart_aura:      { ball: '#f0d0dc', hi: '#ffffff', glow: '#aa3366', aura: ['#ff3388','#ff55aa','#ff88cc'], ring: '#ee4488' },
  celestial_aura:  { ball: '#e8e0d0', hi: '#ffffff', glow: '#887744', aura: ['#ffd700','#88aaff','#ffee88'], ring: '#ccaa33' },
  sun_glow:        { ball: '#e8a14f', hi: '#fff6d6', glow: '#cc6f1f', ring: '#ffbc66' },
  nebula_ball:     { ball: '#2d1a4f', hi: '#ffd6ff', glow: '#7b3cff', ring: '#b86cff' },
  royal_trail:     { ball: '#1a2a5a', hi: '#ffffff', glow: '#ffd24d', trail: ['#ffe066','#5ad1ff','#9c7dff','#ffd24d'], ring: '#8aa8ff' },
  holo_ball:       { ball: '#3ee3ff', hi: '#ffffff', glow: '#7a4dff', alpha: 0.55, ring: '#74ffff' },
  starfield_ball:  { ball: '#0a1127', hi: '#ffffff', glow: '#5fb5ff', ring: '#8ec8ff' },
  aurora_ball:     { ball: '#1d7c63', hi: '#f0fffb', glow: '#4ee0b2', aura: ['#58ffd0','#49c7ff','#7b8cff'], ring: '#67e2c0' },
  silver_trail:    { ball: '#e8eef6', hi: '#ffffff', glow: '#94a3b8', trail: ['#f7fbff','#e5edf7','#cfd9e8','#aebed1'], ring: '#ced8e6' },
};

// ---- Color Helpers ----
function _hexRgb(hex) {
  const m = hex.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  return m ? [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)] : [200,200,200];
}
export { _hexRgb };
function _rgba(hex, a) { const [r,g,b] = _hexRgb(hex); return `rgba(${r},${g},${b},${a})`; }
function _darken(hex, f) { const [r,g,b] = _hexRgb(hex); return `rgb(${(r*f)|0},${(g*f)|0},${(b*f)|0})`; }
function _lighten(hex, f) { const [r,g,b] = _hexRgb(hex); return `rgb(${Math.min(255,(r+(255-r)*f))|0},${Math.min(255,(g+(255-g)*f))|0},${Math.min(255,(b+(255-b)*f))|0})`; }

// ---- Preview Animation ----
const _shopPreviews = [];
let _shopAnimating = false;

function renderPreview(itemId) {
  const S = PREVIEW_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = S; canvas.height = S;
  const phase = (itemId.charCodeAt(0) + itemId.length * 37) % 100 / 100 * Math.PI * 2;
  _shopPreviews.push({ canvas, itemId, phase });
  _drawPreview(canvas, itemId, phase);
  return canvas;
}

function _startShopAnim() {
  if (_shopAnimating) return;
  _shopAnimating = true;
  _tickShopPreviews();
}
function _stopShopAnim() {
  _shopAnimating = false;
  _shopPreviews.length = 0;
}
function _tickShopPreviews() {
  if (!_shopAnimating) return;
  const t = performance.now() * 0.001;
  for (const p of _shopPreviews) {
    _drawPreview(p.canvas, p.itemId, t * 0.25 + p.phase);
  }
  requestAnimationFrame(_tickShopPreviews);
}

function _drawPreview(canvas, itemId, t) {
  const cfg = PREVIEW_CONFIGS[itemId] || { ball: '#eeeeee', hi: '#ffffff', glow: null };
  const S = canvas.width;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, S, S);
  const bobY = Math.sin(t * 2.5) * S * 0.012;
  const cx = S / 2, cy = S * 0.40 + bobY, r = S * 0.24;
  const lAngle = t * Math.PI * 2;
  const lx = Math.sin(lAngle) * 0.4;
  const ly = -0.32 + Math.cos(lAngle * 0.65) * 0.06;
  const gc = cfg.ring || cfg.glow || cfg.ball;
  const [gcR, gcG, gcB] = _hexRgb(gc);

  // Background
  { const bg = ctx.createRadialGradient(cx, S*0.42, S*0.05, cx, S*0.42, S*0.5);
    bg.addColorStop(0, `rgba(${(gcR*0.15)|0},${(gcG*0.12)|0},${(gcB*0.18+15)|0},0.7)`);
    bg.addColorStop(0.4, `rgba(${(gcR*0.06)|0},${(gcG*0.04)|0},${(gcB*0.08+8)|0},0.55)`);
    bg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(cx, S*0.42, S*0.5, 0, Math.PI*2); ctx.fillStyle = bg; ctx.fill(); }

  // Dust motes
  { ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const seed = itemId.charCodeAt(0)*13 + itemId.charCodeAt(Math.min(1,itemId.length-1))*7;
    for (let i = 0; i < 6; i++) {
      const a = ((seed+i*97.3)%360)*Math.PI/180 + t*(0.12+(i%3)*0.08);
      const d = S*0.18 + ((seed*(i+1))%50)/50*S*0.24;
      const mx = cx + Math.cos(a)*d;
      const my = S*0.42 + Math.sin(a*0.7+t*0.3)*d*0.5;
      const mr = S*0.004 + (i%2)*S*0.003;
      const pulse = 0.3 + Math.sin(t*1.5+i*1.7)*0.2;
      const mg = ctx.createRadialGradient(mx, my, 0, mx, my, mr*6);
      mg.addColorStop(0, `rgba(${Math.min(255,gcR+100)},${Math.min(255,gcG+100)},${Math.min(255,gcB+100)},${pulse})`);
      mg.addColorStop(0.3, _rgba(gc, pulse*0.3)); mg.addColorStop(1, 'transparent');
      ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, mr*6, 0, Math.PI*2); ctx.fill();
    } ctx.restore(); }

  // Reflective ground plane
  { ctx.save(); const floorY = cy+r*1.15;
    const floorG = ctx.createLinearGradient(cx, floorY-S*0.02, cx, S);
    floorG.addColorStop(0, 'rgba(0,0,0,0)');
    floorG.addColorStop(0.1, `rgba(${(gcR*0.04)|0},${(gcG*0.03)|0},${(gcB*0.06+4)|0},0.25)`);
    floorG.addColorStop(0.8, `rgba(${(gcR*0.02)|0},${(gcG*0.015)|0},${(gcB*0.03+2)|0},0.15)`);
    floorG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = floorG; ctx.fillRect(0, floorY-S*0.02, S, S-floorY+S*0.02);
    ctx.beginPath(); ctx.moveTo(cx-S*0.35, floorY); ctx.lineTo(cx+S*0.35, floorY);
    const lineG = ctx.createLinearGradient(cx-S*0.35, 0, cx+S*0.35, 0);
    lineG.addColorStop(0, 'transparent'); lineG.addColorStop(0.3, _rgba(gc, 0.12));
    lineG.addColorStop(0.5, _rgba(gc, 0.25)); lineG.addColorStop(0.7, _rgba(gc, 0.12));
    lineG.addColorStop(1, 'transparent');
    ctx.strokeStyle = lineG; ctx.lineWidth = 1; ctx.stroke(); ctx.restore(); }

  // Ground glow
  { ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const pulseA = 0.18 + Math.sin(t*1.8)*0.05; const py = cy+r*1.18;
    const pg = ctx.createRadialGradient(cx, py, 0, cx, py, r*2.4);
    pg.addColorStop(0, _rgba(gc, pulseA)); pg.addColorStop(0.25, _rgba(gc, pulseA*0.35)); pg.addColorStop(1, 'transparent');
    ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(cx, py, r*2.4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, cy+r*0.99, r*1.35, r*0.25, 0, 0, Math.PI*2);
    const rg = ctx.createRadialGradient(cx, cy+r*0.99, r*0.45, cx, cy+r*0.99, r*1.35);
    rg.addColorStop(0, 'transparent'); rg.addColorStop(0.45, _rgba(gc, 0.08));
    rg.addColorStop(0.72, _rgba(gc, 0.42)); rg.addColorStop(0.88, _rgba(gc, 0.15)); rg.addColorStop(1, 'transparent');
    ctx.fillStyle = rg; ctx.fill(); ctx.restore(); }

  // Trail particles
  if (cfg.trail) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const tBase = t*1.3;
    cfg.trail.forEach((c, i) => {
      const p = i/cfg.trail.length; const ta = tBase - i*0.65;
      const dist = r*(1.15+i*0.28);
      const tx = cx + Math.cos(ta)*dist*0.52 - r*0.2; const ty = cy + Math.sin(ta)*dist*0.2;
      const pr = r*(0.18-p*0.04); if (pr<=0) return;
      const bg = ctx.createRadialGradient(tx,ty,0,tx,ty,pr*5);
      bg.addColorStop(0, _rgba(c,0.65)); bg.addColorStop(0.15, _rgba(c,0.25)); bg.addColorStop(1, 'transparent');
      ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(tx,ty,pr*5,0,Math.PI*2); ctx.fill();
      const cg = ctx.createRadialGradient(tx,ty,0,tx,ty,pr);
      cg.addColorStop(0, 'rgba(255,255,255,0.97)'); cg.addColorStop(0.2, _lighten(c,0.7));
      cg.addColorStop(0.7, c); cg.addColorStop(1, _rgba(c,0));
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(tx,ty,pr,0,Math.PI*2); ctx.fill();
    }); ctx.restore();
  }

  // Aura particles
  if (cfg.aura) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const orbitR = r*1.5; const aBase = t*0.75;
    cfg.aura.forEach((c, i) => {
      const angle = aBase + (i/cfg.aura.length)*Math.PI*2;
      const ax = cx + Math.cos(angle)*orbitR; const ay = cy + Math.sin(angle)*orbitR*0.45;
      const pr = r*0.13;
      for (let g = 1; g <= 3; g++) {
        const ga = angle-g*0.15; const gx = cx+Math.cos(ga)*orbitR; const gy = cy+Math.sin(ga)*orbitR*0.45;
        const gAlpha = 0.12/g;
        const gg = ctx.createRadialGradient(gx,gy,0,gx,gy,pr*2);
        gg.addColorStop(0, _rgba(c, gAlpha)); gg.addColorStop(1, 'transparent');
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(gx,gy,pr*2,0,Math.PI*2); ctx.fill();
      }
      const bg = ctx.createRadialGradient(ax,ay,0,ax,ay,pr*5.5);
      bg.addColorStop(0, _rgba(c,0.7)); bg.addColorStop(0.15, _rgba(c,0.25)); bg.addColorStop(1, 'transparent');
      ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(ax,ay,pr*5.5,0,Math.PI*2); ctx.fill();
      const cg = ctx.createRadialGradient(ax,ay,0,ax,ay,pr);
      cg.addColorStop(0, '#ffffff'); cg.addColorStop(0.25, _lighten(c,0.6)); cg.addColorStop(1, c);
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(ax,ay,pr,0,Math.PI*2); ctx.fill();
    }); ctx.restore();
  }

  // Shadow
  { const shX = cx-lx*r*0.3; const shY = cy+r*1.08; const shW = r*(0.85+Math.abs(lx)*0.15);
    const sh = ctx.createRadialGradient(shX,shY,0,shX,shY,shW);
    sh.addColorStop(0, 'rgba(0,0,0,0.6)'); sh.addColorStop(0.3, 'rgba(0,0,0,0.22)'); sh.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.ellipse(shX,shY,shW,r*0.16,0,0,Math.PI*2); ctx.fillStyle = sh; ctx.fill(); }

  // Reflection
  { const refY = cy+r*2.05; const refR = r*0.6; ctx.save(); ctx.globalAlpha = 0.15;
    const refG = ctx.createRadialGradient(cx,refY,0,cx,refY,refR);
    refG.addColorStop(0, cfg.hi); refG.addColorStop(0.3, cfg.ball);
    refG.addColorStop(0.7, _darken(cfg.ball,0.5)); refG.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.ellipse(cx,refY,refR,refR*0.3,0,0,Math.PI*2); ctx.fillStyle = refG; ctx.fill(); ctx.restore(); }

  // ---- MAIN 3D SPHERE ----
  ctx.save();
  if (cfg.alpha) ctx.globalAlpha = cfg.alpha;
  const hlX = cx+lx*r; const hlY = cy+ly*r;

  // L1: Base diffuse
  const base = ctx.createRadialGradient(cx+lx*r*0.6,cy+ly*r*0.6,0,cx-lx*r*0.12,cy-ly*r*0.08,r*1.08);
  base.addColorStop(0, _lighten(cfg.hi,0.25)); base.addColorStop(0.1, _lighten(cfg.ball,0.35));
  base.addColorStop(0.28, _lighten(cfg.ball,0.1)); base.addColorStop(0.5, cfg.ball);
  base.addColorStop(0.7, _darken(cfg.ball,0.5)); base.addColorStop(0.88, _darken(cfg.ball,0.25));
  base.addColorStop(1, _darken(cfg.glow||cfg.ball,0.12));
  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle = base; ctx.fill();

  // L2: Subsurface
  if (cfg.glow && cfg.glow !== cfg.ball) {
    const sX = cx-lx*r*0.65, sY = cy-ly*r*0.35;
    const sss = ctx.createRadialGradient(sX,sY,r*0.15,cx,cy,r);
    sss.addColorStop(0, 'transparent'); sss.addColorStop(0.45, 'transparent');
    sss.addColorStop(0.72, _rgba(cfg.glow,0.1)); sss.addColorStop(0.9, _rgba(cfg.glow,0.22));
    sss.addColorStop(1, _rgba(cfg.glow,0.05));
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle = sss; ctx.fill();
  }

  // L3: Bounce light
  { const bl = ctx.createRadialGradient(cx,cy+r*0.7,0,cx,cy,r);
    bl.addColorStop(0, _rgba(gc,0.12)); bl.addColorStop(0.3, _rgba(gc,0.04)); bl.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle = bl; ctx.fill(); }

  // L4: Fresnel rim
  { const rimPulse = 0.42+Math.sin(t*2)*0.08;
    const rX = cx-lx*r*0.1, rY = cy-ly*r*0.1;
    const rim = ctx.createRadialGradient(rX,rY,r*0.5,rX,rY,r);
    rim.addColorStop(0, 'transparent'); rim.addColorStop(0.5, 'transparent');
    rim.addColorStop(0.73, _rgba(cfg.hi,0.05)); rim.addColorStop(0.86, _rgba(cfg.hi,0.2));
    rim.addColorStop(0.94, _rgba(cfg.hi,rimPulse)); rim.addColorStop(1, _rgba(cfg.hi,rimPulse*0.2));
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle = rim; ctx.fill(); }

  // L5: Primary specular
  { const spR = r*0.23;
    const sp = ctx.createRadialGradient(hlX,hlY,0,hlX,hlY,spR);
    sp.addColorStop(0, 'rgba(255,255,255,0.99)'); sp.addColorStop(0.06, 'rgba(255,255,255,0.9)');
    sp.addColorStop(0.2, 'rgba(255,255,255,0.45)'); sp.addColorStop(0.45, 'rgba(255,255,255,0.08)');
    sp.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle = sp; ctx.fill(); }

  // L6: Secondary specular
  { const s2x = cx+lx*r*0.5, s2y = cy+ly*r*0.4;
    const sp2 = ctx.createRadialGradient(s2x,s2y,0,s2x,s2y,r*0.45);
    sp2.addColorStop(0, 'rgba(255,255,255,0.08)'); sp2.addColorStop(0.25, 'rgba(255,255,255,0.02)');
    sp2.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle = sp2; ctx.fill(); }

  // L7: Internal sparkles
  { ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,r*0.96,0,Math.PI*2); ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    const seed = itemId.charCodeAt(0)*17+itemId.length*53;
    for (let i = 0; i < 12; i++) {
      const a = ((seed+i*137.508)%360)*Math.PI/180 + t*(0.25+(i%4)*0.1);
      const d = r*(0.15+((seed*(i+1)*31)%80)/100*0.6);
      const sx = cx+Math.cos(a)*d; const sy = cy+Math.sin(a)*d*0.85;
      const sr = r*0.02+(i%3)*r*0.008;
      const distFromHL = Math.sqrt((sx-hlX)**2+(sy-hlY)**2)/r;
      const bright = Math.max(0, 0.55-distFromHL*0.38);
      if (bright < 0.04) continue;
      const sg = ctx.createRadialGradient(sx,sy,0,sx,sy,sr*4);
      sg.addColorStop(0, `rgba(255,255,255,${bright})`);
      sg.addColorStop(0.2, _rgba(cfg.hi,bright*0.5));
      sg.addColorStop(0.5, _rgba(gc,bright*0.15)); sg.addColorStop(1, 'transparent');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx,sy,sr*4,0,Math.PI*2); ctx.fill();
    } ctx.restore(); }

  // L8: Surface texture
  { ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.clip();
    ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.04;
    const texSeed = itemId.charCodeAt(0)*7;
    for (let i = 0; i < 5; i++) {
      const tAngle = ((texSeed+i*72)%360)*Math.PI/180+t*0.15;
      const td = r*(0.3+i*0.12); const tx = cx+Math.cos(tAngle)*td; const ty = cy+Math.sin(tAngle)*td*0.8;
      const tr = r*0.3;
      const tg = ctx.createRadialGradient(tx,ty,0,tx,ty,tr);
      tg.addColorStop(0, 'rgba(255,255,255,0.8)'); tg.addColorStop(0.5, 'rgba(255,255,255,0.2)');
      tg.addColorStop(1, 'transparent');
      ctx.fillStyle = tg; ctx.beginPath(); ctx.arc(tx,ty,tr,0,Math.PI*2); ctx.fill();
    } ctx.restore(); }

  // L9: Environment reflection band
  { ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.clip();
    const eShift = Math.sin(t*0.35)*r*0.06;
    const env = ctx.createLinearGradient(cx,cy-r,cx,cy+r);
    env.addColorStop(0, 'transparent'); env.addColorStop(0.36, 'transparent');
    const eC = 0.48+eShift/r;
    env.addColorStop(Math.max(0.37,eC-0.04), 'rgba(190,180,235,0.03)');
    env.addColorStop(eC, 'rgba(220,210,250,0.065)');
    env.addColorStop(Math.min(0.62,eC+0.04), 'rgba(190,180,235,0.03)');
    env.addColorStop(0.63, 'transparent'); env.addColorStop(1, 'transparent');
    ctx.fillStyle = env; ctx.fillRect(cx-r,cy-r,r*2,r*2); ctx.restore(); }

  // L10: Ambient occlusion
  { const ao = ctx.createRadialGradient(cx+lx*r*0.08,cy+r*0.45,0,cx,cy+r*0.1,r);
    ao.addColorStop(0, 'rgba(0,0,0,0.18)'); ao.addColorStop(0.25, 'rgba(0,0,0,0.06)');
    ao.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle = ao; ctx.fill(); }

  // L11: Glossy edge
  { ctx.beginPath(); ctx.arc(cx,cy,r-0.5,0,Math.PI*2);
    ctx.strokeStyle = _rgba(cfg.hi,0.07); ctx.lineWidth = 0.8; ctx.stroke(); }

  ctx.restore(); ctx.globalAlpha = 1;

  // Emissive bloom
  if (cfg.glow) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const bloomPulse = 1+Math.sin(t*1.6)*0.12;
    const b0 = ctx.createRadialGradient(cx,cy,r*0.5,cx,cy,r*1.25);
    b0.addColorStop(0, _rgba(cfg.glow,0.12*bloomPulse)); b0.addColorStop(0.5, _rgba(cfg.glow,0.03*bloomPulse));
    b0.addColorStop(1, 'transparent');
    ctx.fillStyle = b0; ctx.beginPath(); ctx.arc(cx,cy,r*1.25,0,Math.PI*2); ctx.fill();
    const b1 = ctx.createRadialGradient(cx,cy,r*0.7,cx,cy,r*1.7);
    b1.addColorStop(0, _rgba(cfg.glow,0.1*bloomPulse)); b1.addColorStop(0.3, _rgba(cfg.glow,0.03*bloomPulse));
    b1.addColorStop(1, 'transparent');
    ctx.fillStyle = b1; ctx.beginPath(); ctx.arc(cx,cy,r*1.7,0,Math.PI*2); ctx.fill();
    const b2 = ctx.createRadialGradient(cx,cy,r,cx,cy,r*2.5);
    b2.addColorStop(0, _rgba(cfg.glow,0.04*bloomPulse)); b2.addColorStop(1, 'transparent');
    ctx.fillStyle = b2; ctx.beginPath(); ctx.arc(cx,cy,r*2.5,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // Lens flare
  { ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const fr = r*0.14;
    const fg = ctx.createRadialGradient(hlX,hlY,0,hlX,hlY,fr*3.5);
    fg.addColorStop(0, 'rgba(255,255,255,0.2)'); fg.addColorStop(0.1, 'rgba(255,255,255,0.08)');
    fg.addColorStop(0.35, _rgba(gc,0.03)); fg.addColorStop(1, 'transparent');
    ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(hlX,hlY,fr*3.5,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha = 0.07; ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.6;
    const fLen = fr*5;
    ctx.beginPath(); ctx.moveTo(hlX-fLen,hlY); ctx.lineTo(hlX+fLen,hlY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hlX,hlY-fLen*0.7); ctx.lineTo(hlX,hlY+fLen*0.7); ctx.stroke();
    ctx.globalAlpha = 0.03; const dLen = fLen*0.5;
    ctx.beginPath(); ctx.moveTo(hlX-dLen,hlY-dLen); ctx.lineTo(hlX+dLen,hlY+dLen); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hlX+dLen,hlY-dLen); ctx.lineTo(hlX-dLen,hlY+dLen); ctx.stroke();
    const gx = cx*2-hlX, gy = cy*2-hlY; ctx.globalAlpha = 0.015;
    const ghG = ctx.createRadialGradient(gx,gy,0,gx,gy,fr*4);
    ghG.addColorStop(0, _rgba(gc,0.3)); ghG.addColorStop(0.3, _rgba(gc,0.08)); ghG.addColorStop(1, 'transparent');
    ctx.fillStyle = ghG; ctx.beginPath(); ctx.arc(gx,gy,fr*4,0,Math.PI*2); ctx.fill();
    ctx.restore(); }
}

// ---- Shop UI ----
export function initShop() {
  G.shopPanel = document.getElementById('shop-panel');
  G.shopGrid = document.getElementById('shop-grid');
  G.shopCoinCount = document.getElementById('shop-coin-count');
  G.shopExclCount = document.getElementById('shop-excl-count');
  G.shopMsg = document.getElementById('shop-msg');
  G.exclusiveCountEl = document.getElementById('exclusive-count');
  G.exclusiveToast = document.getElementById('exclusive-toast');
}

export function renderShop() {
  G.shopCoinCount.textContent = G.coins;
  G.shopExclCount.textContent = G.exclusiveCoins;
  G.shopGrid.innerHTML = '';

  const regDivider = document.createElement('div');
  regDivider.className = 'shop-divider regular';
  regDivider.innerHTML = '<div class="divider-line"></div><div class="divider-label">COIN SHOP</div><div class="divider-line"></div>';
  G.shopGrid.appendChild(regDivider);
  SHOP_ITEMS.forEach(item => { G.shopGrid.appendChild(makeShopCard({...item, exclusive: false})); });

  const exclDivider = document.createElement('div');
  exclDivider.className = 'shop-divider exclusive';
  exclDivider.innerHTML = '<div class="divider-line"></div><div class="divider-label">EXCLUSIVE</div><div class="divider-line"></div>';
  G.shopGrid.appendChild(exclDivider);
  EXCLUSIVE_SHOP_ITEMS.forEach(item => { G.shopGrid.appendChild(makeShopCard(item)); });
}

function makeShopCard(item) {
  const owned = !!G.ownedItems[item.id];
  const isActive = G.activeEffect === item.id;
  const div = document.createElement('div');
  div.className = 'shop-item' + (owned ? ' owned' : '') + (isActive ? ' active' : '') + (item.exclusive ? ' exclusive-item' : '');

  const cfg = PREVIEW_CONFIGS[item.id];
  if (cfg) {
    const tc = cfg.ring || cfg.glow || cfg.ball;
    const [cr, cg, cb] = _hexRgb(tc);
    div.style.borderColor = `rgba(${cr},${cg},${cb},0.18)`;
    div.style.boxShadow = `0 2px 14px rgba(0,0,0,0.18), 0 0 24px rgba(${cr},${cg},${cb},0.06), inset 0 1px 0 rgba(255,255,255,0.06)`;
    div.addEventListener('mouseenter', () => {
      if (owned && !isActive) return;
      div.style.borderColor = `rgba(${cr},${cg},${cb},0.4)`;
      div.style.boxShadow = `0 14px 40px rgba(${cr},${cg},${cb},0.12), 0 0 40px rgba(${cr},${cg},${cb},0.08), 0 0 0 1px rgba(${cr},${cg},${cb},0.12), inset 0 1px 0 rgba(255,255,255,0.08)`;
    });
    div.addEventListener('mouseleave', () => {
      div.style.borderColor = isActive ? `rgba(255,215,0,0.4)` : `rgba(${cr},${cg},${cb},0.18)`;
      div.style.boxShadow = isActive
        ? `0 0 32px rgba(255,215,0,0.12), 0 0 0 1px rgba(255,215,0,0.15), inset 0 0 24px rgba(255,215,0,0.03)`
        : `0 2px 14px rgba(0,0,0,0.18), 0 0 24px rgba(${cr},${cg},${cb},0.06), inset 0 1px 0 rgba(255,255,255,0.06)`;
    });
  }

  const priceLabel = item.exclusive
    ? `<span class="excl-price-icon"></span> ${item.price}`
    : `<span class="coin-price-icon"></span> ${item.price}`;
  const iconDiv = document.createElement('div');
  iconDiv.className = 'item-icon';
  iconDiv.appendChild(renderPreview(item.id));
  const infoHTML = `
    <div class="item-name">${item.name}</div>
    <div class="item-desc">${item.desc}</div>
    <div class="item-price ${owned ? 'owned-label' : ''}">${owned ? (isActive ? '\u2705 Active' : 'Owned') : priceLabel}</div>
    ${owned && !isActive ? '<div class="item-status">Click to equip</div>' : ''}`;
  div.appendChild(iconDiv);
  div.insertAdjacentHTML('beforeend', infoHTML);
  div.onclick = () => handleShopClick(item);
  return div;
}

function handleShopClick(item) {
  G.shopMsg.textContent = '';
  if (G.ownedItems[item.id]) {
    if (G.activeEffect === item.id) { G.activeEffect = null; }
    else { G.activeEffect = item.id; }
    applyActiveEffect(); saveShopData(); renderShop(); return;
  }
  if (item.exclusive) {
    if (G.exclusiveCoins < item.price) {
      G.shopMsg.textContent = `Not enough 💎! Need ${item.price - G.exclusiveCoins} more.`; return;
    }
    G.exclusiveCoins -= item.price;
    G.exclusiveCountEl.textContent = G.exclusiveCoins;
  } else {
    if (G.coins < item.price) {
      G.shopMsg.textContent = `Not enough coins! Need ${item.price - G.coins} more.`; return;
    }
    G.coins -= item.price;
    G.coinCountEl.textContent = G.coins;
  }
  G.ownedItems[item.id] = true;
  G.activeEffect = item.id;
  applyActiveEffect(); saveShopData(); renderShop();
  G.shopMsg.style.color = '#66ffaa';
  G.shopMsg.textContent = `\u2728 ${item.name} unlocked and equipped!`;
  setTimeout(() => { G.shopMsg.style.color = '#ff6b6b'; G.shopMsg.textContent = ''; }, 2500);
}

export function openShop() {
  renderShop();
  G.shopPanel.classList.add('open');
  _startShopAnim();
}

export function closeShop() {
  G.shopPanel.classList.remove('open');
  _stopShopAnim();
}
