export const GROUND_RATIO = 0.76;
export const GRAVITY = 1750;
export const JUMP_FORCE = -620;

export const MATERIALS = ['wooden', 'rock', 'silver', 'gold', 'diamond', 'titanium', 'light'];
export const MATERIAL_COLORS = {
  wooden: '#8B4513',
  rock: '#708090',
  silver: '#C0C0C0',
  gold: '#FFD700',
  diamond: '#67e8f9',
  titanium: '#9ca3af',
  light: '#fffbe6'
};

export const MATERIAL_PRICES = {
  wooden: 10,
  rock: 60,
  silver: 200,
  gold: 500,
  diamond: 1300,
  titanium: 3200
};

export const POTIONS = {
  healing: { icon: '🧪', name: 'HEALING', price: 30, color: '#ef4444' },
  shield: { icon: '🛡️', name: 'SHIELD', price: 50, color: '#3b82f6' },
  damage: { icon: '💪', name: 'DAMAGE', price: 80, color: '#f59e0b' },
  speed: { icon: '💨', name: 'SPEED', price: 40, color: '#10b981' },
  vitality: { icon: '❤️', name: 'VITALITY', price: 100, color: '#ec4899' }
};

export const BOW_TYPES = {
  basic: { name: 'BASIC', price: 0, mult: 1, status: null },
  fire: { name: 'FIRE', price: 500, mult: 2, status: 'burn' },
  lightning: { name: 'LIGHTNING', price: 800, mult: 1.5, status: 'chain' },
  ice: { name: 'ICE', price: 600, mult: 1.2, status: 'freeze' },
  light: { name: 'BOW OF LIGHT', price: 0, mult: 3, status: 'light' }
};

export const ARROW_TYPES = {
  basic: { name: 'BASIC', price: 0, damage: 4, speed: 500 },
  steel: { name: 'STEEL', price: 300, damage: 7, speed: 650 },
  diamond: { name: 'DIAMOND', price: 800, damage: 12, speed: 780 },
  explosive: { name: 'EXPLOSIVE', price: 1200, damage: 15, speed: 620 }
};

export const WORLD_AREAS = {
  grassy: { icon: '🌱', name: 'GRASSY PLAIN', start: 0, end: 299, unlocked: true, unlockAt: 0 },
  ice: { icon: '❄️', name: 'ICE PALACE', start: 300, end: 599, unlocked: false, unlockAt: 300 },
  lava: { icon: '🌋', name: 'LAVA MOUNTAIN', start: 600, end: 899, unlocked: false, unlockAt: 600 },
  lightning: { icon: '⚡', name: 'LIGHTNING CLOUD', start: 900, end: 1199, unlocked: false, unlockAt: 900 },
  void: { icon: '💀', name: 'THE ABYSS', start: 1201, end: 1250, unlocked: false, unlockAt: 1201, secret: true }
};

