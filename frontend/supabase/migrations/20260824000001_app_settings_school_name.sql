-- Adds school_name to app_settings for use in exported PDF report headers.
-- Falls back to platform_name if school_name is null or empty.

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS school_name text;
