-- Migration: Add bypass setting to app_settings
ALTER TABLE public.app_settings 
ADD COLUMN allow_all_grades_access BOOLEAN NOT NULL DEFAULT FALSE;

-- Update select policy on public.resources
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
        (SELECT allow_all_grades_access FROM public.app_settings WHERE id = 1) = true
        OR
        EXISTS (
          SELECT 1
          FROM public.resource_grade_access rga
          WHERE rga.resource_id = id
            AND rga.grade = public.current_user_grade()
        )
      )
    )
  )
);

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
      AND r.is_active = true
      AND me.is_active = true
      AND (
        me.role IN ('admin', 'teacher')
        OR (
          me.role = 'student'
          AND r.published = true
          AND (
            settings.allow_all_grades_access = true
            OR EXISTS (
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
  v_grade smallint;
  v_bypass boolean;
BEGIN
  -- Retrieve student grade details
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
    s.name                                                   as subject_name,
    coalesce(rp.progress_pct, 0)                             as progress_pct,
    rp.last_page,
    rp.last_viewed_at,
    (bm.resource_id IS NOT NULL)                             as is_bookmarked,
    coalesce(
      array_agg(distinct rga.grade order by rga.grade)
        filter (where rga.grade is not null),
      array[]::integer[]
    )                                                        as grades
  FROM public.resources r
  JOIN public.subjects s          ON s.id = r.subject_id
  LEFT JOIN public.resource_grade_access rga
       ON rga.resource_id = r.id
  LEFT JOIN public.reading_progress rp
       ON rp.resource_id = r.id
       AND rp.user_id = p_user_id
  LEFT JOIN public.bookmarks bm
       ON bm.resource_id = r.id
       AND bm.user_id = p_user_id
  WHERE r.published  = true
    AND r.is_active  = true
    AND (v_bypass = true OR EXISTS (
      SELECT 1 
      FROM public.resource_grade_access rga_filter 
      WHERE rga_filter.resource_id = r.id 
        AND rga_filter.grade = v_grade
    ))
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
