// Three.js Scene Setup: renderer, camera, sky dome, lights, materials
import * as THREE from 'three';
import G from './globals.js';

// ---- 15 Sky Themes ----
export const SKY_THEMES = [
  { name: 'Twilight',       sky: ['#05051a','#0a0830','#120f45','#1e1260','#3a1878','#6a2088','#9a3070','#c84860','#e87050','#f0a050','#f8c870','#ffe0a0'], fog: 0x1a1030, bg: 0x0a0820, aurora: [[80,255,180],[100,200,255],[150,100,255]], auroraOp: 0.08 },
  { name: 'Midnight Blue',  sky: ['#020210','#050520','#0a0a38','#101060','#181888','#2020a0','#2830b0','#3040c0','#4060d0','#6090e0','#90c0f0','#c0e0ff'], fog: 0x080828, bg: 0x030318, aurora: [[60,120,255],[80,160,255],[120,200,255]], auroraOp: 0.06 },
  { name: 'Sunset Blaze',   sky: ['#0a0008','#1a0010','#300820','#501030','#802040','#b03040','#d05020','#e07010','#f09020','#f0b040','#f8d070','#fff0b0'], fog: 0x2a1018, bg: 0x150008, aurora: [[255,120,60],[255,180,80],[255,220,120]], auroraOp: 0.07 },
  { name: 'Northern Lights', sky: ['#020812','#041420','#082030','#0c3040','#104050','#185060','#206070','#307080','#409090','#60b0a0','#90d8c0','#c0ffe0'], fog: 0x082820, bg: 0x041410, aurora: [[40,255,180],[60,255,220],[100,255,200]], auroraOp: 0.14 },
  { name: 'Cherry Blossom', sky: ['#100818','#200820','#381030','#501840','#702858','#904070','#b06088','#c880a0','#d8a0b0','#e8c0c8','#f0d8d8','#fff0f0'], fog: 0x281828, bg: 0x140810, aurora: [[255,140,180],[255,180,200],[255,120,160]], auroraOp: 0.06 },
  { name: 'Deep Space',     sky: ['#000005','#000008','#000010','#000018','#020020','#040030','#060040','#080450','#100860','#180c70','#201080','#281890'], fog: 0x060018, bg: 0x000008, aurora: [[100,50,255],[140,80,255],[180,100,255]], auroraOp: 0.05 },
  { name: 'Golden Hour',    sky: ['#0a0810','#181020','#282030','#403030','#604030','#806030','#a08020','#c0a010','#d8c020','#e8d840','#f0e870','#fff8a0'], fog: 0x282018, bg: 0x141008, aurora: [[255,220,80],[255,200,100],[255,180,60]], auroraOp: 0.05 },
  { name: 'Arctic Dawn',    sky: ['#081020','#102030','#183040','#204050','#285060','#306878','#408890','#58a8a8','#78c8c0','#a0e0d8','#c0f0e8','#e8fff8'], fog: 0x183838, bg: 0x0c1820, aurora: [[120,255,240],[160,255,255],[100,220,255]], auroraOp: 0.10 },
  { name: 'Volcanic',       sky: ['#0a0400','#1a0800','#301000','#481800','#602000','#803000','#a04000','#c05010','#d86820','#e88030','#f0a050','#ffc880'], fog: 0x281808, bg: 0x140800, aurora: [[255,80,20],[255,120,40],[255,60,10]], auroraOp: 0.08 },
  { name: 'Mystic Forest',  sky: ['#040a08','#081810','#0c2818','#103820','#184828','#205830','#286838','#307840','#408850','#58a060','#78b878','#a0d8a0'], fog: 0x0c2810, bg: 0x061008, aurora: [[80,255,120],[100,255,160],[60,200,100]], auroraOp: 0.09 },
  { name: 'Nebula',         sky: ['#080010','#100020','#200038','#300050','#480068','#600880','#781098','#9020b0','#a838c0','#c050d0','#d070e0','#e0a0f0'], fog: 0x180830, bg: 0x0c0018, aurora: [[200,80,255],[160,120,255],[255,100,200]], auroraOp: 0.10 },
  { name: 'Ocean Night',    sky: ['#000810','#001020','#002030','#003040','#004060','#005080','#0868a0','#1080b8','#2098c8','#40b0d8','#70c8e0','#a8e0f0'], fog: 0x002840, bg: 0x001018, aurora: [[40,180,255],[60,200,255],[80,160,240]], auroraOp: 0.07 },
  { name: 'Desert Stars',   sky: ['#0a0808','#181010','#282018','#383020','#504030','#685040','#806850','#988060','#b09870','#c8b088','#e0c8a0','#f0e0c0'], fog: 0x282018, bg: 0x141008, aurora: [[255,200,120],[255,180,100],[240,160,80]], auroraOp: 0.04 },
  { name: 'Crystal Cave',   sky: ['#080818','#101028','#181838','#202850','#283868','#304880','#386098','#4878b0','#5890c0','#70a8d0','#90c0e0','#b8d8f0'], fog: 0x182838, bg: 0x0c1018, aurora: [[140,200,255],[180,220,255],[100,180,255]], auroraOp: 0.08 },
  { name: 'Emerald Dusk',   sky: ['#040808','#081410','#0c2018','#102c20','#183828','#204430','#285038','#306040','#387048','#488858','#60a068','#80c088'], fog: 0x102818, bg: 0x080c08, aurora: [[80,255,140],[100,240,120],[60,200,100]], auroraOp: 0.07 },
];

// Constants
export const CW = 40;
export const CH = 30;
export const BORDER_H = 0.8;
export const BALL_R = 0.3;
export const HOLE_R = 0.55;

