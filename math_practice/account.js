import {initializeApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCb2sZ4y_ef8dz5cmzvwynajbb36zFHBSs",
  authDomain: "incandescent-heat-4745.firebaseapp.com",
  projectId: "incandescent-heat-4745",
  appId: "1:763873275091:web:19c5dda8aaf2e4f460b826",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const API_URL = "https://us-central1-incandescent-heat-4745.cloudfunctions.net/mathPracticeApi";
let profileData = null;
let activeTab = "progression";
let authMode = "signin";
let resolveAuthReady;
let lastTrailAt = 0;
let trailTone = 0;

export const authReady = new Promise((resolve) => {
  resolveAuthReady = resolve;
});

export async function mathApi(action, payload = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to save your Math Galaxy progress.");

  const token = await user.getIdToken();
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({action, ...payload}),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || "The Math Galaxy service could not complete that request.");
  }
  return data;
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderAccountButton(button) {
  if (!auth.currentUser) {
    button.textContent = "Sign in";
    button.classList.remove("account-signed-in");
    return;
  }

  const profile = profileData?.profile;
  const username = profile?.username || auth.currentUser.displayName || "Pilot";
  button.textContent = `${username} · Lv ${profile?.level || 1} · ${profile?.coins || 0} ◈`;
  button.classList.add("account-signed-in");
}

function updateLevelLinks(isAuthenticated, xp = 0) {
  document.querySelectorAll(".level-links a").forEach((link) => {
    const level = Number(new URL(link.href).searchParams.get("level"));
    const requiredXp = (level - 1) * 150;
    const locked = level > 1 && (!isAuthenticated || xp < requiredXp);
    const title = link.querySelector("span:first-child");
    const detail = link.querySelector(".level-detail");

    if (!link.dataset.originalTitle) link.dataset.originalTitle = title.textContent;
    if (!link.dataset.originalDetail) link.dataset.originalDetail = detail.textContent;
    link.classList.toggle("is-locked", locked);
    link.dataset.locked = String(locked);
    link.setAttribute("aria-disabled", String(locked));
    if (locked) {
      link.title = isAuthenticated ? `Earn ${requiredXp} XP to unlock this level.` : "Sign in to unlock higher levels.";
    } else {
      link.removeAttribute("title");
    }
    title.textContent = locked ? `${link.dataset.originalTitle} · Locked` : link.dataset.originalTitle;
    detail.textContent = locked
      ? isAuthenticated ? `Need ${requiredXp} XP` : "Sign in to unlock"
      : link.dataset.originalDetail;
  });
}

function applyProfileTheme(profile) {
  if (profile?.equippedTheme) document.body.dataset.profileTheme = profile.equippedTheme;
  else delete document.body.dataset.profileTheme;
  if (profile?.equippedAvatarFrame) document.body.dataset.profileFrame = profile.equippedAvatarFrame;
  else delete document.body.dataset.profileFrame;
  if (profile?.equippedMouseTrail) document.body.dataset.profileMouseTrail = profile.equippedMouseTrail;
  else delete document.body.dataset.profileMouseTrail;
}

function addMouseTrailDiamond(event) {
  if (document.body.dataset.profileMouseTrail !== "diamond_trail" || event.pointerType === "touch") return;
  const now = performance.now();
  if (now - lastTrailAt < 28) return;
  lastTrailAt = now;

  const diamond = makeElement("span", "mouse-trail-diamond");
  diamond.dataset.tone = String(trailTone % 3);
  trailTone += 1;
  diamond.style.left = `${event.clientX}px`;
  diamond.style.top = `${event.clientY}px`;
  diamond.setAttribute("aria-hidden", "true");
  document.body.append(diamond);
  window.setTimeout(() => diamond.remove(), 700);
}

function handleLevelLinkClick(event) {
  const link = event.target.closest(".level-links a[data-locked='true']");
  if (!link) return;
  event.preventDefault();
  const level = Number(new URL(link.href).searchParams.get("level"));
  const requiredXp = (level - 1) * 150;

  if (!auth.currentUser) {
    setAuthMode("signin");
    document.querySelector("#account-status").textContent = "Sign in to track progress and unlock higher levels.";
    openAccountDialog();
    return;
  }

  activeTab = "progression";
  openAccountDialog();
  document.querySelector("#account-pane").prepend(
    makeElement("p", "locked-level-note", `Level ${level} unlocks at ${requiredXp} XP.`),
  );
}

