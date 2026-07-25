-- Projects table for installations portfolio
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  location text NOT NULL,
  sector text NOT NULL,
  year text NOT NULL,
  scope text NOT NULL,
  description text,
  cover_image text NOT NULL,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  related_sectors text[] NOT NULL DEFAULT '{}',
  grid_span text NOT NULL DEFAULT 'normal',
  is_published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published projects"
  ON public.projects FOR SELECT
  USING (is_published = true OR public.is_admin(auth.uid()));

CREATE POLICY "Admins manage projects"
  ON public.projects FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_projects_sector ON public.projects(sector);
CREATE INDEX idx_projects_published ON public.projects(is_published, sort_order);