const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('./db/pool');

const JWT_EXPIRES_IN = '30d'; // long-lived: mobile shouldn't need to re-login constantly

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set (see .env.example)');
  }
  return process.env.JWT_SECRET;
}

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, getJwtSecret(), {
    expiresIn: JWT_EXPIRES_IN,
  });
}

async function signup(email, password, fullName = null) {
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 10);

  let result;
  try {
    result = await pool.query(
      'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name',
      [normalizedEmail, passwordHash, fullName ? fullName.trim() : null]
    );
  } catch (err) {
    if (err.code === '23505') {
      // unique_violation on users.email
      const dup = new Error('An account with that email already exists.');
      dup.status = 409;
      throw dup;
    }
    throw err;
  }

  const user = result.rows[0];
  return { user, token: signToken(user) };
}

async function login(email, password) {
  const normalizedEmail = email.trim().toLowerCase();

  const { rows } = await pool.query(
    'SELECT id, email, full_name, password_hash FROM users WHERE email = $1',
    [normalizedEmail]
  );
  const row = rows[0];

  // Compare against a fixed dummy hash when the user doesn't exist so a login attempt for
  // an unknown email takes the same time as a wrong-password one (don't let response time
  // leak which emails have accounts).
  const hashToCompare = row ? row.password_hash : '$2a$10$CwTycUXWue0Thq9StjUM0uJ8kSNEwGGB.T.Rnq1pZ.gAJVaB9nqBu';
  const passwordMatches = await bcrypt.compare(password, hashToCompare);

  if (!row || !passwordMatches) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }

  const user = { id: row.id, email: row.email, full_name: row.full_name };
  return { user, token: signToken(user) };
}

async function updateProfile(userId, fullName) {
  const clean = String(fullName || '').trim();
  if (!clean) {
    const err = new Error('Nickname is required.');
    err.status = 400;
    throw err;
  }
  if (clean.length > 40) {
    const err = new Error('Nickname must be 40 characters or fewer.');
    err.status = 400;
    throw err;
  }
  const { rows } = await pool.query(
    'UPDATE users SET full_name = $1 WHERE id = $2 RETURNING id, email, full_name',
    [clean, userId]
  );
  if (!rows[0]) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }
  return rows[0];
}

function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}

module.exports = { signup, login, updateProfile, verifyToken };
