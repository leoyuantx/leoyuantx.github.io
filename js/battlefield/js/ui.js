// ui.js — 3D Globe map selection, HUD updates, killfeed, minimap
import { LOADOUTS, WEAPONS } from './weapons.js';

// ── Continent polygon data [lat, lon] ──
const CONTINENTS = [
  { name: 'North America', color: '#1e5e30', stroke: '#2a8040', points: [
    [72,-168],[72,-140],[70,-115],[68,-100],[62,-78],[55,-60],[48,-55],
    [44,-64],[42,-70],[38,-75],[33,-80],[28,-82],[25,-82],[22,-97],
    [18,-100],[16,-92],[16,-87],[19,-87],[22,-105],[28,-112],
    [32,-117],[37,-122],[45,-124],[49,-126],[56,-132],[60,-148],[66,-165]
  ]},
  { name: 'Central America', color: '#1a5528', stroke: '#2a7038', points: [
    [22,-97],[18,-100],[16,-92],[16,-87],[14,-85],[10,-84],[8,-78],
    [8,-82],[10,-86],[14,-90],[18,-105]
  ]},
  { name: 'South America', color: '#1a6828', stroke: '#28883a', points: [
    [12,-72],[10,-80],[6,-78],[2,-80],[-4,-81],[-8,-78],[-13,-76],
    [-18,-72],[-22,-66],[-28,-66],[-33,-72],[-38,-62],[-42,-65],
    [-48,-70],[-54,-68],[-55,-70],[-55,-74],[-50,-74],[-46,-67],
    [-40,-62],[-34,-54],[-26,-48],[-22,-41],[-14,-38],[-5,-35],
    [0,-50],[4,-58],[7,-62],[10,-68]
  ]},
  { name: 'Europe', color: '#2a6535', stroke: '#38854a', points: [
    [36,-9],[38,-5],[36,2],[38,5],[42,3],[44,8],[43,13],[40,18],
    [38,24],[40,28],[44,28],[46,15],[48,17],[50,20],[52,14],
    [54,10],[56,12],[58,10],[60,5],[62,5],[64,10],[66,14],
    [68,16],[70,20],[72,28],[72,30],[68,38],[62,32],[58,28],
    [55,24],[50,30],[48,35],[46,40],[44,40],[42,32],[40,30],
    [38,26],[37,20],[36,14],[36,5],[35,-5]
  ]},
  { name: 'UK', color: '#2a6a38', stroke: '#38904a', points: [
    [50,-6],[51,-3],[53,-3],[54,0],[56,-2],[58,-5],[58,-7],
    [57,-6],[55,-5],[54,-4],[52,-5],[51,-5]
  ]},
  { name: 'Africa', color: '#7a6520', stroke: '#a08830', points: [
    [35,-5],[37,10],[35,12],[33,13],[32,28],[30,32],[25,36],
    [20,40],[15,42],[10,42],[5,38],[2,10],[0,10],[-2,10],
    [-5,12],[-8,14],[-12,24],[-18,28],[-23,30],[-25,33],
    [-30,30],[-34,26],[-34,18],[-28,14],[-22,12],[-15,10],
    [-10,14],[-5,10],[0,8],[3,2],[5,-4],[7,-12],[10,-16],
    [14,-17],[20,-17],[25,-16],[30,-10],[33,-8]
  ]},
  { name: 'India', color: '#1e6030', stroke: '#2a8242', points: [
    [28,68],[30,72],[28,78],[24,82],[20,85],[16,82],[12,80],
    [8,78],[8,74],[10,72],[14,70],[18,72],[22,74],[26,70]
  ]},
  { name: 'Asia West', color: '#245828', stroke: '#349040', points: [
    [72,28],[72,50],[70,60],[68,68],[65,75],[62,72],[58,58],
    [55,55],[52,52],[48,45],[42,44],[38,35],[35,38],[32,44],
    [28,48],[24,55],[20,58],[15,56],[10,60],[8,75],[6,80],
    [4,90],[2,95],[0,98],[-5,100],[-8,105],[-8,100],[0,90],
    [5,80],[10,70],[15,60],[20,55],[25,48],[30,42],[35,36],
    [38,32],[40,30],[44,28],[48,32],[52,35],[56,38],[58,44],
    [55,50],[50,68],[50,80],[52,92],[55,110],[58,120],
    [60,130],[62,140],[65,148],[68,155],[70,162],[72,170],[72,180]
  ]},
  { name: 'Asia East', color: '#245828', stroke: '#349040', points: [
    [72,180],[72,170],[70,162],[68,155],[65,148],[62,140],
    [60,130],[58,120],[55,110],[52,92],[50,80],[50,68],
    [48,60],[44,52],[42,50],[40,48],[38,50],[36,58],
    [34,65],[30,72],[25,78],[20,82],[15,88],[10,95],
    [6,102],[2,104],[0,110],[-4,112],[-8,115],[-7,120],
    [0,115],[4,108],[8,105],[12,105],[16,108],[20,110],
    [24,115],[28,120],[32,122],[36,128],[40,130],[42,132],
    [45,135],[48,140],[52,142],[55,140],[58,138],[60,140],
    [62,150],[64,162],[66,170],[68,178],[72,180]
  ]},
  { name: 'Japan', color: '#2a6830', stroke: '#38884a', points: [
    [34,130],[36,136],[38,138],[40,140],[42,140],[44,142],[45,144],
    [44,146],[42,143],[39,140],[36,140],[34,136],[32,131]
  ]},
  { name: 'Australia', color: '#8a6a18', stroke: '#aa8828', points: [
    [-12,133],[-14,128],[-18,123],[-22,116],[-26,114],[-30,115],
    [-33,118],[-35,135],[-38,144],[-38,148],[-35,150],[-30,153],
    [-25,153],[-20,148],[-16,146],[-13,142],[-11,138]
  ]},
  { name: 'New Zealand', color: '#2a6830', stroke: '#38884a', points: [
    [-35,172],[-38,175],[-42,174],[-46,168],[-47,167],[-44,168],
    [-40,173],[-37,175]
  ]},
];

