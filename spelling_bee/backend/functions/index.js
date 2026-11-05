/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// POST endpoint - Fetch word counters for an authenticated user
exports.getWordCounters = onRequest(async (request, response) => {
  try {
    // Enable CORS
    response.set("Access-Control-Allow-Origin", "*");
    response.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.set("Access-Control-Allow-Headers", "Content-Type");

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }
    if (request.method !== "POST") {
      response.status(405).json({success: false, error: "Method not allowed"});
      return;
    }

    const {username, password} = request.body || {};
    if (typeof username !== "string" || !username.trim() ||
        typeof password !== "string" || !password) {
      response.status(400).json({success: false, error: "Username and password are required"});
      return;
    }

    const userSnapshot = await db.collection("users")
        .where("name", "==", username.trim())
        .limit(1)
        .get();
    const userDocument = userSnapshot.docs[0];
    if (!userDocument || userDocument.data().password !== password) {
      response.status(401).json({success: false, error: "Invalid username or password"});
      return;
    }

    const snapshot = await userDocument.ref.collection("words").get();
    const counters = {};
    snapshot.forEach(doc => {
      counters[doc.id] = doc.data().count || 0;
    });

    logger.info("Fetched user word counters", {
      user: username.trim(),
      count: Object.keys(counters).length
    });
    response.status(200).json({success: true, data: counters});
  } catch (error) {
    logger.error("Error fetching word counters:", error);
    response.status(500).json({success: false, error: error.message});
  }
});

// POST endpoint - Update counter for a single word
exports.updateWordCounter = onRequest(async (request, response) => {
  try {
    // Enable CORS
    response.set("Access-Control-Allow-Origin", "*");
    response.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.set("Access-Control-Allow-Headers", "Content-Type");

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    if (request.method !== "POST") {
      response.status(405).json({success: false, error: "Method not allowed"});
      return;
    }

    const {username, password, word, count} = request.body || {};

    // Validate input
    if (typeof username !== "string" || !username.trim() ||
        typeof password !== "string" || !password ||
        typeof word !== "string" || !word.trim() || word.includes("/") ||
        Buffer.byteLength(word, "utf8") > 1500 ||
        !Number.isInteger(count) || count < 0) {
      return response.status(400).json({
        success: false,
        error: "Provide valid username, password, word, and non-negative integer count"
      });
    }

    const userSnapshot = await db.collection("users")
        .where("name", "==", username.trim())
        .limit(1)
        .get();
    const userDocument = userSnapshot.docs[0];
    if (!userDocument || userDocument.data().password !== password) {
      response.status(401).json({success: false, error: "Invalid username or password"});
      return;
    }

    await userDocument.ref.collection("words").doc(word).set({
      count,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, {merge: true});

    logger.info("Updated user word counter", {user: username.trim(), word, count});
    response.status(200).json({
      success: true,
      message: `Counter for '${word}' updated to ${count}`
    });
  } catch (error) {
    logger.error("Error updating word counter:", error);
    response.status(500).json({success: false, error: error.message});
  }
});

// POST endpoint - Verify a user's credentials
exports.logIn = onRequest(async (request, response) => {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({success: false, error: "Method not allowed"});
    return;
  }

  try {
    const {username, password} = request.body || {};
    if (typeof username !== "string" || !username.trim() ||
        typeof password !== "string" || !password) {
      response.status(400).json({
        success: false,
        error: "Username and password are required"
      });
      return;
    }

    const snapshot = await db.collection("users")
        .where("name", "==", username.trim())
        .limit(1)
        .get();
    const userDocument = snapshot.docs[0];
    const user = userDocument?.data();

    if (!userDocument || user.password !== password) {
      response.status(401).json({
        success: false,
        error: "Invalid username or password"
      });
      return;
    }

    const wordsSnapshot = await userDocument.ref.collection("words").get();
    const words = wordsSnapshot.docs
        .map(document => ({...document.data(), word: document.id}))
        .sort((a, b) => {
          const orderA = Number.isInteger(a.order) ? a.order : Number.MAX_SAFE_INTEGER;
          const orderB = Number.isInteger(b.order) ? b.order : Number.MAX_SAFE_INTEGER;
          const orderDifference = orderA - orderB;
          return orderDifference || a.word.localeCompare(b.word);
        });

    response.status(200).json({
      success: true,
      username: username.trim(),
      words
    });
  } catch (error) {
    logger.error("Error verifying user credentials:", error);
    response.status(500).json({
      success: false,
      error: "Unable to verify credentials"
    });
  }
});

// POST endpoint - Seed word counters for an authenticated user
exports.seedUserWords = onRequest(async (request, response) => {
  if (request.method !== "POST") {
    response.status(405).json({success: false, error: "Method not allowed"});
    return;
  }

  try {
    const {username, password, words} = request.body || {};
    if (typeof username !== "string" || !username.trim() ||
        typeof password !== "string" || !password ||
        !Array.isArray(words) || words.length === 0 || words.length > 500 ||
        words.some(word => typeof word !== "string" || !word.trim() ||
          word.includes("/") || Buffer.byteLength(word, "utf8") > 1500) ||
        new Set(words).size !== words.length) {
      response.status(400).json({
        success: false,
        error: "Provide a username, password, and 1 to 500 unique, valid words"
      });
      return;
    }

    const userSnapshot = await db.collection("users")
        .where("name", "==", username.trim())
        .limit(1)
        .get();
    const userDocument = userSnapshot.docs[0];
    if (!userDocument || userDocument.data().password !== password) {
      response.status(401).json({success: false, error: "Invalid username or password"});
      return;
    }

    const wordsCollection = userDocument.ref.collection("words");
    const existingWords = await wordsCollection.get();
    const existingCounts = new Map(
        existingWords.docs.map(document => [document.id, document.data().count]),
    );
    const batch = db.batch();
    words.forEach((word, index) => {
      const currentCount = existingCounts.get(word);
      batch.set(wordsCollection.doc(word), {
        count: Number.isInteger(currentCount) && currentCount >= 0 ? currentCount : 3,
        order: index + 1,
      }, {merge: true});
    });
    await batch.commit();

    logger.info("Seeded ordered word counters", {user: username.trim(), count: words.length});
    response.status(200).json({
      success: true,
      user: username.trim(),
      count: words.length
    });
  } catch (error) {
    logger.error("Error seeding word counters:", error);
    response.status(500).json({
      success: false,
      error: "Unable to seed word counters"
    });
  }
});
