const cron = require('node-cron');
const { pool } = require('./db/pool');
const { listAllCars, fetchAndSaveViolations } = require('./carsService');
const { sendPushToUser } = require('./push');

/**
 * One sweep: for every saved car, re-fetch violations, and for anything genuinely new
 * (per the car_id+summons_number dedup in fetchAndSaveViolations), record a
 * notification_event and try to push it to the owner. Sequential, not parallel — this is a
 * handful of cars during development, and Socrata rate-limits unauthenticated/low-volume
 * callers hard (see CONTEXT.md); a Promise.all here would just trade one problem for 429s.
 */
async function runSweep() {
  const cars = await listAllCars();
  let newViolationsTotal = 0;

  for (const car of cars) {
    let newlyInserted;
    try {
      newlyInserted = await fetchAndSaveViolations(car.id, car.plate, car.state);
    } catch (err) {
      console.error(`[cron] violations fetch failed for car ${car.id} (${car.nickname}):`, err.message);
      continue;
    }

    for (const violation of newlyInserted) {
      const { rows } = await pool.query(
        'INSERT INTO notification_events (car_id, violation_id) VALUES ($1, $2) RETURNING *',
        [car.id, violation.id]
      );
      const event = rows[0];

      try {
        const { sent } = await sendPushToUser(car.user_id, {
          title: `New violation on ${car.nickname}`,
          body: violation.violation || 'A new violation was recorded.',
          data: { carId: car.id, violationId: violation.id },
        });
        if (sent > 0) {
          await pool.query('UPDATE notification_events SET sent_at = now() WHERE id = $1', [event.id]);
        }
      } catch (err) {
        // Notification-sending failure shouldn't undo the fact that we found a real new
        // violation — it stays recorded (sent_at left null) so it can be retried/inspected.
        console.error(`[cron] push send failed for user ${car.user_id}:`, err.message);
      }
    }

    newViolationsTotal += newlyInserted.length;
  }

  console.log(
    `[cron] sweep complete: ${cars.length} car(s) checked, ${newViolationsTotal} new violation(s) found.`
  );
}

function startCron() {
  // Every hour, on the hour — per the product spec in CONTEXT.md.
  cron.schedule('0 * * * *', () => {
    runSweep().catch((err) => console.error('[cron] sweep crashed:', err));
  });
  console.log('[cron] scheduled hourly violation sweep.');
}

module.exports = { startCron, runSweep };