// ---- Biome System: theme changes every 10 tournaments ----
export const BIOMES = [
  {
    name: 'Classic Meadow',
    grass: 0x2a8a48, grassStripe1: '#1e7838', grassStripe2: '#268842', grassStripe3: '#2a924a',
    fringeColor: 0x267840, fringeGrad: ['#1e6e38','#257840','#1a6430'],
    borderColor: 0x2a5035, borderTopColor: 0x2a6640, borderStone: '#3a5c3a',
    treeLeaf: [0x1e6b30, 0x267a38, 0x2e8840], treeTrunk: 0x6b4520,
    flowerColors: [0xff6b6b, 0xffd93d, 0xc792ea, 0xff8a5c, 0x48dbfb, 0xff9ff3],
    mushroomCap: [0xcc2222, 0xc8a050],
    waterColor: 0x2299cc, pondBed: 0x14384e,
    ambientColor: 0xd4e8ff, ambientIntensity: 0.3,
    hemiSky: 0xb0d8ff, hemiGround: 0x3a7030,
    sunColor: 0xffe8c8, sunIntensity: 2.2,
    fogDensity: 0.003,
  },
  {
    name: 'Frozen Tundra',
    grass: 0x6b8fa8, grassStripe1: '#4a7a90', grassStripe2: '#5a8898', grassStripe3: '#6b96a8',
    fringeColor: 0x5a8494, fringeGrad: ['#4a7080','#5a8494','#4a6878'],
    borderColor: 0x4a6878, borderTopColor: 0x7098a8, borderStone: '#506878',
    treeLeaf: [0x4a8098, 0x5a8ea8, 0x6a9ab0], treeTrunk: 0x8a9aa8,
    flowerColors: [0x88ccff, 0xaaeeff, 0xddeeff, 0x77bbdd, 0xbbddff, 0x99ccee],
    mushroomCap: [0x5588aa, 0x88aacc],
    waterColor: 0x55aacc, pondBed: 0x1a3850,
    ambientColor: 0xc8e0ff, ambientIntensity: 0.4,
    hemiSky: 0xaaccee, hemiGround: 0x4a6a80,
    sunColor: 0xdde8ff, sunIntensity: 1.8,
    fogDensity: 0.004,
  },
  {
    name: 'Autumn Forest',
    grass: 0x6a8a38, grassStripe1: '#5a7a28', grassStripe2: '#688832', grassStripe3: '#7a983a',
    fringeColor: 0x607a30, fringeGrad: ['#4a6820','#607a30','#506a28'],
    borderColor: 0x5a4830, borderTopColor: 0x7a6840, borderStone: '#5a4a30',
    treeLeaf: [0xcc6622, 0xdd8833, 0xbb4411], treeTrunk: 0x5a3a18,
    flowerColors: [0xff8833, 0xffaa44, 0xdd6622, 0xcc4411, 0xffcc55, 0xee7744],
    mushroomCap: [0xaa5522, 0x886633],
    waterColor: 0x3a7a55, pondBed: 0x1a3028,
    ambientColor: 0xffe8cc, ambientIntensity: 0.35,
    hemiSky: 0xffddaa, hemiGround: 0x5a4a20,
    sunColor: 0xffcc88, sunIntensity: 2.5,
    fogDensity: 0.003,
  },
  {
    name: 'Volcanic Wasteland',
    grass: 0x3a3830, grassStripe1: '#2a2820', grassStripe2: '#3a3628', grassStripe3: '#4a4430',
    fringeColor: 0x2a2620, fringeGrad: ['#1a1810','#2a2620','#1e1a14'],
    borderColor: 0x2a2018, borderTopColor: 0x4a3828, borderStone: '#3a2a1a',
    treeLeaf: [0x1a1a12, 0x2a2a18, 0x3a3a1e], treeTrunk: 0x2a1a0a,
    flowerColors: [0xff4400, 0xff6600, 0xff2200, 0xee8800, 0xffaa00, 0xcc3300],
    mushroomCap: [0xff3300, 0xcc6600],
    waterColor: 0xcc4400, pondBed: 0x2a1008,
    ambientColor: 0xffccaa, ambientIntensity: 0.25,
    hemiSky: 0xff8855, hemiGround: 0x3a2010,
    sunColor: 0xffaa66, sunIntensity: 1.8,
    fogDensity: 0.005,
  },
  {
    name: 'Cherry Blossom Garden',
    grass: 0x3a8a50, grassStripe1: '#2a7a40', grassStripe2: '#3a8848', grassStripe3: '#4a9858',
    fringeColor: 0x308040, fringeGrad: ['#287838','#308040','#287030'],
    borderColor: 0x6a4858, borderTopColor: 0x8a6878, borderStone: '#5a3848',
    treeLeaf: [0xff88aa, 0xffaacc, 0xff77aa], treeTrunk: 0x6a4030,
    flowerColors: [0xff88bb, 0xffaacc, 0xff66aa, 0xff99cc, 0xffbbdd, 0xff55aa],
    mushroomCap: [0xdd88aa, 0xeeaacc],
    waterColor: 0x55aacc, pondBed: 0x1a2a48,
    ambientColor: 0xffddf0, ambientIntensity: 0.35,
    hemiSky: 0xffccdd, hemiGround: 0x4a6a30,
    sunColor: 0xffe0d0, sunIntensity: 2.0,
    fogDensity: 0.003,
  },
  {
    name: 'Enchanted Mushroom',
    grass: 0x1a6a48, grassStripe1: '#105a38', grassStripe2: '#1a6842', grassStripe3: '#2a784a',
    fringeColor: 0x186040, fringeGrad: ['#0e5430','#186040','#124a30'],
    borderColor: 0x3a2848, borderTopColor: 0x5a4868, borderStone: '#3a2840',
    treeLeaf: [0x0a5a30, 0x1a6a38, 0x2a7a40], treeTrunk: 0x4a2a18,
    flowerColors: [0xaa44ff, 0xcc66ff, 0x8822dd, 0xbb55ff, 0xdd88ff, 0x7711cc],
    mushroomCap: [0xff2244, 0xaa33ff],
    waterColor: 0x228888, pondBed: 0x0a2828,
    ambientColor: 0xccddff, ambientIntensity: 0.25,
    hemiSky: 0x88aadd, hemiGround: 0x1a4a28,
    sunColor: 0xddccff, sunIntensity: 1.6,
    fogDensity: 0.004,
  },
  {
    name: 'Desert Oasis',
    grass: 0xa89868, grassStripe1: '#988858', grassStripe2: '#a89660', grassStripe3: '#b8a870',
    fringeColor: 0x988858, fringeGrad: ['#887848','#988858','#887048'],
    borderColor: 0x8a7a58, borderTopColor: 0xaa9a78, borderStone: '#7a6a48',
    treeLeaf: [0x4a8a30, 0x5a9a38, 0x3a7a28], treeTrunk: 0x8a6a38,
    flowerColors: [0xffcc44, 0xffaa22, 0xff8800, 0xffdd66, 0xddaa33, 0xffbb44],
    mushroomCap: [0xccaa55, 0xaa8844],
    waterColor: 0x44aaaa, pondBed: 0x1a3838,
    ambientColor: 0xfff0cc, ambientIntensity: 0.4,
    hemiSky: 0xffe8c0, hemiGround: 0x8a7a48,
    sunColor: 0xffddaa, sunIntensity: 2.8,
    fogDensity: 0.002,
  },
  {
    name: 'Crystal Cavern',
    grass: 0x2a4a68, grassStripe1: '#1a3a58', grassStripe2: '#2a4860', grassStripe3: '#3a5a70',
    fringeColor: 0x224458, fringeGrad: ['#1a3848','#224458','#183040'],
    borderColor: 0x3a5068, borderTopColor: 0x5a7088, borderStone: '#2a4058',
    treeLeaf: [0x4488aa, 0x5598bb, 0x66aacc], treeTrunk: 0x4a5a6a,
    flowerColors: [0x44ddff, 0x88eeff, 0x22ccff, 0x66ccff, 0xaaeeff, 0x00bbee],
    mushroomCap: [0x3388cc, 0x55aadd],
    waterColor: 0x3388bb, pondBed: 0x0a2040,
    ambientColor: 0xaaccff, ambientIntensity: 0.3,
    hemiSky: 0x88bbff, hemiGround: 0x2a4058,
    sunColor: 0xccddff, sunIntensity: 1.5,
    fogDensity: 0.005,
  },
  {
    name: 'Neon Cyber',
    grass: 0x1a2a1a, grassStripe1: '#0a1a0a', grassStripe2: '#1a281a', grassStripe3: '#2a3a2a',
    fringeColor: 0x142414, fringeGrad: ['#0a180a','#142414','#0e1c0e'],
    borderColor: 0x0a2a2a, borderTopColor: 0x1a4a4a, borderStone: '#0a2020',
    treeLeaf: [0x00ff88, 0x00ddaa, 0x00ffcc], treeTrunk: 0x1a3a2a,
    flowerColors: [0x00ff88, 0xff00ff, 0x00ffff, 0xffff00, 0xff4444, 0x8800ff],
    mushroomCap: [0xff00ff, 0x00ffff],
    waterColor: 0x00aaaa, pondBed: 0x001a1a,
    ambientColor: 0x88ffcc, ambientIntensity: 0.2,
    hemiSky: 0x44ffaa, hemiGround: 0x0a2a1a,
    sunColor: 0xaaffcc, sunIntensity: 1.4,
    fogDensity: 0.006,
  },
  {
    name: 'Space',
    space: true,
    grass: 0x0a0a1a, grassStripe1: '#060612', grassStripe2: '#0a0a18', grassStripe3: '#141428',
    fringeColor: 0x080816, fringeGrad: ['#040410','#080816','#060612'],
    borderColor: 0x181838, borderTopColor: 0x303060, borderStone: '#181830',
    treeLeaf: [0x334488, 0x445599, 0x5566aa], treeTrunk: 0x222244,
    flowerColors: [0x44ddff, 0xffffff, 0x8888ff, 0x44ffaa, 0xaaddff, 0xff88ff],
    mushroomCap: [0x4444aa, 0x6666cc],
    waterColor: 0x112266, pondBed: 0x040418,
    ambientColor: 0x6666cc, ambientIntensity: 0.15,
    hemiSky: 0x333388, hemiGround: 0x0a0a1a,
    sunColor: 0x8888cc, sunIntensity: 0.8,
    fogDensity: 0.003,
  },
  // ---- 11-20 ----
  {
    name: 'Tropical Paradise',
    grass: 0x1e9a40, grassStripe1: '#128a30', grassStripe2: '#1e9838', grassStripe3: '#28a848',
    fringeColor: 0x189038, fringeGrad: ['#108828','#189038','#0e7a28'],
    borderColor: 0x6a5030, borderTopColor: 0x8a7040, borderStone: '#5a4020',
    treeLeaf: [0x1e8a28, 0x28a838, 0x3ab848], treeTrunk: 0x7a5020,
    flowerColors: [0xff4488, 0xff8844, 0xffcc22, 0xff2266, 0xff6622, 0xffaa00],
    mushroomCap: [0x22aa44, 0x44cc66],
    waterColor: 0x00bbcc, pondBed: 0x0a3038,
    ambientColor: 0xe0fff0, ambientIntensity: 0.35,
    hemiSky: 0x80e8c0, hemiGround: 0x2a7a28,
    sunColor: 0xfff0c0, sunIntensity: 2.6,
    fogDensity: 0.002,
  },
  {
    name: 'Haunted Graveyard',
    grass: 0x2a3a28, grassStripe1: '#1a2a18', grassStripe2: '#283822', grassStripe3: '#384830',
    fringeColor: 0x223420, fringeGrad: ['#1a2c18','#223420','#182a14'],
    borderColor: 0x3a3838, borderTopColor: 0x5a5858, borderStone: '#3a3838',
    treeLeaf: [0x1a2a14, 0x283818, 0x384820], treeTrunk: 0x3a2a1a,
    flowerColors: [0x884488, 0x666688, 0x445566, 0x998888, 0x665577, 0x554466],
    mushroomCap: [0x444466, 0x555588],
    waterColor: 0x224422, pondBed: 0x0a1a0a,
    ambientColor: 0x889988, ambientIntensity: 0.15,
    hemiSky: 0x556655, hemiGround: 0x1a2a18,
    sunColor: 0x889988, sunIntensity: 0.8,
    fogDensity: 0.008,
  },
  {
    name: 'Candy Land',
    grass: 0x66bb55, grassStripe1: '#55aa44', grassStripe2: '#66bb55', grassStripe3: '#77cc66',
    fringeColor: 0x55aa44, fringeGrad: ['#44993a','#55aa44','#449938'],
    borderColor: 0xcc6688, borderTopColor: 0xee88aa, borderStone: '#bb5577',
    treeLeaf: [0xff88aa, 0xffaa55, 0x88ddff], treeTrunk: 0xcc8844,
    flowerColors: [0xff66aa, 0x66ddff, 0xffdd44, 0xff8866, 0xaa66ff, 0x66ffaa],
    mushroomCap: [0xff4488, 0x44ccff],
    waterColor: 0x88bbff, pondBed: 0x2a3a58,
    ambientColor: 0xffeeff, ambientIntensity: 0.45,
    hemiSky: 0xffccdd, hemiGround: 0x55aa44,
    sunColor: 0xfff0e0, sunIntensity: 2.4,
    fogDensity: 0.002,
  },
  {
    name: 'Underwater Depths',
    grass: 0x1a4a5a, grassStripe1: '#103a4a', grassStripe2: '#1a4858', grassStripe3: '#2a5a68',
    fringeColor: 0x144450, fringeGrad: ['#0e3a48','#144450','#0a3040'],
    borderColor: 0x1a3848, borderTopColor: 0x2a5868, borderStone: '#1a3040',
    treeLeaf: [0x1a8a6a, 0x2a9a78, 0x3aaa88], treeTrunk: 0x2a5a5a,
    flowerColors: [0x44ddbb, 0x22ccaa, 0x66eedd, 0x00bbaa, 0x88ffee, 0x33ddcc],
    mushroomCap: [0x2288aa, 0x44aacc],
    waterColor: 0x1166aa, pondBed: 0x081838,
    ambientColor: 0x88ccee, ambientIntensity: 0.2,
    hemiSky: 0x4488cc, hemiGround: 0x1a3a48,
    sunColor: 0x88bbdd, sunIntensity: 1.2,
    fogDensity: 0.007,
  },
  {
    name: 'Sakura Twilight',
    grass: 0x3a6a48, grassStripe1: '#2a5a38', grassStripe2: '#386840', grassStripe3: '#487a50',
    fringeColor: 0x306240, fringeGrad: ['#285a38','#306240','#245230'],
    borderColor: 0x5a3848, borderTopColor: 0x7a5868, borderStone: '#4a2838',
    treeLeaf: [0xee88bb, 0xff99cc, 0xdd77aa], treeTrunk: 0x5a3028,
    flowerColors: [0xff88cc, 0xffaadd, 0xff66bb, 0xff44aa, 0xffccee, 0xee55aa],
    mushroomCap: [0xcc6699, 0xdd88aa],
    waterColor: 0x4488aa, pondBed: 0x182840,
    ambientColor: 0xffe0f0, ambientIntensity: 0.3,
    hemiSky: 0xffbbcc, hemiGround: 0x3a5a30,
    sunColor: 0xffd0e0, sunIntensity: 1.8,
    fogDensity: 0.004,
  },
  {
    name: 'Arctic Glacier',
    grass: 0x88aacc, grassStripe1: '#7899bb', grassStripe2: '#88a8cc', grassStripe3: '#98badd',
    fringeColor: 0x7a9abc, fringeGrad: ['#6a8aaa','#7a9abc','#5a7a98'],
    borderColor: 0x5a7a98, borderTopColor: 0x8aaabb, borderStone: '#4a6a88',
    treeLeaf: [0x88bbdd, 0x99ccee, 0xaaddff], treeTrunk: 0x7a8a9a,
    flowerColors: [0xccddff, 0xaaccff, 0xeef0ff, 0xbbccee, 0xddeeff, 0x99bbee],
    mushroomCap: [0x6699cc, 0x88bbdd],
    waterColor: 0x44aadd, pondBed: 0x0a2848,
    ambientColor: 0xd0e8ff, ambientIntensity: 0.45,
    hemiSky: 0xbbddff, hemiGround: 0x6688aa,
    sunColor: 0xe8f0ff, sunIntensity: 2.0,
    fogDensity: 0.003,
  },
  {
    name: 'Savanna Sunset',
    grass: 0x88783a, grassStripe1: '#78682a', grassStripe2: '#887838', grassStripe3: '#988840',
    fringeColor: 0x787030, fringeGrad: ['#686028','#787030','#585820'],
    borderColor: 0x6a5828, borderTopColor: 0x8a7838, borderStone: '#5a4820',
    treeLeaf: [0x5a7a20, 0x6a8a28, 0x4a6a18], treeTrunk: 0x6a4a20,
    flowerColors: [0xffaa44, 0xff8822, 0xffcc66, 0xdd7722, 0xffbb55, 0xee9933],
    mushroomCap: [0xaa7738, 0xcc9955],
    waterColor: 0x557744, pondBed: 0x1a2a18,
    ambientColor: 0xffeedd, ambientIntensity: 0.35,
    hemiSky: 0xffcc88, hemiGround: 0x6a5a28,
    sunColor: 0xffbb77, sunIntensity: 2.6,
    fogDensity: 0.003,
  },
  {
    name: 'Moonlit Marsh',
    grass: 0x2a4a38, grassStripe1: '#1a3a28', grassStripe2: '#284832', grassStripe3: '#3a5a40',
    fringeColor: 0x224430, fringeGrad: ['#1a3c28','#224430','#183420'],
    borderColor: 0x2a3a30, borderTopColor: 0x4a5a48, borderStone: '#2a3a28',
    treeLeaf: [0x1a5a38, 0x286a40, 0x387a48], treeTrunk: 0x3a3a2a,
    flowerColors: [0x66bbaa, 0x44aa99, 0x88ccbb, 0x22aa88, 0x55bb99, 0x77ccaa],
    mushroomCap: [0x338866, 0x55aa88],
    waterColor: 0x224455, pondBed: 0x0a1828,
    ambientColor: 0xaabbcc, ambientIntensity: 0.18,
    hemiSky: 0x667788, hemiGround: 0x2a3a28,
    sunColor: 0xbbccdd, sunIntensity: 1.0,
    fogDensity: 0.006,
  },
  {
    name: 'Coral Reef',
    grass: 0x1a6a6a, grassStripe1: '#0a5a5a', grassStripe2: '#1a6868', grassStripe3: '#2a7a78',
    fringeColor: 0x156060, fringeGrad: ['#0e5858','#156060','#0a4a4a'],
    borderColor: 0x2a5858, borderTopColor: 0x4a7878, borderStone: '#1a4848',
    treeLeaf: [0xff6688, 0xffaa44, 0xaa44ff], treeTrunk: 0x4a6a68,
    flowerColors: [0xff4488, 0xff8844, 0xaa44ff, 0x44ddff, 0xffcc22, 0x88ff66],
    mushroomCap: [0xff4466, 0xaa33dd],
    waterColor: 0x2288aa, pondBed: 0x082838,
    ambientColor: 0x88ddee, ambientIntensity: 0.3,
    hemiSky: 0x55bbdd, hemiGround: 0x1a5858,
    sunColor: 0x99ddee, sunIntensity: 1.6,
    fogDensity: 0.005,
  },
  {
    name: 'Bamboo Grove',
    grass: 0x3a8a38, grassStripe1: '#2a7a28', grassStripe2: '#388838', grassStripe3: '#48984a',
    fringeColor: 0x308030, fringeGrad: ['#287828','#308030','#206a20'],
    borderColor: 0x4a6a38, borderTopColor: 0x6a8a58, borderStone: '#3a5a28',
    treeLeaf: [0x48a838, 0x58b848, 0x68c858], treeTrunk: 0x88aa48,
    flowerColors: [0xffffff, 0xeeffee, 0xddffdd, 0xcceecc, 0xbbddbb, 0xaaccaa],
    mushroomCap: [0x558844, 0x77aa66],
    waterColor: 0x448866, pondBed: 0x102828,
    ambientColor: 0xddffdd, ambientIntensity: 0.35,
    hemiSky: 0xaaddaa, hemiGround: 0x387838,
    sunColor: 0xeeffdd, sunIntensity: 2.0,
    fogDensity: 0.003,
  },
  // ---- 21-30 ----
  {
    name: 'Steampunk Factory',
    grass: 0x4a4838, grassStripe1: '#3a3828', grassStripe2: '#484632', grassStripe3: '#585840',
    fringeColor: 0x3a3828, fringeGrad: ['#2a2818','#3a3828','#282618'],
    borderColor: 0x5a4830, borderTopColor: 0x7a6848, borderStone: '#4a3820',
    treeLeaf: [0x888850, 0x999960, 0x7a7a40], treeTrunk: 0x5a4a28,
    flowerColors: [0xffaa44, 0xcc8833, 0xddaa55, 0xbb7722, 0xeebb66, 0xaa6611],
    mushroomCap: [0x888855, 0xaaaa77],
    waterColor: 0x556638, pondBed: 0x1a2818,
    ambientColor: 0xeedd99, ambientIntensity: 0.25,
    hemiSky: 0xbbaa66, hemiGround: 0x4a4828,
    sunColor: 0xffcc88, sunIntensity: 1.8,
    fogDensity: 0.005,
  },
  {
    name: 'Lavender Fields',
    grass: 0x4a7848, grassStripe1: '#3a6838', grassStripe2: '#4a7640', grassStripe3: '#5a8850',
    fringeColor: 0x407038, fringeGrad: ['#386830','#407038','#305a28'],
    borderColor: 0x6a5878, borderTopColor: 0x8a7898, borderStone: '#5a4868',
    treeLeaf: [0x6a8850, 0x7a9860, 0x5a7840], treeTrunk: 0x5a4030,
    flowerColors: [0xaa66dd, 0xcc88ee, 0x8844cc, 0xbb77dd, 0xdd99ff, 0x7733bb],
    mushroomCap: [0x8855aa, 0xaa77cc],
    waterColor: 0x5577aa, pondBed: 0x182840,
    ambientColor: 0xeeddff, ambientIntensity: 0.35,
    hemiSky: 0xccaaee, hemiGround: 0x4a6838,
    sunColor: 0xffeedd, sunIntensity: 2.2,
    fogDensity: 0.003,
  },
  {
    name: 'Radioactive Waste',
    grass: 0x283a18, grassStripe1: '#182a08', grassStripe2: '#263812', grassStripe3: '#384a22',
    fringeColor: 0x203010, fringeGrad: ['#182808','#203010','#142208'],
    borderColor: 0x2a2a18, borderTopColor: 0x4a4a30, borderStone: '#2a2a18',
    treeLeaf: [0x44cc00, 0x66dd22, 0x88ee44], treeTrunk: 0x3a3a1a,
    flowerColors: [0x44ff00, 0x88ff44, 0x00ff44, 0xaaff66, 0x22ff22, 0x66ff00],
    mushroomCap: [0x22dd00, 0x44ff22],
    waterColor: 0x44aa00, pondBed: 0x0a2800,
    ambientColor: 0xaaff88, ambientIntensity: 0.25,
    hemiSky: 0x66cc44, hemiGround: 0x223a10,
    sunColor: 0xccff88, sunIntensity: 1.6,
    fogDensity: 0.006,
  },
  {
    name: 'Sunset Beach',
    grass: 0xbbaa78, grassStripe1: '#aa9968', grassStripe2: '#bba870', grassStripe3: '#ccbb80',
    fringeColor: 0xaa9868, fringeGrad: ['#998858','#aa9868','#888050'],
    borderColor: 0x8a7a58, borderTopColor: 0xaa9a78, borderStone: '#7a6a48',
    treeLeaf: [0x3a8a30, 0x4a9a38, 0x2a7a28], treeTrunk: 0x8a6a30,
    flowerColors: [0xff6644, 0xff8855, 0xffaa66, 0xff4422, 0xffcc88, 0xee7744],
    mushroomCap: [0xaa8855, 0xcc9966],
    waterColor: 0x3399bb, pondBed: 0x0a2838,
    ambientColor: 0xffe0cc, ambientIntensity: 0.4,
    hemiSky: 0xffccaa, hemiGround: 0x8a7a48,
    sunColor: 0xffbb88, sunIntensity: 2.6,
    fogDensity: 0.002,
  },
  {
    name: 'Gothic Castle',
    grass: 0x2a3828, grassStripe1: '#1a2818', grassStripe2: '#283620', grassStripe3: '#384830',
    fringeColor: 0x223020, fringeGrad: ['#1a2818','#223020','#182014'],
    borderColor: 0x3a3840, borderTopColor: 0x5a5860, borderStone: '#3a3840',
    treeLeaf: [0x1a3a20, 0x2a4a28, 0x3a5a30], treeTrunk: 0x2a2a2a,
    flowerColors: [0x882244, 0xaa3366, 0x661133, 0xcc4488, 0x991144, 0x772255],
    mushroomCap: [0x442244, 0x663366],
    waterColor: 0x223344, pondBed: 0x081018,
    ambientColor: 0x8888aa, ambientIntensity: 0.15,
    hemiSky: 0x445566, hemiGround: 0x1a2a18,
    sunColor: 0x8888aa, sunIntensity: 0.9,
    fogDensity: 0.007,
  },
  {
    name: 'Rainbow Valley',
    grass: 0x44aa44, grassStripe1: '#339933', grassStripe2: '#44aa44', grassStripe3: '#55bb55',
    fringeColor: 0x339933, fringeGrad: ['#228822','#339933','#228822'],
    borderColor: 0x4488cc, borderTopColor: 0x66aaee, borderStone: '#3377bb',
    treeLeaf: [0xff4444, 0xffaa22, 0x4488ff], treeTrunk: 0x885522,
    flowerColors: [0xff0000, 0xff8800, 0xffff00, 0x00ff00, 0x0088ff, 0xaa00ff],
    mushroomCap: [0xff4488, 0x4488ff],
    waterColor: 0x44aadd, pondBed: 0x0a2848,
    ambientColor: 0xffffff, ambientIntensity: 0.4,
    hemiSky: 0xddddff, hemiGround: 0x44aa44,
    sunColor: 0xffffff, sunIntensity: 2.4,
    fogDensity: 0.002,
  },
  {
    name: 'Witch Forest',
    grass: 0x1a4a2a, grassStripe1: '#0a3a1a', grassStripe2: '#184828', grassStripe3: '#2a5a38',
    fringeColor: 0x144022, fringeGrad: ['#0e381a','#144022','#0a3018'],
    borderColor: 0x2a2a38, borderTopColor: 0x4a4a58, borderStone: '#2a2a30',
    treeLeaf: [0x0a3a1a, 0x1a4a28, 0x2a5a30], treeTrunk: 0x2a1a0a,
    flowerColors: [0xcc44ff, 0x8800dd, 0xaa22ff, 0x6600bb, 0xee66ff, 0x7711cc],
    mushroomCap: [0xcc22ff, 0x8800dd],
    waterColor: 0x114444, pondBed: 0x061818,
    ambientColor: 0x9988cc, ambientIntensity: 0.18,
    hemiSky: 0x554488, hemiGround: 0x1a3a18,
    sunColor: 0xaa99dd, sunIntensity: 1.0,
    fogDensity: 0.007,
  },
  {
    name: 'Snow Mountain',
    grass: 0x9ab0c0, grassStripe1: '#88a0b0', grassStripe2: '#98aec0', grassStripe3: '#a8c0d0',
    fringeColor: 0x8aa8b8, fringeGrad: ['#7a98a8','#8aa8b8','#6a88a0'],
    borderColor: 0x6a8898, borderTopColor: 0x8aa8b8, borderStone: '#5a7888',
    treeLeaf: [0x2a6848, 0x3a7858, 0x4a8868], treeTrunk: 0x5a4a38,
    flowerColors: [0xddddff, 0xbbccee, 0xeeeeff, 0xaabbdd, 0xccddee, 0x99aacc],
    mushroomCap: [0x667788, 0x8899aa],
    waterColor: 0x4488bb, pondBed: 0x0a2040,
    ambientColor: 0xdde8ff, ambientIntensity: 0.4,
    hemiSky: 0xccddff, hemiGround: 0x7a8a9a,
    sunColor: 0xf0f0ff, sunIntensity: 2.2,
    fogDensity: 0.003,
  },
  {
    name: 'Ancient Ruins',
    grass: 0x5a7a40, grassStripe1: '#4a6a30', grassStripe2: '#587838', grassStripe3: '#688a48',
    fringeColor: 0x4a7038, fringeGrad: ['#3a6028','#4a7038','#3a5828'],
    borderColor: 0x787058, borderTopColor: 0x989078, borderStone: '#686050',
    treeLeaf: [0x3a6a28, 0x4a7a38, 0x5a8a48], treeTrunk: 0x686048,
    flowerColors: [0xccbb88, 0xbbaa77, 0xddcc99, 0xaaaa66, 0xeedd8a, 0x999955],
    mushroomCap: [0x887766, 0xaa9988],
    waterColor: 0x448866, pondBed: 0x102828,
    ambientColor: 0xeee8cc, ambientIntensity: 0.3,
    hemiSky: 0xcccc88, hemiGround: 0x5a6a38,
    sunColor: 0xffeebb, sunIntensity: 2.0,
    fogDensity: 0.004,
  },
  {
    name: 'Alien Planet',
    grass: 0x4a2868, grassStripe1: '#3a1858', grassStripe2: '#482660', grassStripe3: '#5a3878',
    fringeColor: 0x3a2058, fringeGrad: ['#2a1848','#3a2058','#281440'],
    borderColor: 0x3a2858, borderTopColor: 0x5a4878, borderStone: '#2a1848',
    treeLeaf: [0x8844cc, 0x9955dd, 0xaa66ee], treeTrunk: 0x4a3868,
    flowerColors: [0xff44aa, 0x44ffdd, 0xffff44, 0xff4444, 0x44ff44, 0xaa44ff],
    mushroomCap: [0xff22aa, 0x44ffaa],
    waterColor: 0x6622aa, pondBed: 0x1a0838,
    ambientColor: 0xcc88ff, ambientIntensity: 0.25,
    hemiSky: 0x8844cc, hemiGround: 0x3a1858,
    sunColor: 0xddaaff, sunIntensity: 1.5,
    fogDensity: 0.005,
  },
  // ---- 31-40 ----
  {
    name: 'Firefly Meadow',
    grass: 0x1a5a30, grassStripe1: '#0e4a20', grassStripe2: '#185828', grassStripe3: '#286a38',
    fringeColor: 0x145228, fringeGrad: ['#0e4a20','#145228','#0a4018'],
    borderColor: 0x2a3a28, borderTopColor: 0x4a5a48, borderStone: '#2a3a20',
    treeLeaf: [0x1a5a28, 0x286a38, 0x387a40], treeTrunk: 0x4a3a18,
    flowerColors: [0xffee44, 0xffdd22, 0xffcc00, 0xffaa00, 0xffff66, 0xeedd33],
    mushroomCap: [0x448844, 0x66aa66],
    waterColor: 0x225544, pondBed: 0x0a2018,
    ambientColor: 0xccddaa, ambientIntensity: 0.2,
    hemiSky: 0x77aa55, hemiGround: 0x1a4a20,
    sunColor: 0xddddaa, sunIntensity: 1.2,
    fogDensity: 0.005,
  },
  {
    name: 'Obsidian Peaks',
    grass: 0x282830, grassStripe1: '#181820', grassStripe2: '#262628', grassStripe3: '#383838',
    fringeColor: 0x1a1a22, fringeGrad: ['#121218','#1a1a22','#0e0e18'],
    borderColor: 0x2a2a38, borderTopColor: 0x4a4a58, borderStone: '#222230',
    treeLeaf: [0x2a2a3a, 0x3a3a4a, 0x4a4a5a], treeTrunk: 0x1a1a2a,
    flowerColors: [0x6644aa, 0x4488ff, 0x8866cc, 0x2266dd, 0xaa88ee, 0x3377cc],
    mushroomCap: [0x333348, 0x444458],
    waterColor: 0x1a2244, pondBed: 0x080818,
    ambientColor: 0x8888aa, ambientIntensity: 0.15,
    hemiSky: 0x444466, hemiGround: 0x1a1a28,
    sunColor: 0x9999bb, sunIntensity: 1.0,
    fogDensity: 0.006,
  },
  {
    name: 'Summer Vineyard',
    grass: 0x4a8838, grassStripe1: '#3a7828', grassStripe2: '#488630', grassStripe3: '#5a9840',
    fringeColor: 0x3a7a28, fringeGrad: ['#2a6a18','#3a7a28','#2a6218'],
    borderColor: 0x6a5838, borderTopColor: 0x8a7858, borderStone: '#5a4828',
    treeLeaf: [0x3a7828, 0x4a8838, 0x2a6818], treeTrunk: 0x6a4a20,
    flowerColors: [0x773388, 0x995599, 0x553377, 0xaa66aa, 0x884488, 0x664488],
    mushroomCap: [0x664488, 0x886688],
    waterColor: 0x3a7a5a, pondBed: 0x0e2818,
    ambientColor: 0xfff8dd, ambientIntensity: 0.38,
    hemiSky: 0xddcc88, hemiGround: 0x4a6828,
    sunColor: 0xffeeaa, sunIntensity: 2.5,
    fogDensity: 0.002,
  },
  {
    name: 'Frozen Lake',
    grass: 0x5a7a88, grassStripe1: '#4a6a78', grassStripe2: '#587888', grassStripe3: '#688a98',
    fringeColor: 0x4a7080, fringeGrad: ['#3a6070','#4a7080','#3a5868'],
    borderColor: 0x4a6070, borderTopColor: 0x6a8090, borderStone: '#3a5060',
    treeLeaf: [0x5a8a9a, 0x6a9aaa, 0x7aaabb], treeTrunk: 0x6a7a88,
    flowerColors: [0x88ccee, 0xaaddff, 0x66bbdd, 0xccddff, 0x77bbcc, 0xbbddee],
    mushroomCap: [0x5588aa, 0x77aacc],
    waterColor: 0x66bbdd, pondBed: 0x0a2838,
    ambientColor: 0xd0e0f0, ambientIntensity: 0.4,
    hemiSky: 0xaaccee, hemiGround: 0x5a7888,
    sunColor: 0xe0e8ff, sunIntensity: 1.8,
    fogDensity: 0.004,
  },
  {
    name: 'Pirate Cove',
    grass: 0x5a8848, grassStripe1: '#4a7838', grassStripe2: '#588640', grassStripe3: '#689850',
    fringeColor: 0x4a7838, fringeGrad: ['#3a6828','#4a7838','#3a6028'],
    borderColor: 0x6a5028, borderTopColor: 0x8a7040, borderStone: '#5a4020',
    treeLeaf: [0x2a6a22, 0x3a7a30, 0x1a5a18], treeTrunk: 0x6a4018,
    flowerColors: [0xffcc33, 0xff8822, 0xddaa44, 0xffaa00, 0xccaa22, 0xee9911],
    mushroomCap: [0x886633, 0xaa8855],
    waterColor: 0x2288aa, pondBed: 0x081838,
    ambientColor: 0xfff0cc, ambientIntensity: 0.35,
    hemiSky: 0xddcc88, hemiGround: 0x4a6828,
    sunColor: 0xffddaa, sunIntensity: 2.4,
    fogDensity: 0.003,
  },
  {
    name: 'Electric Storm',
    grass: 0x1a2838, grassStripe1: '#0a1828', grassStripe2: '#182630', grassStripe3: '#2a3848',
    fringeColor: 0x142028, fringeGrad: ['#0e1820','#142028','#0a1418'],
    borderColor: 0x1a2838, borderTopColor: 0x3a4858, borderStone: '#1a2030',
    treeLeaf: [0x1a3858, 0x2a4868, 0x3a5878], treeTrunk: 0x2a2a3a,
    flowerColors: [0x44ddff, 0x2288ff, 0x88eeff, 0x0066ff, 0xaaeeff, 0x4488ff],
    mushroomCap: [0x223358, 0x334468],
    waterColor: 0x1144aa, pondBed: 0x060828,
    ambientColor: 0x8899dd, ambientIntensity: 0.2,
    hemiSky: 0x3355aa, hemiGround: 0x1a2838,
    sunColor: 0x8899cc, sunIntensity: 1.2,
    fogDensity: 0.006,
  },
  {
    name: 'Golden Temple',
    grass: 0x4a7a38, grassStripe1: '#3a6a28', grassStripe2: '#487830', grassStripe3: '#5a8a40',
    fringeColor: 0x3a7028, fringeGrad: ['#2a6018','#3a7028','#2a5818'],
    borderColor: 0x8a7838, borderTopColor: 0xaa9858, borderStone: '#7a6828',
    treeLeaf: [0x3a7a28, 0x4a8a38, 0x2a6a18], treeTrunk: 0x8a6828,
    flowerColors: [0xffcc44, 0xffdd66, 0xffaa22, 0xffee88, 0xeebb33, 0xddaa22],
    mushroomCap: [0xccaa44, 0xeebb55],
    waterColor: 0x448855, pondBed: 0x102820,
    ambientColor: 0xffeecc, ambientIntensity: 0.35,
    hemiSky: 0xeecc66, hemiGround: 0x5a6a28,
    sunColor: 0xffddaa, sunIntensity: 2.4,
    fogDensity: 0.003,
  },
  {
    name: 'Misty Highlands',
    grass: 0x4a6a40, grassStripe1: '#3a5a30', grassStripe2: '#486838', grassStripe3: '#5a7a48',
    fringeColor: 0x3a6038, fringeGrad: ['#2a5028','#3a6038','#284828'],
    borderColor: 0x5a6858, borderTopColor: 0x7a8878, borderStone: '#4a5848',
    treeLeaf: [0x3a6a38, 0x4a7a48, 0x5a8a58], treeTrunk: 0x5a4a38,
    flowerColors: [0xaabbcc, 0x8899aa, 0xbbccdd, 0x778899, 0xccddee, 0x667788],
    mushroomCap: [0x667766, 0x889988],
    waterColor: 0x446688, pondBed: 0x102838,
    ambientColor: 0xbbc8dd, ambientIntensity: 0.3,
    hemiSky: 0x88aabb, hemiGround: 0x4a5a38,
    sunColor: 0xccddee, sunIntensity: 1.6,
    fogDensity: 0.006,
  },
  {
    name: 'Bubblegum Land',
    grass: 0x66aa66, grassStripe1: '#55995a', grassStripe2: '#66aa65', grassStripe3: '#77bb77',
    fringeColor: 0x55995a, fringeGrad: ['#449950','#55995a','#448848'],
    borderColor: 0xdd66aa, borderTopColor: 0xff88cc, borderStone: '#cc5599',
    treeLeaf: [0xff88cc, 0x88ddff, 0xffff66], treeTrunk: 0xdd8866,
    flowerColors: [0xff66bb, 0x66ccff, 0xffff44, 0xff8866, 0xcc66ff, 0x66ffcc],
    mushroomCap: [0xff4499, 0x44ddff],
    waterColor: 0x99bbff, pondBed: 0x2a3858,
    ambientColor: 0xffeeff, ambientIntensity: 0.45,
    hemiSky: 0xffbbdd, hemiGround: 0x66aa55,
    sunColor: 0xfffff0, sunIntensity: 2.5,
    fogDensity: 0.002,
  },
  {
    name: 'Midnight Garden',
    grass: 0x1a3a2a, grassStripe1: '#0a2a1a', grassStripe2: '#183828', grassStripe3: '#2a4a38',
    fringeColor: 0x143422, fringeGrad: ['#0e2c1a','#143422','#0a2818'],
    borderColor: 0x1a2a28, borderTopColor: 0x3a4a48, borderStone: '#1a2420',
    treeLeaf: [0x0e3a22, 0x1e4a30, 0x2e5a40], treeTrunk: 0x2a2a1a,
    flowerColors: [0xffffff, 0xddddff, 0xbbbbee, 0xffffcc, 0xeeeeff, 0xaaaadd],
    mushroomCap: [0x224444, 0x336655],
    waterColor: 0x113344, pondBed: 0x081018,
    ambientColor: 0x8899aa, ambientIntensity: 0.15,
    hemiSky: 0x445566, hemiGround: 0x1a2a1a,
    sunColor: 0xaabbcc, sunIntensity: 0.9,
    fogDensity: 0.007,
  },
  // ---- 41-50 ----
  {
    name: 'Dragon Forge',
    grass: 0x3a2a20, grassStripe1: '#2a1a10', grassStripe2: '#38281a', grassStripe3: '#4a3a28',
    fringeColor: 0x2a2018, fringeGrad: ['#1a1810','#2a2018','#1a1408'],
    borderColor: 0x3a2818, borderTopColor: 0x5a4830, borderStone: '#3a2010',
    treeLeaf: [0x2a2018, 0x3a3028, 0x4a4030], treeTrunk: 0x2a1808,
    flowerColors: [0xff6600, 0xff4400, 0xff8800, 0xcc3300, 0xffaa22, 0xdd5500],
    mushroomCap: [0xcc4400, 0xff6600],
    waterColor: 0xbb4400, pondBed: 0x2a0800,
    ambientColor: 0xffbb88, ambientIntensity: 0.22,
    hemiSky: 0xcc6622, hemiGround: 0x3a2010,
    sunColor: 0xffaa55, sunIntensity: 1.8,
    fogDensity: 0.006,
  },
  {
    name: 'Cotton Cloud',
    grass: 0x5aaa5a, grassStripe1: '#4a994a', grassStripe2: '#5aa858', grassStripe3: '#6abb6a',
    fringeColor: 0x4a9a4a, fringeGrad: ['#3a8a3a','#4a9a4a','#3a8238'],
    borderColor: 0x8899aa, borderTopColor: 0xaabbcc, borderStone: '#7a8a9a',
    treeLeaf: [0x55aa55, 0x66bb66, 0x77cc77], treeTrunk: 0x887755,
    flowerColors: [0xffffff, 0xffeedd, 0xeeddff, 0xddffee, 0xffddee, 0xeeffdd],
    mushroomCap: [0x88aa88, 0xaaccaa],
    waterColor: 0x66aacc, pondBed: 0x183848,
    ambientColor: 0xffffff, ambientIntensity: 0.45,
    hemiSky: 0xeeeeff, hemiGround: 0x55aa55,
    sunColor: 0xffffff, sunIntensity: 2.6,
    fogDensity: 0.002,
  },
  {
    name: 'Blood Moon',
    grass: 0x2a2020, grassStripe1: '#1a1010', grassStripe2: '#281e1e', grassStripe3: '#383030',
    fringeColor: 0x221818, fringeGrad: ['#1a1010','#221818','#180c0c'],
    borderColor: 0x3a1818, borderTopColor: 0x5a3030, borderStone: '#2a1010',
    treeLeaf: [0x3a1818, 0x4a2828, 0x5a3838], treeTrunk: 0x1a0a0a,
    flowerColors: [0xff2222, 0xcc0000, 0xdd3333, 0xaa0000, 0xff4444, 0xbb1111],
    mushroomCap: [0x881111, 0xaa2222],
    waterColor: 0x661111, pondBed: 0x1a0808,
    ambientColor: 0xcc8888, ambientIntensity: 0.15,
    hemiSky: 0x882222, hemiGround: 0x2a1010,
    sunColor: 0xcc6666, sunIntensity: 1.0,
    fogDensity: 0.007,
  },
  {
    name: 'Zen Garden',
    grass: 0xbbaa88, grassStripe1: '#aa9978', grassStripe2: '#bba880', grassStripe3: '#ccbb90',
    fringeColor: 0xaa9878, fringeGrad: ['#998868','#aa9878','#888060'],
    borderColor: 0x8a7a60, borderTopColor: 0xaa9a80, borderStone: '#7a6a50',
    treeLeaf: [0x5a8a38, 0x6a9a48, 0x4a7a28], treeTrunk: 0x6a5838,
    flowerColors: [0xffffff, 0xeeeecc, 0xddddaa, 0xcccc99, 0xbbbb88, 0xffffee],
    mushroomCap: [0x998877, 0xbbaa99],
    waterColor: 0x5588aa, pondBed: 0x182838,
    ambientColor: 0xfff8ee, ambientIntensity: 0.35,
    hemiSky: 0xddddaa, hemiGround: 0x8a8858,
    sunColor: 0xfff0dd, sunIntensity: 2.2,
    fogDensity: 0.003,
  },
  {
    name: 'Aurora Borealis',
    grass: 0x1a4a48, grassStripe1: '#0a3a38', grassStripe2: '#184840', grassStripe3: '#2a5a58',
    fringeColor: 0x144440, fringeGrad: ['#0e3c38','#144440','#0a3430'],
    borderColor: 0x1a3a40, borderTopColor: 0x3a5a60, borderStone: '#182838',
    treeLeaf: [0x1a5858, 0x2a6868, 0x3a7878], treeTrunk: 0x3a4a48,
    flowerColors: [0x44ffbb, 0x22ddaa, 0x66ff99, 0x88ffcc, 0x00dd88, 0x55ffaa],
    mushroomCap: [0x228866, 0x44aa88],
    waterColor: 0x226688, pondBed: 0x081828,
    ambientColor: 0x88ddcc, ambientIntensity: 0.25,
    hemiSky: 0x44aa88, hemiGround: 0x1a4a38,
    sunColor: 0xaaddcc, sunIntensity: 1.4,
    fogDensity: 0.005,
  },
  {
    name: 'Pixel Retro',
    grass: 0x228822, grassStripe1: '#117711', grassStripe2: '#228820', grassStripe3: '#339932',
    fringeColor: 0x117711, fringeGrad: ['#006600','#117711','#006600'],
    borderColor: 0x555555, borderTopColor: 0x777777, borderStone: '#444444',
    treeLeaf: [0x00aa00, 0x00cc00, 0x00ee00], treeTrunk: 0x664400,
    flowerColors: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff],
    mushroomCap: [0xff0000, 0x0000ff],
    waterColor: 0x0055aa, pondBed: 0x001838,
    ambientColor: 0xaaaaaa, ambientIntensity: 0.3,
    hemiSky: 0x888888, hemiGround: 0x228822,
    sunColor: 0xffffff, sunIntensity: 2.0,
    fogDensity: 0.003,
  },
  {
    name: 'Phantom Mist',
    grass: 0x4a5a58, grassStripe1: '#3a4a48', grassStripe2: '#485850', grassStripe3: '#5a6a68',
    fringeColor: 0x3a5250, fringeGrad: ['#2a4240','#3a5250','#2a3a38'],
    borderColor: 0x3a4848, borderTopColor: 0x5a6868, borderStone: '#2a3838',
    treeLeaf: [0x3a5858, 0x4a6868, 0x5a7878], treeTrunk: 0x4a4a4a,
    flowerColors: [0x88aaaa, 0x669988, 0xaacccc, 0x558888, 0xbbdddd, 0x447777],
    mushroomCap: [0x556666, 0x778888],
    waterColor: 0x335566, pondBed: 0x0a1828,
    ambientColor: 0x99aabb, ambientIntensity: 0.2,
    hemiSky: 0x667788, hemiGround: 0x3a4a48,
    sunColor: 0xaabbcc, sunIntensity: 1.2,
    fogDensity: 0.008,
  },
  {
    name: 'Solar Flare',
    grass: 0x4a3a18, grassStripe1: '#3a2a08', grassStripe2: '#483812', grassStripe3: '#5a4a20',
    fringeColor: 0x3a3010, fringeGrad: ['#2a2808','#3a3010','#282008'],
    borderColor: 0x5a3810, borderTopColor: 0x7a5830, borderStone: '#4a2808',
    treeLeaf: [0x8a6818, 0x9a7828, 0x7a5808], treeTrunk: 0x5a3808,
    flowerColors: [0xffdd00, 0xff8800, 0xffaa00, 0xffff44, 0xff6600, 0xffcc22],
    mushroomCap: [0xcc8800, 0xeeaa22],
    waterColor: 0xcc6600, pondBed: 0x2a1800,
    ambientColor: 0xffcc88, ambientIntensity: 0.3,
    hemiSky: 0xddaa44, hemiGround: 0x4a3010,
    sunColor: 0xffcc44, sunIntensity: 2.8,
    fogDensity: 0.004,
  },
  {
    name: 'Deep Jungle',
    grass: 0x0e5a22, grassStripe1: '#064a14', grassStripe2: '#0e581e', grassStripe3: '#1a6a2a',
    fringeColor: 0x0a521a, fringeGrad: ['#064a14','#0a521a','#044010'],
    borderColor: 0x2a4a20, borderTopColor: 0x4a6a40, borderStone: '#1a3a18',
    treeLeaf: [0x0a4a10, 0x1a5a20, 0x2a6a30], treeTrunk: 0x3a2a08,
    flowerColors: [0xff3366, 0xff6644, 0xffaa33, 0xee2255, 0xff8855, 0xdd4422],
    mushroomCap: [0x2a5522, 0x448844],
    waterColor: 0x1a6644, pondBed: 0x061a10,
    ambientColor: 0xaaddaa, ambientIntensity: 0.2,
    hemiSky: 0x55aa55, hemiGround: 0x0e4a18,
    sunColor: 0xbbddaa, sunIntensity: 1.4,
    fogDensity: 0.006,
  },
];

