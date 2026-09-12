-- Store the user's chosen vehicle silhouette so the same car appearance follows the account.
ALTER TABLE cars ADD COLUMN IF NOT EXISTS vehicle_icon TEXT NOT NULL DEFAULT 'sedan';
