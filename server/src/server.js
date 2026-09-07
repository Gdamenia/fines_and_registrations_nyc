require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getViolationsByPlate } = require('./socrata');
const { getRegistrationByVin } = require('./dmvRegistration');
const { signup, login } = require('./auth');
const { requireAuth } = require('./middleware/requireAuth');
const carsService = require('./carsService');
const { registerPushToken } = require('./push');
const { startCron } = require('./cron');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(require('path').join(__dirname, '..', 'public')));

// ---- Auth ----

app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are both required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
    const { user, token } = await signup(email, password);
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
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
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ---- Cars (all require auth) ----

app.get('/api/cars', requireAuth, async (req, res) => {
  const cars = await carsService.listCarsForUser(req.userId);
  res.json({ cars });
});

app.post('/api/cars', requireAuth, async (req, res) => {
  const { nickname, plate, state, vin } = req.body;
  if (!nickname || !plate) {
    return res.status(400).json({ error: 'A nickname and plate number are both required.' });
  }

  try {
    const result = await carsService.createCar(req.userId, { nickname, plate, state, vin });
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.get('/api/cars/:id', requireAuth, async (req, res) => {
  const detail = await carsService.getCarDetail(req.params.id, req.userId);
  if (!detail) return res.status(404).json({ error: 'Car not found.' });
  res.json(detail);
});

app.delete('/api/cars/:id', requireAuth, async (req, res) => {
  const deleted = await carsService.deleteCar(req.params.id, req.userId);
  if (!deleted) return res.status(404).json({ error: 'Car not found.' });
  res.status(204).end();
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
    res.status(err.status || 500).json({ error: err.message });
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
    const status = err.status === 429 ? 429 : 502;
    res.status(status).json({ error: err.message });
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
    const status = err.status === 429 ? 429 : 502;
    res.status(status).json({ error: err.message });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`plate-lookup server running on http://localhost:${PORT}`);
  if (!process.env.SOCRATA_APP_TOKEN) {
    console.log('No SOCRATA_APP_TOKEN set — running unauthenticated (low rate limit).');
  }
  startCron();
});
