-- Migration: Add file upload limits to plan configuration and usage tracking
-- Date: 2025-11-14
-- Description: Adds file_uploads_per_day to plan_limits_config and file_uploads_used to usage_limits
--              Updates increment_usage function to support 'file_upload' operation type

-- Step 1: Add file_uploads_per_day column to plan_limits_config
ALTER TABLE plan_limits_config
ADD COLUMN IF NOT EXISTS file_uploads_per_day INTEGER NOT NULL DEFAULT 1;

-- Step 2: Set default values for existing plans
-- Free plan: 1 file upload per day
-- Pro plan: unlimited file uploads (-1)
UPDATE plan_limits_config
SET file_uploads_per_day = 1
WHERE plan_type = 'free';

UPDATE plan_limits_config
SET file_uploads_per_day = -1
WHERE plan_type = 'pro';

-- Step 3: Add file_uploads_used column to usage_limits
ALTER TABLE usage_limits
ADD COLUMN IF NOT EXISTS file_uploads_used INTEGER NOT NULL DEFAULT 0;

-- Step 4: Update increment_usage function to support file_upload operation
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_operation_type TEXT
)
RETURNS VOID AS $$
DECLARE
  v_current_date DATE := CURRENT_DATE;
BEGIN
  -- Insere ou atualiza o contador
  INSERT INTO usage_limits (user_id, date, corrections_used, rewrites_used, ai_analyses_used, file_uploads_used)
  VALUES (
    p_user_id,
    v_current_date,
    CASE WHEN p_operation_type = 'correct' THEN 1 ELSE 0 END,
    CASE WHEN p_operation_type = 'rewrite' THEN 1 ELSE 0 END,
    CASE WHEN p_operation_type = 'ai_analysis' THEN 1 ELSE 0 END,
    CASE WHEN p_operation_type = 'file_upload' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    corrections_used = CASE
      WHEN p_operation_type = 'correct' THEN usage_limits.corrections_used + 1
      ELSE usage_limits.corrections_used
    END,
    rewrites_used = CASE
      WHEN p_operation_type = 'rewrite' THEN usage_limits.rewrites_used + 1
      ELSE usage_limits.rewrites_used
    END,
    ai_analyses_used = CASE
      WHEN p_operation_type = 'ai_analysis' THEN usage_limits.ai_analyses_used + 1
      ELSE usage_limits.ai_analyses_used
    END,
    file_uploads_used = CASE
      WHEN p_operation_type = 'file_upload' THEN usage_limits.file_uploads_used + 1
      ELSE usage_limits.file_uploads_used
    END,
    last_reset = NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_usage IS 'Incrementa contador de uso após operação bem-sucedida (correct, rewrite, ai_analysis, file_upload)';

-- Step 5: Verify the migration
DO $$
DECLARE
  free_file_uploads INT;
  pro_file_uploads INT;
  column_exists BOOLEAN;
BEGIN
  -- Check if column was added to plan_limits_config
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plan_limits_config'
    AND column_name = 'file_uploads_per_day'
  ) INTO column_exists;

  IF NOT column_exists THEN
    RAISE EXCEPTION 'Failed to add file_uploads_per_day column to plan_limits_config';
  END IF;

  -- Check if column was added to usage_limits
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'usage_limits'
    AND column_name = 'file_uploads_used'
  ) INTO column_exists;

  IF NOT column_exists THEN
    RAISE EXCEPTION 'Failed to add file_uploads_used column to usage_limits';
  END IF;

  -- Verify plan limits were set correctly
  SELECT file_uploads_per_day
  INTO free_file_uploads
  FROM plan_limits_config
  WHERE plan_type = 'free';

  SELECT file_uploads_per_day
  INTO pro_file_uploads
  FROM plan_limits_config
  WHERE plan_type = 'pro';

  IF free_file_uploads = 1 AND pro_file_uploads = -1 THEN
    RAISE NOTICE 'File upload limits successfully configured: free=1 upload/day, pro=unlimited';
  ELSE
    RAISE EXCEPTION 'Failed to configure file upload limits. Current values: free=%, pro=%',
      free_file_uploads, pro_file_uploads;
  END IF;

  RAISE NOTICE 'Migration 20251114_add_file_uploads_limits completed successfully';
END $$;
