const cron = require('node-cron');
const { pool } = require('./db/pool');
const { listAllCars, fetchAndSaveViolations, refreshTimelines } = require('./carsService');
const { sendPushToUser } = require('./push');
const {
  newFineNotification,
  weeklyReminderNotification,
  penaltySoonNotification,
  penaltyAddedNotification,
  judgmentSoonNotification,
  judgmentEnteredNotification,
  enforcementNotification,
} = require('./language');
const { computeTimeline, nycToday, JUDGMENT_ENFORCEMENT_THRESHOLD } = require('./fineTimeline');

// Deadline reminders: once two weeks ahead, then three times in the final week, evenly
// spaced so the last one arrives the day before the due date.
const REMINDER_DAYS_BEFORE_DUE = [14, 7, 4, 1];
// Owners get a softer "approaching" warning from this much judgment debt.
const ENFORCEMENT_NEAR_AMOUNT = 250;

/**
 * Record a notification event and push it to the owner's devices. With a reminderKey the
 * event is created at most once (a re-run of a job can't send duplicates).
 * @returns {Promise<boolean>} whether a new event was created
 */
async function notify({ userId, carId, violationId = null, kind, title, body, reminderKey = null, data = {} }) {
  const { rows } = await pool.query(
    `INSERT INTO notification_events (car_id, violation_id, kind, title, body, reminder_key)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (reminder_key) WHERE reminder_key IS NOT NULL DO NOTHING
     RETURNING id`,
    [carId, violationId, kind, title, body, reminderKey]
  );
  if (!rows[0]) return false;

  try {
    const { sent } = await sendPushToUser(userId, { title, body, data: { kind, carId, violationId, ...data } });
    if (sent > 0) await pool.query('UPDATE notification_events SET sent_at = now() WHERE id = $1', [rows[0].id]);
  } catch (err) {
    console.error(`[cron] push send failed for user ${userId}:`, err.message);
  }
  return true;
}

/**
 * Hourly sweep: refresh tracked plates and notify the owner when a genuinely new
 * violation appears.
 */
