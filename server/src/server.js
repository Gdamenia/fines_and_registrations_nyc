require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getViolationsByPlate } = require('./socrata');
const { getRegistrationByVin } = require('./dmvRegistration');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(require('path').join(__dirname, '..', 'public')));

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
});
