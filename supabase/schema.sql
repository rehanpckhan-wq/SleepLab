-- ============================================================================
-- SLEEPLAB COMPLETE MASTER DATABASE SCHEMA (ALL TABLES & POLICIES)
-- Copy and paste this script into your Supabase SQL Editor and click "RUN".
-- ============================================================================

-- 1. Multi-Study Protocols Table
CREATE TABLE IF NOT EXISTS public.studies (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'SleepLab N=1 Longitudinal Study',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    duration_days INT NOT NULL DEFAULT 30,
    description TEXT,
    schema JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Daily Entries Table
CREATE TABLE IF NOT EXISTS public.daily_entries (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    study_id TEXT DEFAULT 'study-default',
    day_number INT NOT NULL,
    report_id TEXT NOT NULL,
    date DATE NOT NULL,
    sleep JSONB NOT NULL,
    morning JSONB NOT NULL,
    recovery JSONB NOT NULL,
    afternoon JSONB NOT NULL,
    evening JSONB NOT NULL,
    confounders JSONB NOT NULL DEFAULT '[]'::jsonb,
    muted_metrics JSONB DEFAULT '[]'::jsonb,
    additional_metrics JSONB DEFAULT '{}'::jsonb,
    metrics_data JSONB DEFAULT '{}'::jsonb,
    calculated_metrics JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

-- 3. Custom Metric Definitions Table
CREATE TABLE IF NOT EXISTS public.custom_metric_definitions (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    config JSONB,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    order_num INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Legacy Study Config Table (For backward compatibility)
CREATE TABLE IF NOT EXISTS public.study_config (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'SleepLab N=1 Longitudinal Study',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    duration_days INT NOT NULL DEFAULT 30,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Indexes for Query Performance
CREATE INDEX IF NOT EXISTS idx_studies_user_created ON public.studies (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_daily_entries_user_date ON public.daily_entries (user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_entries_study_id ON public.daily_entries (user_id, study_id);
CREATE INDEX IF NOT EXISTS idx_custom_metrics_user_order ON public.custom_metric_definitions (user_id, order_num);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_metric_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_config ENABLE ROW LEVEL SECURITY;

-- RLS Policy: studies
DROP POLICY IF EXISTS "Users manage their own studies" ON public.studies;
CREATE POLICY "Users manage their own studies" ON public.studies
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: daily_entries
DROP POLICY IF EXISTS "Users manage their own entries" ON public.daily_entries;
CREATE POLICY "Users manage their own entries" ON public.daily_entries
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: custom_metric_definitions
DROP POLICY IF EXISTS "Users manage their custom metrics" ON public.custom_metric_definitions;
CREATE POLICY "Users manage their custom metrics" ON public.custom_metric_definitions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: study_config
DROP POLICY IF EXISTS "Users manage their study config" ON public.study_config;
CREATE POLICY "Users manage their study config" ON public.study_config
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Grant Access
GRANT ALL ON TABLE public.studies TO authenticated;
GRANT ALL ON TABLE public.daily_entries TO authenticated;
GRANT ALL ON TABLE public.custom_metric_definitions TO authenticated;
GRANT ALL ON TABLE public.study_config TO authenticated;