export const LEVEL_NAMES = {
  grassy: [
    'WHISPERING GLEN','EMERALD MEADOW','MOSSY HOLLOW','SUNLIT GROVE','HIDDEN BROOK',
    'FOXGLOVE PATH','WILD GARDEN','AMBER FIELD','CLOVER RISE','GOLDEN BRIDGE',
    'THORNWOOD TRAIL','ANCIENT OAK','MISTY GLADE','WINDING CREEK','PEACEFUL VALE',
    'BIRCHWOOD GATE','WILLOW BEND','GREENSTONE ARCH','GENTLE SLOPE','HONEY ORCHARD',
    'FERN VALLEY','DEWDROP RIDGE','SERPENT RIVER','QUIET POND','RUSTED MANOR',
    'BLUEBELL HILL','CRIMSON HEDGE','SHADY COVE','PEBBLE FORD','CEDAR HOLLOW',
    'HAZEL THICKET','SILVER STREAM','MOONLIT PATH','TWILIGHT MARSH','PINE RIDGE',
    'LANTERN GLADE','STARLIT FIELD','VERDANT FALLS','HARVEST ROAD','IRON GATE',
    'SUNSET BLUFF','COPPER BRIDGE','OVERGROWN RUIN','COBWEB CAVERN','TOADSTOOL RING',
    'ENCHANTED LAKE','DAPPLED SHADE','WREN ROOST','GRASSY KNOLL','SHEPHERD HILL',
    'BROKEN TOWER','LILY SPRING','MUDDY BANK','STONE CIRCLE','ACORN TRAIL',
    'FOREST EDGE','MAPLE RIDGE','THICKET GATE','DUSTY ROAD','BEETLE BURROW',
    'FALCON PERCH','BRAMBLE WOOD','MOSSY RUIN','TANGLED ROOTS','SANDY COVE',
    'ROSE GARDEN','CRYSTAL BROOK','DEEP HOLLOW','WINDMILL HILL','RUSTY FENCE',
    'AMBER CANYON','SPARROW NEST','BASALT CLIFF','DAISY FIELD','FOGGY MOOR',
    'HIGHLAND TRAIL','IVORY GATE','JADE CREEK','KINGFISHER BAY','LAVENDER HILL',
    'MARBLE ARCH','NETTLE LANE','OAK HAVEN','PRIMROSE PATH','QUARRY TOWN',
    'RABBIT WARREN','SAGE HOLLOW','TIMBER BRIDGE','RIVER BEND','VIOLET GLADE',
    'WREN HOLLOW','YARROW FIELD','ASPEN GROVE','BARLEY GATE','CHESTNUT BEND',
    'ELM CROSSING','FLINT RIDGE','GOPHER HILL','HEATHER MOOR','IVY TOWER',
    'JUNIPER TRAIL','KESTREL ROOST','LARCH WOOD','MEADOW RUN','NEWT POND',
    'OTTER STREAM','POPLAR LANE','QUAIL RIDGE','REED MARSH','SORREL HILL',
    'THISTLEDOWN','UMBER GLADE','VALE ROAD','WATER MILL','FOXHOLE DEN',
    'YUCCA FIELD','ZINNIA BLOOM','ALDER SHADE','BUTTERCUP WAY','CRANE MARSH',
    'DOGWOOD PASS','EAGLE BLUFF','FAWN MEADOW','GARNET FORD','HERON LAKE',
    'INDIGO VALE','JASPER TRAIL','KNOTHOLE OAK','LYNX HOLLOW','MUSHROOM RING',
    'NIGHTSHADE GLADE','ORCHID COVE','PANTHER RIDGE','QUARTZ CAVERN','RAVEN PEAK',
    'STAG CROSSING','TULIP GARDEN','URCHIN COVE','VIPER MARSH','WOLF DEN',
    'WINTER BERRY','YONDER HILL','ZEPHER FIELD','ALDERTHORN','BADGER HOLE',
    'CANOPY WALK','DRAGONFLY POOL','EVERGREEN WAY','FIREFLY GLEN','GINGER ROOT',
    'HAWTHORN LANE','IRONWOOD GATE','JACKDAW ROOST','KETTLEDRUM HILL','LOOKOUT POINT',
    'MOLEHILL PATH','NUTMEG GROVE','OSPREY NEST','PARTRIDGE RUN','QUICKSILVER BROOK',
    'ROSEHIP TRAIL','SUNFLOWER ROAD','TURTLEDOVE GLEN','UNDERBRUSH','VINEYARD PATH',
    'WOODPECKER RIDGE','YELLOW MEADOW','ZIGZAG TRAIL','ACACIA GROVE','BLOSSOMING VALE',
    'CATTAIL SWAMP','DAWN RIDGE','ELDERBERRY PATH','FROG POND','GRAYWOLF DEN',
    'HOLLOW LOG','INKBERRY BUSH','JACKRABBIT RUN','KETTLEBELL HILL','LOST TRAIL',
    'MILLSTONE CREEK','NIGHTJAR ROOST','OLD MILL','PHEASANT WALK','QUIET GROVE',
    'RAINDROP GLEN','SASSAFRAS LANE','TROUT STREAM','UPLAND MEADOW','VERNAL POOL',
    'WEEPING WILLOW','YEARLING FIELD','AZURE MEADOW','BISON RANGE','CHERRY DALE',
    'DRUID CIRCLE','ECHO VALLEY','FEATHERSTONE','GOOSE CREEK','HAREBELL FIELD',
    'INKWELL SPRING','JUNCO ROOST','KINGWOOD TRAIL','LINDEN ARBOL','MAGPIE PERCH',
    'NIGHTINGALE WAY','OAKMOSS GLADE','PEACOCK GARDEN','QUAKING ASPEN','ROBIN GLEN',
    'STARGAZER HILL','TANAGER ROOST','UNCHARTED PATH','VISTA POINT','WARBLER WOOD',
    'BRAMBLECREST','GOLDFINCH GLEN','PATCHWORK FIELD','RUSHWOOD TRAIL','SILVERPINE',
    'COPPERVALE','STONEWALL PATH','MORNING DEW','BRACKEN HILL','LOAM FIELD',
    'PAINTED ROCK','WINDSWEPT BLUFF','DEERHORN TRAIL','BURROW HILL','MAPLECREST',
    'TAWNY RIDGE','STILLWATER BEND','SYCAMORE SHADE','WANDERER PATH','CLEARWATER GLEN',
    'HONEYBEE LANE','FERNWOOD MANOR','ROOKERY HILL','SUNSTONE ARCH','PEAT BOG',
    'DRIZZLE HOLLOW','CATTAIL CREEK','CLOUDBERRY HILL','GREENBRIAR','ASHWOOD TRAIL',
    'SNAPDRAGON VALE','MILKWEED PATH','CRABAPPLE GROVE','BIRDSONG GLEN','COBBLESTONE WAY',
    'TURNIP FIELD','SNAIL TRAIL','FOSSIL RIDGE','PEPPERMINT WOOD','BEETLE GROVE',
    'FINCH MEADOW','SALMON RUN','BEAVERDAM CREEK','HAWKMOTH GLEN','PAINTBRUSH HILL',
    'CORNFLOWER LANE','FIDDLEHEAD TRAIL','BULRUSH POND','SWALLOWTAIL GLADE','DANDELION RISE',
    'LADYBUG GARDEN','BURR OAK','CHICKADEE WOOD','COYOTE RIDGE','FIREBRUSH DALE',
    'GOLDENROD FIELD','HUMMINGBIRD GLEN','IRONWEED PATH','JACOB LADDER','KITEFIN BAY',
    'LARKSPUR LANE','MARIGOLD MEADOW','NUTHATCH GROVE','ORIOLE ROOST','PINECONE TRAIL'
  ],
  ice: [
    'FROZEN GATE','SNOWFALL BASIN','GLACIER POINT','ICICLE RIDGE','FROSTED VALE',
    'CRYSTAL TUNDRA','BLIZZARD PEAK','SHIVERING CAVE','POLAR WATCH','DRIFT HOLLOW',
    'SLEET CROSSING','PERMAFROST WAY','FROSTBITE LEDGE','AVALANCHE PASS','WINTER THRONE',
    'ARCTIC BRIDGE','HAILSTONE RIDGE','SNOWDRIFT MANOR','PALE SUMMIT','RIME CAVERN',
    'GLACIAL FALLS','NORTH WIND','ICE SHARD PEAK','FROZEN RIVER','FROST GARDEN',
    'WHITEOUT FIELDS','COLD IRON GATE','SILENT SNOW','BITTER HOLLOW','SNOWCAP RUINS',
    'POWDER RIDGE','TUNDRA WATCH','FROZEN SPIRE','ICEBOUND TRAIL','CRYSTALLINE LAKE',
    'GLACIAL RIFT','WINTRY GLADE','SNOWMELT CREEK','FROSTFIRE CAVE','FROZEN THRONE',
    'HAILSTORM PEAK','FRIGID HOLLOW','SNOWSQUALL BAY','COLDSNAP RIDGE','ICE TEMPLE',
    'BOREAL FOREST','RIMEFROST GATE','WINTER HOLLOW','BLACKICE CAVE','PERMAFROST PEAK',
    'SLEETFALL PATH','ICECAP RUINS','SNOWBOUND TOWER','GLACIAL GROTTO','FROST HAVEN',
    'WHITEPINE RIDGE','CHILL BASIN','SNOWFIELD MANOR','FROSTED BRIDGE','ICEFALL GORGE',
    'POLAR CAVERN','ARCTIC TEMPLE','BLIZZARD GATE','FROZEN MEADOW','SNOWDUST PATH',
    'RIME FORTRESS','COLDWIND VALE','ICE PILLAR','GLACIER DALE','FROSTWOOD GLEN',
    'SNOWBLIND PASS','SHATTERED ICE','CRYSTAL CAVERN','WINTER SPIRE','FROZEN GARDEN',
    'TUNDRA KEEP','ICECRYSTAL CAVE','POLAR SUMMIT','HOWLING FROST','BITTER PEAK',
    'GLACIAL THRONE','FROZEN HARBOR','SNOWSTORM RIDGE','PALE HOLLOW','RIME BRIDGE',
    'ARCTIC FALLS','FROSTBITTEN PATH','ICESHEET BLUFF','SNOWCREST MANOR','COLD FORGE',
    'WINTER VALE','GLACIAL ALTAR','FROSTED RUINS','SLEETSTONE ARCH','PERMAFROST GATE',
    'SNOWPEAK TOWER','FROZEN GORGE','ICE CLIFF','BLIZZARD HOLLOW','POLAR RIDGE',
    'HAILFIRE CAVE','TUNDRA FALLS','RIME PEAK','FROSTGLOW GLEN','SNOWBOUND PATH',
    'CRYSTAL SUMMIT','FROZEN CHAPEL','ICEVEIN MINE','COLD HARBOR','GLACIAL KEEP',
    'WINTER BRIDGE','SNOWSHADOW','FROST SPIRE','ARCTIC HOLLOW','BLINDING SNOW',
    'ICEWIND TRAIL','FROZEN FOREST','SNOWFALL PEAK','RIME HOLLOW','COLDSTONE GATE',
    'POLAR TEMPLE','GLACIER CAVE','FROSTDALE','WINTER CREEK','SNOWLIGHT GLEN',
    'ICEMIST VALE','BITTER RIDGE','FROSTED PEAK','ARCTIC SPIRE','GLACIAL BRIDGE',
    'CRYSTAL THRONE','SNOWBIRD ROOST','PERMAFROST TOWER','ICE GARDEN','FROZEN ALTAR',
    'TUNDRA RIDGE','BLIZZARD SPIRE','COLDWIND KEEP','FROSTMARK PATH','SNOWVEIL CAVE',
    'RIME TEMPLE','WINTER FALLS','POLAR GATE','GLACIAL RUIN','ICE HAVEN',
    'FROZEN WELL','SNOWMIRE','ARCTIC DALE','FROST HOLLOW','ICECROWN PEAK',
    'CRYSTAL BRIDGE','BLIZZARD KEEP','FROZEN TOWER','COLDFIRE CAVE','WINTER RIDGE',
    'SNOWBORN PATH','ICE ALTAR','RIME DALE','GLACIAL MANOR','FROSTCRAG',
    'POLAR PATH','TUNDRA SPIRE','FROZEN DALE','SNOWSTONE GATE','ARCTIC RUIN',
    'BITTER CAVE','ICE BRIDGE','WINTER GROTTO','BLIZZARD DALE','CRYSTAL KEEP',
    'FROZEN PINES','SNOWGLOW PEAK','COLDFRONT','RIME GARDEN','FROSTFALL CAVE',
    'POLAR HOLLOW','GLACIAL PATH','ICE MESA','WINTER ARCH','SNOWDRIFT PEAK',
    'TUNDRA THRONE','FROZEN CREST','ARCTIC KEEP','BLIZZARD PATH','FROST RIDGE',
    'CRYSTAL HOLLOW','SNOWSHADE','ICE THRONE','RIME FALLS','COLDSNAP CAVE',
    'POLAR MANOR','WINTER TOWER','GLACIAL GATE','FROZEN PASS','SNOWFALL RUINS',
    'ARCTIC BRIDGE','FROST VALE','ICE RUIN','BLIZZARD FALLS','TUNDRA CAVE',
    'CRYSTAL DALE','FROZEN LIGHT','SNOWSTEP PATH','POLAR RUINS','RIME TOWER',
    'WINTER GATE','COLDFIRE PEAK','GLACIAL SPIRE','FROSTPINE GLEN','ICE PEAK',
    'ARCTIC FALLS','BLIZZARD RUINS','SNOWFALL GLEN','FROZEN ARCH','CRYSTAL GATE',
    'WINTER MESA','TUNDRA GATE','POLAR PEAK','COLDSTONE KEEP','RIME RIDGE',
    'FROST GATE','ICE FALLS','GLACIER GATE','SNOWBOURNE','FROZEN GLADE',
    'ARCTIC THRONE','BLIZZARD CAVE','CRYSTAL PATH','WINTER PEAK','TUNDRA TOWER',
    'POLAR DALE','FROST CAVE','ICE HOLLOW','RIME KEEP','GLACIAL FALLS',
    'SNOWFALL CAVE','FROZEN RIDGE','ARCTIC CAVE','BLIZZARD BRIDGE','CRYSTAL RUINS',
    'WINTER CAVE','TUNDRA BRIDGE','POLAR CAVE','COLDSKY RIDGE','FROST RUINS',
    'ICE DALE','GLACIER HOLLOW','SNOWPEAK RUINS','RIME BRIDGE','FROZEN KNOLL',
    'ARCTIC HOLLOW','BLIZZARD TOWER','CRYSTAL SPIRE','WINTER DALE','TUNDRA VALE'
  ],
  lava: [
    'MOLTEN GATE','EMBER FIELD','CHARRED BASIN','SCORCHED TRAIL','CRIMSON VENT',
    'ASHEN HOLLOW','FIRE RIDGE','MAGMA FLOW','CINDER PATH','VOLCANIC ARCH',
    'SULFUR SPRING','INFERNAL GATE','OBSIDIAN CLIFF','BLAZING MESA','SEARING GORGE',
    'HELLFIRE BRIDGE','FLAME THRONE','PYROCLAST RIDGE','LAVA FALLS','BRIMSTONE CAVE',
    'EMBER CANYON','CHARCOAL RUINS','SCORCHED VALE','MOLTEN FORGE','CINDER HOLLOW',
    'ASH GARDEN','FIRE TEMPLE','MAGMA THRONE','VOLCANIC KEEP','CRIMSON POOL',
    'INFERNAL SPIRE','OBSIDIAN GATE','BLAZING TRAIL','SEARING PEAK','SULFUR CAVE',
    'HELLFIRE PATH','FLAME CANYON','PYROCLAST CAVE','LAVA BRIDGE','BRIMSTONE ARCH',
    'EMBER RUINS','CHARRED FOREST','SCORCHED MESA','MOLTEN LAKE','CINDER RIDGE',
    'ASH VALE','FIRE HOLLOW','MAGMA RIFT','VOLCANIC ALTAR','CRIMSON BRIDGE',
    'INFERNAL PIT','OBSIDIAN THRONE','BLAZING HOLLOW','SEARING FALLS','SULFUR RIDGE',
    'HELLFIRE CAVE','FLAME RIDGE','PYROCLAST GATE','LAVA THRONE','BRIMSTONE PEAK',
    'EMBER PATH','CHARRED GATE','SCORCHED RUINS','MOLTEN ARCH','CINDER GATE',
    'ASH PEAK','FIRE DALE','MAGMA POOL','VOLCANIC PATH','CRIMSON CAVE',
    'INFERNAL RIDGE','OBSIDIAN PATH','BLAZING GATE','SEARING CAVE','SULFUR VENT',
    'HELLFIRE PEAK','FLAME HOLLOW','PYROCLAST FALLS','LAVA CAVERN','BRIMSTONE GATE',
    'EMBER DALE','CHARRED VALE','SCORCHED PEAK','MOLTEN PATH','CINDER FALLS',
    'ASH BRIDGE','FIRE KEEP','MAGMA BRIDGE','VOLCANIC CAVE','CRIMSON RIDGE',
    'INFERNAL ARCH','OBSIDIAN FALLS','BLAZING RUINS','SEARING DALE','SULFUR POOL',
    'HELLFIRE HOLLOW','FLAME PATH','PYROCLAST ARCH','LAVA GATE','BRIMSTONE DALE',
    'EMBER CAVE','CHARRED PEAK','SCORCHED BRIDGE','MOLTEN RUINS','CINDER ARCH',
    'ASH TEMPLE','FIRE BRIDGE','MAGMA CAVE','VOLCANIC RIDGE','CRIMSON FALLS',
    'INFERNAL DALE','OBSIDIAN CAVE','BLAZING DALE','SEARING ARCH','SULFUR BRIDGE',
    'HELLFIRE RUINS','FLAME DALE','PYROCLAST POOL','LAVA RIDGE','BRIMSTONE CAVE',
    'EMBER ARCH','CHARRED BRIDGE','SCORCHED GATE','MOLTEN CAVE','CINDER DALE',
    'ASH CAVERN','FIRE GORGE','MAGMA DALE','VOLCANIC BRIDGE','CRIMSON PATH',
    'INFERNAL KEEP','OBSIDIAN RIDGE','BLAZING CAVE','SEARING RUINS','SULFUR DALE',
    'HELLFIRE DALE','FLAME RUINS','PYROCLAST DALE','LAVA PATH','BRIMSTONE RIDGE',
    'EMBER KEEP','CHARRED DALE','SCORCHED FALLS','MOLTEN PEAK','CINDER CAVE',
    'ASH RIDGE','FIRE RUINS','MAGMA RUINS','VOLCANIC FALLS','CRIMSON RUINS',
    'INFERNAL FALLS','OBSIDIAN DALE','BLAZING PEAK','SEARING GATE','SULFUR RUINS',
    'HELLFIRE GATE','FLAME CAVE','PYROCLAST PEAK','LAVA DALE','BRIMSTONE FALLS',
    'EMBER GATE','CHARRED CAVE','SCORCHED DALE','MOLTEN DALE','CINDER PEAK',
    'ASH GATE','FIRE ARCH','MAGMA GATE','VOLCANIC DALE','CRIMSON DALE',
    'INFERNAL CAVE','OBSIDIAN PEAK','BLAZING FALLS','SEARING BRIDGE','SULFUR PEAK',
    'HELLFIRE ARCH','FLAME ARCH','PYROCLAST RUINS','LAVA RUINS','BRIMSTONE PATH',
    'EMBER BRIDGE','CHARRED ARCH','SCORCHED CAVE','MOLTEN BRIDGE','CINDER BRIDGE',
    'ASH FALLS','FIRE FALLS','MAGMA PEAK','VOLCANIC PEAK','CRIMSON GATE',
    'INFERNAL BRIDGE','OBSIDIAN ARCH','BLAZING PATH','SEARING PATH','SULFUR GATE',
    'HELLFIRE FALLS','FLAME GATE','PYROCLAST BRIDGE','LAVA PEAK','BRIMSTONE RUINS',
    'EMBER FALLS','CHARRED PATH','SCORCHED ARCH','MOLTEN FALLS','CINDER RUINS',
    'ASH PATH','FIRE PATH','MAGMA ARCH','VOLCANIC RUINS','CRIMSON ARCH',
    'INFERNAL PATH','OBSIDIAN RUINS','BLAZING ARCH','SEARING PEAK','SULFUR ARCH',
    'HELLFIRE RIDGE','FLAME PEAK','PYROCLAST PATH','LAVA ARCH','BRIMSTONE ARCH',
    'EMBER PEAK','CHARRED RUINS','SCORCHED RIDGE','MOLTEN RIDGE','CINDER THRONE',
    'ASH HOLLOW','FIRE PEAK','MAGMA FALLS','VOLCANIC GATE','CRIMSON PEAK',
    'INFERNAL PEAK','OBSIDIAN BRIDGE','BLAZING BRIDGE','SEARING HOLLOW','SULFUR FALLS',
    'HELLFIRE THRONE','FLAME BRIDGE','PYROCLAST RIDGE','LAVA HOLLOW','BRIMSTONE HOLLOW',
    'EMBER HOLLOW','CHARRED HOLLOW','SCORCHED HOLLOW','MOLTEN HOLLOW','CINDER TRAIL',
    'ASH TRAIL','FIRE TRAIL','MAGMA TRAIL','VOLCANIC TRAIL','CRIMSON TRAIL',
    'INFERNAL TRAIL','OBSIDIAN TRAIL','BLAZING TRAIL','SEARING TRAIL','SULFUR TRAIL',
    'HELLFIRE TRAIL','FLAME TRAIL','PYROCLAST TRAIL','LAVA TRAIL','BRIMSTONE TRAIL',
    'EMBER THRONE','CHARRED THRONE','SCORCHED THRONE','MOLTEN THRONE','CINDER MESA',
    'ASH MESA','FIRE MESA','MAGMA MESA','VOLCANIC MESA','CRIMSON MESA',
    'INFERNAL MESA','OBSIDIAN MESA','BLAZING MESA','SEARING MESA','SULFUR MESA',
    'HELLFIRE MESA','FLAME MESA','PYROCLAST MESA','LAVA MESA','BRIMSTONE MESA'
  ],
  lightning: [
    'THUNDER GATE','STORM BASIN','VOLTAGE RIDGE','SPARK HOLLOW','CHARGED FIELD',
    'CRACKLING CAVE','SURGE PEAK','BOLT BRIDGE','GALVANIC RIFT','STATIC VALE',
    'PLASMA SPIRE','TEMPEST RIDGE','SHOCK TOWER','ARC HOLLOW','IONIZED PATH',
    'MAGNETIC FALLS','THUNDER PEAK','STORM THRONE','VOLTAGE CAVE','SPARK TRAIL',
    'CHARGED BRIDGE','CRACKLING PATH','SURGE DALE','BOLT GATE','GALVANIC PEAK',
    'STATIC BRIDGE','PLASMA GATE','TEMPEST CAVE','SHOCK PATH','ARC RIDGE',
    'IONIZED DALE','MAGNETIC CAVE','THUNDER HOLLOW','STORM RIDGE','VOLTAGE PATH',
    'SPARK CAVE','CHARGED RUINS','CRACKLING DALE','SURGE FALLS','BOLT PEAK',
    'GALVANIC DALE','STATIC CAVE','PLASMA FALLS','TEMPEST PATH','SHOCK DALE',
    'ARC GATE','IONIZED CAVE','MAGNETIC RIDGE','THUNDER CAVE','STORM FALLS',
    'VOLTAGE DALE','SPARK BRIDGE','CHARGED PEAK','CRACKLING RUINS','SURGE GATE',
    'BOLT HOLLOW','GALVANIC CAVE','STATIC RUINS','PLASMA RIDGE','TEMPEST DALE',
    'SHOCK CAVE','ARC DALE','IONIZED PEAK','MAGNETIC PATH','THUNDER BRIDGE',
    'STORM GATE','VOLTAGE RUINS','SPARK DALE','CHARGED CAVE','CRACKLING PEAK',
    'SURGE CAVE','BOLT DALE','GALVANIC RUINS','STATIC PEAK','PLASMA DALE',
    'TEMPEST GATE','SHOCK RIDGE','ARC CAVE','IONIZED FALLS','MAGNETIC DALE',
    'THUNDER RUINS','STORM PATH','VOLTAGE FALLS','SPARK RUINS','CHARGED PATH',
    'CRACKLING GATE','SURGE RIDGE','BOLT CAVE','GALVANIC FALLS','STATIC DALE',
    'PLASMA PATH','TEMPEST FALLS','SHOCK GATE','ARC FALLS','IONIZED RIDGE',
    'MAGNETIC GATE','THUNDER DALE','STORM DALE','VOLTAGE GATE','SPARK PEAK',
    'CHARGED DALE','CRACKLING FALLS','SURGE PATH','BOLT RIDGE','GALVANIC PATH',
    'STATIC GATE','PLASMA CAVE','TEMPEST PEAK','SHOCK FALLS','ARC PEAK',
    'IONIZED GATE','MAGNETIC FALLS','THUNDER FALLS','STORM CAVE','VOLTAGE PEAK',
    'SPARK GATE','CHARGED GATE','CRACKLING BRIDGE','SURGE RUINS','BOLT PATH',
    'GALVANIC GATE','STATIC FALLS','PLASMA PEAK','TEMPEST RUINS','SHOCK BRIDGE',
    'ARC BRIDGE','IONIZED BRIDGE','MAGNETIC PEAK','THUNDER PATH','STORM BRIDGE',
    'VOLTAGE BRIDGE','SPARK FALLS','CHARGED FALLS','CRACKLING CAVE','SURGE BRIDGE',
    'BOLT FALLS','GALVANIC BRIDGE','STATIC PATH','PLASMA BRIDGE','TEMPEST BRIDGE',
    'SHOCK RUINS','ARC RUINS','IONIZED RUINS','MAGNETIC RUINS','THUNDER RIDGE',
    'STORM PEAK','VOLTAGE HOLLOW','SPARK RIDGE','CHARGED RIDGE','CRACKLING RIDGE',
    'SURGE HOLLOW','BOLT RUINS','GALVANIC RIDGE','STATIC RIDGE','PLASMA RUINS',
    'TEMPEST HOLLOW','SHOCK PEAK','ARC PATH','IONIZED HOLLOW','MAGNETIC HOLLOW',
    'THUNDER THRONE','STORM THRONE','VOLTAGE THRONE','SPARK THRONE','CHARGED THRONE',
    'CRACKLING THRONE','SURGE THRONE','BOLT THRONE','GALVANIC THRONE','STATIC THRONE',
    'PLASMA THRONE','TEMPEST THRONE','SHOCK THRONE','ARC THRONE','IONIZED THRONE',
    'MAGNETIC THRONE','THUNDER SPIRE','STORM SPIRE','VOLTAGE SPIRE','SPARK SPIRE',
    'CHARGED SPIRE','CRACKLING SPIRE','SURGE SPIRE','BOLT SPIRE','GALVANIC SPIRE',
    'STATIC SPIRE','PLASMA SPIRE','TEMPEST SPIRE','SHOCK SPIRE','ARC SPIRE',
    'IONIZED SPIRE','MAGNETIC SPIRE','THUNDER MESA','STORM MESA','VOLTAGE MESA',
    'SPARK MESA','CHARGED MESA','CRACKLING MESA','SURGE MESA','BOLT MESA',
    'GALVANIC MESA','STATIC MESA','PLASMA MESA','TEMPEST MESA','SHOCK MESA',
    'ARC MESA','IONIZED MESA','MAGNETIC MESA','THUNDER TRAIL','STORM TRAIL',
    'VOLTAGE TRAIL','SPARK TRAIL','CHARGED TRAIL','CRACKLING TRAIL','SURGE TRAIL',
    'BOLT TRAIL','GALVANIC TRAIL','STATIC TRAIL','PLASMA TRAIL','TEMPEST TRAIL',
    'SHOCK TRAIL','ARC TRAIL','IONIZED TRAIL','MAGNETIC TRAIL','THUNDER ARCH',
    'STORM ARCH','VOLTAGE ARCH','SPARK ARCH','CHARGED ARCH','CRACKLING ARCH',
    'SURGE ARCH','BOLT ARCH','GALVANIC ARCH','STATIC ARCH','PLASMA ARCH',
    'TEMPEST ARCH','SHOCK ARCH','ARC ARCH','IONIZED ARCH','MAGNETIC ARCH',
    'THUNDER KEEP','STORM KEEP','VOLTAGE KEEP','SPARK KEEP','CHARGED KEEP',
    'CRACKLING KEEP','SURGE KEEP','BOLT KEEP','GALVANIC KEEP','STATIC KEEP',
    'PLASMA KEEP','TEMPEST KEEP','SHOCK KEEP','ARC KEEP','IONIZED KEEP',
    'MAGNETIC KEEP','THUNDER ALTAR','STORM ALTAR','VOLTAGE ALTAR','SPARK ALTAR',
    'CHARGED ALTAR','CRACKLING ALTAR','SURGE ALTAR','BOLT ALTAR','GALVANIC ALTAR',
    'STATIC ALTAR','PLASMA ALTAR','TEMPEST ALTAR','SHOCK ALTAR','ARC ALTAR',
    'IONIZED ALTAR','MAGNETIC ALTAR','THUNDER GORGE','STORM GORGE','VOLTAGE GORGE',
    'SPARK GORGE','CHARGED GORGE','CRACKLING GORGE','SURGE GORGE','BOLT GORGE',
    'GALVANIC GORGE','STATIC GORGE','PLASMA GORGE','TEMPEST GORGE','SHOCK GORGE',
    'ARC GORGE','IONIZED GORGE','MAGNETIC GORGE','THUNDER TEMPLE','STORM TEMPLE',
    'VOLTAGE TEMPLE','SPARK TEMPLE','CHARGED TEMPLE','CRACKLING TEMPLE','SURGE TEMPLE',
    'BOLT TEMPLE','GALVANIC TEMPLE','STATIC TEMPLE','PLASMA TEMPLE','TEMPEST TEMPLE',
    'SHOCK TEMPLE','ARC TEMPLE','IONIZED TEMPLE','MAGNETIC TEMPLE','FINAL STORM'
  ]
};

