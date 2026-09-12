const cron = require('node-cron');
const { pool } = require('./db/pool');
const { listAllCars, fetchAndSaveViolations } = require('./carsService');
const { sendPushToUser } = require('./push');

/**
 * Hourly sweep: refresh tracked plates and notify the owner when a genuinely new
 * violation appears.
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
      const amount = Number(violation.amount_due || 0);
      const title = `New fine on ${car.nickname}`;
      const body = `${amount > 0 ? `$${amount.toFixed(2)} due · ` : ''}${violation.violation || 'A new NYC violation was recorded.'}`;
      const { rows } = await pool.query(
        `INSERT INTO notification_events (car_id, violation_id, kind, title, body)
         VALUES ($1, $2, 'new_fine', $3, $4)
         RETURNING *`,
        [car.id, violation.id, title, body]
      );
      const event = rows[0];

      try {
        const { sent } = await sendPushToUser(car.user_id, {
          title,
          body,
          data: { kind: 'new_fine', carId: car.id, violationId: violation.id },
        });
        if (sent > 0) {
          await pool.query('UPDATE notification_events SET sent_at = now() WHERE id = $1', [event.id]);
        }
      } catch (err) {
        console.error(`[cron] push send failed for user ${car.user_id}:`, err.message);
      }
    }

    newViolationsTotal += newlyInserted.length;
  }

  console.log(`[cron] sweep complete: ${cars.length} car(s) checked, ${newViolationsTotal} new violation(s) found.`);
}

function isoWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/**
 * Weekly reminder: only cars that still have an amount due receive one reminder.
 * The reminder_key prevents duplicates if the job is re-run during the same week.
 */
async function runWeeklyFineReminders() {
  const { rows } = await pool.query(`
    SELECT
      c.id AS car_id,
      c.user_id,
      c.nickname,
      c.plate,
      c.state,
      COUNT(v.id)::int AS open_count,
      COALESCE(SUM(v.amount_due), 0)::numeric AS total_due
    FROM cars c
    JOIN violations v ON v.car_id = c.id
    WHERE COALESCE(v.amount_due, 0) > 0
    GROUP BY c.id, c.user_id, c.nickname, c.plate, c.state
    ORDER BY c.id
  `);

  const weekKey = isoWeekKey();
  let created = 0;

  for (const row of rows) {
    const total = Number(row.total_due || 0);
    const title = 'Weekly fine reminder';
    const body = `${row.nickname} has ${row.open_count} open fine${row.open_count === 1 ? '' : 's'} totaling $${total.toFixed(2)}.`;
    const reminderKey = `${weekKey}:car:${row.car_id}`;

    const result = await pool.query(
      `INSERT INTO notification_events (car_id, violation_id, kind, title, body, reminder_key)
       VALUES ($1, NULL, 'weekly_reminder', $2, $3, $4)
       ON CONFLICT (reminder_key) WHERE reminder_key IS NOT NULL DO NOTHING
       RETURNING *`,
      [row.car_id, title, body, reminderKey]
    );

    if (result.rows.length === 0) continue;
    created += 1;
    const event = result.rows[0];

    try {
      const { sent } = await sendPushToUser(row.user_id, {
        title,
        body,
        data: { kind: 'weekly_reminder', carId: row.car_id },
      });
      if (sent > 0) {
        await pool.query('UPDATE notification_events SET sent_at = now() WHERE id = $1', [event.id]);
      }
    } catch (err) {
      console.error(`[cron] weekly reminder push failed for user ${row.user_id}:`, err.message);
    }
  }

  console.log(`[cron] weekly reminder complete: ${created} reminder(s) created.`);
}

function startCron() {
  cron.schedule('0 * * * *', () => {
    runSweep().catch((err) => console.error('[cron] sweep crashed:', err));
  });

  // Monday at 10:00 AM New York time.
  cron.schedule('0 10 * * 1', () => {
    runWeeklyFineReminders().catch((err) => console.error('[cron] weekly reminder crashed:', err));
  }, { timezone: 'America/New_York' });

  console.log('[cron] scheduled hourly violation sweep + Monday weekly fine reminders.');
}

module.exports = { startCron, runSweep, runWeeklyFineReminders };