export function getBiome(tournamentIndex) {
  // Each biome repeats for 3 tournaments, then advances
  const biomeIndex = Math.floor(tournamentIndex / 3) % BIOMES.length;
  return BIOMES[biomeIndex];
}

export function applyBiome(biome) {
  // Update grass
  G.grassMat.color.setHex(biome.grass);

  // Update borders
  G.borderMat.color.setHex(biome.borderColor);
  G.borderTopMat.color.setHex(biome.borderTopColor);

  // Update fog density
  if (G.scene.fog) G.scene.fog.density = biome.fogDensity;

  // Update lighting
  if (G.ambientLight) {
    G.ambientLight.color.setHex(biome.ambientColor);
    G.ambientLight.intensity = biome.ambientIntensity;
  }
  if (G.hemiLight) {
    G.hemiLight.color.setHex(biome.hemiSky);
    G.hemiLight.groundColor.setHex(biome.hemiGround);
  }
  if (G.sunLight) {
    G.sunLight.color.setHex(biome.sunColor);
    G.sunLight.intensity = biome.sunIntensity;
  }

  // Store active biome for buildCourse3D
  G.activeBiome = biome;
}

export function initScene() {
  const container = document.getElementById('container');
  G.container = container;

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.insertBefore(renderer.domElement, container.firstChild);
  G.renderer = renderer;

  const scene = new THREE.Scene();
  G.scene = scene;

  // ---- Sky Dome ----
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 2048; skyCanvas.height = 1024;
  const skyCtx = skyCanvas.getContext('2d');

  const themeIndex = G.currentSkyTheme || 0;
  const theme = SKY_THEMES[themeIndex % SKY_THEMES.length];
  const skyColors = theme.sky;
  const skyGrad = skyCtx.createLinearGradient(0, 0, 0, 1024);
  for (let i = 0; i < skyColors.length; i++) {
    skyGrad.addColorStop(i / (skyColors.length - 1), skyColors[i]);
  }
  skyCtx.fillStyle = skyGrad;
  skyCtx.fillRect(0, 0, 2048, 1024);

  // Stars
  for (let i = 0; i < 300; i++) {
    const sx = Math.random() * 2048;
    const sy = Math.random() * 550;
    const sr = 0.3 + Math.random() * 1.5;
    const brightness = 0.3 + Math.random() * 0.7;
    const starGrad = skyCtx.createRadialGradient(sx, sy, 0, sx, sy, sr * 3);
    starGrad.addColorStop(0, `rgba(255,255,255,${brightness})`);
    starGrad.addColorStop(0.3, `rgba(220,230,255,${brightness * 0.4})`);
    starGrad.addColorStop(1, 'rgba(200,210,255,0)');
    skyCtx.fillStyle = starGrad;
    skyCtx.fillRect(sx - sr * 3, sy - sr * 3, sr * 6, sr * 6);
  }
  for (let i = 0; i < 12; i++) {
    const sx = 50 + Math.random() * 1950;
    const sy = 30 + Math.random() * 380;
    const br = 0.85 + Math.random() * 0.15;
    const h1 = skyCtx.createRadialGradient(sx, sy, 0, sx, sy, 8);
    h1.addColorStop(0, `rgba(255,255,255,${br})`);
    h1.addColorStop(1, 'rgba(255,255,255,0)');
    skyCtx.save(); skyCtx.translate(sx, sy); skyCtx.scale(3, 0.3);
    skyCtx.fillStyle = h1; skyCtx.fillRect(-8, -8, 16, 16);
    skyCtx.restore();
    skyCtx.save(); skyCtx.translate(sx, sy); skyCtx.scale(0.3, 3);
    skyCtx.fillStyle = h1; skyCtx.fillRect(-8, -8, 16, 16);
    skyCtx.restore();
    const core = skyCtx.createRadialGradient(sx, sy, 0, sx, sy, 2);
    core.addColorStop(0, `rgba(255,255,255,${br})`);
    core.addColorStop(1, 'rgba(255,255,255,0)');
    skyCtx.fillStyle = core; skyCtx.fillRect(sx - 2, sy - 2, 4, 4);
  }

  // Moon
  const moonX = 400, moonY = 200;
  for (let gl = 0; gl < 3; gl++) {
    const gr = [90, 55, 30][gl];
    const ga = [0.06, 0.1, 0.2][gl];
    const mg = skyCtx.createRadialGradient(moonX, moonY, 0, moonX, moonY, gr);
    mg.addColorStop(0, `rgba(220,210,255,${ga})`);
    mg.addColorStop(0.5, `rgba(180,170,230,${ga * 0.3})`);
    mg.addColorStop(1, 'rgba(150,140,200,0)');
    skyCtx.fillStyle = mg;
    skyCtx.fillRect(moonX - gr, moonY - gr, gr * 2, gr * 2);
  }
  skyCtx.beginPath(); skyCtx.arc(moonX, moonY, 22, 0, Math.PI * 2);
  const moonFill = skyCtx.createRadialGradient(moonX - 3, moonY - 3, 0, moonX, moonY, 22);
  moonFill.addColorStop(0, 'rgba(255,250,240,0.95)');
  moonFill.addColorStop(0.7, 'rgba(230,220,210,0.9)');
  moonFill.addColorStop(1, 'rgba(200,190,180,0.7)');
  skyCtx.fillStyle = moonFill; skyCtx.fill();
  skyCtx.beginPath(); skyCtx.arc(moonX + 10, moonY - 3, 20, 0, Math.PI * 2);
  const darkSide = skyCtx.createRadialGradient(moonX + 10, moonY - 3, 0, moonX + 10, moonY - 3, 20);
  darkSide.addColorStop(0, 'rgba(18,15,50,0.9)');
  darkSide.addColorStop(0.8, 'rgba(18,15,50,0.7)');
  darkSide.addColorStop(1, 'rgba(18,15,50,0)');
  skyCtx.fillStyle = darkSide; skyCtx.fill();

  // Aurora Borealis
  function drawAurora(startX, width, peakY, colors, opacity) {
    for (let c = 0; c < colors.length; c++) {
      const [r, g, b] = colors[c];
      for (let x = startX; x < startX + width; x += 3) {
        const wave1 = Math.sin((x - startX) * 0.008 + c * 0.5) * 60;
        const wave2 = Math.sin((x - startX) * 0.015 + c * 1.2) * 30;
        const wave3 = Math.sin((x - startX) * 0.003) * 40;
        const cy = peakY + wave1 + wave2 + wave3;
        const h = 60 + Math.sin((x - startX) * 0.01) * 40;
        const ag = skyCtx.createLinearGradient(x, cy - h, x, cy + h);
        const a = opacity * (0.5 + Math.sin((x - startX) * 0.012 + c) * 0.3);
        ag.addColorStop(0, `rgba(${r},${g},${b},0)`);
        ag.addColorStop(0.3, `rgba(${r},${g},${b},${a * 0.6})`);
        ag.addColorStop(0.5, `rgba(${r},${g},${b},${a})`);
        ag.addColorStop(0.7, `rgba(${r},${g},${b},${a * 0.6})`);
        ag.addColorStop(1, `rgba(${r},${g},${b},0)`);
        skyCtx.fillStyle = ag;
        skyCtx.fillRect(x, cy - h, 4, h * 2);
      }
    }
  }
  drawAurora(200, 800, 280, theme.aurora, theme.auroraOp);
  drawAurora(900, 700, 320, theme.aurora.slice().reverse(), theme.auroraOp * 0.75);

  // Clouds
  function drawCloud(cx, cy, w, h, opacity) {
    const numBlobs = 6 + Math.floor(Math.random() * 5);
    for (let i = 0; i < numBlobs; i++) {
      const bx = cx + (Math.random() - 0.5) * w;
      const by = cy + (Math.random() - 0.5) * h * 0.6;
      const br = 15 + Math.random() * w * 0.2;
      const cg = skyCtx.createRadialGradient(bx, by, 0, bx, by, br);
      cg.addColorStop(0, `rgba(200,160,180,${opacity * 0.5})`);
      cg.addColorStop(0.4, `rgba(180,130,160,${opacity * 0.25})`);
      cg.addColorStop(0.7, `rgba(120,80,130,${opacity * 0.08})`);
      cg.addColorStop(1, 'rgba(100,60,110,0)');
      skyCtx.fillStyle = cg;
      skyCtx.fillRect(bx - br, by - br, br * 2, br * 2);
    }
  }
  drawCloud(300, 550, 200, 50, 0.7);
  drawCloud(700, 520, 180, 45, 0.55);
  drawCloud(1200, 560, 220, 55, 0.6);
  drawCloud(1600, 530, 160, 40, 0.5);
  drawCloud(500, 600, 140, 35, 0.4);
  drawCloud(1000, 580, 170, 40, 0.45);
  drawCloud(1800, 570, 130, 35, 0.35);

  // Horizon glow
  const horizGlow = skyCtx.createLinearGradient(0, 750, 0, 1024);
  horizGlow.addColorStop(0, 'rgba(255,200,120,0)');
  horizGlow.addColorStop(0.3, 'rgba(255,180,100,0.1)');
  horizGlow.addColorStop(0.6, 'rgba(255,160,80,0.15)');
  horizGlow.addColorStop(1, 'rgba(255,220,160,0.08)');
  skyCtx.fillStyle = horizGlow;
  skyCtx.fillRect(0, 750, 2048, 274);

  // Mountain silhouette
  skyCtx.fillStyle = 'rgba(20,15,40,0.25)';
  skyCtx.beginPath();
  const mtnSeed = [0, 180, 320, 500, 620, 780, 950, 1100, 1280, 1440, 1600, 1750, 1920, 2048];
  const mtnH = [870, 835, 815, 830, 800, 820, 805, 838, 815, 795, 825, 810, 835, 870];
  for (let i = 0; i < mtnSeed.length; i++) {
    if (i === 0) skyCtx.moveTo(mtnSeed[i], mtnH[i]);
    else {
      const cpx = (mtnSeed[i - 1] + mtnSeed[i]) / 2;
      skyCtx.quadraticCurveTo(cpx, mtnH[i] - 18, mtnSeed[i], mtnH[i]);
    }
  }
  skyCtx.lineTo(2048, 1024); skyCtx.lineTo(0, 1024); skyCtx.closePath();
  skyCtx.fill();
  skyCtx.strokeStyle = 'rgba(255,150,80,0.12)';
  skyCtx.lineWidth = 2;
  skyCtx.beginPath();
  for (let i = 0; i < mtnSeed.length; i++) {
    if (i === 0) skyCtx.moveTo(mtnSeed[i], mtnH[i]);
    else {
      const cpx = (mtnSeed[i - 1] + mtnSeed[i]) / 2;
      skyCtx.quadraticCurveTo(cpx, mtnH[i] - 18, mtnSeed[i], mtnH[i]);
    }
  }
  skyCtx.stroke();

  const skyTexture = new THREE.CanvasTexture(skyCanvas);
  skyTexture.magFilter = THREE.LinearFilter;
  skyTexture.minFilter = THREE.LinearMipmapLinearFilter;
  const skyDomeGeo = new THREE.SphereGeometry(180, 64, 32);
  const skyDomeMat = new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide, fog: false, depthWrite: false });
  const skyDome = new THREE.Mesh(skyDomeGeo, skyDomeMat);
  skyDome.renderOrder = -1;
  scene.add(skyDome);
  G.skyDome = skyDome;

  scene.background = new THREE.Color(theme.bg);
  scene.fog = new THREE.FogExp2(theme.fog, 0.003);

  const camera3D = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500);
  camera3D.position.set(CW / 2, 22, CH + 10);
  camera3D.lookAt(CW / 2, 0, CH / 2);
  G.camera3D = camera3D;

  const camera2D = new THREE.OrthographicCamera(-20, 20, 15, -15, 0.1, 500);
  camera2D.position.set(CW / 2, 60, CH / 2);
  camera2D.lookAt(CW / 2, 0, CH / 2);
  G.camera2D = camera2D;
  G.camera = camera3D;

  const update2DCamera = () => {
    const aspect = window.innerWidth / window.innerHeight;
    const baseHeight = CH + 8;
    const baseWidth = CW + 8;
    let width = baseWidth;
    let height = baseHeight;
    if (aspect >= width / height) {
      width = height * aspect;
    } else {
      height = width / aspect;
    }
    camera2D.left = -width / 2;
    camera2D.right = width / 2;
    camera2D.top = height / 2;
    camera2D.bottom = -height / 2;
    camera2D.updateProjectionMatrix();
  };
  update2DCamera();

  window.addEventListener('resize', () => {
    camera3D.aspect = window.innerWidth / window.innerHeight;
    camera3D.updateProjectionMatrix();
    update2DCamera();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ---- Lights ----
  const ambientLight = new THREE.AmbientLight(0xd4e8ff, 0.3);
  scene.add(ambientLight);
  G.ambientLight = ambientLight;

  const hemiLight = new THREE.HemisphereLight(0xb0d8ff, 0x3a7030, 0.55);
  scene.add(hemiLight);
  G.hemiLight = hemiLight;

  const sunLight = new THREE.DirectionalLight(0xffe8c8, 2.2);
  sunLight.position.set(25, 38, 10);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 4096;
  sunLight.shadow.mapSize.height = 4096;
  sunLight.shadow.camera.left = -35;
  sunLight.shadow.camera.right = 35;
  sunLight.shadow.camera.top = 35;
  sunLight.shadow.camera.bottom = -35;
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 80;
  sunLight.shadow.bias = -0.001;
  scene.add(sunLight);
  G.sunLight = sunLight;

  const fillLight = new THREE.DirectionalLight(0x8ab4f8, 0.35);
  fillLight.position.set(-15, 12, -8);
  scene.add(fillLight);

  const backLight = new THREE.DirectionalLight(0xffd4a0, 0.25);
  backLight.position.set(-5, 8, 25);
  scene.add(backLight);

  // Environment map
  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128);
  const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget);
  scene.add(cubeCamera);
  G.cubeCamera = cubeCamera;
  G.cubeRenderTarget = cubeRenderTarget;

  // ---- Materials ----
  initMaterials(cubeRenderTarget);
}

