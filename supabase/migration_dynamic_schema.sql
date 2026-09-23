-- ============================================================================
-- SLEEPLAB DYNAMIC PROTOCOL SCHEMA MIGRATION
-- Copy and paste this script into your Supabase SQL Editor and click "RUN".
-- ============================================================================

-- 1. Add `schema` JSONB column to `studies` table if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='studies' AND column_name='schema'
    ) THEN
        ALTER TABLE public.studies ADD COLUMN schema JSONB;
    END IF;
END $$;

-- 2. Add `metrics_data` JSONB column to `daily_entries` table if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='daily_entries' AND column_name='metrics_data'
    ) THEN
        ALTER TABLE public.daily_entries ADD COLUMN metrics_data JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;