// ── 7 Theaters of War ──
export const LOCATIONS = [
  {
    id: 'normandy', name: 'NORMANDY', subtitle: 'D-Day Landings', date: 'June 6, 1944',
    lat: 49.2, lon: -0.9,
    playerFaction: 'usa', playerFactionLabel: 'US ARMY',
    enemyFaction: 'germany', enemyFactionLabel: 'WEHRMACHT',
    weaponId: 'thompson', weaponLabel: 'Thompson SMG',
    terrain: 'Beaches & Hedgerows', difficulty: 'HARD', vehicle: null,
    story: 'The largest seaborne invasion in history. As Allied forces storm the fortified beaches of Normandy, you are among the first wave landing at Omaha Beach. German machine gun nests rain fire from the cliffs above. Every meter of sand is paid for in blood. Push through the wire, silence the bunkers, and secure the beachhead \u2014 the liberation of Europe depends on it.',
  },
  {
    id: 'stalingrad', name: 'STALINGRAD', subtitle: 'The Siege',
    date: 'September 1942 \u2014 February 1943',
    lat: 48.7, lon: 44.5,
    playerFaction: 'ussr', playerFactionLabel: 'RED ARMY',
    enemyFaction: 'germany', enemyFactionLabel: 'WEHRMACHT',
    weaponId: 'ppsh41', weaponLabel: 'PPSh-41',
    terrain: 'Urban Ruins', difficulty: 'EXTREME', vehicle: null,
    story: 'The city that bears Stalin\'s name has become a slaughterhouse. The German 6th Army has pushed deep into the shattered remains of the city, fighting room by room, floor by floor. You are a Soviet soldier defending the ruins of a tractor factory. Snipers lurk in every window. The Volga is at your back \u2014 there is no retreat. Hold the line until the counter-offensive encircles the enemy.',
  },
  {
    id: 'midway', name: 'MIDWAY', subtitle: 'Turning Point in the Pacific',
    date: 'June 4-7, 1942',
    lat: 28.2, lon: -177.4,
    playerFaction: 'usa', playerFactionLabel: 'US NAVY',
    enemyFaction: 'japan', enemyFactionLabel: 'IJN',
    weaponId: 'm1_garand', weaponLabel: 'M1 Garand',
    terrain: 'Island & Ocean', difficulty: 'MEDIUM', vehicle: null,
    story: 'Six months after Pearl Harbor, the Imperial Japanese Navy launches a massive assault on Midway Atoll \u2014 a tiny island that controls the central Pacific. American codebreakers have cracked the enemy\'s plans. You deploy as part of the island garrison, defending airstrips while US dive bombers hunt the Japanese carriers on the horizon. The fate of the Pacific war hangs in the balance.',
  },
  {
    id: 'tobruk', name: 'TOBRUK', subtitle: 'Desert Siege',
    date: 'April \u2014 November 1941',
    lat: 32.1, lon: 23.8,
    playerFaction: 'uk', playerFactionLabel: 'BRITISH 8TH ARMY',
    enemyFaction: 'germany', enemyFactionLabel: 'AFRIKA KORPS',
    weaponId: 'lee_enfield', weaponLabel: 'Lee-Enfield',
    terrain: 'Desert & Fortifications', difficulty: 'MEDIUM', vehicle: null,
    story: 'The Libyan port of Tobruk is the key to North Africa. Rommel\'s Afrika Korps has swept across the desert, but the garrison refuses to fall. You are a British soldier holding the perimeter against relentless Panzer assaults. Sandstorms blind you, heat saps your strength, and water is rationed to a canteen a day. But if Tobruk falls, Egypt and the Suez Canal are next.',
  },
  {
    id: 'iwo_jima', name: 'IWO JIMA', subtitle: 'Island of Sulfur',
    date: 'February 19 \u2014 March 26, 1945',
    lat: 24.8, lon: 141.3,
    playerFaction: 'usa', playerFactionLabel: 'US MARINES',
    enemyFaction: 'japan', enemyFactionLabel: 'IJA',
    weaponId: 'bar', weaponLabel: 'BAR',
    terrain: 'Volcanic Ash & Tunnels', difficulty: 'HARD', vehicle: null,
    story: 'Eight square miles of volcanic rock, riddled with 11 miles of tunnels. The Japanese garrison has dug in deep \u2014 every cave is a fortress, every ridge a kill zone. You land on the black sand beaches as a US Marine, pushing toward Mount Suribachi under withering fire from positions you cannot see. The enemy fights to the last man. This tiny island will cost 26,000 American casualties.',
  },
  {
    id: 'berlin', name: 'BERLIN', subtitle: 'Fall of the Reich',
    date: 'April 16 \u2014 May 2, 1945',
    lat: 52.5, lon: 13.4,
    playerFaction: 'ussr', playerFactionLabel: 'RED ARMY',
    enemyFaction: 'germany', enemyFactionLabel: 'WAFFEN-SS',
    weaponId: 'ppsh41', weaponLabel: 'PPSh-41',
    terrain: 'Ruined City', difficulty: 'EXTREME', vehicle: null,
    story: 'The Third Reich is dying, but it will not go quietly. Two and a half million Soviet soldiers converge on Hitler\'s capital in the final apocalyptic battle of the European war. You fight through the shattered streets of Berlin, past flaming barricades defended by old men and boys. Panzerfausts fire from every alley. The Reichstag looms ahead \u2014 take it, and the war is over.',
  },
  {
    id: 'atlantic', name: 'ATLANTIC', subtitle: 'Battle of the Convoys',
    date: 'September 1939 \u2014 May 1943',
    lat: 50, lon: -30,
    playerFaction: 'uk', playerFactionLabel: 'ROYAL NAVY',
    enemyFaction: 'germany', enemyFactionLabel: 'KRIEGSMARINE',
    weaponId: 'lee_enfield', weaponLabel: 'Deck Gun',
    terrain: 'Open Ocean', difficulty: 'HARD', vehicle: 'boat',
    story: 'The longest campaign of the entire war. German U-boats hunt in wolf packs across the North Atlantic, strangling Britain\'s lifeline of food, fuel, and ammunition. You command a corvette escort ship, protecting a lumbering convoy of merchant vessels through fog, storms, and submarine-infested waters. Depth charges are your weapon. Sonar is your eyes. Lose the convoy, and Britain starves.',
  },
];

