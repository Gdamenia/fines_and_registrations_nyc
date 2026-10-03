// NYC ticket penalty / deadline timeline.
//
// NYC's open data has no due date: each record has the issue date, the fine and penalty
// amounts, the current balance (amount_due) and — once it happens — judgment_entry_date.
// This module derives the deadlines from NYC's published penalty schedules so the app can
// show countdowns and send reminders. NYC's own numbers stay the source of truth for what
// is owed right now (amount_due, penalty_amount) and for judgment (judgment_entry_date);
// the schedule below is only used to estimate what happens next.
//
// Schedules (days counted from the ISSUE date, never from when we first saw the ticket):
//
//   Parking tickets: days 0-30 fine only; day 31 +$10; day 61 +$20 (=$30); day 91 +$30
//   (=$60); judgment around day 100. Checked against NYC data on 2026-10-03: unpaid
//   tickets older than 90 days carry exactly $60 in penalties, and judgment was entered
//   106-120 days after issue - so "day 100" is a safe, slightly early estimate.
//
//   Camera violations (speed, red light, bus lane, MTA camera): day 31 +$25 (one late
//   penalty only), final notice around day 65, judgment around day 75. NYC data on
//   2026-10-03: old unpaid camera violations carry exactly $25 in penalties, and judgment
//   was entered 79-93 days after issue - "day 75" again errs early.
//
// Judgment debt is subject to 9% simple annual interest (calculated monthly). Owners with
// more than $350 of parking/camera debt IN JUDGMENT may have their vehicles booted or
// towed — ordinary unpaid tickets don't count towards that threshold.
//
// Tickets that went to a hearing (violation_status "HEARING ...") follow the hearing
// decision's own deadline, which the dataset doesn't include, so no countdown is derived
// for them (scheduleKnown: false) - only NYC's balance is shown.

const DAY_MS = 24 * 60 * 60 * 1000;

const SCHEDULES = {
  parking: {
    // `lastFreeDay`: last day (since issue) before the penalty; it is applied the next day.
    penalties: [
      { lastFreeDay: 30, amount: 10, totalAfter: 10 },
      { lastFreeDay: 60, amount: 20, totalAfter: 30 },
      { lastFreeDay: 90, amount: 30, totalAfter: 60 },
    ],
    judgmentDay: 100,
  },
  camera: {
    penalties: [{ lastFreeDay: 30, amount: 25, totalAfter: 25 }],
    finalNoticeDay: 65,
    judgmentDay: 75,
  },
};

const JUDGMENT_ENFORCEMENT_THRESHOLD = 350;
const JUDGMENT_INTEREST_RATE = 0.09;

// Camera programs: speed (PHTO = photo), red light, bus lane, and the MTA's camera
// violations ("MTA CAMERA VIOLATION - DOUBLE PARKING", ...). NYC DOT only issues camera
// violations in this dataset, so its agency is a fallback signal.
const CAMERA_NAME = /PHTO|RED LIGHT|BUS LANE VIOLATION|CAMERA/;
const CAMERA_AGENCIES = new Set(['DEPARTMENT OF TRANSPORTATION']);

function ticketType(record) {
  const name = String(record.violation || '').toUpperCase();
  const agency = String(record.issuing_agency || '').toUpperCase();
  return CAMERA_NAME.test(name) || CAMERA_AGENCIES.has(agency) ? 'camera' : 'parking';
}

/** NYC's "MM/DD/YYYY" text -> a UTC midnight Date, or null for anything malformed. */
function parseNycDate(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(value || '').trim());
  if (!match) return null;
  const [, mm, dd, yyyy] = match.map(Number);
  const date = new Date(Date.UTC(yyyy, mm - 1, dd));
  // Rejects impossible dates like 99/02/2015, which do occur in NYC's data.
  return date.getUTCMonth() === mm - 1 && date.getUTCDate() === dd ? date : null;
}

/** Today in New York as a UTC midnight Date (deadlines are NYC calendar days). */
function nycToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return new Date(Date.UTC(get('year'), get('month') - 1, get('day')));
}

const addDays = (date, days) => new Date(date.getTime() + days * DAY_MS);
const daysBetween = (from, to) => Math.round((to.getTime() - from.getTime()) / DAY_MS);
const isoDate = (date) => (date ? date.toISOString().slice(0, 10) : null);
const money = (value) => {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
};

/**
 * Derive the timeline for one raw NYC record (the Socrata row) as of `today`
 * (a UTC-midnight Date for the NYC calendar day; defaults to now).
 */
