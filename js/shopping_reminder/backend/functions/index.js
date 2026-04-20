/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

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

function setCorsHeaders(response) {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type");
}

function addDays(baseDate, days) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + days);
  return date;
}

function toIsoDateString(date) {
  return date.toISOString().slice(0, 10);
}

function getDaysUntilIsoDate(dateString) {
  if (typeof dateString !== "string") {
    return null;
  }

  const parts = dateString.split("-");
  if (parts.length !== 3) {
    return null;
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const targetUtc = Date.UTC(year, month - 1, day);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.round((targetUtc - todayUtc) / millisecondsPerDay);
}

function buildItemWithDates(name, refill, consume) {
  const today = new Date();
  return {
    name,
    refillDate: toIsoDateString(addDays(today, refill)),
    consumeDate: toIsoDateString(addDays(today, consume)),
  };
}

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

export const initShoppingList = onRequest((request, response) => {
  setCorsHeaders(response);
  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  logger.info("Seeding shoppingList collection", {structuredData: true});

  const items = [
    {name: "Banana", refill: 7, consume: 5},
    {name: "Strawberry", refill: 3, consume: 3},
    {name: "Milk", refill: 14, consume: 5},
    {name: "Cat Food", refill: 28, consume: -1},
    {name: "Water", refill: 7, consume: -1},
    {name: "Eggs", refill: 14, consume: 14},
    {name: "Bread", refill: 7, consume: 5},
    {name: "Butter", refill: 28, consume: 30},
    {name: "Cheese", refill: 14, consume: 14},
    {name: "Yogurt", refill: 7, consume: 8},
    {name: "Apples", refill: 14, consume: 8},
    {name: "Oranges", refill: 14, consume: 14},
    {name: "Tomatoes", refill: 7, consume: 5},
    {name: "Potatoes", refill: 21, consume: 30},
    {name: "Onions", refill: 21, consume: 30},
    {name: "Garlic", refill: 28, consume: 30},
    {name: "Lettuce", refill: 7, consume: 5},
    {name: "Spinach", refill: 7, consume: 3},
    {name: "Carrots", refill: 14, consume: 14},
    {name: "Chicken", refill: 7, consume: 3},
    {name: "Beef", refill: 7, consume: 3},
    {name: "Fish", refill: 7, consume: 3},
    {name: "Rice", refill: 90, consume: -1},
    {name: "Pasta", refill: 90, consume: -1},
    {name: "Cereal", refill: 28, consume: 30},
    {name: "Coffee", refill: 28, consume: -1},
    {name: "Tea", refill: 90, consume: -1},
    {name: "Juice", refill: 14, consume: 8},
    {name: "Cooking oil", refill: 90, consume: -1},
    {name: "Sugar", refill: 180, consume: -1},
    {name: "Salt", refill: 180, consume: -1},
    {name: "Pepper", refill: 90, consume: -1},
    {name: "Toilet paper", refill: 28, consume: -1},
    {name: "Paper towels", refill: 28, consume: -1},
    {name: "Dish soap", refill: 28, consume: -1},
    {name: "Laundry detergent", refill: 28, consume: -1},
  ];

  const itemsWithDates = items.map((item) =>
    buildItemWithDates(item.name, item.refill, item.consume)
  );

  const writes = itemsWithDates.map((item) =>
    db.collection("shoppingList").doc(item.name.toLowerCase().replace(/\s+/g, "-")).set(item)
  );

  Promise.all(writes)
    .then(() => {
      response.status(200).json({
        message: "Items saved to shoppingList",
        count: items.length,
      });
    })
    .catch((error) => {
      logger.error("Failed to save shopping list", error);
      response.status(500).json({
        message: "Failed to save items",
        error: error.message,
      });
    });
});

export const fetchShoppingList = onRequest((request, response) => {
  setCorsHeaders(response);
  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  db.collection("shoppingList")
    .get()
    .then((snapshot) => {
      const items = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          refill: getDaysUntilIsoDate(data.refillDate),
          consume: getDaysUntilIsoDate(data.consumeDate),
        };
      });

      response.status(200).json({
        count: items.length,
        items,
      });
    })
    .catch((error) => {
      logger.error("Failed to fetch shopping list", error);
      response.status(500).json({
        message: "Failed to fetch shopping list",
        error: error.message,
      });
    });
});

