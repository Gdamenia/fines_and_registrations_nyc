-- The user's chosen app language, so it follows the account across devices and the
-- server can write notifications (fine alerts, weekly reminders) in it.
-- NULL = never chosen: the app then uploads the language picked on its first screen
-- instead of the account silently defaulting to English.
ALTER TABLE users ADD COLUMN IF NOT EXISTS language TEXT
  CHECK (language IS NULL OR language IN ('en', 'ru', 'ka', 'es'));
