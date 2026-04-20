const SAVE_KEY = 'bitFighterSave.v1';

export function saveGame(state) {
  const payload = {
    currentLevel: state.currentLevel,
    worldProgress: state.worldProgress,
    tutorialComplete: state.tutorialComplete,
    companions: state.companions.length,
    player: {
      money: state.player.money,
      arrows: state.player.arrows,
      maxHp: state.player.maxHp,
      baseMaxHp: state.player.baseMaxHp,
      swordMaterial: state.player.swordMaterial,
      swordLevel: state.player.swordLevel,
      shieldMaterial: state.player.shieldMaterial,
      shieldLevel: state.player.shieldLevel,
      armorMaterial: state.player.armorMaterial,
      armorLevel: state.player.armorLevel,
      helmetMaterial: state.player.helmetMaterial,
      helmetLevel: state.player.helmetLevel,
      bowType: state.player.bowType,
      arrowType: state.player.arrowType,
      potionSlots: state.player.potionSlots,
      maxPotionSlots: state.player.maxPotionSlots,
      hasJetpack: state.player.hasJetpack,
      jetpackUpgraded: state.player.jetpackUpgraded,
      healthUpgrades: state.player.healthUpgrades || 0,
      hasForceField: state.player.hasForceField,
      forceFieldLevel: state.player.forceFieldLevel,
      element: state.player.element || null,
      unlockedElements: state.player.unlockedElements || [],
      hasSwordOfLight: state.player.hasSwordOfLight || false,
      hasBowOfLight: state.player.hasBowOfLight || false,
      hasBlessingOfLight: state.player.hasBlessingOfLight || false
    },
    activeQuest: state.activeQuest || null,
    questProgress: state.questProgress || 0
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
}

export function loadGame(state) {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    state.currentLevel = parsed.currentLevel ?? 1;
    state.worldProgress = parsed.worldProgress || state.worldProgress;
    state.tutorialComplete = !!parsed.tutorialComplete;

    const p = parsed.player || {};
    state.player.money = p.money ?? state.player.money;
    state.player.arrows = p.arrows ?? state.player.arrows;
    state.player.maxHp = p.maxHp ?? state.player.maxHp;
    state.player.baseMaxHp = p.baseMaxHp ?? state.player.baseMaxHp;
    state.player.hp = state.player.maxHp;
    state.player.swordMaterial = p.swordMaterial || 'wooden';
    state.player.swordLevel = p.swordLevel || 1;
    state.player.shieldMaterial = p.shieldMaterial || null;
    state.player.shieldLevel = p.shieldLevel || 0;
    state.player.armorMaterial = p.armorMaterial || null;
    state.player.armorLevel = p.armorLevel || 0;
    state.player.helmetMaterial = p.helmetMaterial || null;
    state.player.helmetLevel = p.helmetLevel || 0;
    state.player.bowType = p.bowType || 'basic';
    state.player.arrowType = p.arrowType || 'basic';
    state.player.potionSlots = p.potionSlots || ['healing', null, null];
    state.player.maxPotionSlots = p.maxPotionSlots || 3;
    state.player.hasJetpack = !!p.hasJetpack;
    state.player.jetpackUpgraded = !!p.jetpackUpgraded;
    state.player.maxJetpackFuel = state.player.jetpackUpgraded ? 10 : 7;
    state.player.jetpackFuel = state.player.hasJetpack ? state.player.maxJetpackFuel : 0;
    state.player.healthUpgrades = p.healthUpgrades || 0;
    state.player.hasForceField = !!p.hasForceField;
    state.player.forceFieldLevel = p.forceFieldLevel || 1;
    state.player.forceFieldMaxHP = state.player.forceFieldLevel === 1 ? 5 : state.player.forceFieldLevel === 2 ? 10 : 20;
    state.player.forceFieldHP = state.player.forceFieldMaxHP;
    state.player.forceFieldActive = state.player.hasForceField;
    state.player.element = p.element || null;
    state.player.unlockedElements = Array.isArray(p.unlockedElements) ? p.unlockedElements : (p.element ? [p.element] : []);
    state.player.elementCooldown = 0;
    state.player.hasSwordOfLight = !!p.hasSwordOfLight;
    state.player.hasBowOfLight = !!p.hasBowOfLight;
    state.player.hasBlessingOfLight = !!p.hasBlessingOfLight;
    if (state.player.hasBlessingOfLight) {
      state.player.maxHp = Math.max(state.player.maxHp, state.player.baseMaxHp + 50);
      state.player.hp = state.player.maxHp;
    }

    state.activeQuest = parsed.activeQuest || null;
    state.questProgress = parsed.questProgress || 0;
    state.questDamageTaken = false;

    const count = Math.max(0, Math.min(4, parsed.companions || 0));
    state.companions.length = 0;
    for (let i = 0; i < count; i += 1) {
      state.companions.push({
        x: state.player.x - 60 - i * 36,
        y: state.player.y,
        w: 36,
        h: 44,
        vx: 0,
        vy: 0,
        facing: 1,
        element: ['fire', 'lightning', 'ice', 'wind'][i % 4],
        attackCd: 0,
        kills: 0,
        specialReady: false,
        color: ['#f97316', '#eab308', '#3b82f6', '#10b981'][i % 4]
      });
    }
    return true;
  } catch {
    return false;
  }
}