function addShoppingItemHandler(request, response) {
  setCorsHeaders(response);
  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({
      message: "Method not allowed. Use POST.",
    });
    return;
  }

  const name = typeof request.body?.name === "string" ? request.body.name.trim() : "";
  const refill = Number(request.body?.refill);
  const consume = Number(request.body?.consume);

  if (!name || !Number.isFinite(refill) || !Number.isFinite(consume)) {
    response.status(400).json({
      message: "Invalid payload. Required fields: name (string), refill (number), consume (number).",
    });
    return;
  }

  const id = name.toLowerCase().replace(/\s+/g, "-");
  const item = buildItemWithDates(name, refill, consume);

  db.collection("shoppingList")
    .doc(id)
    .set(item)
    .then(() => {
      response.status(200).json({
        message: "Item saved",
        item: {
          id,
          ...item,
        },
      });
    })
    .catch((error) => {
      logger.error("Failed to add shopping item", error);
      response.status(500).json({
        message: "Failed to add shopping item",
        error: error.message,
      });
    });
}

export const addShoppingItem = onRequest(addShoppingItemHandler);

export const deleteItem = onRequest((request, response) => {
  setCorsHeaders(response);
  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "DELETE" && request.method !== "POST") {
    response.status(405).json({
      message: "Method not allowed. Use DELETE or POST.",
    });
    return;
  }

  const idFromQuery = typeof request.query?.id === "string" ? request.query.id.trim() : "";
  const idFromBody = typeof request.body?.id === "string" ? request.body.id.trim() : "";
  const id = idFromBody || idFromQuery;

  if (!id) {
    response.status(400).json({
      message: "Invalid payload. Required field: id (string).",
    });
    return;
  }

  db.collection("shoppingList")
    .doc(id)
    .delete()
    .then(() => {
      response.status(200).json({
        message: "Item deleted",
        id,
      });
    })
    .catch((error) => {
      logger.error("Failed to delete shopping item", error);
      response.status(500).json({
        message: "Failed to delete shopping item",
        error: error.message,
      });
    });
});

export const updateItem = onRequest((request, response) => {
  setCorsHeaders(response);
  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "PATCH" && request.method !== "POST") {
    response.status(405).json({
      message: "Method not allowed. Use PATCH or POST.",
    });
    return;
  }

  const idFromQuery = typeof request.query?.id === "string" ? request.query.id.trim() : "";
  const idFromBody = typeof request.body?.id === "string" ? request.body.id.trim() : "";
  const id = idFromBody || idFromQuery;

  if (!id) {
    response.status(400).json({
      message: "Invalid payload. Required field: id (string).",
    });
    return;
  }

  const updates = {};
  if (typeof request.body?.name === "string") {
    const trimmedName = request.body.name.trim();
    if (!trimmedName) {
      response.status(400).json({
        message: "Invalid payload. name must be a non-empty string.",
      });
      return;
    }
    updates.name = trimmedName;
  }

  if (request.body?.refill !== undefined) {
    const refill = Number(request.body.refill);
    if (!Number.isFinite(refill)) {
      response.status(400).json({
        message: "Invalid payload. refill must be a number.",
      });
      return;
    }
    updates.refillDate = toIsoDateString(addDays(new Date(), refill));
  }

  if (request.body?.consume !== undefined) {
    const consume = Number(request.body.consume);
    if (!Number.isFinite(consume)) {
      response.status(400).json({
        message: "Invalid payload. consume must be a number.",
      });
      return;
    }
    updates.consumeDate = toIsoDateString(addDays(new Date(), consume));
  }

  if (Object.keys(updates).length === 0) {
    response.status(400).json({
      message: "No fields to update. Provide at least one of: name, refill, consume.",
    });
    return;
  }

  const docRef = db.collection("shoppingList").doc(id);
  docRef.get()
    .then((doc) => {
      if (!doc.exists) {
        response.status(404).json({
          message: "Item not found",
          id,
        });
        return null;
      }

      return docRef.set(updates, {merge: true})
        .then(() => {
          const mergedData = {
            ...doc.data(),
            ...updates,
          };

          response.status(200).json({
            message: "Item updated",
            item: {
              id,
              ...mergedData,
              refill: getDaysUntilIsoDate(mergedData.refillDate),
              consume: getDaysUntilIsoDate(mergedData.consumeDate),
            },
          });
        });
    })
    .catch((error) => {
      logger.error("Failed to update shopping item", error);
      response.status(500).json({
        message: "Failed to update shopping item",
        error: error.message,
      });
    });
});