function computeTimeline(record, today = nycToday()) {
  const type = ticketType(record);
  const schedule = SCHEDULES[type];
  const issued = parseNycDate(record.issue_date);
  const judgmentDate = parseNycDate(record.judgment_entry_date);

  const originalAmount = money(record.fine_amount);
  const currentAmount = money(record.amount_due);
  const penaltyAmount = money(record.penalty_amount);
  const interestAmount = money(record.interest_amount);
  const unpaid = currentAmount > 0;

  const daysSinceIssue = issued ? daysBetween(issued, today) : null;
  const hearing = /HEARING/i.test(String(record.violation_status || ''));
  const scheduleKnown = Boolean(issued) && !hearing;

  // Judgment: NYC's judgment_entry_date is authoritative; otherwise only an estimate.
  const inJudgment = unpaid && Boolean(judgmentDate) && judgmentDate.getTime() <= today.getTime();
  const estimatedJudgmentDate = scheduleKnown ? addDays(issued, schedule.judgmentDay) : null;
  let judgmentStatus = 'none';
  if (!unpaid) judgmentStatus = 'none';
  else if (inJudgment) judgmentStatus = 'in_judgment';
  else if (scheduleKnown && daysSinceIssue >= schedule.judgmentDay) judgmentStatus = 'likely'; // past the usual day, NYC hasn't reported it yet
  else if (scheduleKnown && daysSinceIssue >= schedule.judgmentDay - 14) judgmentStatus = 'approaching';

  // Next scheduled penalty (only while unpaid, schedule known and not in judgment).
  let nextPenalty = null;
  if (unpaid && scheduleKnown && !inJudgment) {
    nextPenalty = schedule.penalties.find((p) => daysSinceIssue <= p.lastFreeDay) || null;
  }
  const lastPenaltyApplied = scheduleKnown
    ? [...schedule.penalties].reverse().find((p) => daysSinceIssue > p.lastFreeDay) || null
    : null;

  const dueDate = nextPenalty ? addDays(issued, nextPenalty.lastFreeDay) : null; // last day to pay before it
  const nextPenaltyDate = nextPenalty ? addDays(issued, nextPenalty.lastFreeDay + 1) : null;

  return {
    ticket_type: type,
    issue_date: isoDate(issued),
    days_since_issue: daysSinceIssue,
    original_amount: originalAmount,
    current_amount: currentAmount, // NYC's balance - the source of truth
    penalty_amount: penaltyAmount, // as reported by NYC
    interest_amount: interestAmount,
    unpaid,
    schedule_known: scheduleKnown,
    // Deadline for the next penalty: pay by `due_date`, or `next_penalty_amount` is added on `next_penalty_date`.
    due_date: isoDate(dueDate),
    days_until_due: dueDate ? daysBetween(today, dueDate) : null,
    next_penalty_date: isoDate(nextPenaltyDate),
    next_penalty_amount: nextPenalty ? nextPenalty.amount : null,
    // Penalties the schedule says should apply by now (NYC's data can lag a few days).
    scheduled_penalty_total: lastPenaltyApplied ? lastPenaltyApplied.totalAfter : 0,
    last_penalty_added: lastPenaltyApplied ? lastPenaltyApplied.amount : null,
    last_penalty_date: lastPenaltyApplied ? isoDate(addDays(issued, lastPenaltyApplied.lastFreeDay + 1)) : null,
    final_notice_date: type === 'camera' && scheduleKnown ? isoDate(addDays(issued, schedule.finalNoticeDay)) : null,
    judgment_status: judgmentStatus, // none | approaching | likely | in_judgment
    judgment_date: isoDate(judgmentDate), // NYC's actual judgment_entry_date, when known
    estimated_judgment_date: unpaid && !inJudgment ? isoDate(estimatedJudgmentDate) : null,
    days_until_judgment: unpaid && !inJudgment && estimatedJudgmentDate ? daysBetween(today, estimatedJudgmentDate) : null,
    amount_in_judgment: inJudgment ? currentAmount : 0,
  };
}

/** Sum of an owner's debt that has actually entered judgment (boot/tow threshold input). */
function judgmentDebt(timelines) {
  return Math.round(timelines.reduce((sum, t) => sum + (t.amount_in_judgment || 0), 0) * 100) / 100;
}

module.exports = {
  SCHEDULES,
  JUDGMENT_ENFORCEMENT_THRESHOLD,
  JUDGMENT_INTEREST_RATE,
  ticketType,
  parseNycDate,
  nycToday,
  computeTimeline,
  judgmentDebt,
};
