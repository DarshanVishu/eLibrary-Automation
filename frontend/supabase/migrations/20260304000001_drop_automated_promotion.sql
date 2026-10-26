drop function if exists public.run_grade_promotion_if_due();
drop trigger if exists trg_grade_promotion_config_updated_at on public.grade_promotion_config;
drop table if exists public.grade_promotion_config;
