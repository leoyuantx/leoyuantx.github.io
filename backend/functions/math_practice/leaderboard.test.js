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
