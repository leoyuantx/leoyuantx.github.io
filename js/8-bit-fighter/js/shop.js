import { ARROW_TYPES, BOW_TYPES, MATERIALS, MATERIAL_PRICES, POTIONS, QUESTS } from './data.js';
import { renderShopMenu } from './ui.js';

function canAfford(state, amount) {
  return state.player.money >= amount;
}

function pay(state, amount) {
  state.player.money -= amount;
}

export function openShop(state, dom, type = 'hub') {
  state.insideShop = true;
  state.shopType = type;

  if (type === 'hub') {
    renderShopMenu(dom, 'SHOP DISTRICT', `
      <div class="shop-items">
        <button class="shop-item" data-shop="weapon">⚔ WEAPON FORGE</button>
        <button class="shop-item" data-shop="armor">🛡 ARMORY</button>
        <button class="shop-item" data-shop="potion">🧪 POTION SHOP</button>
        <button class="shop-item" data-shop="mercenary">👥 MERCENARY GUILD</button>
        <button class="shop-item" data-shop="tech">⚙ TECH STORE</button>
        <button class="shop-item" data-shop="health">❤️ HEALTH CLINIC</button>
        <button class="shop-item" data-shop="quest">📜 QUEST BOARD</button>
      </div>
      <div class="row">
        <button class="btn danger" data-shop="close">LEAVE SHOP</button>
      </div>
    `);
    return;
  }

  if (type === 'weapon') {
    const mats = MATERIALS.filter(m => m !== 'light').map((m) => {
      const price = MATERIAL_PRICES[m];
      return `<button class="shop-item" data-buy="sword:${m}">SWORD ${m.toUpperCase()} - $${price}</button>`;
    }).join('');
    const bows = Object.entries(BOW_TYPES).filter(([k]) => k !== 'basic' && k !== 'light').map(([k, v]) => `<button class="shop-item" data-buy="bow:${k}">${v.name} BOW - $${v.price}</button>`).join('');
    const arrows = Object.entries(ARROW_TYPES).filter(([k]) => k !== 'basic').map(([k, v]) => `<button class="shop-item" data-buy="arrowType:${k}">${v.name} ARROWS - $${v.price}</button>`).join('');

    renderShopMenu(dom, 'WEAPON FORGE', `
      <div class="shop-items">${mats}${bows}${arrows}
        <button class="shop-item" data-buy="arrows:5">+5 ARROWS ($8)</button>
        <button class="shop-item" data-buy="arrows:10">+10 ARROWS ($15)</button>
      </div>
      <div class="row"><button class="btn info" data-shop="hub">BACK</button></div>
    `);
    return;
  }

  if (type === 'armor') {
    const rows = MATERIALS.filter(m => m !== 'light').map((m) => {
      const base = MATERIAL_PRICES[m];
      return `
        <button class="shop-item" data-buy="shield:${m}">${m.toUpperCase()} SHIELD - $${base}</button>
        <button class="shop-item" data-buy="armor:${m}">${m.toUpperCase()} ARMOR - $${Math.floor(base * 1.5)}</button>
        <button class="shop-item" data-buy="helmet:${m}">${m.toUpperCase()} HELMET - $${Math.floor(base * 1.2)}</button>
      `;
    }).join('');
    renderShopMenu(dom, 'ARMORY', `
      <div class="shop-items">${rows}
        <button class="shop-item" data-buy="upgrade:sword">UPGRADE SWORD</button>
        <button class="shop-item" data-buy="upgrade:shield">UPGRADE SHIELD</button>
        <button class="shop-item" data-buy="upgrade:armor">UPGRADE ARMOR</button>
        <button class="shop-item" data-buy="upgrade:helmet">UPGRADE HELMET</button>
      </div>
      <div class="row"><button class="btn info" data-shop="hub">BACK</button></div>
    `);
    return;
  }

  if (type === 'potion') {
    const items = Object.entries(POTIONS).map(([k, v]) => `<button class="shop-item" data-buy="potion:${k}">${v.icon} ${v.name} - $${v.price}</button>`).join('');
    const pouch = state.player.maxPotionSlots < 5 ? `<button class="shop-item" data-buy="pouch:1">POTION POUCH +1 SLOT - $${state.player.maxPotionSlots === 3 ? 150 : 300}</button>` : '';
    renderShopMenu(dom, 'POTION SHOP', `
      <div class="shop-items">${items}${pouch}</div>
      <div class="row"><button class="btn info" data-shop="hub">BACK</button></div>
    `);
    return;
  }

  if (type === 'mercenary') {
    const cost = 200 * Math.pow(2, state.companions.length);
    renderShopMenu(dom, 'MERCENARY GUILD', `
      <p>CURRENT PARTY: ${1 + state.companions.length}/5</p>
      <div class="shop-items">
        <button class="shop-item" data-buy="mercenary:1">HIRE MERCENARY - $${cost}</button>
      </div>
      <div class="row"><button class="btn info" data-shop="hub">BACK</button></div>
    `);
    return;
  }

  if (type === 'tech') {
    const ffCost = state.player.forceFieldLevel === 1 ? 3000 : state.player.forceFieldLevel === 2 ? 7000 : 0;
    renderShopMenu(dom, 'TECH STORE', `
      <div class="shop-items">
        <button class="shop-item" data-buy="jetpack:1">🚀 JETPACK (7s fuel) - $5000</button>
        <button class="shop-item" data-buy="jetpackUpgrade:1">🚀 JETPACK UPGRADE (10s fuel) - $8000</button>
        <button class="shop-item" data-buy="forceField:1">FORCE FIELD UPGRADE - $${ffCost}</button>
      </div>
      <div class="row"><button class="btn info" data-shop="hub">BACK</button></div>
    `);
  }

  if (type === 'health') {
    const upgrades = state.player.healthUpgrades || 0;
    const nextCost = 100 + upgrades * 75;
    const fullHealCost = 20 + Math.floor(state.player.maxHp * 0.5);
    renderShopMenu(dom, 'HEALTH CLINIC', `
      <p>CURRENT MAX HP: ${state.player.maxHp} | UPGRADES: ${upgrades}</p>
      <div class="shop-items">
        <button class="shop-item" data-buy="healthUp:1">+10 MAX HP - $${nextCost}</button>
        <button class="shop-item" data-buy="healthUp:2">+25 MAX HP - $${Math.floor(nextCost * 2.2)}</button>
        <button class="shop-item" data-buy="healthUp:3">+50 MAX HP - $${Math.floor(nextCost * 4)}</button>
        <button class="shop-item" data-buy="fullHeal:1">FULL HEAL - $${fullHealCost}</button>
      </div>
      <div class="row"><button class="btn info" data-shop="hub">BACK</button></div>
    `);
  }

  if (type === 'quest') {
    let content = '';
    if (state.activeQuest) {
      const q = state.activeQuest;
      const progress = Math.min(state.questProgress, q.count);
      content = `
        <p>ACTIVE QUEST: ${q.desc}</p>
        <p>PROGRESS: ${progress}/${q.count} | REWARD: $${q.reward}</p>
        <div class="shop-items">
          <button class="shop-item" data-buy="questAbandon:1">❌ ABANDON QUEST</button>
        </div>
      `;
    } else {
      content = `
        <p class="hint">PICK A DIFFICULTY TO GET A RANDOM QUEST</p>
        <div class="shop-items">
          <button class="shop-item" data-buy="questRoll:easy">🟢 EASY QUEST</button>
          <button class="shop-item" data-buy="questRoll:medium">🟡 MEDIUM QUEST</button>
          <button class="shop-item" data-buy="questRoll:hard">🔴 HARD QUEST</button>
        </div>
      `;
    }
    renderShopMenu(dom, '📜 QUEST BOARD', `
      ${content}
      <div class="row"><button class="btn info" data-shop="hub">BACK</button></div>
    `);
  }
}