export function getLevelName(level) {
  if (level === 0) return 'TRAINING';
  if (level >= 1201 && level <= 1250) {
    return VOID_LEVEL_NAMES[level - 1201] || ('ABYSS LEVEL ' + level);
  }
  const area = getAreaByLevel(level);
  const names = LEVEL_NAMES[area];
  const areaStart = WORLD_AREAS[area].start;
  const index = level - Math.max(areaStart, 1);
  return names[index] || (area.toUpperCase() + ' LEVEL ' + level);
}

export const ENEMY_TEMPLATES = {
  slime: { hp: 6, speed: 55, dmg: 2, w: 38, h: 32, color: '#4ade80', bouncy: true },
  red_slime: { hp: 8, speed: 65, dmg: 3, w: 40, h: 34, color: '#f87171', bouncy: true },
  blue_slime: { hp: 10, speed: 48, dmg: 2, w: 42, h: 36, color: '#60a5fa', bouncy: true },
  goblin: { hp: 10, speed: 95, dmg: 4, w: 40, h: 46, color: '#a3e635' },
  ogre: { hp: 24, speed: 45, dmg: 8, w: 62, h: 76, color: '#fb7185', heavy: true },
  skeleton: { hp: 9, speed: 130, dmg: 3, w: 36, h: 50, color: '#e2e8f0' },
  bat: { hp: 5, speed: 120, dmg: 2, w: 34, h: 24, color: '#7c3aed', flying: true },
  spider: { hp: 10, speed: 105, dmg: 4, w: 42, h: 30, color: '#7f1d1d', jumpy: true },
  wraith: { hp: 14, speed: 78, dmg: 6, w: 40, h: 52, color: '#6366f1', floating: true },
  archer: { hp: 12, speed: 65, dmg: 5, w: 40, h: 50, color: '#65a30d', ranged: true },
  mage: { hp: 14, speed: 55, dmg: 6, w: 42, h: 56, color: '#7c3aed', caster: true },
  necromancer: { hp: 16, speed: 52, dmg: 6, w: 42, h: 58, color: '#4c1d95', summoner: true },
  shade: { hp: 13, speed: 145, dmg: 7, w: 36, h: 52, color: '#111827', teleporter: true },
  ninja: { hp: 11, speed: 180, dmg: 5, w: 36, h: 48, color: '#1f2937', teleporter: true, jumpy: true, ninja: true },
  dragon: { hp: 45, speed: 60, dmg: 12, w: 72, h: 58, color: '#dc2626', flying: true, caster: true, dragon: true },
  vampire: { hp: 18, speed: 110, dmg: 7, w: 38, h: 54, color: '#881337', flying: true, vampire: true },
  phoenix: { hp: 20, speed: 95, dmg: 8, w: 46, h: 42, color: '#f97316', flying: true, phoenix: true },
  golem: { hp: 50, speed: 25, dmg: 14, w: 64, h: 72, color: '#78716c', heavy: true, armored: true, golem: true },
  shaman: { hp: 15, speed: 50, dmg: 5, w: 42, h: 56, color: '#059669', caster: true, summoner: true, shaman: true },
  berserker: { hp: 30, speed: 85, dmg: 10, w: 48, h: 58, color: '#b91c1c', heavy: true, berserker: true },
  dark_knight: { hp: 35, speed: 70, dmg: 11, w: 46, h: 60, color: '#312e81', armored: true, ranged: true, dark_knight: true },
  ice_elemental: { hp: 22, speed: 65, dmg: 8, w: 44, h: 52, color: '#06b6d4', floating: true, caster: true, ice_elemental: true },
  fire_imp: { hp: 8, speed: 140, dmg: 4, w: 32, h: 36, color: '#ef4444', jumpy: true, fire_imp: true },
  mimic: { hp: 28, speed: 0, dmg: 15, w: 40, h: 40, color: '#d97706', mimic: true },
  troll: { hp: 40, speed: 38, dmg: 10, w: 54, h: 68, color: '#2d6a4f', heavy: true, troll: true },
  harpy: { hp: 12, speed: 130, dmg: 5, w: 42, h: 40, color: '#c084fc', flying: true, harpy: true },
  scorpion: { hp: 18, speed: 70, dmg: 7, w: 48, h: 28, color: '#a16207', scorpion: true },
  werewolf: { hp: 26, speed: 100, dmg: 9, w: 44, h: 56, color: '#6b7280', jumpy: true, werewolf: true },
  mushroom: { hp: 10, speed: 30, dmg: 3, w: 32, h: 36, color: '#a855f7', caster: true, mushroom: true },
  gargoyle: { hp: 32, speed: 50, dmg: 11, w: 48, h: 60, color: '#57534e', armored: true, flying: true, gargoyle: true },
  lich: { hp: 28, speed: 42, dmg: 10, w: 44, h: 58, color: '#22d3ee', caster: true, summoner: true, lich: true },
  cyclops: { hp: 55, speed: 32, dmg: 16, w: 60, h: 78, color: '#d97706', heavy: true, cyclops: true },
  rat: { hp: 4, speed: 160, dmg: 2, w: 28, h: 18, color: '#9ca3af', rat: true },
  beetle: { hp: 16, speed: 40, dmg: 5, w: 38, h: 26, color: '#854d0e', armored: true, beetle: true },
  ghost: { hp: 11, speed: 70, dmg: 5, w: 36, h: 48, color: '#c7d2fe', floating: true, ghost: true },
  witch: { hp: 14, speed: 80, dmg: 7, w: 40, h: 50, color: '#86198f', flying: true, caster: true, witch: true },
  sand_worm: { hp: 30, speed: 60, dmg: 12, w: 56, h: 40, color: '#d4a017', heavy: true, sand_worm: true },
  frost_wolf: { hp: 20, speed: 120, dmg: 7, w: 46, h: 38, color: '#93c5fd', jumpy: true, frost_wolf: true },
  plague_rat: { hp: 15, speed: 105, dmg: 6, w: 36, h: 24, color: '#65a30d', rat: true, plague_rat: true },
  djinn: { hp: 24, speed: 72, dmg: 9, w: 42, h: 54, color: '#c084fc', floating: true, caster: true, teleporter: true, djinn: true },
  death_knight: { hp: 42, speed: 55, dmg: 13, w: 50, h: 64, color: '#1c1917', heavy: true, armored: true, summoner: true, death_knight: true },
  hydra_mob: { hp: 48, speed: 30, dmg: 11, w: 66, h: 56, color: '#15803d', heavy: true, ranged: true, hydra_mob: true },
  tank: { hp: 60, speed: 28, dmg: 15, w: 78, h: 50, color: '#4b5563', vehicle: true, cannon: true, armored: true },
  artillery: { hp: 50, speed: 0, dmg: 18, w: 74, h: 48, color: '#374151', vehicle: true, artillery: true, armored: true },
  helicopter: { hp: 34, speed: 84, dmg: 9, w: 58, h: 38, color: '#0ea5e9', vehicle: true, flying: true, missile: true },
  mech: { hp: 85, speed: 35, dmg: 20, w: 72, h: 90, color: '#dc2626', vehicle: true, laser: true, armored: true },
  jet: { hp: 28, speed: 160, dmg: 11, w: 54, h: 30, color: '#0369a1', vehicle: true, flying: true, missile: true, jet: true },
  apc: { hp: 48, speed: 45, dmg: 10, w: 70, h: 44, color: '#365314', vehicle: true, armored: true, cannon: true, apc: true },
  warship: { hp: 90, speed: 18, dmg: 22, w: 88, h: 52, color: '#1e3a5f', vehicle: true, armored: true, artillery: true, warship: true },
  hovercraft: { hp: 30, speed: 110, dmg: 8, w: 56, h: 34, color: '#7dd3fc', vehicle: true, hovercraft: true }
};