// ── UI Manager ──
export class UI {
  constructor() {
    this.selectedLocation = null;
    this.globeRotation = -0.4;
    this.globeDragging = false;
    this.globeAnimId = null;
    this.stars = [];
    this.pinEls = [];

    // Cache DOM
    this.mainMenu = document.getElementById('main-menu');
    this.mapSelect = document.getElementById('map-select');
    this.controlsScreen = document.getElementById('controls-screen');
    this.hud = document.getElementById('hud');
    this.pauseMenu = document.getElementById('pause-menu');
    this.deathScreen = document.getElementById('death-screen');
    this.scoreboard = document.getElementById('scoreboard');

    this.healthFill = document.getElementById('health-fill');
    this.healthText = document.getElementById('health-text');
    this.ammoClip = document.getElementById('ammo-clip');
    this.ammoReserve = document.getElementById('ammo-reserve');
    this.hudWeapon = document.getElementById('hud-weapon');
    this.killCount = document.getElementById('kill-count');
    this.compass = document.getElementById('hud-compass');
    this.killfeed = document.getElementById('killfeed');
    this.hitmarker = document.getElementById('hitmarker');
    this.damageOverlay = document.getElementById('damage-overlay');
    this.vehicleHud = document.getElementById('vehicle-hud');
    this.vehicleName = document.getElementById('vehicle-name');
    this.vehicleHealthFill = document.getElementById('vehicle-health-fill');
    this.interactPrompt = document.getElementById('interact-prompt');
    this.minimapCanvas = document.getElementById('minimap');
    this.minimapCtx = this.minimapCanvas.getContext('2d');
  }

