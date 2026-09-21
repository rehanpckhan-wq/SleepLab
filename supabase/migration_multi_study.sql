-- ============================================================================
-- SLEEPLAB MULTI-STUDY SUPABASE MIGRATION SCRIPT
-- Copy and paste this script into your Supabase SQL Editor and click "RUN".
-- ============================================================================

-- 1. Create Multi-Study Protocols Table (`studies`)
CREATE TABLE IF NOT EXISTS public.studies (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    duration_days INT NOT NULL DEFAULT 30,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add `study_id` column to `daily_entries` if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='daily_entries' AND column_name='study_id'
    ) THEN
        ALTER TABLE public.daily_entries ADD COLUMN study_id TEXT DEFAULT 'study-default';
    END IF;
END $$;

-- 3. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_studies_user_created ON public.studies (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_daily_entries_study_id ON public.daily_entries (user_id, study_id);

-- 4. Enable Row Level Security (RLS) on `studies`
ALTER TABLE public.studies ENABLE ROW LEVEL SECURITY;

-- 5. Create Row Level Security Policy for `studies`
DROP POLICY IF EXISTS "Users manage their own studies" ON public.studies;
CREATE POLICY "Users manage their own studies" ON public.studies
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6. Grant Access Permissions
GRANT ALL ON TABLE public.studies TO authenticated;
GRANT ALL ON TABLE public.studies TO service_role;