export const BOSSES = {
  10: { name: 'ANCIENT GOLEM', hp: 180, dmg: 8, color: '#78716c', ability: 'slam', size: 2.4 },
  20: { name: 'WAR MACHINE', hp: 420, dmg: 12, color: '#4b5563', ability: 'tankcharge', vehicle: 'tank', size: 2 },
  30: { name: 'FLAME TITAN', hp: 700, dmg: 17, color: '#dc2626', ability: 'firewall', vehicle: 'warship', size: 2.8 },
  40: { name: 'SKY DOMINATOR', hp: 1000, dmg: 22, color: '#0ea5e9', ability: 'airassault', vehicle: 'helicopter', size: 2.4 },
  50: { name: 'THUNDER LORD', hp: 1400, dmg: 28, color: '#eab308', ability: 'lightning', vehicle: 'jet', size: 3.2 },
  60: { name: 'STEEL FORTRESS', hp: 1900, dmg: 33, color: '#374151', ability: 'artillery', vehicle: 'artillery', size: 2.3 },
  70: { name: 'CHAOS DEMON', hp: 2600, dmg: 40, color: '#b91c1c', ability: 'chaos', vehicle: 'apc', size: 3.6 },
  80: { name: 'OMEGA MECH', hp: 3500, dmg: 48, color: '#7f1d1d', ability: 'mechstomp', vehicle: 'mech', size: 3.1 },
  90: { name: 'ETERNAL DESTROYER', hp: 5000, dmg: 58, color: '#7c3aed', ability: 'meteor', vehicle: 'warship', size: 4.4 },
  100: { name: 'COSMIC OVERLORD', hp: 7500, dmg: 70, color: '#8b5cf6', ability: 'vortex', vehicle: 'mech', size: 5 },
  // === MILESTONE MEGA-BOSSES ===
  300: { name: 'BONE GIANT', hp: 12000, dmg: 10, color: '#e2e8f0', ability: 'bone_storm', size: 5.5, milestone: true },
  600: { name: 'THE PHANTOM', hp: 22000, dmg: 10, color: '#6366f1', ability: 'phase', size: 5.0, milestone: true },
  900: { name: 'HYDRA', hp: 35000, dmg: 10, color: '#15803d', ability: 'multihead', size: 6.0, milestone: true, heads: 3 },
  1200: { name: 'DREAD AMALGAM', hp: 50000, dmg: 10, color: '#7c3aed', ability: 'amalgam', size: 7.0, milestone: true }
};

