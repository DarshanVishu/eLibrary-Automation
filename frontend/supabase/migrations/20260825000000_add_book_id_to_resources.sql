-- Migration: Add optional custom alphanumeric book_id to resources table
-- Allows admins and teachers to tag books with a custom identifier.

ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS book_id text;

-- Index for efficient lookup and search by custom book ID
CREATE INDEX IF NOT EXISTS idx_resources_book_id ON public.resources(book_id) WHERE book_id IS NOT NULL;

-- Update get_student_library RPC to include book_id in output while respecting global bypass and unrestricted materials
DROP FUNCTION IF EXISTS public.get_student_library(uuid);
CREATE OR REPLACE FUNCTION public.get_student_library(p_user_id uuid)
RETURNS TABLE (
  id              uuid,
  book_id         text,
  title           text,
  material_type   text,
  academic_year   text,
  thumbnail_url   text,
  storage_path    text,
  source_url      text,
  page_count      integer,
  created_at      timestamptz,
  subject_name    text,
  progress_pct    numeric,
  last_page       integer,
  last_viewed_at  timestamptz,
  is_bookmarked   boolean,
  grades          integer[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_grade  smallint;
  v_bypass boolean;
BEGIN
  -- Retrieve student grade
  SELECT p.grade INTO v_grade
  FROM public.profiles p
  WHERE p.id = p_user_id
    AND p.role = 'student'
    AND p.is_active = true;

  -- Retrieve global bypass setting (fully qualified table alias to prevent collision with return column 'id')
  SELECT settings.allow_all_grades_access INTO v_bypass
  FROM public.app_settings settings
  WHERE settings.id = 1;

  IF v_grade IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.book_id,
    r.title,
    r.material_type::text,
    r.academic_year,
    r.thumbnail_url,
    r.storage_path,
    r.source_url,
    r.page_count,
    r.created_at,
    s.name                                                     AS subject_name,
    coalesce(rp.progress_pct, 0)                               AS progress_pct,
    rp.last_page,
    rp.last_viewed_at,
    (bm.resource_id IS NOT NULL)                               AS is_bookmarked,
    coalesce(
      array_agg(DISTINCT rga.grade ORDER BY rga.grade)
        FILTER (WHERE rga.grade IS NOT NULL),
      array[]::integer[]
    )                                                          AS grades
  FROM public.resources r
  JOIN public.subjects s               ON s.id = r.subject_id
  LEFT JOIN public.resource_grade_access rga
       ON rga.resource_id = r.id
  LEFT JOIN public.reading_progress rp
       ON rp.resource_id = r.id
       AND rp.user_id = p_user_id
  LEFT JOIN public.bookmarks bm
       ON bm.resource_id = r.id
       AND bm.user_id = p_user_id
  WHERE r.published = true
    AND r.is_active = true
    AND (
      -- Global bypass: show everything
      v_bypass = true
      OR
      -- No grade rows at all → unrestricted, show to everyone
      NOT EXISTS (
        SELECT 1
        FROM public.resource_grade_access rga_filter
        WHERE rga_filter.resource_id = r.id
      )
      OR
      -- Grade rows exist and student's grade matches
      EXISTS (
        SELECT 1
        FROM public.resource_grade_access rga_filter
        WHERE rga_filter.resource_id = r.id
          AND rga_filter.grade = v_grade
      )
    )
  GROUP BY
    r.id, r.book_id, r.title, r.material_type, r.academic_year,
    r.thumbnail_url, r.storage_path, r.source_url,
    r.page_count, r.created_at,
    s.name,
    rp.progress_pct, rp.last_page, rp.last_viewed_at,
    bm.resource_id
  ORDER BY r.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_student_library(uuid) TO authenticated;

