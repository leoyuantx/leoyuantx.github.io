import {randomInt} from "node:crypto";
import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import {getApps, initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {FieldValue, getFirestore} from "firebase-admin/firestore";

if (getApps().length === 0) {
	initializeApp();
}

const db = getFirestore();
const profiles = db.collection("mathProfiles");
const usernames = db.collection("mathUsernames");
const sessions = db.collection("mathSessions");
const challengeRecords = db.collection("mathChallengeRecords");
const totalQuestions = 10;
const progressionVersion = 2;
const luckyRollIntervalMs = 60 * 1000;
const dailyChallengeAttemptLimit = 2;

const levels = {
	addition: [
		[[1, 9], [1, 9]],
		[[1, 9], [10, 99]],
		[[10, 99], [10, 99]],
		[[100, 999], [10, 99]],
		[[100, 999], [100, 999]],
	],
	subtraction: [
		[[1, 9], [1, 9]],
		[[10, 99], [1, 9]],
		[[10, 99], [10, 99]],
		[[100, 999], [10, 99]],
		[[100, 999], [100, 999]],
	],
	multiplication: [
		[[2, 9], [2, 9]],
		[[10, 99], [2, 9]],
	],
	division: [
		[[10, 99], [2, 9]],
		[[10, 99], [10, 99]],
	],
};

const achievementCatalog = [
	{id: "first_mission", title: "First Mission", description: "Complete your first mission.", coins: 10},
	{id: "perfect_mission", title: "Perfect Mission", description: "Answer all 10 questions correctly.", coins: 20},
	{id: "three_day_streak", title: "Three-Day Streak", description: "Practice on three consecutive days.", coins: 30},
	{id: "ten_missions", title: "Mission Regular", description: "Complete 10 missions.", coins: 40},
	{id: "hundred_correct", title: "Century Club", description: "Answer 100 questions correctly.", coins: 50},
];

const shopCatalog = [
	{id: "comet_trail", name: "Comet Trail", type: "profile_theme", price: 50},
	{id: "lunar_frame", name: "Lunar Frame", type: "avatar_frame", price: 100},
	{id: "nebula_theme", name: "Nebula Theme", type: "profile_theme", price: 200},
	{id: "diamond_trail", name: "Diamond Trail", type: "mouse_trail", price: 150},
];

const operators = {
	addition: "+",
	subtraction: "-",
	multiplication: "*",
	division: "/",
};

function setCorsHeaders(response) {
	response.set("Access-Control-Allow-Origin", "*");
	response.set("Access-Control-Allow-Methods", "POST, OPTIONS");
	response.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
}

function sendError(response, status, message) {
	response.status(status).json({success: false, error: message});
}

function getUtcDate(date = new Date()) {
	return date.toISOString().slice(0, 10);
}

function getPreviousDate(dateString) {
	const date = new Date(`${dateString}T00:00:00.000Z`);
	date.setUTCDate(date.getUTCDate() - 1);
	return getUtcDate(date);
}

function normalizeUsername(value) {
	return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function usernameFromToken(decodedToken) {
	const candidate = decodedToken.name || decodedToken.email?.split("@")[0] || "cadet";
	const normalized = normalizeUsername(candidate).replace(/[^a-z0-9_]/g, "").slice(0, 18);
	return normalized.length >= 3 ? normalized : `cadet_${decodedToken.uid.slice(-6)}`;
}

async function getOrCreateProfile(decodedToken) {
	const profileRef = profiles.doc(decodedToken.uid);
	const existing = await profileRef.get();
	if (existing.exists) {
		let data = existing.data();
		if (data.progressionVersion !== progressionVersion) {
			await db.runTransaction(async (transaction) => {
				const profileSnapshot = await transaction.get(profileRef);
				if (!profileSnapshot.exists) {
					throw new Error("Player profile not found.");
				}

				const current = profileSnapshot.data();
				if (current.progressionVersion === progressionVersion) {
					data = current;
					return;
				}

				const previousXp = current.xp || 0;
				const previousLevel = Math.max(current.level || 1, Math.floor(previousXp / 150) + 1);
				const progressWithinLevel = Math.max(0, Math.min(149, previousXp - (previousLevel - 1) * 150));
				// Keep existing pilots' level and in-level progress when changing the XP curve.
				const xp = getXpForLevel(previousLevel) + progressWithinLevel;
				data = {...current, xp, level: previousLevel, progressionVersion};
				transaction.update(profileRef, {
					xp,
					level: previousLevel,
					progressionVersion,
					updatedAt: FieldValue.serverTimestamp(),
				});
			});
		}
		return {ref: profileRef, data};
	}

	const baseUsername = usernameFromToken(decodedToken);
	const fallbackUsername = `${baseUsername.slice(0, 13)}_${decodedToken.uid.slice(-6)}`;
	let createdProfile;

	await db.runTransaction(async (transaction) => {
		const profileSnapshot = await transaction.get(profileRef);
		if (profileSnapshot.exists) {
			createdProfile = profileSnapshot.data();
			return;
		}

		const baseRef = usernames.doc(baseUsername);
		const baseSnapshot = await transaction.get(baseRef);
		const chosenUsername = baseSnapshot.exists && baseSnapshot.data().uid !== decodedToken.uid
			? fallbackUsername
			: baseUsername;
		const chosenRef = usernames.doc(chosenUsername);
		if (chosenUsername !== baseUsername) {
			const fallbackSnapshot = await transaction.get(chosenRef);
			if (fallbackSnapshot.exists && fallbackSnapshot.data().uid !== decodedToken.uid) {
				throw new Error("Unable to assign a unique username. Choose one in your profile settings.");
			}
		}

		createdProfile = {
			uid: decodedToken.uid,
			username: chosenUsername,
			displayName: decodedToken.name || chosenUsername,
			xp: 0,
			level: 1,
			progressionVersion,
			coins: 0,
			totalSessions: 0,
			totalCorrect: 0,
			currentStreak: 0,
			longestStreak: 0,
			lastStudyDate: null,
			achievementIds: [],
			friendUids: [],
			inventory: {},
			equippedTheme: null,
			equippedAvatarFrame: null,
			equippedMouseTrail: null,
			luckyTitle: false,
			lastLuckyRollAt: 0,
			createdAt: FieldValue.serverTimestamp(),
			updatedAt: FieldValue.serverTimestamp(),
		};
		transaction.set(profileRef, createdProfile);
		transaction.set(chosenRef, {uid: decodedToken.uid});
	});

	return {ref: profileRef, data: createdProfile};
}

function randomBetween(min, max) {
	return randomInt(min, max + 1);
}

function makeQuestion(operation, ranges) {
	let a;
	let b;
	let answer;

	if (operation === "division") {
		while (true) {
			b = randomBetween(ranges[1][0], ranges[1][1]);
			const minQuotient = Math.max(1, Math.ceil(ranges[0][0] / b));
			const maxQuotient = Math.floor(ranges[0][1] / b);
			if (minQuotient > maxQuotient) continue;
			answer = randomBetween(minQuotient, maxQuotient);
			a = b * answer;
			if (a !== b) break;
		}
	} else {
		a = randomBetween(ranges[0][0], ranges[0][1]);
		b = randomBetween(ranges[1][0], ranges[1][1]);
		if (operation === "addition") answer = a + b;
		if (operation === "subtraction") {
			if (b > a) [a, b] = [b, a];
			answer = a - b;
		}
		if (operation === "multiplication") answer = a * b;
	}

	return {a, b, answer};
}

function getQuestionKey(operation, question) {
	const operands = operation === "addition" || operation === "multiplication"
		? [question.a, question.b].sort((a, b) => a - b)
		: [question.a, question.b];
	return operands.join(":");
}

function makeMissionQuestions(operation, ranges, previousKeys = []) {
	const usedKeys = new Set(previousKeys);
	const questions = [];
	while (questions.length < totalQuestions) {
		const question = makeQuestion(operation, ranges);
		const key = getQuestionKey(operation, question);
		if (usedKeys.has(key)) continue;
		usedKeys.add(key);
		questions.push(question);
	}
	return questions;
}

function getNextChallengeLevel(challenge, maxLevel) {
	let level = challenge?.level || 1;
	if (challenge?.stars >= 4) level += 1;
	if (challenge?.stars <= 2 && challenge?.stars !== undefined) level -= 1;
	return Math.max(1, Math.min(maxLevel, level));
}

async function getChallengeAvailability(decodedToken, body, response) {
	const operation = body.operation;
	if (!Object.hasOwn(levels, operation)) {
		sendError(response, 400, "Choose a valid subject.");
		return;
	}

	const {ref: profileRef, data: profile} = await getOrCreateProfile(decodedToken);
	const level = getNextChallengeLevel(profile.challengeProgress?.[operation], levels[operation].length);
	const today = getUtcDate();
	const attemptRef = profileRef.collection("challengeAttempts").doc(`${today}_${operation}_${level}`);
	const attemptSnapshot = await attemptRef.get();
	const attemptsUsed = attemptSnapshot.exists ? attemptSnapshot.data().count || 0 : 0;
	const attemptsRemaining = Math.max(0, dailyChallengeAttemptLimit - attemptsUsed);

	response.status(200).json({
		success: true,
		operation,
		level,
		attemptsRemaining,
		available: attemptsRemaining > 0,
	});
}

async function getChallengeLeaderboard(body, response) {
	const {operation, level} = body;
	if (!Object.hasOwn(levels, operation) || !Number.isInteger(level) ||
			level < 1 || level > levels[operation].length) {
		sendError(response, 400, "Choose a valid subject and challenge level.");
		return;
	}

	const records = await challengeRecords.doc(`${operation}_${level}`).collection("times")
		.orderBy("elapsedMs").limit(5).get();
	const profileSnapshots = records.empty ? [] : await db.getAll(
		...records.docs.map((record) => profiles.doc(record.id)),
	);
	const entries = records.docs.map((record, index) => ({
		username: profileSnapshots[index].exists ? profileSnapshots[index].data().username : record.data().username,
		elapsedMs: record.data().elapsedMs,
	}));
	response.status(200).json({success: true, operation, level, entries});
}

function chooseVariableReward() {
	const roll = randomInt(100);
	if (roll < 70) return {type: "coins", amount: 0, label: "Steady flight"};
	if (roll < 95) return {type: "coins", amount: 5, label: "Bonus cache"};
	if (roll < 99) return {type: "coins", amount: 15, label: "Supernova cache"};
	return {type: "coins", amount: 50, label: "Cosmic jackpot"};
}

function getNewAchievements(profile, correct, newStreak) {
	const earned = new Set(profile.achievementIds || []);
	const sessionsCompleted = (profile.totalSessions || 0) + 1;
	const totalCorrect = (profile.totalCorrect || 0) + correct;
	const conditions = {
		first_mission: sessionsCompleted >= 1,
		perfect_mission: correct === totalQuestions,
		three_day_streak: newStreak >= 3,
		ten_missions: sessionsCompleted >= 10,
		hundred_correct: totalCorrect >= 100,
	};
	return achievementCatalog.filter((achievement) =>
		conditions[achievement.id] && !earned.has(achievement.id)
	);
}

function getLevel(xp) {
	return Math.floor((Math.sqrt(1 + (8 * xp) / 150) - 1) / 2) + 1;
}

function getXpForLevel(level) {
	return (150 * level * (level - 1)) / 2;
}

function getPublicProfile(profile) {
	return {
		uid: profile.uid,
		username: profile.username,
		displayName: profile.displayName,
		xp: profile.xp,
		level: profile.level,
		coins: profile.coins,
		totalSessions: profile.totalSessions,
		totalCorrect: profile.totalCorrect,
		currentStreak: profile.currentStreak,
		longestStreak: profile.longestStreak,
		lastStudyDate: profile.lastStudyDate,
		achievementIds: profile.achievementIds,
		friendUids: profile.friendUids,
		inventory: profile.inventory,
		equippedTheme: profile.equippedTheme || null,
		equippedAvatarFrame: profile.equippedAvatarFrame || null,
		equippedMouseTrail: profile.equippedMouseTrail || null,
		luckyTitle: profile.luckyTitle || false,
		challengeProgress: Object.fromEntries(
			Object.entries(profile.challengeProgress || {})
				.filter(([operation]) => Object.hasOwn(levels, operation))
				.map(([operation, challenge]) => [operation, {
					level: challenge.level,
					stars: challenge.stars,
				}]),
		),
	};
}

async function requireIdentity(request, response) {
	const authorization = request.get("Authorization") || "";
	const match = authorization.match(/^Bearer\s+(.+)$/i);
	if (!match) {
		sendError(response, 401, "Sign in and provide a Firebase ID token.");
		return null;
	}

	try {
		return await getAuth().verifyIdToken(match[1]);
	} catch {
		sendError(response, 401, "Your sign-in has expired. Please sign in again.");
		return null;
	}
}

async function startMission(decodedToken, body, response) {
	const operation = body.operation;
	if (!Object.hasOwn(levels, operation)) {
		sendError(response, 400, "Choose a valid subject.");
		return;
	}

	const {ref: profileRef} = await getOrCreateProfile(decodedToken);
	const sessionRef = sessions.doc();
	const today = getUtcDate();
	let attemptsRemaining;
	let level;
	let questions;

	await db.runTransaction(async (transaction) => {
		const profileSnapshot = await transaction.get(profileRef);
		if (!profileSnapshot.exists) {
			throw Object.assign(new Error("Player profile not found."), {status: 404});
		}
		const profile = profileSnapshot.data();
		const challenge = profile.challengeProgress?.[operation];
		level = getNextChallengeLevel(challenge, levels[operation].length);
		const attemptRef = profileRef.collection("challengeAttempts").doc(`${today}_${operation}_${level}`);
		const attemptSnapshot = await transaction.get(attemptRef);

		const attemptsUsed = attemptSnapshot.exists ? attemptSnapshot.data().count || 0 : 0;
		if (attemptsUsed >= dailyChallengeAttemptLimit) {
			throw Object.assign(
				new Error("You have used both tries for this challenge today. Try again after midnight UTC."),
				{status: 429},
			);
		}

		questions = makeMissionQuestions(
			operation,
			levels[operation][level - 1],
			challenge?.lastQuestionKeys || [],
		);
		attemptsRemaining = dailyChallengeAttemptLimit - attemptsUsed - 1;
		const startedAtMs = Date.now();
		transaction.set(attemptRef, {
			date: today,
			operation,
			level,
			count: attemptsUsed + 1,
			updatedAt: FieldValue.serverTimestamp(),
		});
		transaction.update(profileRef, {
			[`challengeProgress.${operation}`]: {
				...(challenge || {}),
				lastStartedAtMs: startedAtMs,
				lastQuestionKeys: questions.map((question) => getQuestionKey(operation, question)),
			},
			updatedAt: FieldValue.serverTimestamp(),
		});
		transaction.create(sessionRef, {
			uid: decodedToken.uid,
			operation,
			level,
			questions,
			status: "active",
			startedAtMs,
			createdAt: FieldValue.serverTimestamp(),
		});
	});

	response.status(200).json({
		success: true,
		sessionId: sessionRef.id,
		operation,
		level,
		attemptsRemaining,
		questions: questions.map(({a, b}, index) => ({
			number: index + 1,
			a,
			b,
			symbol: operators[operation],
		})),
	});
}

async function completeMission(decodedToken, body, response) {
	const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
	const answers = body.answers;
	const answerTimes = body.answerTimes;
	if (!sessionId || sessionId.includes("/") || !Array.isArray(answers) || answers.length !== totalQuestions ||
			answers.some((answer) => !Number.isSafeInteger(answer) || answer < 0) ||
			!Array.isArray(answerTimes) || answerTimes.length !== totalQuestions ||
			answerTimes.some((time) => !Number.isFinite(time) || time < 0 || time > 6 * 60 * 60 * 1000)) {
		sendError(response, 400, "Provide a session ID, 10 non-negative integer answers, and 10 valid answer times.");
		return;
	}

	await getOrCreateProfile(decodedToken);
	const sessionRef = sessions.doc(sessionId);
	const profileRef = profiles.doc(decodedToken.uid);
	const variableRewardRoll = chooseVariableReward();
	const completedAtMs = Date.now();
	let missionResult;

	await db.runTransaction(async (transaction) => {
		const sessionSnapshot = await transaction.get(sessionRef);
		if (!sessionSnapshot.exists || sessionSnapshot.data().uid !== decodedToken.uid) {
			throw Object.assign(new Error("Mission not found."), {status: 404});
		}
		const session = sessionSnapshot.data();
		if (session.status === "completed") {
			missionResult = session.result;
			return;
		}
		const elapsedMs = completedAtMs - session.startedAtMs;
		if (!Number.isSafeInteger(elapsedMs) || elapsedMs < 0) {
			throw new Error("Mission start time is invalid or in the future.");
		}
		if (elapsedMs > 6 * 60 * 60 * 1000) {
			throw Object.assign(new Error("This mission has expired. Start a new mission."), {status: 410});
		}

		const profileSnapshot = await transaction.get(profileRef);
		if (!profileSnapshot.exists) {
			throw Object.assign(new Error("Player profile not found."), {status: 404});
		}
		const profile = profileSnapshot.data();
		const correct = session.questions.reduce((count, question, index) =>
			count + (answers[index] === question.answer ? 1 : 0), 0
		);
		const recordRef = challengeRecords.doc(`${session.operation}_${session.level}`)
			.collection("times").doc(decodedToken.uid);
		const recordSnapshot = correct === totalQuestions ? await transaction.get(recordRef) : null;
		const averageAnswerTime = answerTimes.reduce((total, time) => total + time, 0) / totalQuestions;
		const accuracyPoints = (correct / totalQuestions) * 80;
		const speedPoints = Math.max(0, 1 - averageAnswerTime / 60000) * 20;
		const missionRating = accuracyPoints + speedPoints;
		const stars = missionRating >= 90 ? 5
			: missionRating >= 75 ? 4
				: missionRating >= 60 ? 3
					: missionRating >= 45 ? 2
						: missionRating >= 30 ? 1
							: 0;
		const today = getUtcDate();
		const lastStudyDate = profile.lastStudyDate;
		const currentStreak = lastStudyDate === today
			? profile.currentStreak || 1
			: lastStudyDate === getPreviousDate(today)
				? (profile.currentStreak || 0) + 1
				: 1;
		const totalSessions = (profile.totalSessions || 0) + 1;
		const newAchievements = getNewAchievements(profile, correct, currentStreak);
		const rewardMultiplier = session.level;
		const variableReward = {
			...variableRewardRoll,
			amount: variableRewardRoll.amount * rewardMultiplier,
		};
		const xpEarned = (correct * 10 + (correct === totalQuestions ? 25 : 0)) * rewardMultiplier;
		const achievementCoins = newAchievements.reduce((total, achievement) => total + achievement.coins, 0);
		const baseCoins = (5 + correct * 2) * rewardMultiplier;
		const coinsEarned = baseCoins + achievementCoins + variableReward.amount;
		const xp = (profile.xp || 0) + xpEarned;
		const previousChallenge = profile.challengeProgress?.[session.operation] || {};
		const isLatestCompletedChallenge = session.startedAtMs >= (previousChallenge.lastCompletedAtMs || 0);
		const isLatestStartedChallenge = session.startedAtMs >= (previousChallenge.lastStartedAtMs || 0);
		const challengeProgress = {
			...previousChallenge,
			...(isLatestCompletedChallenge ? {
				level: session.level,
				stars,
				lastCompletedAtMs: session.startedAtMs,
			} : {}),
			...(isLatestStartedChallenge ? {
				lastQuestionKeys: session.questions.map((question) => getQuestionKey(session.operation, question)),
			} : {}),
		};

		missionResult = {
			operation: session.operation,
			missionLevel: session.level,
			rewardMultiplier,
			correct,
			totalQuestions,
			elapsedMs,
			stars,
			xpEarned,
			coinsEarned,
			baseCoins,
			achievementCoins,
			variableReward,
			newAchievements,
			currentStreak,
			playerLevel: getLevel(xp),
			xp,
			answers: session.questions.map((question, index) => ({
				number: index + 1,
				a: question.a,
				b: question.b,
				correctAnswer: question.answer,
				submittedAnswer: answers[index],
				correct: answers[index] === question.answer,
			})),
		};

		const earnedIds = new Set(profile.achievementIds || []);
		newAchievements.forEach((achievement) => earnedIds.add(achievement.id));
		if (recordSnapshot && (!recordSnapshot.exists || elapsedMs < recordSnapshot.data().elapsedMs)) {
			transaction.set(recordRef, {
				username: profile.username,
				elapsedMs,
				updatedAt: FieldValue.serverTimestamp(),
			});
		}
		transaction.update(profileRef, {
			xp,
			level: getLevel(xp),
			[`challengeProgress.${session.operation}`]: challengeProgress,
			coins: (profile.coins || 0) + coinsEarned,
			totalSessions,
			totalCorrect: (profile.totalCorrect || 0) + correct,
			currentStreak,
			longestStreak: Math.max(profile.longestStreak || 0, currentStreak),
			lastStudyDate: today,
			achievementIds: [...earnedIds],
			updatedAt: FieldValue.serverTimestamp(),
		});
		transaction.update(sessionRef, {
			status: "completed",
			completedAt: FieldValue.serverTimestamp(),
			result: missionResult,
		});
	});

	response.status(200).json({success: true, result: missionResult});
}

async function rollLuckyTitle(decodedToken, response) {
	const {ref: profileRef} = await getOrCreateProfile(decodedToken);
	const now = Date.now();
	const luckyRoll = randomInt(100) === 0;
	let result;

	await db.runTransaction(async (transaction) => {
		const profileSnapshot = await transaction.get(profileRef);
		if (!profileSnapshot.exists) {
			throw Object.assign(new Error("Player profile not found."), {status: 404});
		}

		const profile = profileSnapshot.data();
		if (profile.luckyTitle) {
			result = {rolled: false, luckyTitle: true};
			return;
		}

		const lastRollAt = profile.lastLuckyRollAt || 0;
		if (now - lastRollAt < luckyRollIntervalMs) {
			result = {rolled: false, luckyTitle: false};
			return;
		}

		transaction.update(profileRef, {
			lastLuckyRollAt: now,
			...(luckyRoll ? {luckyTitle: true} : {}),
			updatedAt: FieldValue.serverTimestamp(),
		});
		result = {rolled: true, luckyTitle: luckyRoll};
	});

	response.status(200).json({success: true, ...result});
}

async function updateUsername(decodedToken, body, response) {
	const username = normalizeUsername(body.username);
	if (!/^[a-z0-9_]{3,20}$/.test(username)) {
		sendError(response, 400, "Username must be 3 to 20 letters, numbers, or underscores.");
		return;
	}

	const profileRef = profiles.doc(decodedToken.uid);
	const newUsernameRef = usernames.doc(username);
	await db.runTransaction(async (transaction) => {
		const [profileSnapshot, usernameSnapshot] = await Promise.all([
			transaction.get(profileRef),
			transaction.get(newUsernameRef),
		]);
		if (!profileSnapshot.exists) {
			throw Object.assign(new Error("Player profile not found."), {status: 404});
		}
		if (usernameSnapshot.exists && usernameSnapshot.data().uid !== decodedToken.uid) {
			throw Object.assign(new Error("That username is already taken."), {status: 409});
		}

		const previousUsernameRef = usernames.doc(profileSnapshot.data().username);
		if (profileSnapshot.data().username !== username) {
			transaction.delete(previousUsernameRef);
			transaction.set(newUsernameRef, {uid: decodedToken.uid});
			transaction.update(profileRef, {username, displayName: username, updatedAt: FieldValue.serverTimestamp()});
		}
	});

	response.status(200).json({success: true, username});
}

async function addFriend(decodedToken, body, response) {
	const username = normalizeUsername(body.username);
	if (!/^[a-z0-9_]{3,20}$/.test(username)) {
		sendError(response, 400, "Provide a valid username.");
		return;
	}

	const usernameSnapshot = await usernames.doc(username).get();
	if (!usernameSnapshot.exists) {
		sendError(response, 404, "Player not found.");
		return;
	}
	const friendUid = usernameSnapshot.data().uid;
	if (friendUid === decodedToken.uid) {
		sendError(response, 400, "You cannot add yourself as a friend.");
		return;
	}

	const ownRef = profiles.doc(decodedToken.uid);
	const friendRef = profiles.doc(friendUid);
	await db.runTransaction(async (transaction) => {
		const [ownSnapshot, friendSnapshot] = await Promise.all([
			transaction.get(ownRef),
			transaction.get(friendRef),
		]);
		if (!ownSnapshot.exists || !friendSnapshot.exists) {
			throw Object.assign(new Error("Player profile not found."), {status: 404});
		}

		const ownFriends = new Set(ownSnapshot.data().friendUids || []);
		const friendFriends = new Set(friendSnapshot.data().friendUids || []);
		if (ownFriends.has(friendUid)) return;
		if (ownFriends.size >= 50 || friendFriends.size >= 50) {
			throw Object.assign(new Error("Friend list limit reached."), {status: 409});
		}
		ownFriends.add(friendUid);
		friendFriends.add(decodedToken.uid);
		transaction.update(ownRef, {friendUids: [...ownFriends]});
		transaction.update(friendRef, {friendUids: [...friendFriends]});
	});

	response.status(200).json({success: true, username});
}

async function getLeaderboard(decodedToken, body, response) {
	const scope = body.scope === "friends" ? "friends" : "global";
	const entries = [];
	if (scope === "global") {
		const snapshot = await profiles.orderBy("xp", "desc").limit(25).get();
		snapshot.forEach((document) => entries.push(document.data()));
	} else {
		const ownSnapshot = await profiles.doc(decodedToken.uid).get();
		const friendUids = [...new Set([decodedToken.uid, ...(ownSnapshot.data()?.friendUids || [])])].slice(0, 51);
		const snapshots = await db.getAll(...friendUids.map((uid) => profiles.doc(uid)));
		snapshots.forEach((snapshot) => {
			if (snapshot.exists) entries.push(snapshot.data());
		});
		entries.sort((a, b) => b.xp - a.xp);
	}

	response.status(200).json({
		success: true,
		scope,
		entries: entries.map((profile, index) => ({
			rank: index + 1,
			username: profile.username,
			level: profile.level,
			xp: profile.xp,
			currentStreak: profile.currentStreak,
			totalSessions: profile.totalSessions,
		})),
	});
}

async function purchaseItem(decodedToken, body, response) {
	const item = shopCatalog.find((entry) => entry.id === body.itemId);
	if (!item) {
		sendError(response, 404, "Shop item not found.");
		return;
	}

	const profileRef = profiles.doc(decodedToken.uid);
	let remainingCoins;
	await db.runTransaction(async (transaction) => {
		const profileSnapshot = await transaction.get(profileRef);
		if (!profileSnapshot.exists) {
			throw Object.assign(new Error("Player profile not found."), {status: 404});
		}
		const profile = profileSnapshot.data();
		if (profile.inventory?.[item.id]) {
			throw Object.assign(new Error("You already own this item."), {status: 409});
		}
		if ((profile.coins || 0) < item.price) {
			throw Object.assign(new Error("Not enough coins."), {status: 400});
		}
		remainingCoins = profile.coins - item.price;
		transaction.update(profileRef, {
			coins: remainingCoins,
			[`inventory.${item.id}`]: true,
			updatedAt: FieldValue.serverTimestamp(),
		});
	});

	response.status(200).json({success: true, item, remainingCoins});
}

async function equipItem(decodedToken, body, response) {
	const item = shopCatalog.find((entry) => entry.id === body.itemId);
	if (!item) {
		sendError(response, 404, "Shop item not found.");
		return;
	}

	const equippedField = {
		profile_theme: "equippedTheme",
		avatar_frame: "equippedAvatarFrame",
		mouse_trail: "equippedMouseTrail",
	}[item.type];
	const profileRef = profiles.doc(decodedToken.uid);
	await db.runTransaction(async (transaction) => {
		const profileSnapshot = await transaction.get(profileRef);
		if (!profileSnapshot.exists) {
			throw Object.assign(new Error("Player profile not found."), {status: 404});
		}
		if (!profileSnapshot.data().inventory?.[item.id]) {
			throw Object.assign(new Error("Purchase this item before equipping it."), {status: 403});
		}
		transaction.update(profileRef, {
			[equippedField]: item.id,
			updatedAt: FieldValue.serverTimestamp(),
		});
	});

	response.status(200).json({success: true, equipped: item.id, type: item.type});
}

export const mathPracticeApi = onRequest(async (request, response) => {
	setCorsHeaders(response);
	if (request.method === "OPTIONS") {
		response.status(204).send("");
		return;
	}
	if (request.method !== "POST") {
		sendError(response, 405, "Use POST for Math Practice API actions.");
		return;
	}

	const decodedToken = await requireIdentity(request, response);
	if (!decodedToken) return;

	try {
		const body = request.body || {};
		const action = body.action;
		if (action === "profile") {
			const {data} = await getOrCreateProfile(decodedToken);
			response.status(200).json({
				success: true,
				profile: getPublicProfile(data),
				progression: {
					level: data.level,
					xp: data.xp,
					xpForNextLevel: getXpForLevel(data.level + 1),
					xpToNextLevel: getXpForLevel(data.level + 1) - data.xp,
				},
				achievements: achievementCatalog.map((achievement) => ({
					...achievement,
					unlocked: (data.achievementIds || []).includes(achievement.id),
				})),
				shop: shopCatalog,
			});
			return;
		}
		if (action === "progression" || action === "achievements") {
			const {data} = await getOrCreateProfile(decodedToken);
			response.status(200).json({
				success: true,
				progression: action === "progression" ? {
					level: data.level,
					xp: data.xp,
					xpForNextLevel: getXpForLevel(data.level + 1),
					xpToNextLevel: getXpForLevel(data.level + 1) - data.xp,
					currentStreak: data.currentStreak,
					longestStreak: data.longestStreak,
				} : undefined,
				achievements: action === "achievements" ? achievementCatalog.map((achievement) => ({
					...achievement,
					unlocked: (data.achievementIds || []).includes(achievement.id),
				})) : undefined,
			});
			return;
		}
		if (action === "shop") {
			const {data} = await getOrCreateProfile(decodedToken);
			response.status(200).json({success: true, coins: data.coins, items: shopCatalog});
			return;
		}
		if (action === "setUsername") {
			await updateUsername(decodedToken, body, response);
			return;
		}
		if (action === "startMission") {
			await startMission(decodedToken, body, response);
			return;
		}
		if (action === "challengeAvailability") {
			await getChallengeAvailability(decodedToken, body, response);
			return;
		}
		if (action === "challengeLeaderboard") {
			await getChallengeLeaderboard(body, response);
			return;
		}
		if (action === "completeMission") {
			await completeMission(decodedToken, body, response);
			return;
		}
		if (action === "rollLuckyTitle") {
			await rollLuckyTitle(decodedToken, response);
			return;
		}
		if (action === "leaderboard") {
			await getLeaderboard(decodedToken, body, response);
			return;
		}
		if (action === "addFriend") {
			await addFriend(decodedToken, body, response);
			return;
		}
		if (action === "purchaseItem") {
			await purchaseItem(decodedToken, body, response);
			return;
		}
		if (action === "equipItem") {
			await equipItem(decodedToken, body, response);
			return;
		}
		sendError(response, 400, "Unknown Math Practice API action.");
	} catch (error) {
		const status = Number.isInteger(error.status) ? error.status : 500;
		if (status === 500) {
			logger.error("Math Practice API request failed", error);
			sendError(response, 500, "The Math Practice request could not be completed.");
			return;
		}
		sendError(response, status, error.message);
	}
});