export const GENERATED_BOSS_NAMES = [
  'IRON WARDEN','FROST SENTINEL','MAGMA BRUTE','WIND RAIDER','SHADOW STALKER',
  'CRYSTAL GUARDIAN','VENOM KING','DARK OVERLORD','STORM BRINGER','PLAGUE BEARER',
  'BONE CRUSHER','FLAME WALKER','ICE WRAITH','DOOM BRINGER','BLOOD KNIGHT',
  'THUNDER HAWK','CURSED TITAN','FOREST GOLEM','SAND WYRM','VOID STALKER',
  'STONE COLOSSUS','EMBER LORD','RIME FIEND','SPARK TYRANT','DEATH HERALD',
  'SIEGE MASTER','PHANTOM BLADE','THORN GIANT','MOLTEN CORE','TOXIC HORROR',
  'SKY LEVIATHAN','GRAVE WARDEN','INFERNO BEAST','GLACIAL DRAKE','VOLTAIC GOLIATH',
  'CRIMSON REAPER','JADE SERPENT','ONYX SENTINEL','ARCANE DEVOURER','GILDED TITAN',
  'RUSTED HULK','SPECTRAL KING','ASH COLOSSUS','ABYSS WATCHER','NOVA FIEND',
  'BLIGHT MONARCH','STEEL HYDRA','CHAOS WRAITH','PRISM GUARDIAN','ECLIPSE LORD'
];
const GENERATED_BOSS_ABILITIES = [
  'slam','firewall','lightning','meteor','vortex','tankcharge','airassault',
  'artillery','chaos','mechstomp','bone_rain','freeze_wave','poison_cloud','shockwave'
];
const GENERATED_BOSS_COLORS = [
  '#78716c','#4b5563','#dc2626','#0ea5e9','#eab308','#374151','#b91c1c',
  '#7f1d1d','#7c3aed','#8b5cf6','#059669','#d97706','#06b6d4','#ec4899',
  '#22c55e','#a855f7','#f97316','#475569','#be123c','#0d9488'
];
const GENERATED_BOSS_VEHICLES = ['tank', 'helicopter', 'artillery', 'mech', 'jet', 'apc', 'warship', 'hovercraft', null, 'tank', 'helicopter', 'mech'];