function addMetric(container, icon, label, value, detail = "") {
  const metric = makeElement("article", "account-metric");
  metric.append(
    makeElement("span", "account-metric-icon", icon),
    makeElement("span", "account-metric-copy"),
  );
  const copy = metric.lastElementChild;
  copy.append(
    makeElement("span", "account-metric-label", label),
    makeElement("strong", "account-metric-value", value),
  );
  if (detail) copy.append(makeElement("span", "account-metric-detail", detail));
  container.append(metric);
}

function renderProgression(container, profile) {
  const progression = profileData?.progression || {};
  const section = makeElement("section", "account-progress");
  section.append(
    makeElement("h3", "", `Level ${progression.level || profile.level || 1}`),
    makeElement("p", "", `${progression.xp || profile.xp || 0} XP earned`),
  );
  const track = makeElement("div", "account-xp-track");
  track.setAttribute("role", "progressbar");
  track.setAttribute("aria-label", "Progress to next level");
  const fill = makeElement("div", "account-xp-fill");
  const levelStart = ((progression.level || profile.level || 1) - 1) * 150;
  const levelXp = (progression.xp || profile.xp || 0) - levelStart;
  fill.style.width = `${Math.max(0, Math.min(100, levelXp / 150 * 100))}%`;
  track.append(fill);
  section.append(track, makeElement("p", "account-next-level", `${progression.xpToNextLevel ?? 150} XP to the next level`));
  container.append(section);
}

function renderAchievements(container, achievements = []) {
  const list = makeElement("div", "achievement-list");
  if (!achievements.length) {
    list.append(makeElement("p", "account-empty", "Achievements will appear here as you complete missions."));
  }
  achievements.forEach((achievement) => {
    const item = makeElement("article", `achievement-item${achievement.unlocked ? " is-unlocked" : ""}`);
    item.append(
      makeElement("span", "achievement-mark", achievement.unlocked ? "★" : "☆"),
      makeElement("span", "achievement-copy"),
    );
    item.lastElementChild.append(
      makeElement("strong", "", achievement.title),
      makeElement("span", "", achievement.description),
    );
    item.append(makeElement("span", "achievement-reward", `+${achievement.coins} ◈`));
    list.append(item);
  });
  container.append(list);
}

async function renderLeaderboard(container, scope = "global") {
  const controls = makeElement("div", "leaderboard-controls");
  ["global", "friends"].forEach((value) => {
    const button = makeElement("button", `account-tab-button${value === scope ? " is-active" : ""}`, value === "global" ? "Global" : "Friends");
    button.type = "button";
    button.addEventListener("click", () => renderTab("leaderboard", value));
    controls.append(button);
  });
  container.append(controls);

  const list = makeElement("ol", "leaderboard-list");
  list.setAttribute("aria-label", `${scope} leaderboard`);
  container.append(list);
  try {
    const result = await mathApi("leaderboard", {scope});
    if (!result.entries.length) {
      list.append(makeElement("li", "account-empty", "No pilots on this leaderboard yet."));
      return;
    }
    result.entries.forEach((entry) => {
      const row = makeElement("li", "leaderboard-row");
      row.append(
        makeElement("span", "leaderboard-rank", String(entry.rank).padStart(2, "0")),
        makeElement("span", "leaderboard-name", entry.username),
        makeElement("span", "leaderboard-level", `Lv ${entry.level}`),
        makeElement("strong", "leaderboard-xp", `${entry.xp} XP`),
      );
      list.append(row);
    });
  } catch (error) {
    list.append(makeElement("li", "account-empty", error.message));
  }
}

async function renderFriends(container, profile) {
  const form = document.createElement("form");
  form.className = "friend-form";
  form.innerHTML = '<label for="friend-username">Pilot username</label><div><input id="friend-username" name="username" minlength="3" maxlength="20" autocomplete="off" required><button class="button button-primary" type="submit">Add friend</button></div><p class="account-message" role="status"></p>';
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = form.querySelector(".account-message");
    const submit = form.querySelector("button[type=submit]");
    submit.disabled = true;
    try {
      const result = await mathApi("addFriend", {username: new FormData(form).get("username")});
      message.textContent = `${result.username} added to your flight crew.`;
      form.reset();
    } catch (error) {
      message.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  });
  container.append(form);
  const friendCount = profile.friendUids?.length || 0;
  container.append(makeElement("p", "account-empty", `${friendCount} pilot${friendCount === 1 ? "" : "s"} in your flight crew. Friends appear in your Friends leaderboard.`));
}

