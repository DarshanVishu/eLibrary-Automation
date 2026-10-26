-- Allow Admin and Teacher (staff) to read reading_progress, bookmarks, and resource_annotations for institutional analytics and report exports.

-- 1. reading_progress
DROP POLICY IF EXISTS reading_progress_owner_read ON public.reading_progress;
DROP POLICY IF EXISTS reading_progress_read_own_or_staff ON public.reading_progress;

CREATE POLICY reading_progress_read_own_or_staff
ON public.reading_progress
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_admin()
  OR public.is_teacher()
);

-- 2. bookmarks
DROP POLICY IF EXISTS bookmarks_owner_read ON public.bookmarks;
DROP POLICY IF EXISTS bookmarks_read_own_or_staff ON public.bookmarks;

CREATE POLICY bookmarks_read_own_or_staff
ON public.bookmarks
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_admin()
  OR public.is_teacher()
);

-- 3. resource_annotations
DROP POLICY IF EXISTS "Users can manage their own annotations" ON public.resource_annotations;
DROP POLICY IF EXISTS resource_annotations_manage_own ON public.resource_annotations;
DROP POLICY IF EXISTS resource_annotations_read_own_or_staff ON public.resource_annotations;
DROP POLICY IF EXISTS resource_annotations_insert_own ON public.resource_annotations;
DROP POLICY IF EXISTS resource_annotations_update_own ON public.resource_annotations;
DROP POLICY IF EXISTS resource_annotations_delete_own ON public.resource_annotations;

CREATE POLICY resource_annotations_read_own_or_staff
ON public.resource_annotations
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_admin()
  OR public.is_teacher()
);

CREATE POLICY resource_annotations_insert_own
ON public.resource_annotations
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY resource_annotations_update_own
ON public.resource_annotations
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
)
WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY resource_annotations_delete_own
ON public.resource_annotations
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
);