// Rebuild the sky dome for a new theme index
export function rebuildSky(themeIndex) {
  G.currentSkyTheme = themeIndex;
  const theme = SKY_THEMES[themeIndex % SKY_THEMES.length];

  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 2048; skyCanvas.height = 1024;
  const skyCtx = skyCanvas.getContext('2d');

  const skyColors = theme.sky;
  const skyGrad = skyCtx.createLinearGradient(0, 0, 0, 1024);
  for (let i = 0; i < skyColors.length; i++) {
    skyGrad.addColorStop(i / (skyColors.length - 1), skyColors[i]);
  }
  skyCtx.fillStyle = skyGrad;
  skyCtx.fillRect(0, 0, 2048, 1024);

  // Stars
  for (let i = 0; i < 300; i++) {
    const sx = Math.random() * 2048, sy = Math.random() * 550;
    const sr = 0.3 + Math.random() * 1.5;
    const brightness = 0.3 + Math.random() * 0.7;
    const sg = skyCtx.createRadialGradient(sx, sy, 0, sx, sy, sr * 3);
    sg.addColorStop(0, `rgba(255,255,255,${brightness})`);
    sg.addColorStop(0.3, `rgba(220,230,255,${brightness * 0.4})`);
    sg.addColorStop(1, 'rgba(200,210,255,0)');
    skyCtx.fillStyle = sg;
    skyCtx.fillRect(sx - sr * 3, sy - sr * 3, sr * 6, sr * 6);
  }

  // Moon
  const moonX = 400, moonY = 200;
  skyCtx.beginPath(); skyCtx.arc(moonX, moonY, 22, 0, Math.PI * 2);
  const moonFill = skyCtx.createRadialGradient(moonX - 3, moonY - 3, 0, moonX, moonY, 22);
  moonFill.addColorStop(0, 'rgba(255,250,240,0.95)');
  moonFill.addColorStop(0.7, 'rgba(230,220,210,0.9)');
  moonFill.addColorStop(1, 'rgba(200,190,180,0.7)');
  skyCtx.fillStyle = moonFill; skyCtx.fill();

  // Aurora
  function drawAurora(startX, width, peakY, colors, opacity) {
    for (let c = 0; c < colors.length; c++) {
      const [r, g, b] = colors[c];
      for (let x = startX; x < startX + width; x += 3) {
        const wave1 = Math.sin((x - startX) * 0.008 + c * 0.5) * 60;
        const wave2 = Math.sin((x - startX) * 0.015 + c * 1.2) * 30;
        const wave3 = Math.sin((x - startX) * 0.003) * 40;
        const cy = peakY + wave1 + wave2 + wave3;
        const h = 60 + Math.sin((x - startX) * 0.01) * 40;
        const ag = skyCtx.createLinearGradient(x, cy - h, x, cy + h);
        const a = opacity * (0.5 + Math.sin((x - startX) * 0.012 + c) * 0.3);
        ag.addColorStop(0, `rgba(${r},${g},${b},0)`);
        ag.addColorStop(0.3, `rgba(${r},${g},${b},${a * 0.6})`);
        ag.addColorStop(0.5, `rgba(${r},${g},${b},${a})`);
        ag.addColorStop(0.7, `rgba(${r},${g},${b},${a * 0.6})`);
        ag.addColorStop(1, `rgba(${r},${g},${b},0)`);
        skyCtx.fillStyle = ag;
        skyCtx.fillRect(x, cy - h, 4, h * 2);
      }
    }
  }
  drawAurora(200, 800, 280, theme.aurora, theme.auroraOp);
  drawAurora(900, 700, 320, theme.aurora.slice().reverse(), theme.auroraOp * 0.75);

  const skyTexture = new THREE.CanvasTexture(skyCanvas);
  skyTexture.magFilter = THREE.LinearFilter;
  skyTexture.minFilter = THREE.LinearMipmapLinearFilter;
  G.skyDome.material.map.dispose();
  G.skyDome.material.map = skyTexture;
  G.skyDome.material.needsUpdate = true;
  G.scene.background = new THREE.Color(theme.bg);
  G.scene.fog.color.set(theme.fog);
}