async function renderShop(container) {
  const result = await mathApi("shop");
  container.append(makeElement("p", "shop-balance", `Your balance: ${result.coins} ◈`));
  const list = makeElement("div", "shop-list");
  result.items.forEach((item) => {
    const row = makeElement("article", "shop-item");
    const itemIcons = {profile_theme: "✦", avatar_frame: "⬡", mouse_trail: "◇"};
    const itemTypes = {profile_theme: "Profile theme", avatar_frame: "Avatar frame", mouse_trail: "Mouse trail"};
    row.append(makeElement("span", "shop-item-icon", itemIcons[item.type] || "✦"));
    row.append(makeElement("span", "shop-item-copy"));
    row.lastElementChild.append(
      makeElement("strong", "", item.name),
      makeElement("span", "", itemTypes[item.type] || "Cosmetic"),
    );
    const owned = Boolean(profileData.profile.inventory?.[item.id]);
    const equippedField = {
      profile_theme: "equippedTheme",
      avatar_frame: "equippedAvatarFrame",
      mouse_trail: "equippedMouseTrail",
    }[item.type];
    const equipped = profileData.profile[equippedField] === item.id;
    const button = makeElement("button", "button button-secondary", !owned ? `Buy · ${item.price} ◈` : equipped ? "Equipped" : "Equip");
    button.type = "button";
    button.disabled = owned && equipped;
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        await mathApi(owned ? "equipItem" : "purchaseItem", {itemId: item.id});
        await refreshProfile();
      } catch (error) {
        button.textContent = error.message;
        button.disabled = false;
      }
    });
    row.append(button);
    list.append(row);
  });
  container.append(list);
}

async function renderTab(tab, scope = "global") {
  activeTab = tab;
  const pane = document.querySelector("#account-pane");
  if (!pane || !profileData) return;
  pane.replaceChildren();
  document.querySelectorAll("[data-account-tab]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.accountTab === tab);
  });

  if (tab === "progression") renderProgression(pane, profileData.profile);
  if (tab === "achievements") renderAchievements(pane, profileData.achievements);
  if (tab === "leaderboard") await renderLeaderboard(pane, scope);
  if (tab === "friends") await renderFriends(pane, profileData.profile);
  if (tab === "shop") {
    try {
      await renderShop(pane);
    } catch (error) {
      pane.append(makeElement("p", "account-empty", error.message));
    }
  }
}

export async function refreshProfile() {
  if (!auth.currentUser) return;
  renderAccountButton(document.querySelector("#account-button"));
  try {
    profileData = await mathApi("profile");
    applyProfileTheme(profileData.profile);
    updateLevelLinks(true, profileData.profile.xp || 0);
    const metrics = document.querySelector("#account-metrics");
    if (metrics) {
      metrics.replaceChildren();
      addMetric(metrics, "✦", "Level", profileData.profile.level);
      addMetric(metrics, "⚡", "Experience", profileData.profile.xp);
      addMetric(metrics, "◈", "Coins", profileData.profile.coins);
      addMetric(metrics, "🔥", "Day streak", profileData.profile.currentStreak);
    }
    const name = document.querySelector("#account-display-name");
    if (name) name.textContent = profileData.profile.username;
    renderAccountButton(document.querySelector("#account-button"));
    await renderTab(activeTab);
  } catch (error) {
    const message = document.querySelector("#account-status");
    if (message) message.textContent = error.message;
  }
}

function setAuthMode(mode) {
  authMode = mode;
  const isSignup = mode === "signup";
  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.authMode === mode);
  });
  document.querySelector("#display-name-field").hidden = !isSignup;
  document.querySelector("#auth-submit").textContent = isSignup ? "Create account" : "Sign in";
  document.querySelector("#auth-password").autocomplete = isSignup ? "new-password" : "current-password";
  document.querySelector("#account-status").textContent = "";
}

export function openAccountDialog() {
  const dialog = document.querySelector("#account-dialog");
  if (auth.currentUser && profileData) {
    document.querySelector("#auth-view").hidden = true;
    document.querySelector("#player-view").hidden = false;
    renderTab(activeTab);
  } else {
    document.querySelector("#auth-view").hidden = false;
    document.querySelector("#player-view").hidden = true;
  }
  if (!dialog.open) dialog.showModal();
}

