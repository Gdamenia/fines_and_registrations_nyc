-- Accounts, saved cars, and their fetched violations/registrations + push infra.
-- See CONTEXT.md for the product plan this implements.

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A car is one user's tracked vehicle. plate+state is what the violations dataset is
-- queried by; vin is what the registration dataset is queried by (see CONTEXT.md — the
-- registration dataset has no plate field at all, by design/DPPA). Nickname is the
-- user-chosen display name shown in the dashboard instead of the raw plate/VIN.
CREATE TABLE cars (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  plate TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'NY',
  vin TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX cars_user_id_idx ON cars (user_id);

-- One row per violation ever seen for a car. `data` holds the full raw Socrata record
-- (its schema isn't ours to fix, and NYC has changed dataset columns before — see
-- CONTEXT.md's pxdn-gtu9 note) alongside a few columns pulled out for querying/display.
-- Deduped per-car (not globally) by summons_number, so two different users tracking the
-- same physical plate each get their own copy and their own notifications.
CREATE TABLE violations (
  id SERIAL PRIMARY KEY,
  car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  summons_number TEXT NOT NULL,
  amount_due NUMERIC,
  issue_date TEXT, -- raw MM/DD/YYYY string from Socrata, not a real date type — see CONTEXT.md
  violation TEXT,
  data JSONB NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (car_id, summons_number)
);
CREATE INDEX violations_car_id_idx ON violations (car_id);

-- One row per car (registration is a live snapshot we refresh, not an append-only log).
CREATE TABLE registrations (
  id SERIAL PRIMARY KEY,
  car_id INTEGER NOT NULL UNIQUE REFERENCES cars(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Registered Expo push tokens for a user's device(s). Empty until the mobile app exists
-- and registers one — the cron/notification pipeline is built to work the moment a row
-- shows up here, nothing else needs to change.
CREATE TABLE push_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, expo_push_token)
);

-- One row per new violation the cron finds, so we know what's been notified already
-- (and this doubles as a "recent activity" feed for the dashboard later).
CREATE TABLE notification_events (
  id SERIAL PRIMARY KEY,
  car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  violation_id INTEGER NOT NULL REFERENCES violations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);
CREATE INDEX notification_events_sent_at_idx ON notification_events (sent_at);
