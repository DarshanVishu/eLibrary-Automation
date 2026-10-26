-- Create resource_annotations table
CREATE TABLE IF NOT EXISTS public.resource_annotations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resource_id uuid REFERENCES public.resources(id) ON DELETE CASCADE NOT NULL,
  page_number integer,
  annotation_data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resource_annotations_user_resource ON public.resource_annotations(user_id, resource_id);

-- RLS
ALTER TABLE public.resource_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own annotations"
  ON public.resource_annotations
  FOR ALL
  USING (auth.uid() = user_id);

-- Add to publications if using realtime
-- alter publication supabase_realtime add table public.resource_annotations;