function installAccountUI() {
  const header = document.querySelector(".topbar");
  if (!header) return;
  const button = makeElement("button", "account-button", "Sign in");
  button.id = "account-button";
  button.type = "button";
  button.addEventListener("click", openAccountDialog);
  header.append(button);

  const dialog = document.createElement("dialog");
  dialog.id = "account-dialog";
  dialog.className = "account-dialog";
  dialog.innerHTML = `
    <div class="account-dialog-head"><div><p class="eyebrow">MATH GALAXY</p><h2>Your pilot account</h2></div><button class="dialog-close" type="button" aria-label="Close">×</button></div>
    <section id="auth-view" class="auth-view">
      <div class="auth-switch"><button type="button" data-auth-mode="signin">Sign in</button><button type="button" data-auth-mode="signup">Create account</button></div>
      <form id="auth-form" class="auth-form">
        <label id="display-name-field" hidden>Pilot name<input id="display-name" name="displayName" minlength="3" maxlength="20" autocomplete="nickname"></label>
        <label>Email<input id="auth-email" name="email" type="email" autocomplete="email" required></label>
        <label>Password<input id="auth-password" name="password" type="password" minlength="6" autocomplete="current-password" required></label>
        <p id="account-status" class="account-message" role="status" aria-live="polite"></p>
        <button id="auth-submit" class="button button-primary" type="submit">Sign in</button>
      </form>
    </section>
    <section id="player-view" hidden>
      <div class="account-player-head"><span id="account-avatar" class="account-avatar" aria-label="Pilot avatar">🚀</span><div class="account-player-identity"><p class="eyebrow">PILOT PROFILE</p><h3 id="account-display-name"></h3></div><button id="sign-out" class="button button-secondary" type="button">Sign out</button></div>
      <div id="account-metrics" class="account-metrics"></div>
      <nav class="account-tabs" aria-label="Pilot account sections">
        <button type="button" data-account-tab="progression">Progress</button>
        <button type="button" data-account-tab="achievements">Awards</button>
        <button type="button" data-account-tab="leaderboard">Leaderboard</button>
        <button type="button" data-account-tab="friends">Friends</button>
        <button type="button" data-account-tab="shop">Shop</button>
      </nav>
      <div id="account-pane" class="account-pane"></div>
    </section>`;
  document.body.append(dialog);
  document.addEventListener("pointermove", addMouseTrailDiamond, {passive: true});
  updateLevelLinks(false);
  document.addEventListener("click", handleLevelLinkClick);
  dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.querySelectorAll("[data-auth-mode]").forEach((modeButton) => {
    modeButton.addEventListener("click", () => setAuthMode(modeButton.dataset.authMode));
  });
  dialog.querySelectorAll("[data-account-tab]").forEach((tabButton) => {
    tabButton.addEventListener("click", () => renderTab(tabButton.dataset.accountTab));
  });
  dialog.querySelector("#sign-out").addEventListener("click", () => signOut(auth));
  dialog.querySelector("#auth-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const status = dialog.querySelector("#account-status");
    const submit = dialog.querySelector("#auth-submit");
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;
    submit.disabled = true;
    status.textContent = "";
    try {
      if (authMode === "signup") {
        const displayName = form.elements.displayName.value.trim();
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(displayName)) {
          throw new Error("Pilot name must be 3 to 20 letters, numbers, or underscores.");
        }
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, {displayName});
        await mathApi("profile");
        await mathApi("setUsername", {username: displayName});
        await refreshProfile();
        dialog.close();
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        dialog.close();
      }
    } catch (error) {
      status.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  });

  setAuthMode("signin");
  window.mathPracticeOpenAccount = openAccountDialog;
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      renderAccountButton(button);
      updateLevelLinks(true, profileData?.profile?.xp || 0);
      document.querySelector("#account-display-name").textContent =
        profileData?.profile?.username || user.displayName || user.email?.split("@")[0] || "Pilot";
      document.querySelector("#auth-view").hidden = true;
      document.querySelector("#player-view").hidden = false;
    } else {
      profileData = null;
      renderAccountButton(button);
      applyProfileTheme(null);
      updateLevelLinks(false);
      document.querySelector("#auth-view").hidden = false;
      document.querySelector("#player-view").hidden = true;
    }
    resolveAuthReady(user);
    window.dispatchEvent(new CustomEvent("math-auth-changed", {detail: {user}}));
    if (user) await refreshProfile();
  });
}

installAccountUI();