function initMaterials(cubeRenderTarget) {
  // Grass
  const grassTexCanvas = document.createElement('canvas');
  grassTexCanvas.width = 512; grassTexCanvas.height = 512;
  const grassTexCtx = grassTexCanvas.getContext('2d');
  const grassBase = grassTexCtx.createLinearGradient(0, 0, 0, 512);
  grassBase.addColorStop(0, '#1e7838'); grassBase.addColorStop(0.3, '#268842');
  grassBase.addColorStop(0.6, '#2a924a'); grassBase.addColorStop(1, '#1e7838');
  grassTexCtx.fillStyle = grassBase; grassTexCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 40; i++) {
    const px = Math.random() * 512, py = Math.random() * 512;
    const pr = 20 + Math.random() * 60;
    const hue = 100 + Math.random() * 40;
    const lit = 24 + Math.random() * 16;
    const pg = grassTexCtx.createRadialGradient(px, py, 0, px, py, pr);
    pg.addColorStop(0, `hsla(${hue}, 55%, ${lit}%, 0.18)`);
    pg.addColorStop(1, `hsla(${hue}, 55%, ${lit}%, 0)`);
    grassTexCtx.fillStyle = pg; grassTexCtx.fillRect(px - pr, py - pr, pr * 2, pr * 2);
  }
  for (let y = 0; y < 512; y += 32) {
    const stripe = y % 64 < 32;
    grassTexCtx.fillStyle = stripe ? 'rgba(255,255,255,0.06)' : 'rgba(0,20,0,0.06)';
    grassTexCtx.fillRect(0, y, 512, 16);
  }
  for (let i = 0; i < 3000; i++) {
    const bx = Math.random() * 512, by = Math.random() * 512;
    const bl = 6 + Math.random() * 14;
    const hue = 90 + Math.random() * 50, sat = 50 + Math.random() * 30;
    const lit = 22 + Math.random() * 32, alpha = 0.18 + Math.random() * 0.28;
    grassTexCtx.strokeStyle = `hsla(${hue}, ${sat}%, ${lit}%, ${alpha})`;
    grassTexCtx.lineWidth = 0.8 + Math.random() * 1.8; grassTexCtx.lineCap = 'round';
    grassTexCtx.beginPath(); grassTexCtx.moveTo(bx, by);
    const curve = (Math.random() - 0.5) * 6;
    grassTexCtx.quadraticCurveTo(bx + curve, by - bl * 0.55, bx + curve * 0.6, by - bl);
    grassTexCtx.stroke();
  }
  for (let i = 0; i < 800; i++) {
    const tx = Math.random() * 512, ty = Math.random() * 512;
    grassTexCtx.fillStyle = `rgba(120,220,100,${0.08 + Math.random() * 0.12})`;
    grassTexCtx.fillRect(tx, ty, 0.8 + Math.random() * 1.5, 0.8 + Math.random() * 1.5);
  }
  for (let i = 0; i < 100; i++) {
    const dx = Math.random() * 512, dy = Math.random() * 512;
    const dr = 0.6 + Math.random() * 1.2;
    const dg = grassTexCtx.createRadialGradient(dx, dy, 0, dx, dy, dr);
    dg.addColorStop(0, 'rgba(220,255,240,0.2)'); dg.addColorStop(1, 'rgba(220,255,240,0)');
    grassTexCtx.fillStyle = dg; grassTexCtx.fillRect(dx - dr, dy - dr, dr * 2, dr * 2);
  }
  const grassTex = new THREE.CanvasTexture(grassTexCanvas);
  grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
  grassTex.repeat.set(8, 6); grassTex.anisotropy = 8;
  const grassBumpCanvas = document.createElement('canvas');
  grassBumpCanvas.width = 256; grassBumpCanvas.height = 256;
  const gbCtx = grassBumpCanvas.getContext('2d');
  gbCtx.fillStyle = '#808080'; gbCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2000; i++) {
    const bx = Math.random() * 256, by = Math.random() * 256;
    const bl = 3 + Math.random() * 8;
    const bright = Math.random() > 0.5 ? 170 + Math.random() * 70 : 50 + Math.random() * 50;
    gbCtx.strokeStyle = `rgb(${bright},${bright},${bright})`;
    gbCtx.lineWidth = 0.6 + Math.random() * 1.0; gbCtx.lineCap = 'round';
    gbCtx.beginPath(); gbCtx.moveTo(bx, by);
    const c = (Math.random() - 0.5) * 3;
    gbCtx.quadraticCurveTo(bx + c, by - bl * 0.6, bx + c * 0.5, by - bl);
    gbCtx.stroke();
  }
  const grassBumpTex = new THREE.CanvasTexture(grassBumpCanvas);
  grassBumpTex.wrapS = grassBumpTex.wrapT = THREE.RepeatWrapping;
  grassBumpTex.repeat.set(8, 6);
  G.grassMat = new THREE.MeshStandardMaterial({
    color: 0x2a8a48, roughness: 0.72, metalness: 0.0,
    map: grassTex, bumpMap: grassBumpTex, bumpScale: 0.2,
  });

  // Stone border
  const stoneTexCanvas = document.createElement('canvas');
  stoneTexCanvas.width = 128; stoneTexCanvas.height = 128;
  const stoneCtx = stoneTexCanvas.getContext('2d');
  stoneCtx.fillStyle = '#3a5c3a'; stoneCtx.fillRect(0, 0, 128, 128);
  for (let row = 0; row < 8; row++) {
    const yy = row * 16;
    const xoff = row % 2 === 0 ? 0 : 16;
    for (let col = -1; col < 5; col++) {
      const xx = col * 32 + xoff;
      const brightness = 0.8 + Math.random() * 0.4;
      const r = Math.floor(50 * brightness), g = Math.floor(80 * brightness), b = Math.floor(50 * brightness);
      stoneCtx.fillStyle = `rgb(${r},${g},${b})`;
      stoneCtx.fillRect(xx + 1, yy + 1, 30, 14);
      stoneCtx.fillStyle = 'rgba(30,40,25,0.5)';
      stoneCtx.fillRect(xx, yy, 32, 1); stoneCtx.fillRect(xx, yy, 1, 16);
    }
  }
  const stoneTex = new THREE.CanvasTexture(stoneTexCanvas);
  stoneTex.wrapS = stoneTex.wrapT = THREE.RepeatWrapping;
  G.borderMat = new THREE.MeshStandardMaterial({ color: 0x2a5035, roughness: 0.65, metalness: 0.05, map: stoneTex });
  G.borderTopMat = new THREE.MeshStandardMaterial({ color: 0x2a6640, roughness: 0.35, metalness: 0.15 });

  G.ballMat = new THREE.MeshPhysicalMaterial({
    color: 0xfefefe, roughness: 0.05, metalness: 0.0, clearcoat: 1.0, clearcoatRoughness: 0.03,
    envMap: cubeRenderTarget.texture, envMapIntensity: 0.8,
    sheen: 0.3, sheenColor: new THREE.Color(0xffffff),
  });

  G.holeMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1.0 });
  G.holeRimMat = new THREE.MeshPhysicalMaterial({ color: 0x888888, roughness: 0.15, metalness: 0.7, clearcoat: 0.3 });

  // Wood
  const woodTexCanvas = document.createElement('canvas');
  woodTexCanvas.width = 128; woodTexCanvas.height = 128;
  const woodTexCtx = woodTexCanvas.getContext('2d');
  woodTexCtx.fillStyle = '#8b5e3c'; woodTexCtx.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y++) {
    const wave = Math.sin(y * 0.15) * 15 + Math.sin(y * 0.4) * 5;
    woodTexCtx.fillStyle = `rgba(${55 + wave}, ${30 + wave * 0.5}, ${12}, 0.3)`;
    woodTexCtx.fillRect(0, y, 128, 1);
  }
  for (let k = 0; k < 3; k++) {
    const kx = 20 + Math.random() * 88, ky = 20 + Math.random() * 88;
    const kg = woodTexCtx.createRadialGradient(kx, ky, 0, kx, ky, 8);
    kg.addColorStop(0, 'rgba(60,30,10,0.5)'); kg.addColorStop(0.6, 'rgba(80,45,20,0.2)');
    kg.addColorStop(1, 'rgba(0,0,0,0)');
    woodTexCtx.fillStyle = kg; woodTexCtx.fillRect(kx - 8, ky - 8, 16, 16);
  }
  const woodTex = new THREE.CanvasTexture(woodTexCanvas);
  woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
  G.woodMat = new THREE.MeshStandardMaterial({ color: 0x9a6b45, roughness: 0.65, metalness: 0.0, map: woodTex });
  G.woodTopMat = new THREE.MeshStandardMaterial({ color: 0xb88a60, roughness: 0.55, metalness: 0.05 });

  G.rockMat = new THREE.MeshStandardMaterial({ color: 0x788888, roughness: 0.82, metalness: 0.1 });
  G.rockDarkMat = new THREE.MeshStandardMaterial({ color: 0x586868, roughness: 0.92, metalness: 0.05 });
  G.rockMossMat = new THREE.MeshStandardMaterial({ color: 0x4a7a3a, roughness: 0.95, metalness: 0.0 });
  G.wallMat = new THREE.MeshStandardMaterial({ color: 0xb83528, roughness: 0.3, metalness: 0.2 });
  G.wallCapMat = new THREE.MeshPhysicalMaterial({ color: 0xd94535, roughness: 0.15, metalness: 0.3, clearcoat: 0.5 });
  G.flagPoleMat = new THREE.MeshPhysicalMaterial({ color: 0xdddddd, roughness: 0.1, metalness: 0.9, clearcoat: 0.4 });
  G.flagMat = new THREE.MeshStandardMaterial({ color: 0xe63946, side: THREE.DoubleSide, roughness: 0.5 });

  // Club materials
  G.clubShaftMat = new THREE.MeshPhysicalMaterial({ color: 0x8899aa, roughness: 0.08, metalness: 0.95, clearcoat: 1.0, clearcoatRoughness: 0.03, envMapIntensity: 1.5 });
  G.clubHeadMat = new THREE.MeshPhysicalMaterial({ color: 0xc0c8d0, roughness: 0.12, metalness: 0.97, clearcoat: 0.6, clearcoatRoughness: 0.1, envMapIntensity: 1.2 });
  G.clubFaceMat = new THREE.MeshPhysicalMaterial({ color: 0xa0a8b0, roughness: 0.25, metalness: 0.95, clearcoat: 0.3 });
  const gripCanvas = document.createElement('canvas');
  gripCanvas.width = 128; gripCanvas.height = 512;
  {
    const gctx = gripCanvas.getContext('2d');
    gctx.fillStyle = '#1a1a1a'; gctx.fillRect(0, 0, 128, 512);
    gctx.strokeStyle = '#2a2a2a'; gctx.lineWidth = 2;
    for (let y = 0; y < 512; y += 12) {
      gctx.beginPath();
      for (let x = 0; x < 128; x += 6) {
        gctx.moveTo(x, y); gctx.lineTo(x + 3, y + 6); gctx.lineTo(x + 6, y);
      }
      gctx.stroke();
    }
    gctx.fillStyle = '#252525';
    for (let y = 0; y < 512; y += 48) { gctx.fillRect(0, y, 128, 2); }
  }
  const gripTex = new THREE.CanvasTexture(gripCanvas);
  gripTex.wrapS = gripTex.wrapT = THREE.RepeatWrapping;
  G.clubGripMat = new THREE.MeshStandardMaterial({ map: gripTex, color: 0x222222, roughness: 0.92, metalness: 0.0, bumpMap: gripTex, bumpScale: 0.3 });
  G.clubFerMat = new THREE.MeshPhysicalMaterial({ color: 0x111111, roughness: 0.4, metalness: 0.3, clearcoat: 0.8 });
  G.clubBadgeMat = new THREE.MeshPhysicalMaterial({ color: 0xd4af37, roughness: 0.2, metalness: 0.9, clearcoat: 1.0 });

  G.sandMat = new THREE.MeshStandardMaterial({ color: 0xe8d5a3, roughness: 0.92, metalness: 0.0 });
  G.waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x2299cc, roughness: 0.02, metalness: 0.15, transparent: true, opacity: 0.5,
    clearcoat: 1.0, clearcoatRoughness: 0.01, transmission: 0.3,
  });
}
