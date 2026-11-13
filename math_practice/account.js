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
let lastActivityAt = Date.now();
let luckyRollInProgress = false;
let titleToastQueue = [];
let titleToastShowing = false;
let challengeEntryUpdate = 0;

const pilotTitles = [
  {level: 1, title: "Cadet in training"},
  {level: 10, title: "New Pilot"},
  {level: 20, title: "Amateur Pilot"},
  {level: 30, title: "Good Pilot"},
  {level: 40, title: "Great Pilot"},
  {level: 50, title: "Pro Pilot"},
  {level: 60, title: "Elite Pilot"},
  {level: 70, title: "Legend"},
  {level: 80, title: "Mythical"},
  {level: 90, title: "Cosmic Pilot"},
  {level: 100, title: "Galactic Legend"},
];

function getPilotTitle(level) {
  const unlockedTitles = pilotTitles.filter((entry) => entry.level <= level);
  const milestone = unlockedTitles[unlockedTitles.length - 1];
  if (milestone.level === 100 && Math.floor(level / 10) > 10) {
    return `${milestone.title} ${Math.floor(level / 10) - 9}`;
  }
  return milestone.title;
}

function showTitleToast(title, isLucky = false) {
  titleToastQueue.push({title, isLucky});
  showNextTitleToast();
}

function showNextTitleToast() {
  if (titleToastShowing) return;
  const nextToast = titleToastQueue.shift();
  if (!nextToast) return;
  titleToastShowing = true;
  const toast = makeElement("div", `title-unlock-toast${nextToast.isLucky ? " is-lucky" : ""}`);
  toast.id = "title-unlock-toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.append(
    makeElement("span", "title-toast-kicker", nextToast.isLucky ? "LUCKY TITLE UNLOCKED" : "NEW PILOT TITLE"),
    makeElement("strong", "title-toast-name", nextToast.title),
  );
  for (let index = 0; index < 12; index += 1) {
    const spark = makeElement("span", "title-toast-spark");
    const angle = Math.random() * Math.PI * 2;
    const distance = 25 + Math.random() * 65;
    spark.style.setProperty("--spark-x", `${Math.cos(angle) * distance}px`);
    spark.style.setProperty("--spark-y", `${Math.sin(angle) * distance}px`);
    toast.append(spark);
  }
  document.body.append(toast);
  window.setTimeout(() => {
    toast.remove();
    titleToastShowing = false;
    showNextTitleToast();
  }, 6000);
}

function updatePilotTitle(profile) {
  const title = getPilotTitle(profile.level || 1);
  const titleElement = document.querySelector(".pilot-title");
  if (titleElement) titleElement.textContent = title;
  const titleList = document.querySelector("#account-pilot-titles");
  if (titleList) {
    titleList.replaceChildren(makeElement("span", "account-title-badge", title));
    if (profile.luckyTitle) titleList.append(makeElement("span", "account-title-badge is-lucky", "Lucky"));
  }
}

function updateSubjectChallengeHistory(profile) {
  document.querySelectorAll(".subject-last-challenge[data-operation]").forEach((label) => {
    const challenge = profile.challengeProgress?.[label.dataset.operation];
    if (!challenge || !Number.isInteger(challenge.stars)) {
      label.textContent = "No challenge played yet";
      return;
    }

    label.textContent = `Last challenge: ${"★".repeat(challenge.stars)}${"☆".repeat(5 - challenge.stars)} · Level ${challenge.level}`;
    label.setAttribute("aria-label", `Last challenge: ${challenge.stars} stars at Level ${challenge.level}`);
  });
}

