// LOCAL DEVELOPMENT ONLY: creates a test account tracking real NY plates that exercise
// every penalty / deadline state (see src/fineTimeline.js), so the app's countdowns,
// judgment status and boot/tow warning can be checked against live NYC data.
//
//   npm run seed:test-plates            # then sign in with the credentials below
//
// The plates are real public records picked on 2026-10-03; their states drift as NYC
// updates its data (tickets get paid, penalties posted). Re-pick from the dataset if one
// stops showing what it's listed for.

require('dotenv').config({ quiet: true });
const { pool } = require('../src/db/pool');
const { signup } = require('../src/auth');
const { createCar } = require('../src/carsService');

const TEST_ACCOUNT = {
  email: 'test-fines@example.com',
  password: 'TixradarTest2026!',
  language: 'en',
};

const TEST_PLATES = [
  { plate: 'LXB3245', nickname: 'Judgment over $350', why: '~$4,300 in judgment -> boot/tow warning' },
  { plate: 'MEW4517', nickname: 'Unpaid, under threshold', why: '$530 unpaid but only ~$225 in judgment -> no boot/tow warning' },
  { plate: 'MDU5757', nickname: 'Parking: next penalty', why: 'parking ticket with $30 in penalties, next +$30 step' },
  { plate: 'LZW8260', nickname: 'Camera: $25 penalty', why: 'camera violation reaching its $25 late penalty' },
  { plate: 'MDP4680', nickname: 'Parking: partly paid', why: 'partly paid parking ticket, upcoming penalty step' },
];

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to seed test data in production.');

  const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [TEST_ACCOUNT.email]);
  if (rows[0]) await pool.query('DELETE FROM users WHERE id = $1', [rows[0].id]); // start fresh (cascades to cars)

  const { user } = await signup(TEST_ACCOUNT.email, TEST_ACCOUNT.password, 'Test Driver', TEST_ACCOUNT.language);
  for (const item of TEST_PLATES) {
    const { car, violationsFetchError } = await createCar(user.id, { nickname: item.nickname, plate: item.plate, state: 'NY' });
    console.log(`${car.plate.padEnd(8)} ${violationsFetchError ? `FETCH FAILED: ${violationsFetchError}` : 'ok'}  - ${item.why}`);
  }
  console.log(`\nSign in as ${TEST_ACCOUNT.email} / ${TEST_ACCOUNT.password}`);
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => pool.end());