export function closeShop(state, dom) {
  state.insideShop = false;
  state.shopType = null;
  dom.shopPanel.classList.add('hidden');
}

export function handleShopAction(state, action) {
  if (!action) return false;
  const [kind, value] = action.split(':');

  if (kind === 'sword') {
    const cost = MATERIAL_PRICES[value];
    if (!canAfford(state, cost)) return false;
    pay(state, cost);
    state.player.swordMaterial = value;
    state.player.swordLevel = 1;
    return true;
  }

  if (kind === 'shield') {
    const cost = MATERIAL_PRICES[value];
    if (!canAfford(state, cost)) return false;
    pay(state, cost);
    state.player.shieldMaterial = value;
    state.player.shieldLevel = 1;
    return true;
  }

  if (kind === 'armor') {
    const cost = Math.floor(MATERIAL_PRICES[value] * 1.5);
    if (!canAfford(state, cost)) return false;
    pay(state, cost);
    state.player.armorMaterial = value;
    state.player.armorLevel = 1;
    state.player.maxHp = state.player.baseMaxHp + (MATERIALS.indexOf(value) + 1) * 5;
    state.player.hp = state.player.maxHp;
    return true;
  }

  if (kind === 'helmet') {
    const cost = Math.floor(MATERIAL_PRICES[value] * 1.2);
    if (!canAfford(state, cost)) return false;
    pay(state, cost);
    state.player.helmetMaterial = value;
    state.player.helmetLevel = 1;
    return true;
  }

  if (kind === 'upgrade') {
    const target = value;
    const current = state.player[`${target}Level`] || 0;
    if (target !== 'sword' && !state.player[`${target}Material`]) return false;
    if (current >= 20) return false;
    const cost = 20 + current * 15;
    if (!canAfford(state, cost)) return false;
    pay(state, cost);
    state.player[`${target}Level`] = current + 1;
    if (target === 'armor' && current % 1 === 0) {
      state.player.maxHp += 1;
      state.player.hp += 1;
    }
    return true;
  }

  if (kind === 'bowType' || kind === 'bow') {
    const data = BOW_TYPES[value];
    if (!data || !canAfford(state, data.price)) return false;
    pay(state, data.price);
    state.player.bowType = value;
    return true;
  }

  if (kind === 'arrowType') {
    const data = ARROW_TYPES[value];
    if (!data || !canAfford(state, data.price)) return false;
    pay(state, data.price);
    state.player.arrowType = value;
    return true;
  }

  if (kind === 'arrows') {
    const qty = Number(value);
    const price = qty === 10 ? 15 : qty === 5 ? 8 : 2;
    if (!canAfford(state, price)) return false;
    pay(state, price);
    state.player.arrows += qty;
    return true;
  }

  if (kind === 'potion') {
    const p = POTIONS[value];
    if (!p || !canAfford(state, p.price)) return false;
    const idx = state.player.potionSlots.findIndex((x) => !x);
    if (idx === -1) return false;
    pay(state, p.price);
    state.player.potionSlots[idx] = value;
    return true;
  }

  if (kind === 'pouch') {
    if (state.player.maxPotionSlots >= 5) return false;
    const price = state.player.maxPotionSlots === 3 ? 150 : 300;
    if (!canAfford(state, price)) return false;
    pay(state, price);
    state.player.maxPotionSlots += 1;
    state.player.potionSlots.push(null);
    return true;
  }

  if (kind === 'mercenary') {
    if (state.companions.length >= 4) return false;
    const cost = 200 * Math.pow(2, state.companions.length);
    if (!canAfford(state, cost)) return false;
    pay(state, cost);
    const i = state.companions.length;
    state.companions.push({
      x: state.player.x - 64 - i * 30,
      y: state.player.y,
      w: 36,
      h: 44,
      vx: 0,
      vy: 0,
      attackCd: 0,
      element: ['fire', 'lightning', 'ice', 'wind'][i % 4],
      kills: 0,
      specialReady: false,
      color: ['#f97316', '#eab308', '#3b82f6', '#10b981'][i % 4]
    });
    return true;
  }

  if (kind === 'jetpack') {
    if (state.player.hasJetpack) return false;
    if (!canAfford(state, 5000)) return false;
    pay(state, 5000);
    state.player.hasJetpack = true;
    state.player.maxJetpackFuel = 7;
    state.player.jetpackFuel = 7;
    return true;
  }

  if (kind === 'jetpackUpgrade') {
    if (!state.player.hasJetpack || state.player.jetpackUpgraded) return false;
    if (!canAfford(state, 8000)) return false;
    pay(state, 8000);
    state.player.jetpackUpgraded = true;
    state.player.maxJetpackFuel = 10;
    state.player.jetpackFuel = 10;
    return true;
  }

  if (kind === 'healthUp') {
    const upgrades = state.player.healthUpgrades || 0;
    const baseCost = 100 + upgrades * 75;
    const tier = Number(value);
    const hpGain = tier === 1 ? 10 : tier === 2 ? 25 : 50;
    const cost = tier === 1 ? baseCost : tier === 2 ? Math.floor(baseCost * 2.2) : Math.floor(baseCost * 4);
    if (!canAfford(state, cost)) return false;
    pay(state, cost);
    state.player.healthUpgrades = upgrades + tier;
    state.player.baseMaxHp += hpGain;
    state.player.maxHp += hpGain;
    state.player.hp = Math.min(state.player.hp + hpGain, state.player.maxHp);
    return true;
  }

  if (kind === 'fullHeal') {
    const cost = 20 + Math.floor(state.player.maxHp * 0.5);
    if (!canAfford(state, cost)) return false;
    if (state.player.hp >= state.player.maxHp) return false;
    pay(state, cost);
    state.player.hp = state.player.maxHp;
    return true;
  }

  if (kind === 'forceField') {
    if (state.player.forceFieldLevel >= 3) return false;
    const next = state.player.hasForceField ? state.player.forceFieldLevel + 1 : 1;
    const cost = next === 1 ? 3000 : 7000;
    if (!canAfford(state, cost)) return false;
    pay(state, cost);
    state.player.hasForceField = true;
    state.player.forceFieldLevel = next;
    state.player.forceFieldMaxHP = next === 1 ? 5 : next === 2 ? 10 : 20;
    state.player.forceFieldHP = state.player.forceFieldMaxHP;
    state.player.forceFieldActive = true;
    return true;
  }

  if (kind === 'questRoll') {
    if (state.activeQuest) return false;
    const pool = QUESTS[value];
    if (!pool || pool.length === 0) return false;
    const quest = { ...pool[Math.floor(Math.random() * pool.length)], difficulty: value };
    state.activeQuest = quest;
    state.questProgress = 0;
    state.questDamageTaken = false;
    state.questStartHp = state.player.hp;
    return true;
  }

  if (kind === 'questAbandon') {
    state.activeQuest = null;
    state.questProgress = 0;
    return true;
  }

  return false;
}