export function getBoss(level) {
  if (BOSSES[level]) return BOSSES[level];
  if (level <= 0) return null;
  // Major bosses every 10 levels
  if (level % 10 === 0) {
    const seed = level * 7 + 13;
    const idx = (Math.floor(level / 10) * 7 + 13) % GENERATED_BOSS_NAMES.length;
    const abilIdx = (seed * 3 + 7) % GENERATED_BOSS_ABILITIES.length;
    const colIdx = (seed * 5 + 11) % GENERATED_BOSS_COLORS.length;
    const vehIdx = (seed * 2 + 3) % GENERATED_BOSS_VEHICLES.length;
    const scaleFactor = 1 + level * 0.008;
    return {
      name: GENERATED_BOSS_NAMES[idx],
      hp: Math.round(150 * Math.pow(1.035, level) * scaleFactor),
      dmg: Math.round(6 + level * 0.65),
      color: GENERATED_BOSS_COLORS[colIdx],
      ability: GENERATED_BOSS_ABILITIES[abilIdx],
      vehicle: GENERATED_BOSS_VEHICLES[vehIdx],
      size: Math.min(6, 2 + level * 0.005)
    };
  }
  // Mini-bosses every 5 levels (weaker than full bosses, can have vehicles)
  if (level % 5 === 0 && level >= 5) {
    const seed = level * 11 + 7;
    const idx = (Math.floor(level / 5) * 3 + 7) % GENERATED_BOSS_NAMES.length;
    const abilIdx = (seed * 3 + 5) % GENERATED_BOSS_ABILITIES.length;
    const colIdx = (seed * 5 + 3) % GENERATED_BOSS_COLORS.length;
    const vehIdx = (seed * 4 + 1) % GENERATED_BOSS_VEHICLES.length;
    const scaleFactor = 1 + level * 0.006;
    return {
      name: GENERATED_BOSS_NAMES[idx],
      hp: Math.round(80 * Math.pow(1.03, level) * scaleFactor),
      dmg: Math.round(4 + level * 0.45),
      color: GENERATED_BOSS_COLORS[colIdx],
      ability: GENERATED_BOSS_ABILITIES[abilIdx],
      vehicle: GENERATED_BOSS_VEHICLES[vehIdx],
      size: Math.min(4, 1.6 + level * 0.003),
      miniBoss: true
    };
  }
  return null;
}