export function formatDuration(milliseconds) {
  const totalMilliseconds = Math.floor(milliseconds);
  const totalSeconds = Math.floor(totalMilliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  const fraction = String(totalMilliseconds % 1000).padStart(3, "0");
  return `${minutes}:${seconds}.${fraction}`;
}

async function updateChallengeEntryButtons() {
  const buttons = [...document.querySelectorAll(".play-button[data-operation]")];
  if (!buttons.length) return;
  const user = auth.currentUser;
  const updateId = ++challengeEntryUpdate;
  const isCurrentUpdate = () => auth.currentUser === user && challengeEntryUpdate === updateId;

  await Promise.all(buttons.map(async (button) => {
    const operation = button.dataset.operation;
    const leaderboard = document.querySelector(`.challenge-leaderboard[data-operation="${operation}"]`);
    if (leaderboard) leaderboard.textContent = "Loading challenge records…";
    try {
      const availability = await mathApi("challengeAvailability", {operation});
      if (!isCurrentUpdate()) return;
      button.href = `${operation}.html`;
      button.removeAttribute("aria-disabled");
      button.removeAttribute("aria-label");
      button.removeAttribute("tabindex");
      button.classList.remove("is-disabled");
      if (availability.available) {
        button.textContent = availability.attemptsRemaining === 1 ? "Play · 1 try left" : "Play";
        button.title = `Next challenge: Level ${availability.level}`;
      } else {
        button.textContent = "No tries left today";
        button.setAttribute("aria-disabled", "true");
        button.setAttribute("aria-label", `${operation}: no tries left today`);
        button.tabIndex = -1;
        button.classList.add("is-disabled");
        button.removeAttribute("href");
        button.title = "Both tries for this challenge have been used. Tries reset at midnight UTC.";
      }
      if (leaderboard) {
        try {
          const result = await mathApi("challengeLeaderboard", {operation, level: availability.level});
          if (!isCurrentUpdate()) return;
          leaderboard.replaceChildren(makeElement("strong", "", `Level ${result.level} · Fastest perfect missions`));
          if (!result.entries.length) {
            leaderboard.append(makeElement("div", "", "No perfect missions yet."));
          } else {
            const list = makeElement("ol");
            result.entries.forEach((entry) => {
              list.append(makeElement("li", "", `${entry.username} · ${formatDuration(entry.elapsedMs)}`));
            });
            leaderboard.append(list);
          }
        } catch (error) {
          if (!isCurrentUpdate()) return;
          leaderboard.textContent = "Unable to load challenge records.";
          console.error(`Could not load ${operation} challenge records:`, error);
        }
      }
    } catch (error) {
      if (!isCurrentUpdate()) return;
      if (leaderboard) leaderboard.textContent = "Unable to load challenge records.";
      button.textContent = "Unable to check tries";
      button.setAttribute("aria-disabled", "true");
      button.tabIndex = -1;
      button.classList.add("is-disabled");
      button.removeAttribute("href");
      button.title = error.message;
      console.error(`Could not check today's ${operation} challenge availability:`, error);
    }
  }));
}

function resetChallengeEntryButtons() {
  challengeEntryUpdate += 1;
  document.querySelectorAll(".challenge-leaderboard[data-operation]").forEach((leaderboard) => {
    leaderboard.textContent = "Sign in to see challenge records.";
  });
  document.querySelectorAll(".play-button[data-operation]").forEach((button) => {
    button.textContent = "Play";
    button.href = `${button.dataset.operation}.html`;
    button.removeAttribute("aria-disabled");
    button.removeAttribute("aria-label");
    button.removeAttribute("tabindex");
    button.removeAttribute("title");
    button.classList.remove("is-disabled");
  });
}

function markActive() {
  lastActivityAt = Date.now();
}

async function checkLuckyTitle() {
  if (!auth.currentUser || !profileData || profileData.profile.luckyTitle ||
      document.visibilityState !== "visible" || Date.now() - lastActivityAt > 3 * 60 * 1000 ||
      luckyRollInProgress) return;

  luckyRollInProgress = true;
  try {
    const result = await mathApi("rollLuckyTitle");
    if (result.luckyTitle && !profileData.profile.luckyTitle) {
      profileData.profile.luckyTitle = true;
      updatePilotTitle(profileData.profile);
      showTitleToast("Lucky", true);
    }
  } catch (error) {
    console.error("Could not check for the Lucky title:", error);
  } finally {
    luckyRollInProgress = false;
  }
}

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
    const error = new Error(data.error || "The Math Galaxy service could not complete that request.");
    error.status = response.status;
    throw error;
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

function getLevelProgress(profile) {
  const progression = profileData?.progression || {};
  const level = progression.level ?? profile.level ?? 1;
  const totalProgress = progression.xp ?? profile.xp ?? 0;
  const progressAtLevelStart = 150 * (level - 1) * level / 2;
  const progressNeededForLevel = 150 * level;
  const progressInLevel = Math.max(0, Math.min(progressNeededForLevel, totalProgress - progressAtLevelStart));
  const pointsToNextLevel = Math.max(0, progression.xpToNextLevel ?? (progressAtLevelStart + progressNeededForLevel - totalProgress));
  return {level, progressInLevel, progressNeededForLevel, pointsToNextLevel};
}

function updateProfileProgress(profile) {
  const {progressInLevel, progressNeededForLevel, pointsToNextLevel} = getLevelProgress(profile);
  const track = document.querySelector("#account-profile-progress-track");
  const fill = document.querySelector("#account-profile-progress-fill");
  const label = document.querySelector("#account-profile-progress-label");
  if (!track || !fill || !label) return;
  const progressPercent = progressInLevel / progressNeededForLevel * 100;
  track.setAttribute("aria-valuemax", String(progressNeededForLevel));
  track.setAttribute("aria-valuenow", String(progressInLevel));
  track.setAttribute("aria-valuetext", `${pointsToNextLevel} points to next level`);
  fill.style.width = `${progressPercent}%`;
  label.textContent = `${pointsToNextLevel} points to next level`;
}

function renderProgression(container, profile) {
  const {level, progressInLevel, progressNeededForLevel, pointsToNextLevel} = getLevelProgress(profile);
  const section = makeElement("section", "account-progress");
  section.append(makeElement("h3", "", `Level ${level}`));
  const track = makeElement("div", "account-level-track");
  track.setAttribute("role", "progressbar");
  track.setAttribute("aria-label", "Progress to next level");
  track.setAttribute("aria-valuemin", "0");
  track.setAttribute("aria-valuemax", String(progressNeededForLevel));
  track.setAttribute("aria-valuenow", String(progressInLevel));
  track.setAttribute("aria-valuetext", `${pointsToNextLevel} points to next level`);
  const fill = makeElement("div", "account-level-fill");
  fill.style.width = `${progressInLevel / progressNeededForLevel * 100}%`;
  track.append(fill);
  section.append(track, makeElement("p", "account-next-level", `${pointsToNextLevel} progress points to the next level`));
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
    const previousProfile = profileData?.profile;
    profileData = await mathApi("profile");
    applyProfileTheme(profileData.profile);
    updateProfileProgress(profileData.profile);
    updatePilotTitle(profileData.profile);
    updateSubjectChallengeHistory(profileData.profile);
    await updateChallengeEntryButtons();
    if (previousProfile) {
      const previousTitle = getPilotTitle(previousProfile.level || 1);
      const currentTitle = getPilotTitle(profileData.profile.level || 1);
      if (previousTitle !== currentTitle) showTitleToast(currentTitle);
      if (!previousProfile.luckyTitle && profileData.profile.luckyTitle) showTitleToast("Lucky", true);
    }
    const metrics = document.querySelector("#account-metrics");
    if (metrics) {
      metrics.replaceChildren();
      addMetric(metrics, "✦", "Level", profileData.profile.level);
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
      <div class="account-player-head"><span id="account-avatar" class="account-avatar" aria-label="Pilot avatar">🚀</span><div class="account-player-identity"><div class="account-profile-heading"><p class="eyebrow">PILOT PROFILE</p><div class="account-profile-progress"><div id="account-profile-progress-track" class="account-profile-progress-track" role="progressbar" aria-label="Progress to next level" aria-valuemin="0" aria-valuemax="150" aria-valuenow="0"><div id="account-profile-progress-fill" class="account-profile-progress-fill"></div></div><span id="account-profile-progress-label">150 points to next level</span></div></div><h3 id="account-display-name"></h3><div id="account-pilot-titles" class="account-pilot-titles"></div></div><button id="sign-out" class="button button-secondary" type="button">Sign out</button></div>
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
  ["pointerdown", "pointermove", "keydown", "touchstart", "scroll"].forEach((eventName) => {
    document.addEventListener(eventName, markActive, {passive: true});
  });
  window.setInterval(checkLuckyTitle, 60 * 1000);
  document.addEventListener("pointermove", addMouseTrailDiamond, {passive: true});
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
      markActive();
      renderAccountButton(button);
      document.querySelector("#account-display-name").textContent =
        profileData?.profile?.username || user.displayName || user.email?.split("@")[0] || "Pilot";
      document.querySelector("#auth-view").hidden = true;
      document.querySelector("#player-view").hidden = false;
    } else {
      profileData = null;
      updatePilotTitle({level: 1, luckyTitle: false});
      renderAccountButton(button);
      applyProfileTheme(null);
      resetChallengeEntryButtons();
      document.querySelector("#auth-view").hidden = false;
      document.querySelector("#player-view").hidden = true;
    }
    resolveAuthReady(user);
    window.dispatchEvent(new CustomEvent("math-auth-changed", {detail: {user}}));
    if (user) await refreshProfile();
  });
}

installAccountUI();