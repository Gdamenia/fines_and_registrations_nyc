const { Expo } = require('expo-server-sdk');
const { pool } = require('./db/pool');

const expo = new Expo();

/**
 * Send a push notification to every device a user has registered.
 * Silently does nothing if the user has no tokens yet — expected state until the mobile
 * app exists and someone registers one (see migrations/0001_init.sql's push_tokens comment).
 *
 * @returns {Promise<{sent: number, skipped: number}>}
 */
async function sendPushToUser(userId, { title, body, data }) {
  const { rows: tokenRows } = await pool.query(
    'SELECT expo_push_token FROM push_tokens WHERE user_id = $1',
    [userId]
  );

  const messages = [];
  let skipped = 0;
  for (const { expo_push_token: token } of tokenRows) {
    if (!Expo.isExpoPushToken(token)) {
      skipped += 1;
      continue;
    }
    messages.push({ to: token, sound: 'default', title, body, data });
  }

  if (messages.length === 0) {
    return { sent: 0, skipped };
  }

  const chunks = expo.chunkPushNotifications(messages);
  let sent = 0;
  for (const chunk of chunks) {
    const tickets = await expo.sendPushNotificationsAsync(chunk);
    sent += tickets.filter((t) => t.status === 'ok').length;
  }

  return { sent, skipped: skipped + (messages.length - sent) };
}

async function registerPushToken(userId, expoPushToken) {
  if (!Expo.isExpoPushToken(expoPushToken)) {
    const err = new Error('That does not look like a valid Expo push token.');
    err.status = 400;
    throw err;
  }
  await pool.query(
    `INSERT INTO push_tokens (user_id, expo_push_token)
     VALUES ($1, $2)
     ON CONFLICT (user_id, expo_push_token) DO NOTHING`,
    [userId, expoPushToken]
  );
}

module.exports = { sendPushToUser, registerPushToken };
