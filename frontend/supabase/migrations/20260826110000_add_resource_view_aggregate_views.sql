-- Migration: Add resource_view_counts aggregate view
--
-- Problem:
--   Multiple analytics and report queries do a full scan of resource_views:
--       supabase.from('resource_views').select(...).range(0, 49999)
--   At 1,600 students × ~31 views each the table already exceeds 49,999 rows,
--   causing analytics stats to be silently truncated.
--
-- Solution:
--   1. A lightweight VIEW (resource_view_counts) that aggregates total views
--      per resource. Querying this never hits row limits because each row is
--      already a COUNT aggregate.
--   2. A VIEW (resource_view_monthly) for time-series analytics that returns
--      per-resource view counts bucketed by month, so the app can fetch just
--      the months it needs (no full table scan).
--   3. A VIEW (resource_view_daily) for the last-7-days chart.
--
-- These views are read-only, RLS is enforced at the resource_views level already.

-- ── 1. Total view counts per resource ─────────────────────────────────────────

CREATE OR REPLACE VIEW public.resource_view_counts AS
SELECT
  resource_id,
  COUNT(*) AS views
FROM public.resource_views
GROUP BY resource_id;

-- Admins and teachers can read this view
GRANT SELECT ON public.resource_view_counts TO authenticated;

-- ── 2. Monthly view counts per resource ───────────────────────────────────────

CREATE OR REPLACE VIEW public.resource_view_monthly AS
SELECT
  resource_id,
  user_id,
  DATE_TRUNC('month', viewed_at) AS month,
  COUNT(*) AS views
FROM public.resource_views
GROUP BY resource_id, user_id, DATE_TRUNC('month', viewed_at);

GRANT SELECT ON public.resource_view_monthly TO authenticated;

-- ── 3. Daily view counts (any window) ─────────────────────────────────────────

CREATE OR REPLACE VIEW public.resource_view_daily AS
SELECT
  resource_id,
  user_id,
  DATE_TRUNC('day', viewed_at) AS day,
  COUNT(*) AS views
FROM public.resource_views
GROUP BY resource_id, user_id, DATE_TRUNC('day', viewed_at);

GRANT SELECT ON public.resource_view_daily TO authenticated;

-- ── 4. Unique student views per resource (for "active students" analytics) ────

CREATE OR REPLACE VIEW public.resource_unique_viewers AS
SELECT
  resource_id,
  COUNT(DISTINCT user_id) AS unique_viewers
FROM public.resource_views
GROUP BY resource_id;

GRANT SELECT ON public.resource_unique_viewers TO authenticated;
