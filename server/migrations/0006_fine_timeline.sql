-- Penalty / deadline timeline per stored violation (see src/fineTimeline.js for the rules).
-- Values are recomputed from the raw NYC record (`data`) on every fetch and by the daily
-- timeline job, because the countdown fields (days_since_issue, next penalty, judgment
-- status) change every day even when NYC's record doesn't.
ALTER TABLE violations
  ADD COLUMN IF NOT EXISTS ticket_type TEXT CHECK (ticket_type IS NULL OR ticket_type IN ('parking', 'camera')),
  ADD COLUMN IF NOT EXISTS issued_on DATE,                 -- issue_date parsed; never the date we first saw it
  ADD COLUMN IF NOT EXISTS original_amount NUMERIC,        -- NYC fine_amount
  ADD COLUMN IF NOT EXISTS current_amount NUMERIC GENERATED ALWAYS AS (amount_due) STORED, -- NYC balance (source of truth)
  ADD COLUMN IF NOT EXISTS penalty_amount NUMERIC,         -- late penalties as reported by NYC
  ADD COLUMN IF NOT EXISTS interest_amount NUMERIC,        -- judgment interest as reported by NYC
  ADD COLUMN IF NOT EXISTS days_since_issue INTEGER,
  ADD COLUMN IF NOT EXISTS due_date DATE,                  -- last day to pay before the next penalty
  ADD COLUMN IF NOT EXISTS next_penalty_date DATE,
  ADD COLUMN IF NOT EXISTS next_penalty_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS judgment_status TEXT,           -- none | approaching | likely | in_judgment
  ADD COLUMN IF NOT EXISTS judgment_date DATE,             -- NYC judgment_entry_date, when known
  ADD COLUMN IF NOT EXISTS estimated_judgment_date DATE,
  ADD COLUMN IF NOT EXISTS amount_in_judgment NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS timeline_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS violations_due_date_idx ON violations (due_date) WHERE due_date IS NOT NULL;
