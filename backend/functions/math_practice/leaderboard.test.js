import {test, mock} from "node:test";
import assert from "node:assert/strict";
import {initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";

process.env.GCLOUD_PROJECT = "math-practice-test";
initializeApp();
const db = getFirestore();
const documents = new Map();

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
		doc: (id) => document(`${path}/${id}`),
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
		action: "challengeLeaderboard", operation: "division", level: 3,
	})).status, 400);
});