export const ARENA_POOL = [
  'slime', 'red_slime', 'blue_slime', 'goblin', 'ogre', 'skeleton', 'bat', 'spider', 'wraith',
  'archer', 'mage', 'necromancer', 'shade',
  'ninja', 'dragon', 'vampire', 'phoenix', 'golem', 'shaman',
  'berserker', 'dark_knight', 'ice_elemental', 'fire_imp', 'mimic',
  'troll', 'harpy', 'scorpion', 'werewolf', 'mushroom', 'gargoyle', 'lich', 'cyclops',
  'rat', 'beetle', 'ghost', 'witch', 'sand_worm', 'frost_wolf', 'plague_rat', 'djinn', 'death_knight', 'hydra_mob',
  'tank', 'artillery', 'helicopter', 'mech', 'jet', 'apc', 'warship', 'hovercraft'
];

export function getEnemyLevelUnlock(type) {
  const unlocks = {
    slime: 1,
    red_slime: 1,
    blue_slime: 1,
    goblin: 1,
    ogre: 2,
    skeleton: 2,
    bat: 2,
    spider: 3,
    wraith: 4,
    archer: 5,
    mage: 6,
    necromancer: 8,
    shade: 9,
    ninja: 7,
    dragon: 15,
    vampire: 10,
    phoenix: 13,
    golem: 11,
    shaman: 9,
    berserker: 8,
    dark_knight: 12,
    ice_elemental: 10,
    fire_imp: 4,
    mimic: 6,
    troll: 6,
    harpy: 7,
    scorpion: 5,
    werewolf: 9,
    mushroom: 3,
    gargoyle: 11,
    lich: 14,
    cyclops: 13,
    tank: 10,
    artillery: 12,
    helicopter: 14,
    mech: 18,
    jet: 16,
    apc: 12,
    warship: 20,
    hovercraft: 15,
    rat: 1,
    beetle: 3,
    ghost: 5,
    witch: 7,
    sand_worm: 8,
    frost_wolf: 9,
    plague_rat: 10,
    djinn: 13,
    death_knight: 16,
    hydra_mob: 19
  };
  return unlocks[type] || 999;
}

