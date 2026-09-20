-- ============================================================================
-- SLEEPLAB PHASE 2.6: SUPABASE DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- Copy and paste this script into your Supabase SQL Editor and click "Run".
-- ============================================================================

-- 1. Daily Entries Table
CREATE TABLE IF NOT EXISTS public.daily_entries (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_number INT NOT NULL,
    report_id TEXT NOT NULL,
    date DATE NOT NULL,
    sleep JSONB NOT NULL,
    morning JSONB NOT NULL,
    recovery JSONB NOT NULL,
    afternoon JSONB NOT NULL,
    evening JSONB NOT NULL,
    confounders JSONB NOT NULL DEFAULT '[]'::jsonb,
    additional_metrics JSONB DEFAULT '{}'::jsonb,
    calculated_metrics JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

-- 2. Custom Metric Definitions Table
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

-- 3. Study Configuration Table (Phase 2.6)
CREATE TABLE IF NOT EXISTS public.study_config (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'SleepLab N=1 Longitudinal Study',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    duration_days INT NOT NULL DEFAULT 30,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_entries_user_date ON public.daily_entries (user_id, date);
CREATE INDEX IF NOT EXISTS idx_custom_metrics_user_order ON public.custom_metric_definitions (user_id, order_num);

-- Enable Row Level Security (RLS)
ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_metric_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_config ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for daily_entries
DROP POLICY IF EXISTS "Users manage their own entries" ON public.daily_entries;
CREATE POLICY "Users manage their own entries" ON public.daily_entries
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create RLS Policies for custom_metric_definitions
DROP POLICY IF EXISTS "Users manage their custom metrics" ON public.custom_metric_definitions;
CREATE POLICY "Users manage their custom metrics" ON public.custom_metric_definitions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create RLS Policies for study_config
DROP POLICY IF EXISTS "Users manage their study config" ON public.study_config;
CREATE POLICY "Users manage their study config" ON public.study_config
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
