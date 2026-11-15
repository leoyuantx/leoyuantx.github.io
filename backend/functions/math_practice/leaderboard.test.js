import {test, mock} from "node:test";
import assert from "node:assert/strict";
import {initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";

process.env.GCLOUD_PROJECT = "math-practice-test";
initializeApp();
const db = getFirestore();
const documents = new Map();
let nextDocumentId = 0;

function snapshot(path) {
	const data = documents.get(path);
	return {id: path.split("/").at(-1), exists: data !== undefined, data: () => data};
}

function document(path) {
	return {
		id: path.split("/").at(-1),
		path,
		get: async () => snapshot(path),
		collection: (name) => collection(`${path}/${name}`),
	};
}

function collection(path) {
	return {
		doc: (id = `test-${++nextDocumentId}`) => document(`${path}/${id}`),
		orderBy: (field) => ({
			limit: (count) => ({
				get: async () => {
					const docs = [...documents.keys()]
						.filter((key) => key.startsWith(`${path}/`) && !key.slice(path.length + 1).includes("/"))
						.map(snapshot)
						.sort((a, b) => a.data()[field] - b.data()[field])
						.slice(0, count);
					return {docs, empty: docs.length === 0};
				},
			}),
		}),
	};
}

mock.method(db, "collection", (path) => collection(path));
mock.method(db, "getAll", async (...refs) => refs.map((ref) => snapshot(ref.path)));
mock.method(db, "runTransaction", async (callback) => {
	let writing = false;
	return callback({
		get: async (ref) => {
			assert.equal(writing, false, "Firestore reads must precede writes");
			return snapshot(ref.path);
		},
		set: (ref, data) => {
			writing = true;
			documents.set(ref.path, data);
		},
		create: (ref, data) => {
			writing = true;
			assert.equal(documents.has(ref.path), false);
			documents.set(ref.path, data);
		},
		update: (ref, data) => {
			writing = true;
			const current = documents.get(ref.path);
			for (const [key, value] of Object.entries(data)) {
				const parts = key.split(".");
				let target = current;
				for (const part of parts.slice(0, -1)) target = target[part] ||= {};
				target[parts.at(-1)] = value;
			}
		},
	});
});
mock.method(getAuth(), "verifyIdToken", async (uid) => ({uid}));
const {mathPracticeApi} = await import("./index.js");

async function request(uid, body) {
	const result = {};
	const response = {
		set() { return this; },
		status(status) { result.status = status; return this; },
		json(data) { result.body = data; return this; },
	};
	await mathPracticeApi({
		method: "POST",
		get: () => `Bearer ${uid}`,
		body,
	}, response);
	return result;
}

function addSession(uid, id, operation, level, startedAtMs) {
	documents.set(`mathProfiles/${uid}`, {
		uid, username: uid, progressionVersion: 2, xp: 0, level: 1,
		achievementIds: [], challengeProgress: {},
	});
	documents.set(`mathSessions/${id}`, {
		uid, operation, level, startedAtMs, status: "active",
		questions: Array.from({length: 10}, (_, index) => ({a: index, b: 1, answer: index + 1})),
	});
}

test("perfect missions keep each pilot's best server time per subject and level", async () => {
	const clock = mock.method(Date, "now", () => 100000);
	const answers = Array.from({length: 10}, (_, index) => index + 1);
	const answerTimes = Array(10).fill(1);
	const complete = (uid, sessionId, submitted = answers) =>
		request(uid, {action: "completeMission", sessionId, answers: submitted, answerTimes});

	try {
		addSession("pilot", "imperfect", "addition", 1, 90000);
		assert.equal((await complete("pilot", "imperfect", Array(10).fill(0))).body.result.correct, 0);
		assert.equal(documents.has("mathChallengeRecords/addition_1/times/pilot"), false);

		addSession("pilot", "first", "addition", 1, 80000);
		assert.equal((await complete("pilot", "first")).body.result.elapsedMs, 20000);
		assert.equal(documents.get("mathChallengeRecords/addition_1/times/pilot").username, "pilot");

		addSession("pilot", "slower", "addition", 1, 70000);
		await complete("pilot", "slower");
		assert.equal(documents.get("mathChallengeRecords/addition_1/times/pilot").elapsedMs, 20000);

		addSession("pilot", "faster", "addition", 1, 95000);
		await complete("pilot", "faster");
		clock.mock.mockImplementation(() => 110000);
		assert.equal((await complete("pilot", "faster")).body.result.elapsedMs, 5000);
		assert.equal(documents.get("mathChallengeRecords/addition_1/times/pilot").elapsedMs, 5000);

		addSession("pilot", "other-level", "addition", 2, 100000);
		await complete("pilot", "other-level");
		assert.equal(documents.get("mathChallengeRecords/addition_2/times/pilot").elapsedMs, 10000);
	} finally {
		clock.mock.restore();
	}
});

test("leaderboard returns the fastest five distinct pilots and validates the challenge", async () => {
	for (let index = 0; index < 6; index += 1) {
		documents.set(`mathProfiles/user${index}`, {username: `renamed${index}`});
		documents.set(`mathChallengeRecords/division_1/times/user${index}`, {
			username: `user${index}`, elapsedMs: (6 - index) * 1000,
		});
	}
	const response = await request("pilot", {action: "challengeLeaderboard", operation: "division", level: 1});
	assert.equal(response.status, 200);
	assert.deepEqual(response.body.entries, [5, 4, 3, 2, 1].map((index) => ({
		username: `renamed${index}`, elapsedMs: (6 - index) * 1000,
	})));
	assert.deepEqual((await request("pilot", {
		action: "challengeLeaderboard", operation: "division", level: 2,
	})).body.entries, []);
	assert.equal((await request("pilot", {
		action: "challengeLeaderboard", operation: "division", level: 4,
	})).status, 400);
});

test("multiplication advances to level 3 with two-digit operands", async () => {
	const uid = "multiplication-pilot";
	documents.set(`mathProfiles/${uid}`, {
		uid, username: uid, progressionVersion: 2, xp: 0, level: 1,
		achievementIds: [], challengeProgress: {multiplication: {level: 2, stars: 4}},
	});
	const availability = await request(uid, {action: "challengeAvailability", operation: "multiplication"});
	assert.equal(availability.body.level, 3);
	const started = await request(uid, {action: "startMission", operation: "multiplication"});
	assert.equal(started.status, 200);
	assert.equal(started.body.level, 3);
	const questions = documents.get(`mathSessions/${started.body.sessionId}`).questions;
	assert.equal(questions.length, 10);
	for (const {a, b, answer} of questions) {
		assert.ok(Number.isInteger(a) && a >= 10 && a <= 99);
		assert.ok(Number.isInteger(b) && b >= 10 && b <= 99);
		assert.equal(answer, a * b);
	}
	const completed = await request(uid, {
		action: "completeMission", sessionId: started.body.sessionId,
		answers: questions.map(({answer}) => answer), answerTimes: Array(10).fill(100),
	});
	assert.equal(completed.body.result.correct, 10);
	assert.equal(documents.has(`mathChallengeRecords/multiplication_3/times/${uid}`), true);
	assert.equal((await request(uid, {action: "challengeAvailability", operation: "multiplication"})).body.level, 3);
	assert.equal((await request(uid, {action: "challengeLeaderboard", operation: "multiplication", level: 3})).status, 200);
});

test("mission rewards match the accuracy and difficulty matrix", async () => {
	const matrix = {
		0: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
		1: [[4, 1], [5, 1], [6, 2], [7, 2], [8, 2]],
		6: [[8, 2], [10, 3], [12, 3], [14, 4], [16, 4]],
		8: [[12, 3], [15, 4], [18, 5], [21, 5], [24, 6]],
		10: [[16, 4], [20, 5], [24, 6], [28, 7], [32, 8]],
	};
	for (const correct of [0, 1, 5, 6, 7, 8, 9, 10]) {
		const band = correct === 0 ? 0 : correct <= 5 ? 1 : correct <= 7 ? 6 : correct <= 9 ? 8 : 10;
		for (let level = 1; level <= 5; level += 1) {
			const uid = `reward-${correct}-${level}`;
			addSession(uid, uid, "addition", level, Date.now());
			documents.get(`mathProfiles/${uid}`).achievementIds =
				["first_mission", "perfect_mission", "three_day_streak", "ten_missions", "hundred_correct"];
			const response = await request(uid, {
				action: "completeMission", sessionId: uid,
				answers: Array.from({length: 10}, (_, index) => index < correct ? index + 1 : 0),
				answerTimes: Array(10).fill(16000),
			});
			assert.equal(response.status, 200);
			const result = response.body.result;
			const [xp, coins] = matrix[band][level - 1];
			assert.equal(result.xpEarned, xp, `${correct} correct, level ${level} XP`);
			assert.equal(result.coinsEarned, coins, `${correct} correct, level ${level} coins`);
			assert.deepEqual(result.speedBonus, {xp: 0, coins: 0});
			assert.equal(result.variableReward.amount, 0);
		}
	}
});

test("speed bonuses require perfection and honor both time boundaries", async () => {
	for (const [time, xp, coins] of [[5000, 2, 1], [5001, 1, 0], [15000, 1, 0], [15001, 0, 0]]) {
		const uid = `speed-${time}`;
		addSession(uid, uid, "addition", 1, Date.now());
		documents.get(`mathProfiles/${uid}`).achievementIds = ["first_mission", "perfect_mission"];
		const result = await request(uid, {
			action: "completeMission", sessionId: uid,
			answers: Array.from({length: 10}, (_, index) => index + 1),
			answerTimes: Array(10).fill(time),
		});
		assert.deepEqual(result.body.result.speedBonus, {xp, coins});
		assert.equal(result.body.result.xpEarned, 16 + xp);
		assert.equal(result.body.result.coinsEarned, 4 + coins);
		assert.equal(documents.get(`mathProfiles/${uid}`).xp, 0);
		assert.equal(documents.get(`mathProfiles/${uid}`).unclaimedMissionXp, 16 + xp);
	}
	const uid = "speed-imperfect";
	addSession(uid, uid, "addition", 1, Date.now());
	documents.get(`mathProfiles/${uid}`).achievementIds = ["first_mission"];
	const result = await request(uid, {
		action: "completeMission", sessionId: uid,
		answers: Array.from({length: 10}, (_, index) => index === 0 ? 0 : index + 1),
		answerTimes: Array(10).fill(100),
	});
	assert.deepEqual(result.body.result.speedBonus, {xp: 0, coins: 0});
});

test("mission XP and achievement coins can be claimed once", async () => {
	const uid = "achievement-rewards";
	addSession(uid, uid, "addition", 1, Date.now());
	Object.assign(documents.get(`mathProfiles/${uid}`), {
		totalSessions: 9, totalCorrect: 90, currentStreak: 2,
		lastStudyDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
	});
	const body = {
		action: "completeMission", sessionId: uid,
		answers: Array.from({length: 10}, (_, index) => index + 1),
		answerTimes: Array(10).fill(16000),
	};
	const result = (await request(uid, body)).body.result;
	assert.deepEqual(result.newAchievements.map(({coins}) => coins), [3, 5, 8, 10, 15]);
	assert.equal(result.achievementCoins, 41);
	assert.equal(result.coinsEarned, 4);
	assert.equal(result.unclaimedMissionXp, 16);
	const profile = documents.get(`mathProfiles/${uid}`);
	const visit = await request(uid, {action: "recordVisit"});
	assert.equal(visit.body.alreadyRecorded, true);
	assert.equal(visit.body.currentStreak, profile.currentStreak);
	assert.equal(profile.coins, 4);
	assert.equal(profile.xp, 0);
	assert.equal(profile.unclaimedMissionXp, 16);

	assert.equal((await request(uid, body)).body.result.unclaimedMissionXp, 16);
	assert.equal(profile.unclaimedMissionXp, 16);
	assert.equal(profile.coins, 4);

	const xpClaim = await request(uid, {action: "claimMissionXp"});
	assert.equal(xpClaim.status, 200);
	assert.equal(xpClaim.body.claimedXp, 16);
	assert.equal(profile.xp, 16);
	assert.equal(profile.unclaimedMissionXp, 0);
	assert.equal((await request(uid, {action: "claimMissionXp"})).body.claimedXp, 0);
	profile.unclaimedMissionXp = 134;
	const levelClaim = await request(uid, {action: "claimMissionXp"});
	assert.equal(levelClaim.body.xp, 150);
	assert.equal(levelClaim.body.level, 2);
	assert.equal(profile.level, 2);

	const achievementClaim = await request(uid, {action: "claimAchievement", achievementId: "first_mission"});
	assert.equal(achievementClaim.status, 200);
	assert.equal(achievementClaim.body.claimedCoins, 3);
	assert.equal(profile.coins, 7);
	const repeatedClaim = await request(uid, {action: "claimAchievement", achievementId: "first_mission"});
	assert.equal(repeatedClaim.status, 429);
	assert.equal(profile.coins, 7);
	assert.equal((await request(uid, {action: "profile"})).body.achievements
		.find(({id}) => id === "first_mission").claimed, true);
	assert.equal((await request(uid, {action: "claimAchievement", achievementId: "unknown"})).status, 400);
});

test("signed-in visits advance streaks once per UTC day without a mission", async () => {
	const uid = "daily-page-visit";
	const today = new Date().toISOString().slice(0, 10);
	const yesterdayDate = new Date(`${today}T00:00:00.000Z`);
	yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
	const yesterday = yesterdayDate.toISOString().slice(0, 10);
	const profile = {
		uid, username: uid, progressionVersion: 2, rewardClaimsVersion: 1,
		xp: 0, level: 1, coins: 0, currentStreak: 2, longestStreak: 4,
		lastStudyDate: yesterday, achievementIds: [], claimedAchievementIds: [],
	};
	documents.set(`mathProfiles/${uid}`, profile);

	const result = await request(uid, {action: "recordVisit"});
	assert.equal(result.status, 200);
	assert.equal(result.body.currentStreak, 3);
	assert.equal(result.body.longestStreak, 4);
	assert.deepEqual(result.body.newAchievements.map(({id}) => id), ["three_day_streak"]);
	assert.equal(profile.lastStudyDate, today);
	assert.deepEqual(profile.achievementIds, ["three_day_streak"]);

	const repeatVisit = await request(uid, {action: "recordVisit"});
	assert.equal(repeatVisit.body.alreadyRecorded, true);
	assert.equal(repeatVisit.body.currentStreak, 3);
	assert.deepEqual(repeatVisit.body.newAchievements, []);
	assert.equal(profile.totalSessions, undefined);
});

test("First Mission reward can be collected again after 24 hours", async () => {
	const uid = "daily-first-mission";
	const profile = {
		uid, username: uid, progressionVersion: 2, rewardClaimsVersion: 1,
		xp: 0, level: 1, coins: 3, achievementIds: ["first_mission"],
		claimedAchievementIds: ["first_mission"],
		firstMissionClaimedAt: Date.now() - 24 * 60 * 60 * 1000 - 1,
	};
	documents.set(`mathProfiles/${uid}`, profile);

	const available = (await request(uid, {action: "profile"})).body.achievements
		.find(({id}) => id === "first_mission");
	assert.equal(available.unlocked, true);
	assert.equal(available.claimed, false);

	const result = await request(uid, {action: "claimAchievement", achievementId: "first_mission"});
	assert.equal(result.status, 200);
	assert.equal(result.body.claimedCoins, 3);
	assert.equal(profile.coins, 6);
	assert.ok(profile.firstMissionClaimedAt > Date.now() - 1000);
	assert.equal((await request(uid, {action: "claimAchievement", achievementId: "first_mission"})).status, 429);
});

test("previously awarded achievement coins are not claimable again", async () => {
	const uid = "legacy-reward-claims";
	documents.set(`mathProfiles/${uid}`, {
		uid, username: uid, progressionVersion: 2, xp: 450, level: 3, coins: 100,
		achievementIds: ["first_mission"],
	});

	const profileResult = await request(uid, {action: "profile"});
	assert.equal(profileResult.body.profile.unclaimedMissionXp, 0);
	assert.deepEqual(profileResult.body.profile.claimedAchievementIds, ["first_mission"]);
	assert.equal(profileResult.body.achievements.find(({id}) => id === "first_mission").claimed, true);
	assert.ok(Number.isFinite(documents.get(`mathProfiles/${uid}`).firstMissionClaimedAt));
	const achievementClaim = await request(uid, {action: "claimAchievement", achievementId: "first_mission"});
	assert.equal(achievementClaim.status, 429);
	assert.equal(documents.get(`mathProfiles/${uid}`).coins, 100);
	assert.equal((await request(uid, {action: "claimAchievement", achievementId: "perfect_mission"})).status, 400);
	const xpClaim = await request(uid, {action: "claimMissionXp"});
	assert.equal(xpClaim.body.claimedXp, 0);
	assert.equal(documents.get(`mathProfiles/${uid}`).xp, 450);
});

test("owned shop items can be unequipped without losing ownership", async () => {
	const uid = "shop-unequip";
	documents.set(`mathProfiles/${uid}`, {
		uid, username: uid, coins: 25,
		inventory: {comet_trail: true, nebula_theme: true},
		equippedTheme: "comet_trail",
	});

	const result = await request(uid, {action: "unequipItem", itemId: "comet_trail"});
	assert.equal(result.status, 200);
	assert.equal(result.body.equipped, null);
	assert.equal(documents.get(`mathProfiles/${uid}`).equippedTheme, null);
	assert.equal(documents.get(`mathProfiles/${uid}`).inventory.comet_trail, true);
	assert.equal(documents.get(`mathProfiles/${uid}`).coins, 25);

	documents.get(`mathProfiles/${uid}`).equippedTheme = "nebula_theme";
	const staleUnequip = await request(uid, {action: "unequipItem", itemId: "comet_trail"});
	assert.equal(staleUnequip.status, 409);
	assert.equal(documents.get(`mathProfiles/${uid}`).equippedTheme, "nebula_theme");
});

test("division levels generate remainder and terminating decimal questions", async () => {
	for (const level of [2, 3]) {
		for (let run = 0; run < 20; run += 1) {
			const uid = `division-${level}-${run}`;
			documents.set(`mathProfiles/${uid}`, {
				uid, username: uid, progressionVersion: 2,
				challengeProgress: {division: {level: level - 1, stars: 4}},
			});
			const result = await request(uid, {
				action: "startMission", operation: "division", answerFormats: ["remainder", "decimal"],
			});
			assert.equal(result.status, 200);
			assert.equal(result.body.level, level);
			assert.equal(result.body.answerFormat, level === 2 ? "remainder" : "decimal");
			const questions = documents.get(`mathSessions/${result.body.sessionId}`).questions;
			assert.equal(new Set(questions.map(({a, b}) => `${a}:${b}`)).size, 10);
			for (const {a, b, answer, remainder} of questions) {
				assert.ok(Number.isInteger(b) && b >= 2 && b <= 9);
				if (level === 2) {
					assert.ok(Number.isInteger(a) && a >= 10 && a <= 99);
					assert.equal(answer, Math.floor(a / b));
					assert.equal(remainder, a % b);
					assert.ok(remainder > 0);
				} else {
					const dividendHundredths = Math.round(a * 100);
					assert.ok(dividendHundredths >= 101 && dividendHundredths <= 9999);
					assert.notEqual(dividendHundredths % 100, 0);
					assert.equal(Math.round(answer * 100) * b, dividendHundredths);
					assert.equal(Math.round(answer * 100) / 100, answer);
				}
			}
		}
	}
});

test("outdated division pages cannot consume a try on the new levels", async () => {
	const uid = "outdated-division";
	documents.set(`mathProfiles/${uid}`, {
		uid, username: uid, progressionVersion: 2,
		challengeProgress: {division: {level: 1, stars: 4}},
	});
	const result = await request(uid, {action: "startMission", operation: "division"});
	assert.equal(result.status, 409);
	assert.match(result.body.error, /reload/i);
	assert.equal([...documents.keys()].some((path) => path.startsWith(`mathProfiles/${uid}/challengeAttempts/`)), false);
});

test("division scoring validates and checks remainders and decimals, including old sessions", async () => {
	const answerTimes = Array(10).fill(100);
	const complete = (uid, sessionId, answers, extra = {}) =>
		request(uid, {action: "completeMission", sessionId, answers, answerTimes, ...extra});

	addSession("remainder-pilot", "remainder", "division", 2, Date.now());
	const remainderSession = documents.get("mathSessions/remainder");
	remainderSession.answerFormat = "remainder";
	remainderSession.questions = Array.from({length: 10}, () => ({a: 73, b: 8, answer: 9, remainder: 1}));
	assert.equal((await complete("remainder-pilot", "remainder", Array(10).fill(9))).status, 400);
	const remainders = Array(10).fill(1);
	remainders[0] = 2;
	const remainderResult = await complete("remainder-pilot", "remainder", Array(10).fill(9), {remainders});
	assert.equal(remainderResult.body.result.correct, 9);
	assert.equal(remainderResult.body.result.answers[0].correctRemainder, 1);
	assert.equal(remainderResult.body.result.answers[0].submittedRemainder, 2);
	assert.equal(documents.has("mathChallengeRecords/division_2/times/remainder-pilot"), false);

	addSession("perfect-remainder-pilot", "perfect-remainder", "division", 2, Date.now());
	const perfectSession = documents.get("mathSessions/perfect-remainder");
	perfectSession.answerFormat = "remainder";
	perfectSession.questions = remainderSession.questions;
	const perfectResult = await complete("perfect-remainder-pilot", "perfect-remainder", Array(10).fill(9), {
		remainders: Array(10).fill(1),
	});
	assert.equal(perfectResult.body.result.correct, 10);
	assert.equal(documents.has("mathChallengeRecords/division_2/times/perfect-remainder-pilot"), true);

	addSession("decimal-pilot", "decimal", "division", 3, Date.now());
	const decimalSession = documents.get("mathSessions/decimal");
	decimalSession.answerFormat = "decimal";
	decimalSession.questions = Array.from({length: 10}, () => ({a: 8.25, b: 5, answer: 1.65}));
	assert.equal((await complete("decimal-pilot", "decimal", Array(10).fill(1.651))).status, 400);
	const decimalResult = await complete("decimal-pilot", "decimal", Array(10).fill(1.65));
	assert.equal(decimalResult.body.result.correct, 10);
	assert.equal(documents.has("mathChallengeRecords/division_3/times/decimal-pilot"), true);

	addSession("legacy-pilot", "legacy", "division", 2, Date.now());
	const legacyAnswers = Array.from({length: 10}, (_, index) => index + 1);
	assert.equal((await complete("legacy-pilot", "legacy", Array(10).fill(1.5))).status, 400);
	assert.equal((await complete("legacy-pilot", "legacy", legacyAnswers)).body.result.correct, 10);
});
