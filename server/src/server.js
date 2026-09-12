require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getViolationsByPlate } = require('./socrata');
const { getRegistrationByVin } = require('./dmvRegistration');
const { signup, login, updateProfile } = require('./auth');
const { requireAuth } = require('./middleware/requireAuth');
const carsService = require('./carsService');
const { registerPushToken } = require('./push');
const { startCron } = require('./cron');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(require('path').join(__dirname, '..', 'public')));

// Node's networking stack can throw an AggregateError when a connection attempt fails
// over multiple addresses (e.g. Postgres unreachable on both ::1 and 127.0.0.1) — its own
// top-level `.message` is empty by design, with the real per-address messages nested in
// `.errors[]`. Fall back to those so API error responses (and logs) are never just "".
function errorMessage(err) {
  if (err.message) return err.message;
  if (Array.isArray(err.errors) && err.errors.length) {
    return err.errors.map((e) => e.message).join('; ');
  }
  return String(err);
}

function sendError(res, err) {
  console.error(err);
  res.status(err.status || 500).json({ error: errorMessage(err) });
}

// ---- Auth ----

app.post('/api/auth/signup', async (req, res) => {
  const { email, password, fullName } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are both required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
    const { user, token } = await signup(email, password, fullName);
    res.status(201).json({ user, token });
  } catch (err) {
    sendError(res, err);
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are both required.' });
  }

  try {
    const { user, token } = await login(email, password);
    res.json({ user, token });
  } catch (err) {
    sendError(res, err);
  }
});

app.patch('/api/profile', requireAuth, async (req, res) => {
  const { fullName } = req.body;
  try {
    const user = await updateProfile(req.userId, fullName);
    res.json({ user });
  } catch (err) {
    sendError(res, err);
  }
});

// ---- Cars (all require auth) ----

app.get('/api/cars', requireAuth, async (req, res) => {
  try {
    const cars = await carsService.listCarsForUser(req.userId);
    res.json({ cars });
  } catch (err) {
    sendError(res, err);
  }
});

app.post('/api/cars', requireAuth, async (req, res) => {
  const { nickname, plate, state, vin, vehicle_icon } = req.body;
  if (!nickname || !plate) {
    return res.status(400).json({ error: 'A nickname and plate number are both required.' });
  }

  try {
    const result = await carsService.createCar(req.userId, { nickname, plate, state, vin, vehicle_icon });
    res.status(201).json(result);
  } catch (err) {
    sendError(res, err);
  }
});

app.get('/api/cars/:id', requireAuth, async (req, res) => {
  try {
    const detail = await carsService.getCarDetail(req.params.id, req.userId);
    if (!detail) return res.status(404).json({ error: 'Car not found.' });
    res.json(detail);
  } catch (err) {
    sendError(res, err);
  }
});

app.patch('/api/cars/:id', requireAuth, async (req, res) => {
  const { nickname, plate, state, vin, vehicle_icon } = req.body;
  if (!nickname || !plate || !state) {
    return res.status(400).json({ error: 'Nickname, plate, and state are required.' });
  }

  try {
    const result = await carsService.updateCar(req.params.id, req.userId, { nickname, plate, state, vin, vehicle_icon });
    if (!result) return res.status(404).json({ error: 'Car not found.' });
    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
});

app.delete('/api/cars/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await carsService.deleteCar(req.params.id, req.userId);
    if (!deleted) return res.status(404).json({ error: 'Car not found.' });
    res.status(204).end();
  } catch (err) {
    sendError(res, err);
  }
});

// ---- Notification activity feed ----

app.get('/api/notifications', requireAuth, async (req, res) => {
  try {
    const { rows } = await require('./db/pool').pool.query(
      `SELECT
         ne.id, ne.created_at, ne.sent_at, ne.car_id, ne.violation_id,
         ne.kind, ne.title, ne.body,
         c.nickname, c.plate, c.state,
         v.summons_number, v.violation, v.amount_due, v.issue_date
       FROM notification_events ne
       JOIN cars c ON c.id = ne.car_id
       LEFT JOIN violations v ON v.id = ne.violation_id
       WHERE c.user_id = $1
       ORDER BY ne.created_at DESC
       LIMIT 100`,
      [req.userId]
    );
    res.json({ notifications: rows });
  } catch (err) {
    sendError(res, err);
  }
});

// ---- Push token registration (for the mobile app, once it exists) ----

app.post('/api/push-tokens', requireAuth, async (req, res) => {
  const { expoPushToken } = req.body;
  if (!expoPushToken) {
    return res.status(400).json({ error: 'expoPushToken is required.' });
  }

  try {
    await registerPushToken(req.userId, expoPushToken);
    res.status(204).end();
  } catch (err) {
    sendError(res, err);
  }
});

// GET /api/violations?plate=ABC1234&state=NY
app.get('/api/violations', async (req, res) => {
  const { plate, state, limit } = req.query;

  if (!plate || !state) {
    return res.status(400).json({ error: 'Query params "plate" and "state" are required.' });
  }

  try {
    const violations = await getViolationsByPlate(plate, state, {
      limit: limit ? Number(limit) : undefined,
    });
    res.json({
      plate: plate.toUpperCase(),
      state: state.toUpperCase(),
      count: violations.length,
      violations,
    });
  } catch (err) {
    err.status = err.status === 429 ? 429 : 502;
    sendError(res, err);
  }
});

// GET /api/registration?vin=JTDZN3EU6D3199758
// NOTE: NY DMV's public registration dataset has no plate field (DPPA restricts
// plate-to-registration linkage from public disclosure) — VIN is the only lookup key.
app.get('/api/registration', async (req, res) => {
  const { vin, limit } = req.query;

  if (!vin) {
    return res.status(400).json({ error: 'Query param "vin" is required.' });
  }

  try {
    const records = await getRegistrationByVin(vin, {
      limit: limit ? Number(limit) : undefined,
    });
    res.json({
      vin: vin.toUpperCase(),
      count: records.length,
      registrations: records,
    });
  } catch (err) {
    err.status = err.status === 429 ? 429 : 502;
    sendError(res, err);
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

// Final safety net: catches anything that reached here without a route-level try/catch
// (e.g. a bug in a future handler) and still returns JSON instead of Express's default
// HTML error page, which the web/mobile clients aren't equipped to parse.
app.use((err, req, res, next) => {
  sendError(res, err);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`plate-lookup server running on http://localhost:${PORT}`);
  if (!process.env.SOCRATA_APP_TOKEN) {
    console.log('No SOCRATA_APP_TOKEN set — running unauthenticated (low rate limit).');
  }
  startCron();
});
