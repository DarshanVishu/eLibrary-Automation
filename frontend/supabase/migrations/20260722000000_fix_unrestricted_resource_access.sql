-- Migration: Fix grade-constraint removal making resources invisible to students
--
-- Root cause:
--   The RLS policy, can_access_resource(), and get_student_library() all used
--   an EXISTS check against resource_grade_access.  When an admin removes all
--   grade restrictions from a resource the table has 0 rows for that resource,
--   so EXISTS returns false and students can no longer see it — even though the
--   intent of removing constraints is "visible to all grades".
--
-- Fix:
--   Treat 0 rows in resource_grade_access as "unrestricted" by adding a
--   NOT EXISTS guard:
--       no rows  → unrestricted (pass)
--       ≥1 row   → student grade must match one of them (existing behaviour)
--
-- All three places that encode this logic are updated atomically:
--   1. RLS policy  resources_read_by_role_and_grade
--   2. SECURITY DEFINER function  can_access_resource
--   3. SECURITY DEFINER function  get_student_library


-- ── 1. RLS policy ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS resources_read_by_role_and_grade ON public.resources;

CREATE POLICY resources_read_by_role_and_grade
ON public.resources
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND (
    public.is_admin()
    OR public.is_teacher()
    OR (
      public.current_user_role() = 'student'
      AND published = true
      AND (
        -- Global bypass: admins toggled "allow all grades access"
        (SELECT allow_all_grades_access FROM public.app_settings WHERE id = 1) = true
        OR
        -- No grade rows at all → resource is unrestricted
        NOT EXISTS (
          SELECT 1
          FROM public.resource_grade_access rga
          WHERE rga.resource_id = resources.id
        )
        OR
        -- Resource has grade rows and student's grade is one of them
        EXISTS (
          SELECT 1
          FROM public.resource_grade_access rga
          WHERE rga.resource_id = resources.id
            AND rga.grade = public.current_user_grade()
        )
      )
    )
  )
);


-- ── 2. can_access_resource() ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.can_access_resource(p_resource_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT p.role, p.grade, p.is_active
    FROM public.profiles p
    WHERE p.id = auth.uid()
  ),
  settings AS (
    SELECT allow_all_grades_access
    FROM public.app_settings
    WHERE id = 1
  )
  SELECT exists (
    SELECT 1
    FROM public.resources r
    CROSS JOIN me
    CROSS JOIN settings
    WHERE r.id = p_resource_id
      AND r.is_active  = true
      AND me.is_active = true
      AND (
        me.role IN ('admin', 'teacher')
        OR (
          me.role = 'student'
          AND r.published = true
          AND (
            -- Global bypass
            settings.allow_all_grades_access = true
            OR
            -- No grade rows → unrestricted
            NOT EXISTS (
              SELECT 1
              FROM public.resource_grade_access rga
              WHERE rga.resource_id = r.id
            )
            OR
            -- Grade rows exist and student matches
            EXISTS (
              SELECT 1
              FROM public.resource_grade_access rga
              WHERE rga.resource_id = r.id
                AND rga.grade = me.grade
            )
          )
        )
      )
  );
$$;


-- ── 3. get_student_library() ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_student_library(p_user_id uuid)
RETURNS TABLE (
  id              uuid,
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

  -- Retrieve global bypass setting
  SELECT allow_all_grades_access INTO v_bypass
  FROM public.app_settings
  WHERE id = 1;

  IF v_grade IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    r.id,
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
    r.id, r.title, r.material_type, r.academic_year,
    r.thumbnail_url, r.storage_path, r.source_url,
    r.page_count, r.created_at,
    s.name,
    rp.progress_pct, rp.last_page, rp.last_viewed_at,
    bm.resource_id
  ORDER BY r.created_at DESC;
END;
$$;
