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

// GET endpoint - Fetch all word counters
exports.getWordCounters = onRequest(async (request, response) => {
  try {
    // Enable CORS
    response.set("Access-Control-Allow-Origin", "*");
    response.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.set("Access-Control-Allow-Headers", "Content-Type");

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    // Fetch all documents from the 'wordCounters' collection
    const snapshot = await db.collection("wordCounters").get();
    
    const counters = {};
    snapshot.forEach(doc => {
      counters[doc.id] = doc.data().count || 0;
    });

    logger.info("Fetched word counters", {count: Object.keys(counters).length});
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

    const {word, count} = request.body;

    // Validate input
    if (!word || count === undefined) {
      return response.status(400).json({
        success: false,
        error: "Missing required fields: 'word' and 'count'"
      });
    }

    // Update or create the document in Firestore
    await db.collection("wordCounters").doc(word).set({
      count: parseInt(count),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, {merge: true});

    logger.info("Updated word counter", {word, count});
    response.status(200).json({
      success: true,
      message: `Counter for '${word}' updated to ${count}`
    });
  } catch (error) {
    logger.error("Error updating word counter:", error);
    response.status(500).json({success: false, error: error.message});
  }
});
