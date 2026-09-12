const { pool } = require('./db/pool');
const { getViolationsByPlate } = require('./socrata');
const { getRegistrationByVin } = require('./dmvRegistration');

/**
 * Fetch violations for a car from Socrata and upsert them.
 * Dedup key is (car_id, summons_number) — see migrations/0001_init.sql for why that's
 * per-car rather than global.
 *
 * @returns {Promise<object[]>} rows that were newly inserted (i.e. genuinely new violations)
 */
async function fetchAndSaveViolations(carId, plate, state) {
  const violations = await getViolationsByPlate(plate, state, { limit: 200 });

  const newlyInserted = [];
  for (const v of violations) {
    if (!v.summons_number) continue; // shouldn't happen, but don't let a bad row crash the sweep

    const { rows } = await pool.query(
      `INSERT INTO violations (car_id, summons_number, amount_due, issue_date, violation, data)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (car_id, summons_number) DO NOTHING
       RETURNING *`,
      [carId, v.summons_number, v.amount_due ?? null, v.issue_date ?? null, v.violation ?? null, v]
    );
    if (rows[0]) newlyInserted.push(rows[0]);
  }

  return newlyInserted;
}

/**
 * Fetch registration for a car's VIN from the DMV dataset and replace the stored snapshot.
 * No-op if the car has no VIN on file, or the dataset has nothing for this VIN yet.
 */
async function fetchAndSaveRegistration(carId, vin) {
  if (!vin) return null;

  const records = await getRegistrationByVin(vin, { limit: 1 });
  if (records.length === 0) return null;

  const { rows } = await pool.query(
    `INSERT INTO registrations (car_id, data)
     VALUES ($1, $2)
     ON CONFLICT (car_id) DO UPDATE SET data = EXCLUDED.data, fetched_at = now()
     RETURNING *`,
    [carId, records[0]]
  );
  return rows[0];
}

/**
 * Create a car for a user, then do the initial violations+registration fetch.
 * The initial fetch runs inline (not deferred to the cron) so the dashboard has data to
 * show immediately after adding a car, per the product spec.
 */
async function createCar(userId, { nickname, plate, state, vin, vehicle_icon }) {
  const { rows } = await pool.query(
    `INSERT INTO cars (user_id, nickname, plate, state, vin, vehicle_icon)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, nickname, plate.toUpperCase(), (state || 'NY').toUpperCase(), vin ? vin.toUpperCase() : null, vehicle_icon || 'sedan']
  );
  const car = rows[0];

  // Best-effort: a car should still get created even if Socrata is down or the plate/VIN
  // has nothing on file yet. The cron will pick it up on the next sweep either way.
  const [violationsResult, registrationResult] = await Promise.allSettled([
    fetchAndSaveViolations(car.id, car.plate, car.state),
    fetchAndSaveRegistration(car.id, car.vin),
  ]);

  return {
    car,
    violationsFetchError: violationsResult.status === 'rejected' ? violationsResult.reason.message : null,
    registrationFetchError: registrationResult.status === 'rejected' ? registrationResult.reason.message : null,
  };
}

async function updateCar(carId, userId, { nickname, plate, state, vin, vehicle_icon }) {
  const { rows: existingRows } = await pool.query(
    'SELECT * FROM cars WHERE id = $1 AND user_id = $2',
    [carId, userId]
  );
  const existing = existingRows[0];
  if (!existing) return null;

  const nextNickname = (nickname || existing.nickname).trim();
  const nextPlate = (plate || existing.plate).trim().toUpperCase();
  const nextState = (state || existing.state || 'NY').trim().toUpperCase();
  const nextVin = vin === undefined
    ? existing.vin
    : (vin ? vin.trim().toUpperCase() : null);
  const nextVehicleIcon = vehicle_icon || existing.vehicle_icon || 'sedan';
  const plateChanged = nextPlate !== existing.plate || nextState !== existing.state;
  const vinChanged = (nextVin || null) !== (existing.vin || null);

  const { rows } = await pool.query(
    `UPDATE cars
     SET nickname = $1, plate = $2, state = $3, vin = $4, vehicle_icon = $5
     WHERE id = $6 AND user_id = $7
     RETURNING *`,
    [nextNickname, nextPlate, nextState, nextVin, nextVehicleIcon, carId, userId]
  );

  if (plateChanged) {
    await pool.query('DELETE FROM violations WHERE car_id = $1', [carId]);
  }
  if (vinChanged) {
    await pool.query('DELETE FROM registrations WHERE car_id = $1', [carId]);
  }

  const jobs = [];
  const jobNames = [];
  if (plateChanged) {
    jobs.push(fetchAndSaveViolations(carId, nextPlate, nextState));
    jobNames.push('violations');
  }
  if (vinChanged && nextVin) {
    jobs.push(fetchAndSaveRegistration(carId, nextVin));
    jobNames.push('registration');
  }
  const results = await Promise.allSettled(jobs);
  let violationsFetchError = null;
  let registrationFetchError = null;
  results.forEach((result, index) => {
    if (result.status !== 'rejected') return;
    if (jobNames[index] === 'violations') violationsFetchError = result.reason.message;
    if (jobNames[index] === 'registration') registrationFetchError = result.reason.message;
  });

  const refreshedCars = await listCarsForUser(userId);
  const refreshed = refreshedCars.find((car) => Number(car.id) === Number(carId)) || rows[0];
  return { car: refreshed, violationsFetchError, registrationFetchError };
}

async function listCarsForUser(userId) {
  const { rows } = await pool.query(
    `SELECT
       cars.*,
       COALESCE(v.violation_count, 0) AS violation_count,
       COALESCE(v.total_amount_due, 0) AS total_amount_due,
       (registrations.car_id IS NOT NULL) AS has_registration
     FROM cars
     LEFT JOIN (
       SELECT car_id, COUNT(*) AS violation_count, SUM(amount_due) AS total_amount_due
       FROM violations
       GROUP BY car_id
     ) v ON v.car_id = cars.id
     LEFT JOIN registrations ON registrations.car_id = cars.id
     WHERE cars.user_id = $1
     ORDER BY cars.created_at ASC`,
    [userId]
  );
  return rows;
}

/** Returns null if the car doesn't exist or isn't owned by this user. */
async function getCarDetail(carId, userId) {
  const { rows } = await pool.query('SELECT * FROM cars WHERE id = $1 AND user_id = $2', [
    carId,
    userId,
  ]);
  const car = rows[0];
  if (!car) return null;

  const [{ rows: violations }, { rows: registrationRows }] = await Promise.all([
    pool.query(
      'SELECT * FROM violations WHERE car_id = $1 ORDER BY issue_date DESC NULLS LAST, id DESC',
      [carId]
    ),
    pool.query('SELECT * FROM registrations WHERE car_id = $1', [carId]),
  ]);

  return { car, violations, registration: registrationRows[0] || null };
}

/** Returns true if a car was deleted, false if it didn't exist / wasn't owned by this user. */
async function deleteCar(carId, userId) {
  const { rowCount } = await pool.query('DELETE FROM cars WHERE id = $1 AND user_id = $2', [
    carId,
    userId,
  ]);
  return rowCount > 0;
}

async function listAllCars() {
  const { rows } = await pool.query('SELECT * FROM cars');
  return rows;
}

module.exports = {
  createCar,
  updateCar,
  listCarsForUser,
  getCarDetail,
  deleteCar,
  listAllCars,
  fetchAndSaveViolations,
  fetchAndSaveRegistration,
};
