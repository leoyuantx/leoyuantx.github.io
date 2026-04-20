        const canvas = document.getElementById('game');
        const ctx = canvas.getContext('2d');
        const titleScreen = document.getElementById('title-screen');
        const trainingBtn = document.getElementById('training-btn');
        const arenaBtn = document.getElementById('arena-btn');
        const startBtn = document.getElementById('start-btn');
        const skipBtn = document.getElementById('skip-btn');
        const findLevelBtn = document.getElementById('find-level-btn');
        const levelFinder = document.getElementById('level-finder');
        const levelNameInput = document.getElementById('level-name-input');
        const hud = document.getElementById('hud');
        const hpFill = document.getElementById('hp-fill');
        const hpText = document.getElementById('hp-text');
        const arrowsText = document.getElementById('arrows');
        const moneyText = document.getElementById('money');
        const swordInfoText = document.getElementById('sword-info');
        const partyInfoText = document.getElementById('party-info');
        const levelName = document.getElementById('level-name');
        const tutorialHint = document.getElementById('tutorial-hint');
        const dialogueBox = document.getElementById('dialogue-box');
        const bowIndicator = document.getElementById('bow-indicator');
        const shopPanel = document.getElementById('shop-panel');
        const shopDialogue = document.getElementById('shop-dialogue');
        const potionSlotsElement = document.getElementById('potion-slots');
        const potionSlotDivs = document.querySelectorAll('.potion-slot');
        
        // Store & Special Equipment
        const storePanel = document.getElementById('store-panel');
        const forcefieldHud = document.getElementById('forcefield-hud');
        
        // World Map
        const worldMap = document.getElementById('world-map');
        
        // Pause Menu
        const pauseMenu = document.getElementById('pause-menu');
        
        // Arena UI Elements
        const arenaUI = document.getElementById('arena-ui');
        const arenaStartBtn = document.getElementById('arena-start-btn');
        const arenaClearBtn = document.getElementById('arena-clear-btn');
        const arenaExitBtn = document.getElementById('arena-exit-btn');
        
        // Arena state
        let arenaMode = false;
        let arenaSelectedMob = null;
        let arenaActive = false;

        // Generate stars for title screen
        const decorations = document.getElementById('title-decorations');
        for (let i = 0; i < 50; i++) {
            const star = document.createElement('div');
            star.className = 'pixel-star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.animationDelay = Math.random() * 2 + 's';
            decorations.appendChild(star);
        }

        const GROUND_Y = 0.75;
        const GRAVITY = 1800;
        const JUMP_FORCE = -600;
        
        // World areas
        const WORLD_AREAS = {
            grassy: { name: 'GRASSY PLAIN', icon: '🌱', unlocked: true, startLevel: 0, endLevel: 299, theme: 'grass' },
            ice: { name: 'ICE PALACE', icon: '❄️', unlocked: false, startLevel: 300, endLevel: 599, theme: 'ice' },
            lava: { name: 'LAVA MOUNTAIN', icon: '🌋', unlocked: false, startLevel: 600, endLevel: 899, theme: 'lava' },
            lightning: { name: 'LIGHTNING CLOUD', icon: '⚡', unlocked: false, startLevel: 900, endLevel: 1199, theme: 'lightning' }
        };
        
        let currentArea = 'grassy';
        let areaProgress = { grassy: 0, ice: 0, lava: 0, lightning: 0 };
        let regionalArmor = { ice: false, lava: false, lightning: false };
        
        let parallaxOffset = 0; // For shop parallax effect

        const input = { left: false, right: false, jump: false };
        let mouseX = 0, mouseY = 0;

        // Materials in order of progression
        const MATERIALS = ['wooden', 'rock', 'silver', 'gold', 'diamond', 'titanium'];
        const MATERIAL_COLORS = {
            wooden: '#8B4513', rock: '#708090', silver: '#C0C0C0',
            gold: '#FFD700', diamond: '#B9F2FF', titanium: '#878681'
        };
        const MATERIAL_PRICES = { wooden: 10, rock: 50, silver: 150, gold: 400, diamond: 1000, titanium: 2500 };

        const player = {
            x: 200,
            y: 400, // Will be set properly by setupLevel
            w: 48,
            h: 64,
            vx: 0,
            vy: 0,
            speed: 220,
            hp: 20,
            maxHp: 20,
            baseMaxHp: 20,
            facing: 1,
            grounded: false,
            attacking: false,
            attackTimer: 0,
            attackCooldown: 0,
            arrows: 10,
            money: 1000,
            invulnTimer: 0,
            shieldUp: false,
            totalMoved: 0,
            totalJumps: 0,
            totalSwings: 0,
            totalShots: 0,
            talkedToMaster: false,
            dummiesHit: 0,
            // Animation properties
            animTime: 0,
            walkCycle: 0,
            isWalking: false,
            // Potion effects
            potionEffects: {
                shield: { active: false, timer: 0, strength: 0 },
                damage: { active: false, timer: 0, multiplier: 1 },
                speed: { active: false, timer: 0, multiplier: 1 }
            },
            // Potion inventory - max 3 slots (expandable to 5)
            potionSlots: ['healing', null, null], // Start with 1 healing potion
            maxPotionSlots: 3, // Can be upgraded to 4, then 5
            // Special equipment
            hasJetpack: false,
            jetpackFuel: 100,
            maxJetpackFuel: 100,
            jetpackActive: false,
            jetpackUpgraded: false,
            hasForceField: false,
            forceFieldHP: 5,
            forceFieldMaxHP: 5,
            forceFieldActive: false,
            forceFieldRespawnTimer: 0,
            forceFieldLevel: 1, // 1 = 5hp, 2 = 10hp, 3 = 20hp
            // Keep old system for shop purchases
            potions: {
                healing: 0,
                shield: 0,
                damage: 0,
                speed: 0,
                extraHealth: 0
            },
            // Equipment
            swordMaterial: 'wooden',
            swordLevel: 1,
            shieldMaterial: null,
            shieldLevel: 0,
            armorMaterial: null,
            armorLevel: 0,
            helmetMaterial: null,
            helmetLevel: 0,
            bowType: 'basic', // basic, fire, lightning, ice
            arrowType: 'basic' // basic, steel, diamond, explosive
        };

        // Potion data
        const POTIONS = {
            healing: { name: 'HEALING POTION', price: 30, icon: '🧪', color: '#ef4444', description: 'RESTORES 15 HP' },
            shield: { name: 'SHIELD POTION', price: 50, icon: '🛡️', color: '#3b82f6', description: '60% DAMAGE BLOCK FOR 30S' },
            damage: { name: 'STRENGTH POTION', price: 80, icon: '💪', color: '#f59e0b', description: '2X DAMAGE FOR 45S' },
            speed: { name: 'SPEED POTION', price: 40, icon: '💨', color: '#10b981', description: '1.5X SPEED FOR 40S' },
            extraHealth: { name: 'VITALITY POTION', price: 100, icon: '❤️', color: '#ec4899', description: 'FULL HEAL + 10 TEMP HP' }
        };

        // Elemental abilities for companions
        const ELEMENTS = {
            fire: { name: 'FIRE', color: '#ef4444', icon: '🔥', description: 'BURNS ENEMIES' },
            lightning: { name: 'LIGHTNING', color: '#eab308', icon: '⚡', description: 'CHAIN DAMAGE' },
            ice: { name: 'ICE', color: '#3b82f6', icon: '❄️', description: 'FREEZES ENEMIES' },
            wind: { name: 'WIND', color: '#10b981', icon: '🌪️', description: 'KNOCKBACK BLAST' }
        };

        // Bow types
        const BOW_TYPES = {
            basic: { name: 'BASIC BOW', price: 0, icon: '🏹', color: '#94a3b8', description: 'STANDARD BOW', damageMultiplier: 1 },
            fire: { name: 'FIRE BOW', price: 500, icon: '🔥', color: '#ef4444', description: '2X DAMAGE + BURNS', damageMultiplier: 2 },
            lightning: { name: 'LIGHTNING BOW', price: 800, icon: '⚡', color: '#eab308', description: 'LIGHTNING STRIKE ON HIT', damageMultiplier: 1.5 },
            ice: { name: 'ICE BOW', price: 600, icon: '❄️', color: '#3b82f6', description: 'FREEZES FOR 5 SECONDS', damageMultiplier: 1.2 }
        };

        // Arrow types
        const ARROW_TYPES = {
            basic: { name: 'BASIC ARROWS', damage: 4, speed: 500, color: '#78350f', description: 'STANDARD ARROWS' },
            steel: { name: 'STEEL ARROWS', damage: 7, speed: 650, color: '#71717a', description: 'FASTER + MORE DAMAGE' },
            diamond: { name: 'DIAMOND ARROWS', damage: 12, speed: 800, color: '#06b6d4', description: 'VERY FAST + HIGH DAMAGE' },
            explosive: { name: 'EXPLOSIVE ARROWS', damage: 15, speed: 600, color: '#dc2626', description: 'MASSIVE DAMAGE' }
        };

        // Boss definitions - every 10 levels
        const BOSSES = {
            10: { name: 'ANCIENT GOLEM', hp: 150, damage: 8, ability: 'slam', color: '#78716c', size: 2.5 },
            20: { name: 'WAR MACHINE', hp: 300, damage: 12, ability: 'tankcharge', color: '#4b5563', size: 2, vehicle: 'tank', isVehicle: true },
            30: { name: 'FLAME TITAN', hp: 500, damage: 16, ability: 'firewall', color: '#dc2626', size: 3 },
            40: { name: 'SKY DOMINATOR', hp: 750, damage: 20, ability: 'airassault', color: '#0ea5e9', size: 2.5, vehicle: 'helicopter', isVehicle: true },
            50: { name: 'THUNDER LORD', hp: 1000, damage: 25, ability: 'lightning', color: '#eab308', size: 3.5 },
            60: { name: 'STEEL FORTRESS', hp: 1500, damage: 30, ability: 'artillery', color: '#374151', size: 2.2, vehicle: 'artillery', isVehicle: true },
            70: { name: 'CHAOS DEMON', hp: 2000, damage: 35, ability: 'chaos', color: '#dc2626', size: 4 },
            80: { name: 'OMEGA MECH', hp: 3000, damage: 40, ability: 'mechstomp', color: '#991b1b', size: 3, vehicle: 'mech', isVehicle: true },
            90: { name: 'ETERNAL DESTROYER', hp: 5000, damage: 50, ability: 'meteor', color: '#7c3aed', size: 5 },
            100: { name: 'COSMIC OVERLORD', hp: 7500, damage: 60, ability: 'vortex', color: '#8b5cf6', size: 5.5 },
            110: { name: 'VOID EMPEROR', hp: 10000, damage: 70, ability: 'blackhole', color: '#000000', size: 6 },
            120: { name: 'PHANTOM JET', hp: 15000, damage: 80, ability: 'jetstrafe', color: '#1e40af', size: 2.8, vehicle: 'jet', isVehicle: true },
            130: { name: 'REALITY BREAKER', hp: 20000, damage: 90, ability: 'timerift', color: '#06b6d4', size: 6.5 },
            140: { name: 'SIEGE COLOSSUS', hp: 30000, damage: 100, ability: 'missilestorm', color: '#7c2d12', size: 2.6, vehicle: 'missile_launcher', isVehicle: true },
            150: { name: 'VOID INCARNATE', hp: 50000, damage: 120, ability: 'armageddon', color: '#ef4444', size: 8 },
            160: { name: 'TITAN MECH MK-II', hp: 75000, damage: 140, ability: 'laserstorm', color: '#991b1b', size: 3.2, vehicle: 'mech', isVehicle: true },
            170: { name: 'INFINITY DEVOURER', hp: 100000, damage: 160, ability: 'voidpulse', color: '#000000', size: 9 },
            180: { name: 'APEX PREDATOR', hp: 150000, damage: 180, ability: 'tankbarrage', color: '#6b7280', size: 2.4, vehicle: 'tank', isVehicle: true },
            190: { name: 'ETERNITY KEEPER', hp: 200000, damage: 200, ability: 'chronofreeze', color: '#06b6d4', size: 10 },
            200: { name: 'ABSOLUTE VOID', hp: 300000, damage: 250, ability: 'voidexplosion', color: '#7c3aed', size: 11 },
            210: { name: 'DIVINE HARBINGER', hp: 400000, damage: 280, ability: 'divinelight', color: '#fbbf24', size: 11.5 },
            220: { name: 'QUANTUM ANNIHILATOR', hp: 550000, damage: 320, ability: 'quantumsplit', color: '#ec4899', size: 12 },
            230: { name: 'CELESTIAL DESTROYER', hp: 750000, damage: 360, ability: 'starfall', color: '#3b82f6', size: 12.5 },
            240: { name: 'OMEGA PRIME', hp: 1000000, damage: 400, ability: 'omegablast', color: '#000000', size: 13 },
            250: { name: 'LEGENDARY TITAN', hp: 1500000, damage: 450, ability: 'titanstomp', color: '#dc2626', size: 3.5, vehicle: 'mech', isVehicle: true },
            260: { name: 'REALITY ENDER', hp: 2000000, damage: 500, ability: 'realitybreak', color: '#06b6d4', size: 14 },
            270: { name: 'PRIMORDIAL CHAOS', hp: 3000000, damage: 600, ability: 'chaosrain', color: '#a855f7', size: 15 },
            280: { name: 'INFINITY LORD', hp: 5000000, damage: 700, ability: 'infinitywave', color: '#f97316', size: 16 },
            290: { name: 'TRANSCENDENT ONE', hp: 10000000, damage: 900, ability: 'transcendence', color: '#ffffff', size: 18 }
        };

        let shopOpen = false;
        let shopType = null; // 'weapon' or 'armor' or 'mercenary'
        let shopNPC = null;
        let shopDialogueChoices = [];
        let levelComplete = false;
        let shopsMovingIn = false;
        let shopsMovingOut = false;
        let shopAnimationProgress = 0;

        const companions = [];
        let mercenaryHireCount = 0;
        let lastSlotFullMessage = 0; // Cooldown for "slots full" message
        
        // Unique level names for endless battles
        const GRASSY_LEVELS = [
            'TRAINING', 'WHISPERING WOODS', 'DARK FOREST', 'MOUNTAIN PASS', 'CRIMSON CANYON',
            'FROZEN TUNDRA', 'SHADOW REALM', 'THUNDER PEAKS', 'CRYSTAL CAVERNS', 'VOLCANIC WASTES',
            'ANCIENT RUINS', 'CURSED SWAMP', 'DESERT DUNES', 'SKY FORTRESS', 'NETHER DIMENSION',
            'IRON CITADEL', 'EMERALD GARDENS', 'TWILIGHT ZONE', 'BONE VALLEY', 'MYSTIC TEMPLE',
            'VOID CHASM', 'CELESTIAL PLAINS', 'DRAGONS LAIR', 'INFINITY ARENA', 'CHAOS REALM',
            'ETERNAL BATTLEGROUND', 'COSMIC NEXUS', 'OBLIVION GATE', 'DIVINE SANCTUM', 'APOCALYPSE ZONE',
            'PHANTOM FORTRESS', 'BLOOD MOON RISE', 'STEEL WASTELAND', 'JADE TEMPLE', 'RIFT OF SOULS',
            'STARLIGHT SUMMIT', 'CRIMSON DEPTHS', 'AZURE PALACE', 'DEATH VALLEY', 'HELLFIRE BASIN',
            'GLACIER PEAK', 'SHADOW SPIRE', 'GOLDEN HALLS', 'PLAGUE MARSH', 'THUNDER DOME',
            'RUBY QUARRY', 'MIDNIGHT GROVE', 'TITAN GORGE', 'SAPPHIRE LAKE', 'DEMON GATE',
            'CRYSTAL THRONE', 'SHATTERED REALM', 'VENOM SWAMP', 'OBSIDIAN TOWER', 'STORM FRONT',
            'CORAL REEF', 'SCORCHED EARTH', 'MOONLIT SANCTUARY', 'BLOOD CITADEL', 'EMERALD ABYSS',
            'PLATINUM MINES', 'CURSED CATHEDRAL', 'HEAVEN GATES', 'INFERNO DEPTHS', 'ICE PALACE',
            'DARK CATHEDRAL', 'METAL COLOSSEUM', 'SPIRIT WOODS', 'LAVA CITADEL', 'RADIANT SPIRE',
            'ABYSS WATCHER', 'ONYX CHAMBER', 'TEMPEST PEAK', 'JADE DRAGON', 'NIGHTMARE REALM',
            'AMBER RUINS', 'ETERNAL FLAME', 'FROZEN HELL', 'SHADOW MONARCH', 'ASTRAL PLANE',
            'LEVIATHAN DEPTHS', 'CRIMSON EMPEROR', 'PLATINUM THRONE', 'VOID EMPEROR', 'CELESTIAL WAR',
            'OMEGA DIMENSION', 'GENESIS CHAMBER', 'FINAL JUDGMENT', 'ABSOLUTE ZERO', 'ETERNAL CHAOS',
            'ULTIMATE TRIAL', 'GOD REALM', 'PRIMORDIAL VOID', 'INFINITE NEXUS', 'TRANSCENDENCE',
            'PERFECT CHAOS', 'OMNIPOTENT ARENA', 'LEGENDARY END', 'MYTHIC ASCENSION', 'ETERNAL CHAMPION',
            'BEYOND HORIZON', 'VERDANT VALLEY', 'PEACEFUL MEADOW', 'SILVER STREAM', 'GOLDEN SUNSET',
            'MORNING DEW', 'WILDFLOWER FIELD', 'ROLLING HILLS', 'QUIET BROOK', 'HARVEST PLAINS',
            'SUNNY GLADE', 'BUTTERFLY GARDEN', 'RAINBOW BRIDGE', 'WINDMILL FARM', 'CLOVER PATCH',
            'HONEYBEE MEADOW', 'DAISY FIELDS', 'RIVERSIDE PATH', 'GENTLE BREEZE', 'BLOSSOM GROVE',
            'MOSSY STONES', 'FERN HOLLOW', 'SONGBIRD WOODS', 'RABBIT WARREN', 'FOX DEN',
            'DEER CROSSING', 'OAK FOREST', 'MAPLE VALLEY', 'WILLOW POND', 'BIRCH CLEARING',
            'PINE RIDGE', 'ASPEN GROVE', 'CEDAR HOLLOW', 'ELM PASSAGE', 'CHERRY ORCHARD',
            'APPLE MEADOW', 'PEACH GARDEN', 'PLUM VALLEY', 'BERRY PATCH', 'MUSHROOM RING',
            'FAIRY CIRCLE', 'GNOME BURROW', 'PIXIE DELL', 'SPRITE SPRINGS', 'NYMPH WATERFALL',
            'UNICORN GLADE', 'GRIFFIN NEST', 'PEGASUS PEAK', 'PHOENIX RISE', 'DRAGON ROOST',
            'WYVERN CLIFFS', 'BASILISK DEN', 'CHIMERA CAVE', 'HYDRA SWAMP', 'MANTICORE LAIR',
            'CENTAUR PLAINS', 'SATYR WOODS', 'DRYAD GROVE', 'NAIAD POOL', 'HAMADRYAD TREE',
            'CYCLOPS MOUNTAIN', 'TITAN VALLEY', 'GIANT HILLS', 'TROLL BRIDGE', 'OGRE CANYON',
            'GOBLIN MINES', 'ORC STRONGHOLD', 'KOBOLD TUNNELS', 'GNOLL CAMP', 'HOBGOBLIN FORT',
            'BUGBEAR CAVE', 'LIZARDMAN MARSH', 'TROGLODYTE PIT', 'YUAN-TI TEMPLE', 'MEDUSA GARDENS',
            'MINOTAUR MAZE', 'HARPY NEST', 'GARGOYLE PERCH', 'GOLEM WORKSHOP', 'ANIMATED ARMORY',
            'LIVING STATUES', 'MOVING PAINTINGS', 'DANCING WEAPONS', 'FLOATING SHIELDS', 'MAGIC MIRRORS',
            'CRYSTAL BALL ROOM', 'RUNE CHAMBER', 'SPELL LIBRARY', 'ENCHANTED ARMORY', 'POTION BREWERY',
            'ALCHEMIST LAB', 'WIZARD TOWER', 'SORCERER SANCTUM', 'WARLOCK ALTAR', 'DRUID CIRCLE',
            'CLERIC SHRINE', 'PALADIN CHAPEL', 'RANGER OUTPOST', 'ROGUE HIDEOUT', 'BARD STAGE',
            'FIGHTER GYM', 'BARBARIAN CAMP', 'MONK MONASTERY', 'SAMURAI DOJO', 'NINJA COMPOUND',
            'KNIGHT CASTLE', 'SQUIRE BARRACKS', 'ARCHER RANGE', 'CAVALRY STABLE', 'INFANTRY CAMP',
            'SIEGE WORKSHOP', 'WAR ROOM', 'BATTLE PLANS', 'STRATEGY HALL', 'COMMAND POST',
            'SCOUT TOWER', 'WATCH POST', 'GUARD STATION', 'PATROL ROUTE', 'BORDER CHECKPOINT',
            'FRONTIER OUTPOST', 'PIONEER SETTLEMENT', 'HOMESTEAD FARM', 'RANCH LANDS', 'CATTLE DRIVE',
            'WAGON TRAIL', 'CARAVAN ROUTE', 'TRADE PATH', 'MERCHANT ROAD', 'MARKET SQUARE',
            'BAZAAR DISTRICT', 'SHOPPING ARCADE', 'VENDOR ALLEY', 'CRAFTSMAN ROW', 'ARTISAN QUARTER',
            'BLACKSMITH FORGE', 'CARPENTER SHOP', 'MASON YARD', 'TAILOR BOUTIQUE', 'COBBLER CORNER',
            'JEWELER VAULT', 'GOLDSMITH ATELIER', 'SILVERSMITH STUDIO', 'COPPERSMITH FOUNDRY', 'IRONWORKS MILL',
            'STEEL REFINERY', 'BRONZE WORKSHOP', 'TIN MINE', 'LEAD QUARRY', 'ZINC DEPOSIT',
            'COAL SEAM', 'OIL WELL', 'GAS FIELD', 'CRYSTAL MINES', 'GEM CAVES',
            'PEARL OYSTER BED', 'CORAL GARDENS', 'KELP FOREST', 'SEAWEED FARM', 'FISH HATCHERY',
            'DOLPHIN BAY', 'WHALE SOUND', 'SHARK REEF', 'OCTOPUS DEN', 'SQUID HUNTING GROUND',
            'CRAB SHALLOWS', 'LOBSTER COVE', 'SHRIMP BEDS', 'CLAM BEACH', 'MUSSEL ROCKS',
            'STARFISH POOLS', 'SEA URCHIN BEDS', 'JELLYFISH DRIFT', 'MANTA GLIDE', 'STINGRAY SAND',
            'SEAHORSE SANCTUARY', 'NAUTILUS SPIRAL', 'CONCH COLLECTION', 'SAND DOLLAR SHORE', 'SEASHELL COAST',
            'PEBBLE BEACH', 'ROCKY INLET', 'CLIFF EDGE', 'SEASIDE CAVE', 'TIDEPOOL HAVEN',
            'WAVE BREAK', 'SURF ZONE', 'BEACH DUNES', 'COASTAL PATH', 'LIGHTHOUSE POINT',
            'HARBOR DOCKS', 'MARINA BERTH', 'PIER END', 'BOARDWALK', 'PROMENADE',
            'SEAFRONT ESPLANADE', 'OCEAN VIEW', 'SEASIDE RESORT', 'BEACH RESORT', 'TROPICAL PARADISE',
            'ISLAND GETAWAY', 'ATOLL RETREAT', 'LAGOON HIDEAWAY', 'COVE SANCTUARY', 'BAY REFUGE',
            'INLET SHELTER', 'FJORD VALLEY', 'SOUND PASSAGE', 'STRAIT CROSSING', 'CHANNEL ROUTE',
            'RIVER DELTA', 'ESTUARY MOUTH', 'WETLAND PRESERVE', 'MARSH RESERVE', 'BOG CONSERVATION',
            'FEN HABITAT', 'SWAMP ECOSYSTEM', 'BAYOU BACKWATER', 'MANGROVE MAZE', 'REED BED',
            'CATTAIL MARSH', 'WATER LILY POND', 'LOTUS LAKE', 'LILY PAD LAGOON', 'DUCK POND',
            'GOOSE MARSH', 'SWAN LAKE', 'HERON ROOKERY', 'EGRET COLONY', 'CRANE MIGRATION',
            'PELICAN PERCH', 'CORMORANT ROOST', 'KINGFISHER DIVE', 'OSPREY NEST', 'EAGLE EYRIE'
        ];
        
        const ICE_LEVELS = [
            'FROZEN GATE', 'SNOWDRIFT PASS', 'ICICLE CAVERN', 'FROST PEAK', 'GLACIER WALL',
            'BLIZZARD PLAINS', 'ICE CRYSTAL CAVE', 'WINTER SHRINE', 'FROZEN THRONE', 'ARCTIC WASTES',
            'POLAR EXPANSE', 'TUNDRA BARRENS', 'SNOW FORTRESS', 'AVALANCHE RIDGE', 'HAILSTORM VALLEY',
            'PERMAFROST DEPTHS', 'FROZEN LAKE', 'ICE BRIDGE', 'CRYSTAL PALACE', 'DIAMOND DUST FIELD',
            'SNOW QUEEN CASTLE', 'WINTER WOLF DEN', 'POLAR BEAR CAVE', 'SEAL ROOKERY', 'PENGUIN COLONY',
            'WALRUS BEACH', 'ARCTIC FOX BURROW', 'SNOWY OWL ROOST', 'REINDEER HERD', 'CARIBOU MIGRATION',
            'MOOSE TERRITORY', 'MAMMOTH GRAVEYARD', 'SABER CAT DEN', 'ICE AGE RUINS', 'PREHISTORIC CAVE',
            'FROZEN MAMMOTH', 'GLACIAL CARVING', 'ANCIENT ICE', 'TIME CAPSULE', 'PRESERVED HISTORY',
            'ICE CORE SAMPLE', 'FROZEN RECORD', 'WINTER ARCHIVE', 'COLD STORAGE', 'CRYOGENIC VAULT',
            'FROST REPOSITORY', 'SNOW LIBRARY', 'ICICLE GALLERY', 'FROZEN MUSEUM', 'ICE SCULPTURE PARK',
            'SNOW STATUE GARDEN', 'WINTER WONDERLAND', 'FROZEN FANTASY', 'ICE DREAM', 'SNOW MAGIC',
            'FROST ENCHANTMENT', 'WINTER SPELL', 'COLD CHARM', 'FROZEN BLESSING', 'ICE BENEDICTION',
            'SNOW PRAYER', 'WINTER WISH', 'FROST HOPE', 'FROZEN FAITH', 'ICE BELIEF',
            'SNOW TRUST', 'WINTER CONFIDENCE', 'FROST ASSURANCE', 'FROZEN CERTAINTY', 'ICE CONVICTION',
            'SNOW DETERMINATION', 'WINTER RESOLVE', 'FROST FORTITUDE', 'FROZEN COURAGE', 'ICE BRAVERY',
            'SNOW VALOR', 'WINTER HEROISM', 'FROST GALLANTRY', 'FROZEN NOBILITY', 'ICE HONOR',
            'SNOW INTEGRITY', 'WINTER VIRTUE', 'FROST RIGHTEOUSNESS', 'FROZEN JUSTICE', 'ICE FAIRNESS',
            'SNOW EQUALITY', 'WINTER BALANCE', 'FROST HARMONY', 'FROZEN PEACE', 'ICE SERENITY',
            'SNOW TRANQUILITY', 'WINTER CALM', 'FROST STILLNESS', 'FROZEN QUIET', 'ICE SILENCE',
            'SNOW HUSH', 'WINTER WHISPER', 'FROST MURMUR', 'FROZEN BREATH', 'ICE WIND',
            'SNOW BREEZE', 'WINTER GALE', 'FROST STORM', 'FROZEN TEMPEST', 'ICE HURRICANE',
            'SNOW CYCLONE', 'WINTER TORNADO', 'FROST WHIRLWIND', 'FROZEN VORTEX', 'ICE MAELSTROM',
            'SNOW CHAOS', 'WINTER FURY', 'FROST RAGE', 'FROZEN WRATH', 'ICE ANGER',
            'SNOW FIRE', 'WINTER FLAME', 'FROST BLAZE', 'FROZEN INFERNO', 'ICE FURNACE',
            'SNOW FORGE', 'WINTER SMITHY', 'FROST WORKSHOP', 'FROZEN FACTORY', 'ICE MILL',
            'SNOW FOUNDRY', 'WINTER REFINERY', 'FROST PLANT', 'FROZEN FACILITY', 'ICE COMPLEX',
            'SNOW COMPOUND', 'WINTER BASE', 'FROST STATION', 'FROZEN OUTPOST', 'ICE CAMP',
            'SNOW SETTLEMENT', 'WINTER VILLAGE', 'FROST TOWN', 'FROZEN CITY', 'ICE METROPOLIS',
            'SNOW CAPITAL', 'WINTER EMPIRE', 'FROST KINGDOM', 'FROZEN REALM', 'ICE DOMAIN',
            'SNOW TERRITORY', 'WINTER LAND', 'FROST COUNTRY', 'FROZEN NATION', 'ICE WORLD',
            'SNOW PLANET', 'WINTER STAR', 'FROST GALAXY', 'FROZEN UNIVERSE', 'ICE COSMOS',
            'SNOW INFINITY', 'WINTER ETERNITY', 'FROST FOREVER', 'FROZEN ALWAYS', 'ICE ENDLESS',
            'SNOW BOUNDLESS', 'WINTER LIMITLESS', 'FROST ETERNAL', 'FROZEN PERPETUAL', 'ICE TIMELESS',
            'SNOW AGELESS', 'WINTER IMMORTAL', 'FROST UNDYING', 'FROZEN DEATHLESS', 'ICE EVERLASTING',
            'SNOW PERMANENT', 'WINTER CONSTANT', 'FROST STEADY', 'FROZEN STABLE', 'ICE FIXED',
            'SNOW SOLID', 'WINTER FIRM', 'FROST HARD', 'FROZEN RIGID', 'ICE STIFF',
            'SNOW FROZEN', 'WINTER ICED', 'FROST CHILLED', 'FROZEN COLD', 'ICE COOL',
            'SNOW CRISP', 'WINTER FRESH', 'FROST CLEAN', 'FROZEN PURE', 'ICE CLEAR',
            'SNOW WHITE', 'WINTER BRIGHT', 'FROST LIGHT', 'FROZEN SHINE', 'ICE GLEAM',
            'SNOW GLITTER', 'WINTER SPARKLE', 'FROST TWINKLE', 'FROZEN SHIMMER', 'ICE GLISTEN',
            'SNOW DAZZLE', 'WINTER RADIANCE', 'FROST BRILLIANCE', 'FROZEN LUMINOSITY', 'ICE GLOW',
            'SNOW BEAM', 'WINTER RAY', 'FROST LIGHT', 'FROZEN ILLUMINATION', 'ICE BRIGHTNESS',
            'SNOW DAWN', 'WINTER SUNRISE', 'FROST MORNING', 'FROZEN DAY', 'ICE NOON',
            'SNOW AFTERNOON', 'WINTER EVENING', 'FROST DUSK', 'FROZEN TWILIGHT', 'ICE NIGHT',
            'SNOW MIDNIGHT', 'WINTER DARKNESS', 'FROST SHADOW', 'FROZEN SHADE', 'ICE GLOOM',
            'SNOW DIM', 'WINTER MURK', 'FROST OBSCURITY', 'FROZEN FOG', 'ICE MIST',
            'SNOW HAZE', 'WINTER CLOUD', 'FROST VAPOR', 'FROZEN STEAM', 'ICE SMOKE',
            'SNOW DUST', 'WINTER POWDER', 'FROST FLAKE', 'FROZEN CRYSTAL', 'ICE SHARD',
            'SNOW FRAGMENT', 'WINTER PIECE', 'FROST BIT', 'FROZEN CHUNK', 'ICE BLOCK',
            'SNOW CUBE', 'WINTER SQUARE', 'FROST RECTANGLE', 'FROZEN SHAPE', 'ICE FORM',
            'SNOW FIGURE', 'WINTER PATTERN', 'FROST DESIGN', 'FROZEN ART', 'ICE CREATION',
            'SNOW WORK', 'WINTER CRAFT', 'FROST MAKE', 'FROZEN BUILD', 'ICE CONSTRUCT',
            'SNOW STRUCTURE', 'WINTER ARCHITECTURE', 'FROST EDIFICE', 'FROZEN MONUMENT', 'ICE MEMORIAL',
            'SNOW TRIBUTE', 'WINTER HOMAGE', 'FROST RESPECT', 'FROZEN HONOR', 'ICE GLORY',
            'SNOW FAME', 'WINTER RENOWN', 'FROST PRESTIGE', 'FROZEN STATUS', 'ICE RANK',
            'SNOW POSITION', 'WINTER STANDING', 'FROST PLACE', 'FROZEN SPOT', 'ICE LOCATION',
            'SNOW SITE', 'WINTER AREA', 'FROST ZONE', 'FROZEN REGION', 'ICE SECTOR',
            'SNOW DISTRICT', 'WINTER QUARTER', 'FROST WARD', 'FROZEN PRECINCT', 'ICE DIVISION',
            'SNOW SECTION', 'WINTER SEGMENT', 'FROST PART', 'FROZEN PORTION', 'ICE SHARE',
            'SNOW LOT', 'WINTER BATCH', 'FROST GROUP', 'FROZEN SET', 'ICE COLLECTION',
            'SNOW ASSEMBLY', 'WINTER GATHERING', 'FROST MEETING', 'FROZEN CONFERENCE', 'ICE SUMMIT',
            'SNOW COUNCIL', 'WINTER CONGRESS', 'FROST PARLIAMENT', 'FROZEN SENATE', 'ICE CHAMBER',
            'SNOW HALL', 'WINTER COURT', 'FROST TRIBUNAL', 'FROZEN BENCH', 'ICE BAR',
            'SNOW DOCK', 'WINTER STAND', 'FROST WITNESS', 'FROZEN JURY', 'ICE VERDICT',
            'SNOW JUDGMENT', 'WINTER RULING', 'FROST DECISION', 'FROZEN CHOICE', 'ICE SELECTION',
            'SNOW PICK', 'WINTER OPTION', 'FROST ALTERNATIVE', 'FROZEN POSSIBILITY', 'ICE CHANCE',
            'SNOW LUCK', 'WINTER FORTUNE', 'FROST FATE', 'FROZEN DESTINY', 'ICE PURPOSE'
        ];
        
        const LAVA_LEVELS = [
            'MOLTEN GATE', 'VOLCANIC PASS', 'MAGMA CHAMBER', 'FIRE PEAK', 'LAVA FLOW',
            'INFERNO PLAINS', 'OBSIDIAN CAVE', 'FLAME SHRINE', 'BURNING THRONE', 'SCORCHED WASTES',
            'HELLFIRE EXPANSE', 'ASH BARRENS', 'EMBER FORTRESS', 'ERUPTION RIDGE', 'FIRESTORM VALLEY',
            'MOLTEN CORE', 'LAVA LAKE', 'MAGMA BRIDGE', 'OBSIDIAN PALACE', 'VOLCANIC DUST FIELD',
            'FIRE LORD CASTLE', 'HELL HOUND DEN', 'PHOENIX NEST', 'SALAMANDER POOL', 'FIRE ELEMENTAL NEXUS',
            'IFRIT DOMAIN', 'PYRO HYDRA LAIR', 'FLAME DRAKE ROOST', 'CINDER WYVERN PEAK', 'COAL GOLEM PIT',
            'ASH WRAITH HAUNT', 'EMBER SPIRIT SHRINE', 'MAGMA TITAN ARENA', 'LAVA GIANT FORTRESS', 'VOLCANIC DEMON GATE',
            'BURNING RUINS', 'SCORCHED TEMPLE', 'CHARRED CATHEDRAL', 'SEARED SANCTUM', 'BLAZING ALTAR',
            'FLAME PYRE', 'FIRE CRUCIBLE', 'HEAT FURNACE', 'KILN CHAMBER', 'SMELTING HALL',
            'FORGE MASTER WORKSHOP', 'BLACKSMITH INFERNO', 'FOUNDRY DEPTHS', 'METALLURGY LAB', 'REFINERY COMPLEX',
            'INDUSTRIAL BLAZE', 'FACTORY FIRES', 'MILL FLAMES', 'PLANT HEAT', 'FACILITY BURN',
            'WORKSHOP SCORCH', 'SMITHY CHAR', 'ANVIL SPARK', 'HAMMER STRIKE', 'TONG GRIP',
            'BELLOWS BREATH', 'COAL PILE', 'COKE HEAP', 'CHARCOAL MOUND', 'FUEL DEPOT',
            'OIL RESERVOIR', 'GAS VENT', 'METHANE POCKET', 'SULFUR SPRING', 'BRIMSTONE PIT',
            'HELLFIRE GEYSERS', 'MAGMA PLUMES', 'LAVA FOUNTAINS', 'PYROCLASTIC SURGE', 'ASH CLOUD',
            'VOLCANIC WINTER', 'NUCLEAR SUMMER', 'THERMAL SPRING', 'HOT SPRING', 'BOILING GEYSER',
            'STEAM VENT', 'FUMAROLE FIELD', 'SOLFATARA', 'MUD POT', 'PAINT POT',
            'BOILING MUD', 'BUBBLING CLAY', 'CHURNING SILT', 'ROILING SEDIMENT', 'SEETHING EARTH',
            'ANGRY GROUND', 'FURIOUS SOIL', 'RAGING LAND', 'VIOLENT TERRAIN', 'SAVAGE LANDSCAPE',
            'BRUTAL VISTA', 'HARSH PANORAMA', 'SEVERE VIEW', 'STERN SIGHT', 'STRICT SCENE',
            'RIGID SETTING', 'FIRM STAGE', 'SOLID PLATFORM', 'HARD GROUND', 'TOUGH SURFACE',
            'STRONG BASE', 'STURDY FOUNDATION', 'STABLE BED', 'STEADY FLOOR', 'FIXED BOTTOM',
            'PERMANENT LAYER', 'LASTING STRATUM', 'ENDURING LEVEL', 'CONTINUING TIER', 'PERSISTING RANK',
            'REMAINING GRADE', 'STAYING CLASS', 'ABIDING CATEGORY', 'DWELLING TYPE', 'LODGING KIND',
            'HOUSING SORT', 'SHELTER VARIETY', 'HAVEN SPECIES', 'REFUGE BREED', 'SANCTUARY STRAIN',
            'ASYLUM STOCK', 'RETREAT LINE', 'HIDEAWAY ANCESTRY', 'ESCAPE DESCENT', 'FLIGHT ORIGIN',
            'EXODUS SOURCE', 'DEPARTURE START', 'LEAVING BEGINNING', 'GOING DAWN', 'EXITING GENESIS',
            'WITHDRAWING BIRTH', 'RETREATING CREATION', 'BACKING FORMATION', 'RECEDING MAKING', 'RETIRING BUILDING',
            'YIELDING CONSTRUCTION', 'GIVING ASSEMBLY', 'SURRENDERING GATHERING', 'SUBMITTING MEETING', 'CAPITULATING UNION',
            'CONCEDING JUNCTION', 'ALLOWING CROSSING', 'PERMITTING PASSAGE', 'ENABLING ROUTE', 'FACILITATING PATH',
            'HELPING TRACK', 'AIDING TRAIL', 'ASSISTING COURSE', 'SUPPORTING DIRECTION', 'BACKING HEADING',
            'ENDORSING BEARING', 'APPROVING ORIENTATION', 'SANCTIONING POSITION', 'AUTHORIZING LOCATION', 'VALIDATING PLACE',
            'CONFIRMING SPOT', 'VERIFYING SITE', 'CERTIFYING AREA', 'ATTESTING ZONE', 'WITNESSING REGION',
            'TESTIFYING SECTOR', 'DECLARING DISTRICT', 'STATING QUARTER', 'ASSERTING PRECINCT', 'AFFIRMING DIVISION',
            'MAINTAINING SECTION', 'CLAIMING SEGMENT', 'CONTENDING PART', 'ARGUING PORTION', 'DEBATING SHARE',
            'DISCUSSING LOT', 'CONVERSING BATCH', 'TALKING GROUP', 'SPEAKING SET', 'SAYING COLLECTION',
            'TELLING ASSEMBLY', 'NARRATING GATHERING', 'RELATING MEETING', 'RECOUNTING CONFERENCE', 'DESCRIBING SUMMIT',
            'EXPLAINING COUNCIL', 'CLARIFYING CONGRESS', 'ILLUMINATING PARLIAMENT', 'ENLIGHTENING SENATE', 'INFORMING CHAMBER',
            'TEACHING HALL', 'INSTRUCTING COURT', 'TRAINING TRIBUNAL', 'COACHING BENCH', 'MENTORING BAR',
            'GUIDING DOCK', 'DIRECTING STAND', 'LEADING WITNESS', 'CONDUCTING JURY', 'MANAGING VERDICT',
            'CONTROLLING JUDGMENT', 'SUPERVISING RULING', 'OVERSEEING DECISION', 'MONITORING CHOICE', 'WATCHING SELECTION',
            'OBSERVING PICK', 'VIEWING OPTION', 'SEEING ALTERNATIVE', 'LOOKING POSSIBILITY', 'GAZING CHANCE',
            'STARING LUCK', 'PEERING FORTUNE', 'GLANCING FATE', 'GLIMPSING DESTINY', 'SPOTTING PURPOSE',
            'NOTICING GOAL', 'DETECTING AIM', 'FINDING TARGET', 'LOCATING OBJECTIVE', 'DISCOVERING END',
            'UNCOVERING FINISH', 'REVEALING CONCLUSION', 'EXPOSING TERMINATION', 'DISCLOSING COMPLETION', 'UNVEILING FULFILLMENT',
            'SHOWING ACHIEVEMENT', 'DEMONSTRATING ACCOMPLISHMENT', 'DISPLAYING SUCCESS', 'EXHIBITING VICTORY', 'PRESENTING TRIUMPH',
            'INTRODUCING WIN', 'OFFERING CONQUEST', 'PROVIDING MASTERY', 'GIVING SUPREMACY', 'DELIVERING DOMINANCE',
            'BRINGING CONTROL', 'CARRYING POWER', 'BEARING MIGHT', 'TRANSPORTING FORCE', 'CONVEYING STRENGTH',
            'MOVING ENERGY', 'SHIFTING VIGOR', 'CHANGING VITALITY', 'ALTERING LIFE', 'MODIFYING EXISTENCE',
            'ADJUSTING BEING', 'ADAPTING ESSENCE', 'REVISING SUBSTANCE', 'EDITING MATTER', 'AMENDING MATERIAL',
            'CORRECTING STUFF', 'IMPROVING THINGS', 'ENHANCING OBJECTS', 'UPGRADING ITEMS', 'ADVANCING ARTICLES',
            'PROGRESSING GOODS', 'DEVELOPING WARES', 'EVOLVING PRODUCTS', 'GROWING MERCHANDISE', 'EXPANDING STOCK',
            'INCREASING INVENTORY', 'ENLARGING SUPPLY', 'EXTENDING RESERVE', 'STRETCHING STORE', 'LENGTHENING CACHE',
            'PROLONGING HOARD', 'CONTINUING STASH', 'MAINTAINING STOCKPILE', 'SUSTAINING ACCUMULATION', 'PRESERVING COLLECTION',
            'CONSERVING AGGREGATION', 'KEEPING ASSEMBLAGE', 'HOLDING CONGLOMERATION', 'RETAINING COMPILATION', 'STORING ANTHOLOGY',
            'SAVING TREASURY', 'BANKING REPOSITORY', 'DEPOSITING DEPOT', 'ARCHIVING WAREHOUSE', 'FILING STOREHOUSE',
            'CATALOGING MAGAZINE', 'INDEXING ARSENAL', 'LISTING ARMORY', 'RECORDING MUNITIONS', 'REGISTERING AMMUNITION',
            'DOCUMENTING ORDNANCE', 'NOTING WEAPONRY', 'MARKING ARMS', 'INDICATING ARTILLERY', 'DESIGNATING CANNON',
            'SPECIFYING GUNS', 'IDENTIFYING RIFLES', 'NAMING PISTOLS', 'LABELING REVOLVERS', 'TAGGING SHOTGUNS',
            'BRANDING CARBINES', 'STAMPING MUSKETS', 'IMPRINTING BLUNDERBUSS', 'ENGRAVING ARQUEBUS', 'ETCHING MATCHLOCK',
            'CARVING FLINTLOCK', 'SCULPTING WHEELLOCK', 'MOLDING SNAPHANCE', 'CASTING DOGLOCK', 'FORGING MIQUELET',
            'HAMMERING FIRELOCK', 'BEATING FUSILLADE', 'POUNDING BARRAGE', 'STRIKING SALVO', 'HITTING VOLLEY',
            'SMASHING BROADSIDE', 'CRUSHING CANNONADE', 'BREAKING BOMBARDMENT', 'SHATTERING BLITZ', 'DEMOLISHING ONSLAUGHT',
            'DESTROYING ASSAULT', 'RUINING ATTACK', 'WRECKING OFFENSIVE', 'DEVASTATING RAID', 'ANNIHILATING STRIKE',
            'OBLITERATING CHARGE', 'ERADICATING RUSH', 'EXTERMINATING SURGE', 'ELIMINATING PUSH', 'REMOVING DRIVE',
            'DELETING THRUST', 'ERASING LUNGE', 'WIPING STAB', 'CLEARING PIERCE', 'CLEANING PUNCTURE',
            'PURGING PERFORATION', 'CLEANSING PENETRATION', 'WASHING INTRUSION', 'RINSING INVASION', 'SCRUBBING INCURSION',
            'SCOURING FORAY', 'POLISHING SORTIE', 'BUFFING EXPEDITION', 'SHINING CAMPAIGN', 'GLEAMING CRUSADE',
            'GLOWING JIHAD', 'RADIATING QUEST', 'BEAMING MISSION', 'BLAZING ERRAND', 'BURNING TASK',
            'FLAMING JOB', 'SCORCHING DUTY', 'SEARING ASSIGNMENT', 'CHARRING COMMISSION', 'COMBUSTING CHARGE',
            'IGNITING RESPONSIBILITY', 'KINDLING OBLIGATION', 'LIGHTING COMMITMENT', 'SPARKING PLEDGE', 'FIRING VOW'
        ];
        
        const LIGHTNING_LEVELS = [
            'THUNDER GATE', 'STORM PASS', 'BOLT CAVERN', 'ELECTRIC PEAK', 'PLASMA WALL',
            'TEMPEST PLAINS', 'ION CAVE', 'VOLTAGE SHRINE', 'CHARGED THRONE', 'STATIC WASTES',
            'ARC EXPANSE', 'SHOCK BARRENS', 'CURRENT FORTRESS', 'DISCHARGE RIDGE', 'STORM CELL VALLEY',
            'ELECTRON CORE', 'PLASMA LAKE', 'LIGHTNING BRIDGE', 'CRYSTAL CONDUCTOR', 'STATIC FIELD',
            'STORM GOD CASTLE', 'THUNDER BEAST DEN', 'LIGHTNING BIRD NEST', 'ELECTRIC EEL POOL', 'ION ELEMENTAL NEXUS',
            'VOLTAGE SPIRIT DOMAIN', 'PLASMA ENTITY LAIR', 'SHOCK WRAITH ROOST', 'BOLT PHANTOM PEAK', 'CHARGE GHOST PIT',
            'CURRENT SPECTER HAUNT', 'ARC APPARITION SHRINE', 'STORM TITAN ARENA', 'LIGHTNING GIANT FORTRESS', 'THUNDER DEMON GATE',
            'ELECTRIFIED RUINS', 'CHARGED TEMPLE', 'IONIZED CATHEDRAL', 'MAGNETIC SANCTUM', 'POLARIZED ALTAR',
            'CAPACITOR ARRAY', 'BATTERY BANK', 'GENERATOR HALL', 'TURBINE CHAMBER', 'DYNAMO ROOM',
            'TRANSFORMER STATION', 'SUBSTATION HUB', 'POWER PLANT', 'GRID CONTROL', 'CIRCUIT NEXUS',
            'CONDUCTOR PATH', 'WIRE TUNNEL', 'CABLE PASSAGE', 'CONDUIT CORRIDOR', 'INSULATOR GAP',
            'RESISTOR JUNCTION', 'DIODE CROSSROAD', 'TRANSISTOR NODE', 'CAPACITOR POINT', 'INDUCTOR COIL',
            'RELAY SWITCH', 'FUSE BOX', 'BREAKER PANEL', 'METER STATION', 'SOCKET OUTLET',
            'PLUG CONNECTION', 'TERMINAL BLOCK', 'BUS BAR', 'GROUND ROD', 'NEUTRAL WIRE',
            'LIVE CONDUCTOR', 'HOT LINE', 'PHASE ANGLE', 'FREQUENCY WAVE', 'AMPLITUDE PEAK',
            'VOLTAGE DROP', 'CURRENT RISE', 'POWER SURGE', 'ENERGY SPIKE', 'CHARGE PULSE',
            'ELECTRON FLOW', 'ION STREAM', 'PLASMA JET', 'ARC FLASH', 'SPARK GAP',
            'CORONA DISCHARGE', 'ST ELMO FIRE', 'BALL LIGHTNING', 'SHEET LIGHTNING', 'FORK LIGHTNING',
            'CHAIN LIGHTNING', 'BOLT FROM BLUE', 'THUNDER CRACK', 'SONIC BOOM', 'SHOCK WAVE',
            'PRESSURE FRONT', 'ATMOSPHERE SPLIT', 'AIR IONIZATION', 'OXYGEN PLASMA', 'NITROGEN GLOW',
            'OZONE SMELL', 'BURNT AIR', 'SCORCHED OXYGEN', 'CHARRED ATMOSPHERE', 'BLACKENED SKY',
            'DARKENED CLOUDS', 'STORM FRONT', 'CUMULONIMBUS PEAK', 'ANVIL TOP', 'MAMMATUS BASE',
            'WALL CLOUD', 'FUNNEL CLOUD', 'TORNADO ALLEY', 'TWISTER TRAIL', 'CYCLONE PATH',
            'WHIRLWIND ROUTE', 'DUST DEVIL', 'WATERSPOUT', 'LANDSPOUT', 'GUSTNADO',
            'MICROBURST', 'DOWNBURST', 'UPDRAFT', 'DOWNDRAFT', 'WIND SHEAR',
            'JET STREAM', 'TRADE WINDS', 'WESTERLIES', 'EASTERLIES', 'POLAR VORTEX',
            'HADLEY CELL', 'FERREL CELL', 'POLAR CELL', 'INTERTROPICAL ZONE', 'DOLDRUMS',
            'HORSE LATITUDES', 'ROARING FORTIES', 'FURIOUS FIFTIES', 'SCREAMING SIXTIES', 'SOUTHERN OCEAN',
            'NORTH ATLANTIC', 'PACIFIC CROSSING', 'INDIAN OCEAN DRIFT', 'ARCTIC CIRCLE', 'ANTARCTIC RING',
            'EQUATORIAL BELT', 'TROPIC CAPRICORN', 'TROPIC CANCER', 'PRIME MERIDIAN', 'DATELINE',
            'INTERNATIONAL LINE', 'TIME ZONE BORDER', 'PARALLEL THIRTY', 'LATITUDE FORTY', 'LONGITUDE ZERO',
            'COORDINATE POINT', 'GPS LOCATION', 'SATELLITE FIX', 'NAVIGATION BEACON', 'WAYPOINT MARKER',
            'CHECKPOINT STATION', 'MILESTONE POST', 'BOUNDARY LINE', 'BORDER CROSSING', 'FRONTIER GATE',
            'CUSTOMS ENTRY', 'IMMIGRATION DESK', 'PASSPORT CONTROL', 'VISA STAMP', 'ENTRY PERMIT',
            'EXIT VISA', 'TRAVEL DOCUMENT', 'ID CHECK', 'SECURITY SCAN', 'METAL DETECTOR',
            'X-RAY MACHINE', 'BODY SCANNER', 'BAGGAGE CLAIM', 'LUGGAGE CAROUSEL', 'SUITCASE PICKUP',
            'TRUNK RETRIEVAL', 'CARGO HANDLING', 'FREIGHT TERMINAL', 'SHIPPING DOCK', 'LOADING BAY',
            'UNLOADING PLATFORM', 'TRANSFER STATION', 'DISTRIBUTION CENTER', 'WAREHOUSE COMPLEX', 'STORAGE FACILITY',
            'INVENTORY DEPOT', 'STOCK ROOM', 'SUPPLY CLOSET', 'PROVISION LOCKER', 'RESOURCE VAULT',
            'ASSET SAFE', 'HOLDING CELL', 'DETENTION CENTER', 'PRISON BLOCK', 'JAIL WING',
            'CELL BLOCK', 'MAXIMUM SECURITY', 'SOLITARY CONFINEMENT', 'ISOLATION UNIT', 'SEGREGATION AREA',
            'RESTRICTED ZONE', 'PROHIBITED SECTOR', 'FORBIDDEN REGION', 'OFF-LIMITS DISTRICT', 'NO-GO AREA',
            'DANGER ZONE', 'HAZARD FIELD', 'RISK TERRITORY', 'THREAT DOMAIN', 'PERIL PROVINCE',
            'JEOPARDY LAND', 'MENACE COUNTRY', 'WARNING NATION', 'CAUTION WORLD', 'ALERT PLANET',
            'ALARM STAR', 'EMERGENCY SYSTEM', 'CRISIS GALAXY', 'DISASTER UNIVERSE', 'CATASTROPHE COSMOS',
            'CALAMITY SPACE', 'TRAGEDY VOID', 'MISFORTUNE EMPTINESS', 'ADVERSITY VACUUM', 'TRIBULATION NOTHINGNESS',
            'AFFLICTION ABYSS', 'HARDSHIP CHASM', 'DIFFICULTY GULF', 'TROUBLE CANYON', 'PROBLEM GORGE',
            'ISSUE RAVINE', 'MATTER VALLEY', 'CONCERN BASIN', 'WORRY DEPRESSION', 'ANXIETY HOLLOW',
            'FEAR CAVITY', 'DREAD CRATER', 'TERROR PIT', 'HORROR HOLE', 'PANIC VOID',
            'ALARM GAP', 'FRIGHT SPACE', 'SCARE INTERVAL', 'SHOCK BREAK', 'STARTLE PAUSE',
            'SURPRISE STOP', 'ASTONISH REST', 'AMAZE HALT', 'ASTOUND CEASE', 'STUN END',
            'DAZE FINISH', 'BEWILDER CLOSE', 'CONFUSE CONCLUSION', 'PERPLEX TERMINATION', 'PUZZLE CULMINATION',
            'BAFFLE CLIMAX', 'MYSTIFY PEAK', 'BEFUDDLE SUMMIT', 'FLUMMOX APEX', 'CONFOUND ZENITH',
            'DISCONCERT ACME', 'DISTURB PINNACLE', 'UNSETTLE CREST', 'AGITATE TOP', 'FLUSTER HEIGHT',
            'RATTLE ELEVATION', 'SHAKE ALTITUDE', 'TREMBLE LEVEL', 'QUAKE PLANE', 'VIBRATE SURFACE',
            'OSCILLATE LAYER', 'FLUCTUATE STRATUM', 'WAVER TIER', 'FALTER RANK', 'HESITATE GRADE',
            'PAUSE CLASS', 'DELAY CATEGORY', 'POSTPONE TYPE', 'DEFER KIND', 'PROCRASTINATE SORT',
            'STALL VARIETY', 'LINGER SPECIES', 'LOITER BREED', 'DAWDLE STRAIN', 'TARRY STOCK',
            'WAIT LINE', 'STAY ANCESTRY', 'REMAIN DESCENT', 'ABIDE ORIGIN', 'DWELL SOURCE',
            'RESIDE START', 'INHABIT BEGINNING', 'OCCUPY DAWN', 'LIVE GENESIS', 'SETTLE BIRTH',
            'LODGE CREATION', 'QUARTER FORMATION', 'HOUSE MAKING', 'HOME BUILDING', 'SHELTER CONSTRUCTION',
            'HARBOR ASSEMBLY', 'REFUGE GATHERING', 'HAVEN MEETING', 'SANCTUARY UNION', 'ASYLUM JUNCTION',
            'RETREAT CROSSING', 'HIDEAWAY PASSAGE', 'ESCAPE ROUTE', 'FLIGHT PATH', 'EXODUS TRACK',
            'DEPARTURE TRAIL', 'LEAVING COURSE', 'GOING DIRECTION', 'EXIT HEADING', 'WITHDRAWAL BEARING',
            'RETREAT ORIENTATION', 'BACKING POSITION', 'RECEDING LOCATION', 'RETIRING PLACE', 'YIELDING SPOT',
            'GIVING SITE', 'SURRENDERING AREA', 'SUBMITTING ZONE', 'CAPITULATING REGION', 'CONCEDING SECTOR',
            'ALLOWING DISTRICT', 'PERMITTING QUARTER', 'ENABLING PRECINCT', 'FACILITATING DIVISION', 'HELPING SECTION',
            'AIDING SEGMENT', 'ASSISTING PART', 'SUPPORTING PORTION', 'BACKING SHARE', 'ENDORSING LOT',
            'APPROVING BATCH', 'SANCTIONING GROUP', 'AUTHORIZING SET', 'VALIDATING COLLECTION', 'CONFIRMING ASSEMBLY',
            'VERIFYING GATHERING', 'CERTIFYING MEETING', 'ATTESTING CONFERENCE', 'WITNESSING SUMMIT', 'TESTIFYING COUNCIL',
            'DECLARING CONGRESS', 'STATING PARLIAMENT', 'ASSERTING SENATE', 'AFFIRMING CHAMBER', 'MAINTAINING HALL',
            'CLAIMING COURT', 'CONTENDING TRIBUNAL', 'ARGUING BENCH', 'DEBATING BAR', 'DISCUSSING DOCK',
            'CONVERSING STAND', 'TALKING WITNESS', 'SPEAKING JURY', 'SAYING VERDICT', 'TELLING JUDGMENT',
            'NARRATING RULING', 'RELATING DECISION', 'RECOUNTING CHOICE', 'DESCRIBING SELECTION', 'EXPLAINING PICK',
            'CLARIFYING OPTION', 'ILLUMINATING ALTERNATIVE', 'ENLIGHTENING POSSIBILITY', 'INFORMING CHANCE', 'TEACHING LUCK',
            'INSTRUCTING FORTUNE', 'TRAINING FATE', 'COACHING DESTINY', 'MENTORING PURPOSE', 'GUIDING GOAL',
            'DIRECTING AIM', 'LEADING TARGET', 'CONDUCTING OBJECTIVE', 'MANAGING END', 'CONTROLLING FINISH',
            'SUPERVISING CONCLUSION', 'OVERSEEING TERMINATION', 'MONITORING COMPLETION', 'WATCHING FULFILLMENT', 'OBSERVING ACHIEVEMENT',
            'VIEWING ACCOMPLISHMENT', 'SEEING SUCCESS', 'LOOKING VICTORY', 'GAZING TRIUMPH', 'STARING WIN',
            'PEERING CONQUEST', 'GLANCING MASTERY', 'GLIMPSING SUPREMACY', 'SPOTTING DOMINANCE', 'NOTICING CONTROL',
            'DETECTING POWER', 'FINDING MIGHT', 'LOCATING FORCE', 'DISCOVERING STRENGTH', 'UNCOVERING ENERGY',
            'REVEALING VIGOR', 'EXPOSING VITALITY', 'DISCLOSING LIFE', 'UNVEILING EXISTENCE', 'SHOWING BEING',
            'DEMONSTRATING ESSENCE', 'DISPLAYING SUBSTANCE', 'EXHIBITING MATTER', 'PRESENTING MATERIAL', 'INTRODUCING STUFF',
            'OFFERING THINGS', 'PROVIDING OBJECTS', 'GIVING ITEMS', 'DELIVERING ARTICLES', 'BRINGING GOODS',
            'CARRYING WARES', 'BEARING PRODUCTS', 'TRANSPORTING MERCHANDISE', 'CONVEYING STOCK', 'MOVING INVENTORY',
            'SHIFTING SUPPLY', 'CHANGING RESERVE', 'ALTERING STORE', 'MODIFYING CACHE', 'ADJUSTING HOARD',
            'ADAPTING STASH', 'REVISING STOCKPILE', 'EDITING ACCUMULATION', 'AMENDING COLLECTION', 'CORRECTING AGGREGATION'
        ];
        
        // Combine all level names into one array
        const ALL_LEVEL_NAMES = [...GRASSY_LEVELS, ...ICE_LEVELS, ...LAVA_LEVELS, ...LIGHTNING_LEVELS];
        
        // Unique level names for endless battles (OLD SYSTEM - keeping for backwards compatibility)
        const LEVEL_NAMES = ALL_LEVEL_NAMES;
        
        // Create reverse mapping for name to level
        const LEVEL_NAME_TO_NUMBER = {};
        LEVEL_NAMES.forEach((name, index) => {
            LEVEL_NAME_TO_NUMBER[name] = index;
        });
        // Add boss names to the mapping so users can search by boss name too
        Object.keys(BOSSES).forEach(level => {
            const boss = BOSSES[level];
            LEVEL_NAME_TO_NUMBER[boss.name] = parseInt(level);
        });
        const shops = []; // Shop buildings

        let gameState = 'title';
        let currentLevel = 0;
        let tutorialComplete = false;
        let lastTime = 0;
        let isPaused = false;

        let bowMode = false;
        let bowTarget = null;

        const enemies = [];
        const npcs = [];
        const projectiles = [];
        const effects = [];
        const drops = [];
        const particles = []; // Jetpack/force field visual particles
        const levelHazards = []; // Dynamic level hazards (meteors, lava, etc.)

        let dialogueOpen = false;
        let dialogueData = null;
        let nearbyNPC = null;

        const tutorialSteps = [
            { text: 'USE A AND D TO MOVE LEFT AND RIGHT', check: () => player.totalMoved > 150 },
            { text: 'PRESS W OR SPACE TO JUMP', check: () => player.totalJumps >= 2 },
            { text: 'DESTROY THE SWORD DUMMIES (CLICK TO SWING)', check: () => enemies.filter(e => e.alive && e.type === 'sword_dummy').length === 0, onComplete: 'spawnArrowDummies' },
            { text: 'NOW USE YOUR BOW! (R TO AIM, CLICK TARGET, R TO SHOOT)', check: () => enemies.filter(e => e.alive && e.type === 'arrow_dummy').length === 0 },
            { text: 'PRESS E NEAR THE MASTER TO TALK', check: () => player.talkedToMaster, onComplete: 'spawnSlimes' },
            { text: 'FINAL TEST: DEFEAT ALL THE SLIMES!', check: () => enemies.filter(e => e.alive && e.type === 'slime').length === 0 },
            { text: 'PRESS ESC TO OPEN PAUSE MENU', check: () => false } // Info only
        ];
        let tutorialStep = 0;
