-- Add RLS policy to allow teachers to see student profiles
-- This fix ensures teachers can see the list of students in the teacher dashboard.

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;

CREATE POLICY "profiles_select_own_admin_or_teacher_seeing_students"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (id = auth.uid()) OR
  public.is_admin() OR
  (public.is_teacher() AND role = 'student')
);