async function runSweep() {
  const cars = await listAllCars();
  let newViolationsTotal = 0;

  for (const car of cars) {
    let result;
    try {
      result = await fetchAndSaveViolations(car.id, car.plate, car.state);
    } catch (err) {
      console.error(`[cron] violations fetch failed for car ${car.id} (${car.nickname}):`, err.message);
      continue;
    }

    for (const violation of result.inserted) {
      // Written in the owner's chosen language (English if they never chose one).
      const { title, body } = newFineNotification(car.owner_language, {
        nickname: car.nickname,
        amountDue: violation.amount_due,
        violation: violation.violation,
      });
      await notify({ userId: car.user_id, carId: car.id, violationId: violation.id, kind: 'new_fine', title, body });
    }

    // Only announced once NYC's own data shows it (its records lag the official schedule).
    for (const { row, added } of result.penaltyAdded) {
      const timeline = computeTimeline(row.data);
      const { title, body } = penaltyAddedNotification(car.owner_language, {
        nickname: car.nickname, ticketType: timeline.ticket_type, added, amountDue: row.amount_due,
      });
      await notify({
        userId: car.user_id, carId: car.id, violationId: row.id, kind: 'penalty_added', title, body,
        reminderKey: `penalty_added:${row.id}:${row.data.penalty_amount}`,
      });
    }

    for (const row of result.enteredJudgment) {
      const { title, body } = judgmentEnteredNotification(car.owner_language, { nickname: car.nickname });
      await notify({
        userId: car.user_id, carId: car.id, violationId: row.id, kind: 'judgment_entered', title, body,
        reminderKey: `judgment_entered:${row.id}`,
      });
    }

    newViolationsTotal += result.inserted.length;
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
      u.language AS owner_language,
      COUNT(v.id)::int AS open_count,
      COALESCE(SUM(v.amount_due), 0)::numeric AS total_due
    FROM cars c
    JOIN users u ON u.id = c.user_id
    JOIN violations v ON v.car_id = c.id
    WHERE COALESCE(v.amount_due, 0) > 0
    GROUP BY c.id, c.user_id, c.nickname, c.plate, c.state, u.language
    ORDER BY c.id
  `);

  const weekKey = isoWeekKey();
  let created = 0;

  for (const row of rows) {
    const { title, body } = weeklyReminderNotification(row.owner_language, {
      nickname: row.nickname,
      openCount: row.open_count,
      totalDue: row.total_due,
    });
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

/**
 * Daily: refresh every fine's timeline, then send the deadline reminders that fall today
 * (upcoming late penalties, approaching judgment) and the owner-level boot/tow warning.
 */
async function runDeadlineReminders() {
  const refreshed = await refreshTimelines();
  const today = nycToday();
  const weekKey = isoWeekKey();

  const { rows } = await pool.query(`
    SELECT v.id, v.car_id, v.data, c.user_id, c.nickname, u.language
    FROM violations v
    JOIN cars c ON c.id = v.car_id
    JOIN users u ON u.id = c.user_id
    WHERE COALESCE(v.amount_due, 0) > 0
  `);

  let sentCount = 0;
  const judgmentByUser = new Map(); // userId -> { total, carId of the biggest share, language }

  for (const row of rows) {
    const t = computeTimeline(row.data, today);

    if (t.amount_in_judgment > 0) {
      const entry = judgmentByUser.get(row.user_id) || { total: 0, carId: row.car_id, top: 0, language: row.language };
      entry.total += t.amount_in_judgment;
      if (t.amount_in_judgment > entry.top) { entry.top = t.amount_in_judgment; entry.carId = row.car_id; }
      judgmentByUser.set(row.user_id, entry);
    }

    if (!t.schedule_known) continue;

    // Upcoming late penalty: pay by due_date, the penalty applies the day after.
    if (t.next_penalty_amount && REMINDER_DAYS_BEFORE_DUE.includes(t.days_until_due)) {
      const { title, body } = penaltySoonNotification(row.language, {
        nickname: row.nickname,
        ticketType: t.ticket_type,
        amount: t.next_penalty_amount,
        daysUntilPenalty: t.days_until_due + 1,
        dueDate: t.due_date,
      });
      if (await notify({
        userId: row.user_id, carId: row.car_id, violationId: row.id, kind: 'penalty_warning', title, body,
        reminderKey: `penalty_warning:${row.id}:${t.due_date}:${t.days_until_due}`,
      })) sentCount += 1;
      continue;
    }

    // No more penalties ahead: remind before the (estimated) judgment instead.
    if (!t.next_penalty_amount && t.estimated_judgment_date && REMINDER_DAYS_BEFORE_DUE.includes(t.days_until_judgment)) {
      const payBy = new Date(`${t.estimated_judgment_date}T00:00:00Z`);
      payBy.setUTCDate(payBy.getUTCDate() - 1);
      const { title, body } = judgmentSoonNotification(row.language, {
        nickname: row.nickname,
        amountDue: t.current_amount,
        judgmentDate: payBy.toISOString().slice(0, 10),
      });
      if (await notify({
        userId: row.user_id, carId: row.car_id, violationId: row.id, kind: 'judgment_warning', title, body,
        reminderKey: `judgment_warning:${row.id}:${t.estimated_judgment_date}:${t.days_until_judgment}`,
      })) sentCount += 1;
    }
  }

  // Boot/tow: only debt that has actually entered judgment counts (not ordinary unpaid tickets).
  for (const [userId, entry] of judgmentByUser) {
    const exceeded = entry.total > JUDGMENT_ENFORCEMENT_THRESHOLD;
    if (!exceeded && entry.total < ENFORCEMENT_NEAR_AMOUNT) continue;
    const { title, body } = enforcementNotification(entry.language, { judgmentDebt: entry.total, exceeded });
    if (await notify({
      userId, carId: entry.carId, kind: exceeded ? 'enforcement_risk' : 'enforcement_near', title, body,
      reminderKey: `${exceeded ? 'enforcement_risk' : 'enforcement_near'}:${userId}:${weekKey}`,
    })) sentCount += 1;
  }

  console.log(`[cron] deadline reminders: ${refreshed} timeline(s) refreshed, ${sentCount} notification(s) sent.`);
}

function startCron() {
  cron.schedule('0 * * * *', () => {
    runSweep().catch((err) => console.error('[cron] sweep crashed:', err));
  });

  // Monday at 10:00 AM New York time.
  cron.schedule('0 10 * * 1', () => {
    runWeeklyFineReminders().catch((err) => console.error('[cron] weekly reminder crashed:', err));
  }, { timezone: 'America/New_York' });

  // Every day at 9:00 AM New York time: deadline reminders + boot/tow warnings.
  cron.schedule('0 9 * * *', () => {
    runDeadlineReminders().catch((err) => console.error('[cron] deadline reminders crashed:', err));
  }, { timezone: 'America/New_York' });

  // Bring stored timelines up to date right away (e.g. after a deploy) - no notifications.
  refreshTimelines().catch((err) => console.error('[cron] timeline refresh failed:', err));

  console.log('[cron] scheduled hourly violation sweep, daily deadline reminders, Monday weekly fine reminders.');
}

module.exports = { startCron, runSweep, runWeeklyFineReminders, runDeadlineReminders };
