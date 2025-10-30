-- Migration: Update free plan limits to 3 corrections and 3 rewrites per day
-- Date: 2025-10-30
-- Description: Changes free plan from 5/5 to 3/3 daily limits for corrections and rewrites

UPDATE plan_limits_config
SET
  corrections_per_day = 3,
  rewrites_per_day = 3
WHERE plan_type = 'free';

-- Verify the update
DO $$
DECLARE
  free_corrections INT;
  free_rewrites INT;
BEGIN
  SELECT corrections_per_day, rewrites_per_day
  INTO free_corrections, free_rewrites
  FROM plan_limits_config
  WHERE plan_type = 'free';

  IF free_corrections = 3 AND free_rewrites = 3 THEN
    RAISE NOTICE 'Free plan limits successfully updated to 3 corrections and 3 rewrites per day';
  ELSE
    RAISE EXCEPTION 'Failed to update free plan limits. Current values: corrections=%, rewrites=%',
      free_corrections, free_rewrites;
  END IF;
END $$;