  // ── Globe Setup ──
  buildMap() {
    this.mapCanvas = document.getElementById('map-canvas');
    this.mapCtx = this.mapCanvas.getContext('2d');
    this._resizeGlobe();
    this._genStars();
    this.createPins();
    this._setupGlobeInput();
    window.addEventListener('resize', () => this._resizeGlobe());
  }

  _resizeGlobe() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    this.mapCanvas.width = w * dpr;
    this.mapCanvas.height = h * dpr;
    this.mapCanvas.style.width = w + 'px';
    this.mapCanvas.style.height = h + 'px';
    this.mapCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._gW = w;
    this._gH = h;
    this._gR = Math.min(w, h) * 0.37;
    // Shift globe left to leave space for detail panel
    this._gCx = w * 0.42;
    this._gCy = h * 0.48;
  }

  _genStars() {
    this.stars = [];
    for (let i = 0; i < 400; i++) {
      this.stars.push({
        x: Math.random(), y: Math.random(),
        r: Math.random() * 1.2 + 0.2,
        a: Math.random() * 0.6 + 0.15,
        twinkle: Math.random() * Math.PI * 2
      });
    }
  }

  _setupGlobeInput() {
    let lastX = 0;
    this.mapCanvas.addEventListener('mousedown', (e) => {
      this.globeDragging = true;
      lastX = e.clientX;
    });
    window.addEventListener('mousemove', (e) => {
      if (this.globeDragging) {
        this.globeRotation += (e.clientX - lastX) * 0.004;
        lastX = e.clientX;
      }
    });
    window.addEventListener('mouseup', () => { this.globeDragging = false; });
  }

  _startGlobeAnim() {
    if (this.globeAnimId) return;
    let t = 0;
    const anim = () => {
      t += 0.016;
      if (!this.globeDragging) this.globeRotation += 0.0015;
      this._drawGlobe(t);
      this._updatePinPositions();
      this.globeAnimId = requestAnimationFrame(anim);
    };
    anim();
  }

  _stopGlobeAnim() {
    if (this.globeAnimId) { cancelAnimationFrame(this.globeAnimId); this.globeAnimId = null; }
  }

  // ── Projection ──
  _project(lat, lon) {
    const phi = lat * Math.PI / 180;
    const theta = lon * Math.PI / 180 + this.globeRotation;
    const x = Math.cos(phi) * Math.sin(theta);
    const y = -Math.sin(phi);
    const z = Math.cos(phi) * Math.cos(theta);
    return { sx: this._gCx + x * this._gR, sy: this._gCy + y * this._gR, z };
  }

  // Sutherland-Hodgman clip polygon against z > Z_CLIP plane
  _clipPoly(pts) {
    const Z = 0.01;
    const out = [];
    const n = pts.length;
    if (n < 3) return out;
    for (let i = 0; i < n; i++) {
      const cur = pts[i];
      const nxt = pts[(i + 1) % n];
      const cIn = cur.z > Z;
      const nIn = nxt.z > Z;
      if (cIn) out.push(cur);
      if (cIn !== nIn) {
        const t = (Z - cur.z) / (nxt.z - cur.z);
        out.push({
          sx: cur.sx + t * (nxt.sx - cur.sx),
          sy: cur.sy + t * (nxt.sy - cur.sy),
          z: Z
        });
      }
    }
    return out;
  }

  // ── Draw Globe ──
  _drawGlobe(t) {
    const ctx = this.mapCtx;
    const W = this._gW, H = this._gH;
    const cx = this._gCx, cy = this._gCy, R = this._gR;

    // Space background with subtle color
    const spaceBg = ctx.createRadialGradient(W * 0.3, H * 0.4, 0, W * 0.5, H * 0.5, W * 0.8);
    spaceBg.addColorStop(0, '#0a1020');
    spaceBg.addColorStop(0.5, '#060c18');
    spaceBg.addColorStop(1, '#030608');
    ctx.fillStyle = spaceBg;
    ctx.fillRect(0, 0, W, H);

    // Faint nebula wisps
    const neb1 = ctx.createRadialGradient(W * 0.2, H * 0.3, 0, W * 0.2, H * 0.3, W * 0.25);
    neb1.addColorStop(0, 'rgba(60,40,120,0.04)');
    neb1.addColorStop(1, 'transparent');
    ctx.fillStyle = neb1; ctx.fillRect(0, 0, W, H);
    const neb2 = ctx.createRadialGradient(W * 0.75, H * 0.7, 0, W * 0.75, H * 0.7, W * 0.2);
    neb2.addColorStop(0, 'rgba(120,50,40,0.03)');
    neb2.addColorStop(1, 'transparent');
    ctx.fillStyle = neb2; ctx.fillRect(0, 0, W, H);

    // Stars with twinkle
    for (const s of this.stars) {
      const a = s.a * (0.6 + 0.4 * Math.sin(t * 1.5 + s.twinkle));
      ctx.globalAlpha = a;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Outer atmosphere glow
    const atmo = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.35);
    atmo.addColorStop(0, 'rgba(80,150,255,0.18)');
    atmo.addColorStop(0.4, 'rgba(60,130,230,0.07)');
    atmo.addColorStop(1, 'transparent');
    ctx.fillStyle = atmo;
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.35, 0, Math.PI * 2); ctx.fill();

    // Secondary warm glow (sunset rim)
    const warm = ctx.createRadialGradient(cx + R * 0.5, cy + R * 0.3, R * 0.8, cx, cy, R * 1.2);
    warm.addColorStop(0, 'rgba(255,150,50,0.04)');
    warm.addColorStop(1, 'transparent');
    ctx.fillStyle = warm;
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.2, 0, Math.PI * 2); ctx.fill();

    // Ocean sphere with 3D shading
    const ocean = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.05, cx + R * 0.15, cy + R * 0.15, R * 1.05);
    ocean.addColorStop(0, '#2a7fb8');
    ocean.addColorStop(0.2, '#1e6899');
    ocean.addColorStop(0.45, '#145a88');
    ocean.addColorStop(0.7, '#0d3d66');
    ocean.addColorStop(1, '#071e3a');
    ctx.fillStyle = ocean;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

    // Ocean texture — faint horizontal wave lines
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    ctx.strokeStyle = 'rgba(100,180,255,0.03)';
    ctx.lineWidth = 0.8;
    for (let lat = -80; lat <= 80; lat += 8) {
      ctx.beginPath();
      let drawing = false;
      for (let lon = -180; lon <= 180; lon += 3) {
        const p = this._project(lat + Math.sin((lon + t * 20) * 0.05) * 2, lon);
        if (p.z > 0.02) {
          if (!drawing) { ctx.moveTo(p.sx, p.sy); drawing = true; }
          else ctx.lineTo(p.sx, p.sy);
        } else drawing = false;
      }
      ctx.stroke();
    }
    ctx.restore();

    // Clip all drawing to the sphere circle
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();

    // Grid lines (latitude) — draw only front-hemisphere segments
    ctx.strokeStyle = 'rgba(100,190,255,0.06)';
    ctx.lineWidth = 0.5;
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath();
      let drawing = false;
      for (let lon = -180; lon <= 180; lon += 2) {
        const p = this._project(lat, lon);
        if (p.z > 0.02) {
          if (!drawing) { ctx.moveTo(p.sx, p.sy); drawing = true; }
          else ctx.lineTo(p.sx, p.sy);
        } else {
          drawing = false;
        }
      }
      ctx.stroke();
    }
    for (let lon = -180; lon < 180; lon += 30) {
      ctx.beginPath();
      let drawing = false;
      for (let lat = -90; lat <= 90; lat += 2) {
        const p = this._project(lat, lon);
        if (p.z > 0.02) {
          if (!drawing) { ctx.moveTo(p.sx, p.sy); drawing = true; }
          else ctx.lineTo(p.sx, p.sy);
        } else {
          drawing = false;
        }
      }
      ctx.stroke();
    }

    // Light direction for per-continent shading
    const lightX = -0.5, lightY = -0.6, lightZ = 0.6;

    // Draw continents with proper hemisphere clipping
    for (const c of CONTINENTS) {
      const projected = c.points.map(p => this._project(p[0], p[1]));
      const clipped = this._clipPoly(projected);
      if (clipped.length < 3) continue;

      // Compute average facing for lighting
      let avgZ = 0;
      for (const p of clipped) avgZ += p.z;
      avgZ /= clipped.length;
      const brightness = 0.55 + 0.45 * Math.max(0, avgZ);

      // Parse base color and apply brightness
      const r = parseInt(c.color.slice(1, 3), 16);
      const g = parseInt(c.color.slice(3, 5), 16);
      const b = parseInt(c.color.slice(5, 7), 16);
      const sr = parseInt(c.stroke.slice(1, 3), 16);
      const sg = parseInt(c.stroke.slice(3, 5), 16);
      const sb = parseInt(c.stroke.slice(5, 7), 16);

      ctx.fillStyle = 'rgb(' +
        Math.round(r * brightness) + ',' +
        Math.round(g * brightness) + ',' +
        Math.round(b * brightness) + ')';
      ctx.strokeStyle = 'rgb(' +
        Math.round(sr * brightness) + ',' +
        Math.round(sg * brightness) + ',' +
        Math.round(sb * brightness) + ')';
      ctx.lineWidth = 1;
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(clipped[0].sx, clipped[0].sy);
      for (let i = 1; i < clipped.length; i++) {
        ctx.lineTo(clipped[i].sx, clipped[i].sy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inner highlight — subtle lighter edge near the light side
      if (clipped.length > 3 && avgZ > 0.2) {
        const gr = ctx.createLinearGradient(
          clipped[0].sx, clipped[0].sy,
          clipped[Math.floor(clipped.length / 2)].sx,
          clipped[Math.floor(clipped.length / 2)].sy
        );
        gr.addColorStop(0, 'rgba(255,255,200,0.08)');
        gr.addColorStop(0.5, 'transparent');
        gr.addColorStop(1, 'rgba(0,0,0,0.06)');
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.moveTo(clipped[0].sx, clipped[0].sy);
        for (let i = 1; i < clipped.length; i++) ctx.lineTo(clipped[i].sx, clipped[i].sy);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Cloud wisps — semi-transparent white arcs that move
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      const latC = -50 + i * 15;
      const lonOff = t * 8 + i * 45;
      ctx.beginPath();
      let drawing = false;
      for (let lon = lonOff; lon < lonOff + 60; lon += 3) {
        const lat = latC + Math.sin(lon * 0.08) * 6;
        const p = this._project(lat, lon);
        if (p.z > 0.1) {
          if (!drawing) { ctx.moveTo(p.sx, p.sy); drawing = true; }
          else ctx.lineTo(p.sx, p.sy);
        } else drawing = false;
      }
      ctx.stroke();
    }

    ctx.restore();

    // Specular highlight (top-left shine) — multi-layered for realism
    const spec = ctx.createRadialGradient(cx - R * 0.32, cy - R * 0.32, R * 0.02, cx, cy, R * 0.85);
    spec.addColorStop(0, 'rgba(255,255,255,0.22)');
    spec.addColorStop(0.15, 'rgba(255,255,255,0.10)');
    spec.addColorStop(0.35, 'rgba(255,255,255,0.03)');
    spec.addColorStop(1, 'transparent');
    ctx.fillStyle = spec;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

    // Secondary soft highlight
    const spec2 = ctx.createRadialGradient(cx - R * 0.15, cy - R * 0.45, R * 0.05, cx, cy, R * 0.6);
    spec2.addColorStop(0, 'rgba(200,220,255,0.08)');
    spec2.addColorStop(1, 'transparent');
    ctx.fillStyle = spec2;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

    // Edge darkening for depth
    const edge = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, R);
    edge.addColorStop(0, 'transparent');
    edge.addColorStop(0.75, 'rgba(0,0,0,0.15)');
    edge.addColorStop(0.92, 'rgba(0,0,0,0.40)');
    edge.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = edge;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

    // Thin atmosphere rim — double layer
    ctx.strokeStyle = 'rgba(100,180,255,0.18)';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(140,200,255,0.06)';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(cx, cy, R + 2, 0, Math.PI * 2); ctx.stroke();
  }

  // ── Pins ──
  createPins() {
    const container = document.getElementById('map-pins');
    container.innerHTML = '';
    this.pinEls = [];
    for (const loc of LOCATIONS) {
      const pin = document.createElement('div');
      pin.className = 'map-pin';
      pin.innerHTML =
        '<div class="pin-pulse"></div>' +
        '<div class="pin-dot"></div>' +
        '<div class="pin-label">' + loc.name + '</div>';
      pin.addEventListener('click', () => this.selectLocation(loc, pin));
      container.appendChild(pin);
      this.pinEls.push({ el: pin, loc: loc });
    }
  }

  _updatePinPositions() {
    for (const p of this.pinEls) {
      const proj = this._project(p.loc.lat, p.loc.lon);
      if (proj.z > 0.05) {
        p.el.style.left = proj.sx + 'px';
        p.el.style.top = proj.sy + 'px';
        p.el.style.opacity = '' + Math.min(1, (proj.z + 0.1) * 2);
        p.el.style.pointerEvents = 'auto';
      } else {
        p.el.style.opacity = '0';
        p.el.style.pointerEvents = 'none';
      }
    }
  }

  selectLocation(loc, pinEl) {
    this.selectedLocation = loc;
    document.querySelectorAll('.map-pin').forEach(p => p.classList.remove('active'));
    pinEl.classList.add('active');

    // Smoothly rotate globe to center on this location
    const targetRot = -loc.lon * Math.PI / 180;
    const diff = targetRot - this.globeRotation;
    const wrapped = ((diff + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    const steps = 40;
    const step = wrapped / steps;
    let i = 0;
    const ease = () => {
      if (i < steps) {
        this.globeRotation += step;
        i++;
        requestAnimationFrame(ease);
      }
    };
    ease();

    const detail = document.getElementById('location-detail');
    detail.classList.remove('hidden');
    // Re-trigger animation
    detail.style.animation = 'none';
    detail.offsetHeight;
    detail.style.animation = '';

    document.getElementById('loc-name').textContent = loc.name + ' \u2014 ' + loc.subtitle;
    document.getElementById('loc-date').textContent = loc.date;
    document.getElementById('loc-factions').innerHTML =
      '<span class="loc-faction-tag ally">' + loc.playerFactionLabel + '</span>' +
      '<span class="loc-vs">VS</span>' +
      '<span class="loc-faction-tag enemy">' + loc.enemyFactionLabel + '</span>';
    document.getElementById('loc-story').textContent = loc.story;
    document.getElementById('loc-weapon').textContent = loc.weaponLabel;
    document.getElementById('loc-terrain').textContent = loc.terrain;
    document.getElementById('loc-diff').textContent = loc.difficulty;
  }

  // ── Screen Management ──
  showMenu() {
    this._show(this.mainMenu);
    this._hide(this.mapSelect, this.controlsScreen, this.hud, this.pauseMenu, this.deathScreen, this.scoreboard);
    this._stopGlobeAnim();
  }
  showMapSelect() {
    this._show(this.mapSelect);
    this._hide(this.mainMenu);
    this._resizeGlobe();
    this._startGlobeAnim();
  }
  showControls() { this._show(this.controlsScreen); this._hide(this.mainMenu); }
  showHUD() {
    this._show(this.hud);
    this._hide(this.mapSelect, this.mainMenu, this.pauseMenu, this.deathScreen);
    this._stopGlobeAnim();
  }
  showPause() { this._show(this.pauseMenu); }
  hidePause() { this._hide(this.pauseMenu); }
  showDeath(info) {
    this._show(this.deathScreen);
    document.getElementById('death-info').textContent = info || '';
  }
  hideDeath() { this._hide(this.deathScreen); }
  showScoreboard() { this.scoreboard.classList.remove('hidden'); }
  hideScoreboard() { this.scoreboard.classList.add('hidden'); }

  _show(...els) { els.forEach(el => el && el.classList.remove('hidden')); }
  _hide(...els) { els.forEach(el => el && el.classList.add('hidden')); }

  // ── HUD Updates ──
  updateHealth(hp, maxHp) {
    const pct = Math.max(0, hp / maxHp * 100);
    this.healthFill.style.width = pct + '%';
    this.healthFill.style.background = pct > 50 ? '#4ade80' : pct > 25 ? '#facc15' : '#ef4444';
    this.healthText.textContent = Math.ceil(hp);
  }

  updateAmmo(clip, reserve) {
    this.ammoClip.textContent = clip;
    this.ammoReserve.textContent = reserve;
  }

  updateWeaponName(name) { this.hudWeapon.textContent = name; }
  updateKills(k) { this.killCount.textContent = k; }

  updateCompass(yawRad) {
    const deg = (((-yawRad * 180 / Math.PI) % 360) + 360) % 360;
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const idx = Math.round(deg / 45) % 8;
    this.compass.textContent = dirs[idx] + ' ' + Math.round(deg) + String.fromCharCode(176);
  }

  showHitmarker() {
    this.hitmarker.classList.remove('hidden');
    clearTimeout(this._hitTimer);
    this._hitTimer = setTimeout(() => this.hitmarker.classList.add('hidden'), 150);
  }

  showDamageFlash() {
    this.damageOverlay.classList.remove('hidden');
    clearTimeout(this._dmgTimer);
    this._dmgTimer = setTimeout(() => this.damageOverlay.classList.add('hidden'), 400);
  }

  addKillfeed(killer, victim) {
    const div = document.createElement('div');
    div.className = 'killfeed-item';
    div.textContent = killer + '  >>  ' + victim;
    this.killfeed.appendChild(div);
    setTimeout(() => div.remove(), 5000);
  }

  showVehicleHUD(name, hp, maxHp) {
    this.vehicleHud.classList.remove('hidden');
    this.vehicleName.textContent = name;
    this.vehicleHealthFill.style.width = (hp / maxHp * 100) + '%';
  }
  hideVehicleHUD() { this.vehicleHud.classList.add('hidden'); }

  showInteract() { this.interactPrompt.classList.remove('hidden'); }
  hideInteract() { this.interactPrompt.classList.add('hidden'); }

  // ── Minimap ──
  updateMinimap(playerPos, playerYaw, enemies, vehicles, allies) {
    const ctx = this.minimapCtx;
    ctx.clearRect(0, 0, 180, 180);

    ctx.fillStyle = 'rgba(20,30,20,0.85)';
    ctx.beginPath(); ctx.arc(90, 90, 90, 0, Math.PI * 2); ctx.fill();

    ctx.save();
    ctx.translate(90, 90);
    ctx.rotate(-playerYaw);

    // Enemies — only show when alert (detected player)
    ctx.fillStyle = '#ef4444';
    for (const e of enemies) {
      if (!e.alive) continue;
      if (e.alertLevel < 1) continue; // hidden if unaware
      const dx = (e.mesh.position.x - playerPos.x) * 0.35;
      const dz = (e.mesh.position.z - playerPos.z) * 0.35;
      if (Math.abs(dx) < 85 && Math.abs(dz) < 85) {
        ctx.beginPath(); ctx.arc(dx, dz, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Allies — blue dots
    if (allies) {
      ctx.fillStyle = '#4a9eff';
      for (const a of allies) {
        if (!a.alive) continue;
        const dx = (a.mesh.position.x - playerPos.x) * 0.35;
        const dz = (a.mesh.position.z - playerPos.z) * 0.35;
        if (Math.abs(dx) < 85 && Math.abs(dz) < 85) {
          ctx.beginPath(); ctx.arc(dx, dz, 2.5, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    ctx.fillStyle = '#60a5fa';
    for (const v of vehicles) {
      if (!v.alive) continue;
      const dx = (v.mesh.position.x - playerPos.x) * 0.35;
      const dz = (v.mesh.position.z - playerPos.z) * 0.35;
      if (Math.abs(dx) < 85 && Math.abs(dz) < 85) {
        ctx.fillRect(dx - 3, dz - 3, 6, 6);
      }
    }
    ctx.restore();

    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.moveTo(90, 84); ctx.lineTo(86, 96); ctx.lineTo(94, 96);
    ctx.closePath(); ctx.fill();
  }

  updateScoreboard(player, enemies) {
    const body = document.getElementById('scoreboard-body');
    const alive = enemies.filter(e => e.alive).length;
    const dead = enemies.filter(e => !e.alive).length;
    body.innerHTML =
      '<tr style="color:#4ade80"><td>You</td><td>' + player.kills + '</td><td>' + player.deaths + '</td><td>' + player.score + '</td></tr>' +
      '<tr><td>Enemies (alive)</td><td colspan="3">' + alive + '</td></tr>' +
      '<tr><td>Enemies (killed)</td><td colspan="3">' + dead + '</td></tr>';
  }
}
