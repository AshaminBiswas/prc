
CREATE TABLE public.about_page (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_singleton boolean NOT NULL DEFAULT true UNIQUE,

  hero_eyebrow text NOT NULL DEFAULT 'About PRCH',
  hero_title text NOT NULL DEFAULT 'Precision hardware, engineered with intent.',
  hero_subtitle text NOT NULL DEFAULT '',
  hero_image text,

  intro_eyebrow text NOT NULL DEFAULT 'Our story',
  intro_heading text NOT NULL DEFAULT '',
  intro_body text NOT NULL DEFAULT '',

  craft_eyebrow text NOT NULL DEFAULT 'The craft',
  craft_heading text NOT NULL DEFAULT '',
  craft_body text NOT NULL DEFAULT '',
  craft_image text,

  materials_eyebrow text NOT NULL DEFAULT 'The materials',
  materials_heading text NOT NULL DEFAULT '',
  materials_image text,
  materials jsonb NOT NULL DEFAULT '[]'::jsonb,

  stats jsonb NOT NULL DEFAULT '[]'::jsonb,

  principles_eyebrow text NOT NULL DEFAULT 'Principles',
  principles_heading text NOT NULL DEFAULT '',
  principles jsonb NOT NULL DEFAULT '[]'::jsonb,

  timeline_eyebrow text NOT NULL DEFAULT 'Timeline',
  timeline_heading text NOT NULL DEFAULT '',
  timeline jsonb NOT NULL DEFAULT '[]'::jsonb,

  closing_eyebrow text NOT NULL DEFAULT '',
  closing_heading text NOT NULL DEFAULT '',
  closing_body text NOT NULL DEFAULT '',
  closing_cta_label text NOT NULL DEFAULT '',
  closing_cta_href text NOT NULL DEFAULT '',
  closing_images jsonb NOT NULL DEFAULT '[]'::jsonb,

  seo_title text,
  seo_description text,
  og_image text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.about_page TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.about_page TO authenticated;
GRANT ALL ON public.about_page TO service_role;

ALTER TABLE public.about_page ENABLE ROW LEVEL SECURITY;

CREATE POLICY "About page is publicly readable"
  ON public.about_page FOR SELECT USING (true);

CREATE POLICY "Admins can insert about page"
  ON public.about_page FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update about page"
  ON public.about_page FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete about page"
  ON public.about_page FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_about_page_updated_at
  BEFORE UPDATE ON public.about_page
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.about_page (
  hero_eyebrow, hero_title, hero_subtitle,
  intro_heading, intro_body,
  craft_heading, craft_body,
  materials_heading, materials,
  stats,
  principles_heading, principles,
  timeline_heading, timeline,
  closing_eyebrow, closing_heading, closing_body, closing_cta_label, closing_cta_href
) VALUES (
  'About PRCH',
  'Precision hardware, engineered with intent.',
  'For the small parts that hold everything together — designed in detail, made to last, installed everywhere.',
  'Hardware that quietly does its job — for years.',
  E'PRCH began with a simple frustration: the fittings inside public washrooms, locker rooms and partitions were treated as an afterthought. Loose hinges. Dull finishes. Parts that failed within a year.\n\nWe set out to make hardware for these spaces the way it should be — precisely engineered, thoughtfully finished, and specified with the same care as the architecture around it. Every hinge, bracket and lock we ship is built to be handled thousands of times a day, in environments that don''t forgive shortcuts.\n\nToday, PRCH fittings are installed in offices, airports, schools and stadiums across the country. But the intent is unchanged: precision, at scale, without compromise.',
  'Made by hands that measure in microns.',
  E'Each PRCH component passes through a chain of specialists — from CNC operators machining tolerances tighter than 0.05 mm, to finishers who wet-sand every visible surface by hand.\n\nNothing leaves the floor without a serialised inspection stamp. If it doesn''t turn, latch or close the way we designed it to, it doesn''t ship.',
  'Three materials. One standard.',
  '[
    {"title":"Stainless Steel","description":"SS-304 and SS-316 grades — corrosion-resistant, salt-air tested, brushed or mirror finish."},
    {"title":"Aluminium Hardware","description":"Extruded 6063-T5 with anodised satin finish. Light, dimensionally stable, ideal for lockers."},
    {"title":"Nylon Hardware","description":"Glass-filled nylon 66 for silent operation, thermal stability and no cold-weld failures."}
  ]'::jsonb,
  '[
    {"number":"500+","label":"Projects delivered"},
    {"number":"18","label":"States shipped to"},
    {"number":"0.05mm","label":"Machining tolerance"},
    {"number":"10yr","label":"Standard warranty"}
  ]'::jsonb,
  'The rules we don''t break.',
  '[
    {"title":"Precision first","description":"Every tolerance, thread and radius is spec''d before a single part is cut. Guesswork is expensive."},
    {"title":"Built for cycles","description":"Our fittings are rated for 200,000+ operations. Public spaces are unforgiving; our hardware isn''t fragile."},
    {"title":"Specify by material","description":"Stainless, aluminium or nylon — each chosen for the environment, not for a datasheet number."},
    {"title":"Serviceable by design","description":"Standardised fasteners. Modular internals. Replaceable wear parts. Nothing is disposable."}
  ]'::jsonb,
  'A slow, deliberate build.',
  '[
    {"year":"2016","title":"First workshop","description":"Two machines, one bench, three hinges."},
    {"year":"2019","title":"First 100 projects","description":"Cubicle hardware shipped to schools across three states."},
    {"year":"2022","title":"Material lab opens","description":"In-house salt-spray, cycle and pull-strength testing."},
    {"year":"2024","title":"Nylon range launches","description":"Silent, thermally stable fittings for cold-chain and coastal sites."},
    {"year":"Today","title":"500+ installations","description":"Offices, airports, gyms and stadiums across the country."}
  ]'::jsonb,
  'Get in touch',
  'Talk to our specification team.',
  'Whether you''re specifying hardware for a single project or rolling out a national programme, we''ll help you pick the right material, finish and fittings.',
  'Contact us',
  '/contact'
);