export function getAreaByLevel(level) {
  if (level >= 1201) return 'void';
  if (level >= 900) return 'lightning';
  if (level >= 600) return 'lava';
  if (level >= 300) return 'ice';
  return 'grassy';
}

/* ─── THE ABYSS / BONUS AREA (Levels 1201–1250) ─── */
export const VOID_LEVEL_NAMES = [
  'ABYSSAL GATE','SHATTERED ABYSS','ENTROPY RIFT','OBLIVION EDGE','NULL CORRIDOR',
  'FRACTURE POINT','BROKEN REALITY','SHADOW NEXUS','DARK SINGULARITY','ABYSS MAW',
  'ANNIHILATION PIT','HOLLOW CHAMBER','SOUL FURNACE','DREAD ENGINE','CHAOS CORE',
  'PHANTOM LABYRINTH','SCREAMING DARK','WARP SPIRE','FINAL THEOREM','DESPAIR HALL',
  'TWILIGHT ABYSS','OMEGA BREACH','ZERO SANCTUM','RUIN ALTAR','BLIGHT THRONE',
  'CRIMSON ABYSS','ETERNAL DUSK','ASH DIMENSION','TERROR GATE','DESOLATION PEAK',
  'GRAVITY WELL','TIMELESS CAGE','WRATH CORRIDOR','DOOM SPIRAL','CATACLYSM',
  'BROKEN CLOCK','LAST BASTION','NIGHTMARE CORE','ECHO PRISON','SILENT STORM',
  'FORGOTTEN DEPTHS','RIFT WALKER','DEAD STAR','ENTROPY BLOOM','ABYSS EMPEROR',
  'OMEGA THRONE','FINAL DESCENT','ABSOLUTE ZERO','GENESIS RUIN','THE END'
];

/* ─── QUEST SYSTEM ─── */
export const QUESTS = {
  easy: [
    { desc: 'KILL 5 SLIMES',            goal: 'kill', target: 'slime', count: 5, reward: 80 },
    { desc: 'KILL 3 GOBLINS',           goal: 'kill', target: 'goblin', count: 3, reward: 100 },
    { desc: 'KILL 3 BATS',              goal: 'kill', target: 'bat', count: 3, reward: 80 },
    { desc: 'KILL 2 SPIDERS',           goal: 'kill', target: 'spider', count: 2, reward: 90 },
    { desc: 'KILL 3 RED SLIMES',        goal: 'kill', target: 'red_slime', count: 3, reward: 85 },
    { desc: 'KILL 3 MUSHROOMS',         goal: 'kill', target: 'mushroom', count: 3, reward: 75 },
    { desc: 'KILL 4 FIRE IMPS',         goal: 'kill', target: 'fire_imp', count: 4, reward: 95 },
    { desc: 'COMPLETE 2 LEVELS',        goal: 'levels', count: 2, reward: 120 },
    { desc: 'SHOOT 5 ARROWS',           goal: 'arrows', count: 5, reward: 70 },
    { desc: 'SWING SWORD 20 TIMES',     goal: 'swings', count: 20, reward: 60 }
  ],
  medium: [
    { desc: 'KILL 5 SKELETONS',         goal: 'kill', target: 'skeleton', count: 5, reward: 200 },
    { desc: 'KILL 3 ARCHERS',           goal: 'kill', target: 'archer', count: 3, reward: 220 },
    { desc: 'KILL 3 WRAITHS',           goal: 'kill', target: 'wraith', count: 3, reward: 250 },
    { desc: 'KILL 2 MAGES',             goal: 'kill', target: 'mage', count: 2, reward: 230 },
    { desc: 'KILL 2 BERSERKERS',        goal: 'kill', target: 'berserker', count: 2, reward: 260 },
    { desc: 'KILL 2 DARK KNIGHTS',      goal: 'kill', target: 'dark_knight', count: 2, reward: 280 },
    { desc: 'KILL 1 DRAGON',            goal: 'kill', target: 'dragon', count: 1, reward: 350 },
    { desc: 'COMPLETE 5 LEVELS',        goal: 'levels', count: 5, reward: 300 },
    { desc: 'KILL 10 ENEMIES TOTAL',    goal: 'killAny', count: 10, reward: 200 },
    { desc: 'USE ELEMENT ATTACK 3x',    goal: 'elements', count: 3, reward: 250 }
  ],
  hard: [
    { desc: 'KILL 3 CYCLOPSES',         goal: 'kill', target: 'cyclops', count: 3, reward: 600 },
    { desc: 'KILL 2 GOLEMS',            goal: 'kill', target: 'golem', count: 2, reward: 550 },
    { desc: 'KILL 5 VAMPIRES',          goal: 'kill', target: 'vampire', count: 5, reward: 650 },
    { desc: 'KILL 2 LICHES',            goal: 'kill', target: 'lich', count: 2, reward: 580 },
    { desc: 'DESTROY 3 TANKS',          goal: 'kill', target: 'tank', count: 3, reward: 700 },
    { desc: 'DESTROY 2 MECHS',          goal: 'kill', target: 'mech', count: 2, reward: 800 },
    { desc: 'DEFEAT ANY BOSS',          goal: 'boss', count: 1, reward: 500 },
    { desc: 'COMPLETE 10 LEVELS',       goal: 'levels', count: 10, reward: 750 },
    { desc: 'KILL 30 ENEMIES TOTAL',    goal: 'killAny', count: 30, reward: 600 },
    { desc: 'WIN WITH NO DAMAGE TAKEN', goal: 'noDamage', count: 1, reward: 1000 }
  ]
};
