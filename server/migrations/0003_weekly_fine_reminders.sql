-- Allow notification_events to represent both newly detected fines and weekly reminders.
ALTER TABLE notification_events ALTER COLUMN violation_id DROP NOT NULL;
ALTER TABLE notification_events ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'new_fine';
ALTER TABLE notification_events ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE notification_events ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE notification_events ADD COLUMN IF NOT EXISTS reminder_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS notification_events_reminder_key_unique
  ON notification_events (reminder_key)
  WHERE reminder_key IS NOT NULL;
