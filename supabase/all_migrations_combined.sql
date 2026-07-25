-- ALL PRCH MIGRATIONS COMBINED

-- Migration: 20260717043142_fa874bb9-0ef0-45f4-85ca-e7646c264f03.sql

-- ===== ROLES =====
CREATE TYPE public.app_role AS ENUM (
  'super_admin', 'manager', 'sales_manager', 'inventory_manager',
  'content_manager', 'customer_support', 'marketing_manager'
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id);
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ===== PROFILES =====
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles self" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id OR public.is_admin(auth.uid())) WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== updated_at helper =====
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ===== CATEGORIES =====
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  icon_url text,
  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  seo_title text,
  seo_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active categories" ON public.categories FOR SELECT TO anon, authenticated USING (status = 'active' OR public.is_admin(auth.uid()));
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== MATERIALS =====
CREATE TABLE public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.materials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.materials TO authenticated;
GRANT ALL ON public.materials TO service_role;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active materials" ON public.materials FOR SELECT TO anon, authenticated USING (status = 'active' OR public.is_admin(auth.uid()));
CREATE POLICY "Admins manage materials" ON public.materials FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER materials_updated BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== BRANDS =====
CREATE TABLE public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  banner_url text,
  description text,
  website_url text,
  seo_title text,
  seo_description text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.brands TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brands TO authenticated;
GRANT ALL ON public.brands TO service_role;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active brands" ON public.brands FOR SELECT TO anon, authenticated USING (status = 'active' OR public.is_admin(auth.uid()));
CREATE POLICY "Admins manage brands" ON public.brands FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER brands_updated BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== COLLECTIONS =====
CREATE TABLE public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  featured boolean NOT NULL DEFAULT false,
  is_automatic boolean NOT NULL DEFAULT false,
  rules jsonb,
  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.collections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated;
GRANT ALL ON public.collections TO service_role;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active collections" ON public.collections FOR SELECT TO anon, authenticated USING (status = 'active' OR public.is_admin(auth.uid()));
CREATE POLICY "Admins manage collections" ON public.collections FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER collections_updated BEFORE UPDATE ON public.collections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== PRODUCTS =====
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sku text UNIQUE,
  barcode text,
  description text,
  short_description text,
  specifications jsonb DEFAULT '{}'::jsonb,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  collection_id uuid REFERENCES public.collections(id) ON DELETE SET NULL,
  material_id uuid REFERENCES public.materials(id) ON DELETE SET NULL,
  finish text,
  tags text[] DEFAULT '{}',
  price numeric(12,2) NOT NULL DEFAULT 0,
  mrp numeric(12,2),
  offer_price numeric(12,2),
  gst numeric(5,2),
  hsn text,
  weight numeric(10,3),
  dimensions jsonb,
  stock int NOT NULL DEFAULT 0,
  min_stock int NOT NULL DEFAULT 0,
  images text[] DEFAULT '{}',
  videos text[] DEFAULT '{}',
  brochure_url text,
  install_guide_url text,
  warranty text,
  featured boolean NOT NULL DEFAULT false,
  trending boolean NOT NULL DEFAULT false,
  best_seller boolean NOT NULL DEFAULT false,
  visibility text NOT NULL DEFAULT 'public',
  status text NOT NULL DEFAULT 'draft', -- draft|published|archived
  seo_title text,
  seo_description text,
  og_image text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_category_idx ON public.products(category_id);
CREATE INDEX products_brand_idx ON public.products(brand_id);
CREATE INDEX products_material_idx ON public.products(material_id);
CREATE INDEX products_status_idx ON public.products(status);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published products" ON public.products FOR SELECT TO anon, authenticated USING (status = 'published' OR public.is_admin(auth.uid()));
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== BANNERS =====
CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL, -- homepage_hero, homepage_secondary, category, brand, offer, popup, mobile, desktop, sidebar, footer
  title text,
  subtitle text,
  description text,
  image_url text,
  mobile_image_url text,
  tablet_image_url text,
  button_text text,
  button_link text,
  display_order int NOT NULL DEFAULT 0,
  start_date timestamptz,
  end_date timestamptz,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.banners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.banners TO authenticated;
GRANT ALL ON public.banners TO service_role;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active banners" ON public.banners FOR SELECT TO anon, authenticated USING (status = 'active' OR public.is_admin(auth.uid()));
CREATE POLICY "Admins manage banners" ON public.banners FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER banners_updated BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== OFFERS =====
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  discount_type text NOT NULL DEFAULT 'percentage', -- percentage|fixed
  discount_value numeric(10,2) NOT NULL DEFAULT 0,
  applies_to text NOT NULL DEFAULT 'product', -- product|category|brand|all
  applicable_ids uuid[] DEFAULT '{}',
  priority int NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  banner_url text,
  description text,
  start_date timestamptz,
  end_date timestamptz,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.offers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offers TO authenticated;
GRANT ALL ON public.offers TO service_role;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active offers" ON public.offers FOR SELECT TO anon, authenticated USING (status = 'active' OR public.is_admin(auth.uid()));
CREATE POLICY "Admins manage offers" ON public.offers FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER offers_updated BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== COUPONS =====
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric(10,2) NOT NULL DEFAULT 0,
  usage_limit int,
  times_used int NOT NULL DEFAULT 0,
  min_purchase numeric(12,2),
  max_discount numeric(12,2),
  applicable_products uuid[] DEFAULT '{}',
  applicable_categories uuid[] DEFAULT '{}',
  expiry_date timestamptz,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER coupons_updated BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== ORDERS =====
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE DEFAULT ('PRCH-' || to_char(now(),'YYYYMMDD') || '-' || substr(gen_random_uuid()::text,1,6)),
  customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending', -- pending|processing|completed|cancelled|returned|refunded
  payment_status text NOT NULL DEFAULT 'pending',
  payment_method text,
  delivery_status text NOT NULL DEFAULT 'pending',
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  tax numeric(12,2) NOT NULL DEFAULT 0,
  shipping numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  shipping_address jsonb,
  billing_address jsonb,
  tracking_number text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers view own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = customer_id OR public.is_admin(auth.uid()));
CREATE POLICY "Customers create orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Admins manage orders" ON public.orders FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== REVIEWS =====
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  comment text,
  images text[] DEFAULT '{}',
  verified_purchase boolean NOT NULL DEFAULT false,
  featured boolean NOT NULL DEFAULT false,
  admin_reply text,
  status text NOT NULL DEFAULT 'pending', -- pending|approved|rejected
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads approved reviews" ON public.reviews FOR SELECT TO anon, authenticated USING (status = 'approved' OR auth.uid() = customer_id OR public.is_admin(auth.uid()));
CREATE POLICY "Customers write reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Admins manage reviews" ON public.reviews FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER reviews_updated BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== MEDIA FILES =====
CREATE TABLE public.media_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  path text NOT NULL,
  filename text NOT NULL,
  size int,
  mime_type text,
  folder text DEFAULT 'general',
  tags text[] DEFAULT '{}',
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_files TO authenticated;
GRANT ALL ON public.media_files TO service_role;
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage media" ON public.media_files FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ===== CMS PAGES =====
CREATE TABLE public.cms_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  content jsonb DEFAULT '{}'::jsonb,
  meta_title text,
  meta_description text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cms_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_pages TO authenticated;
GRANT ALL ON public.cms_pages TO service_role;
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published pages" ON public.cms_pages FOR SELECT TO anon, authenticated USING (status = 'published' OR public.is_admin(auth.uid()));
CREATE POLICY "Admins manage pages" ON public.cms_pages FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER cms_pages_updated BEFORE UPDATE ON public.cms_pages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== BLOG =====
CREATE TABLE public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_categories TO authenticated;
GRANT ALL ON public.blog_categories TO service_role;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads blog cats" ON public.blog_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage blog cats" ON public.blog_categories FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text,
  cover_image text,
  category_id uuid REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  tags text[] DEFAULT '{}',
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  meta_title text,
  meta_description text,
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published posts" ON public.blog_posts FOR SELECT TO anon, authenticated USING (status = 'published' OR public.is_admin(auth.uid()));
CREATE POLICY "Admins manage posts" ON public.blog_posts FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER blog_posts_updated BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== ACTIVITY LOGS =====
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read activity" ON public.activity_logs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins insert activity" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()) AND admin_id = auth.uid());

-- ===== SITE SETTINGS =====
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_public boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads public settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (is_public = true OR public.is_admin(auth.uid()));
CREATE POLICY "Admins manage settings" ON public.site_settings FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER site_settings_updated BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== SEED: bootstrap first signed-in user as super_admin =====
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER bootstrap_first_admin_trg AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.bootstrap_first_admin();

-- ===== SEED: initial categories & materials from brand taxonomy =====
INSERT INTO public.categories (name, slug, sort_order) VALUES
  ('Cubicle Hardware', 'cubicle-hardware', 1),
  ('Locker Hardware', 'locker-hardware', 2),
  ('Toilet Partition Hardware', 'toilet-partition-hardware', 3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.materials (name, slug, sort_order) VALUES
  ('Stainless Steel', 'stainless-steel', 1),
  ('Aluminium Hardware', 'aluminium-hardware', 2),
  ('Nylon Hardware', 'nylon-hardware', 3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.site_settings (key, value, is_public) VALUES
  ('company', jsonb_build_object('name','PRCH','tagline','Precision Hardware','email','','phone',''), true)
ON CONFLICT (key) DO NOTHING;


-- Migration: 20260717043215_fad96457-1461-4431-a168-5771506b14a6.sql

CREATE POLICY "Public read media" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'media');
CREATE POLICY "Admins upload media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media' AND public.is_admin(auth.uid()));
CREATE POLICY "Admins update media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media' AND public.is_admin(auth.uid()));
CREATE POLICY "Admins delete media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media' AND public.is_admin(auth.uid()));


-- Migration: 20260717043238_393fe135-daa4-496d-8f1f-fe8a94a1caa2.sql

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;


-- Migration: 20260717092214_45129b20-855d-4ea0-997d-a49fe35388aa.sql

-- 1) Account ID on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_id text UNIQUE;

CREATE OR REPLACE FUNCTION public.generate_account_id()
RETURNS text LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  new_id text;
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
BEGIN
  LOOP
    new_id := 'ACC-';
    FOR i IN 1..8 LOOP
      new_id := new_id || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE account_id = new_id);
  END LOOP;
  RETURN new_id;
END; $$;

CREATE OR REPLACE FUNCTION public.set_profile_account_id()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.account_id IS NULL THEN
    NEW.account_id := public.generate_account_id();
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS profiles_set_account_id ON public.profiles;
CREATE TRIGGER profiles_set_account_id BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_profile_account_id();

UPDATE public.profiles SET account_id = public.generate_account_id() WHERE account_id IS NULL;
ALTER TABLE public.profiles ALTER COLUMN account_id SET NOT NULL;

-- 2) Addresses
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  alt_phone text,
  line1 text NOT NULL,
  line2 text,
  landmark text,
  city text NOT NULL,
  state text NOT NULL,
  pin_code text NOT NULL,
  country text NOT NULL DEFAULT 'India',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own addresses" ON public.addresses FOR ALL
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER addresses_updated BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) Cart items
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  variant text,
  material_finish text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id, variant, material_finish)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cart" ON public.cart_items FOR ALL
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER cart_items_updated BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- Migration: 20260717092253_fbbab21e-2c85-4360-af6d-d54508300be9.sql

REVOKE EXECUTE ON FUNCTION public.generate_account_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_profile_account_id() FROM PUBLIC, anon, authenticated;


-- Migration: 20260718060046_06ab4064-5fbb-46cb-878c-4de521b382c4.sql

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS url_hash text UNIQUE;

CREATE OR REPLACE FUNCTION public.compute_profile_url_hash(_account_id text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions
AS $$
  SELECT substr(
    encode(
      extensions.digest(_account_id || '::prch::7f3a9c1e8b2d4a6f0e5c9d3b1a7f2e4c', 'sha256'),
      'hex'
    ),
    1, 24
  );
$$;

CREATE OR REPLACE FUNCTION public.set_profile_url_hash()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.url_hash IS NULL AND NEW.account_id IS NOT NULL THEN
    NEW.url_hash := public.compute_profile_url_hash(NEW.account_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_url_hash ON public.profiles;
CREATE TRIGGER profiles_set_url_hash
  BEFORE INSERT OR UPDATE OF account_id ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_profile_url_hash();

UPDATE public.profiles
SET url_hash = public.compute_profile_url_hash(account_id)
WHERE url_hash IS NULL AND account_id IS NOT NULL;


-- Migration: 20260718083942_003eb79f-e849-4f5e-bdbe-81a5d3199ea9.sql

CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a contact message" ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (
  length(name) BETWEEN 1 AND 100
  AND length(email) BETWEEN 3 AND 255
  AND length(message) BETWEEN 1 AND 2000
  AND (company IS NULL OR length(company) <= 150)
);


-- Migration: 20260718084659_c76f51e3-f3b7-43a6-9596-f5cd9ad90384.sql

ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

GRANT SELECT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;

DROP POLICY IF EXISTS "Admins can view contact messages" ON public.contact_messages;
CREATE POLICY "Admins can view contact messages" ON public.contact_messages
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;
CREATE POLICY "Admins can update contact messages" ON public.contact_messages
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete contact messages" ON public.contact_messages;
CREATE POLICY "Admins can delete contact messages" ON public.contact_messages
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

DROP TRIGGER IF EXISTS contact_messages_updated_at ON public.contact_messages;
CREATE TRIGGER contact_messages_updated_at BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx ON public.contact_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS contact_messages_status_idx ON public.contact_messages (status);


-- Migration: 20260718092859_177911a6-6016-47a1-958c-cd9c240b69d7.sql

CREATE TYPE public.appointment_status AS ENUM ('pending','confirmed','rescheduled','completed','cancelled','rejected');
CREATE TYPE public.appointment_meeting_type AS ENUM ('video','phone','factory_visit','showroom_visit','onsite_visit');

CREATE TABLE public.appointment_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  capacity int NOT NULL DEFAULT 1 CHECK (capacity >= 1),
  meeting_types public.appointment_meeting_type[] NOT NULL DEFAULT ARRAY['video','phone','factory_visit','showroom_visit','onsite_visit']::public.appointment_meeting_type[],
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT appointment_slots_time_valid CHECK (ends_at > starts_at)
);

GRANT SELECT ON public.appointment_slots TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.appointment_slots TO authenticated;
GRANT ALL ON public.appointment_slots TO service_role;

ALTER TABLE public.appointment_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active future slots" ON public.appointment_slots
  FOR SELECT TO anon, authenticated
  USING (is_active = true AND starts_at > now());

CREATE POLICY "Admins view all slots" ON public.appointment_slots
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins insert slots" ON public.appointment_slots
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins update slots" ON public.appointment_slots
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete slots" ON public.appointment_slots
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER appointment_slots_set_updated_at
  BEFORE UPDATE ON public.appointment_slots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL REFERENCES public.appointment_slots(id) ON DELETE RESTRICT,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  account_id text,
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  meeting_type public.appointment_meeting_type NOT NULL,
  estimated_quantity text,
  product_interest text,
  project_details text NOT NULL,
  onsite_address text,
  status public.appointment_status NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX appointments_slot_id_idx ON public.appointments(slot_id);
CREATE INDEX appointments_user_id_idx ON public.appointments(user_id);
CREATE INDEX appointments_status_idx ON public.appointments(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT INSERT ON public.appointments TO anon;
GRANT ALL ON public.appointments TO service_role;

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create appointments" ON public.appointments
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Users view own appointments" ON public.appointments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins view all appointments" ON public.appointments
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins update appointments" ON public.appointments
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete appointments" ON public.appointments
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER appointments_set_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.appointment_check_capacity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  slot_cap int;
  active_count int;
  slot_active boolean;
  slot_start timestamptz;
  allowed public.appointment_meeting_type[];
BEGIN
  SELECT capacity, is_active, starts_at, meeting_types
    INTO slot_cap, slot_active, slot_start, allowed
  FROM public.appointment_slots WHERE id = NEW.slot_id FOR UPDATE;

  IF slot_cap IS NULL THEN
    RAISE EXCEPTION 'Slot not found';
  END IF;
  IF NOT slot_active THEN
    RAISE EXCEPTION 'Slot is not available';
  END IF;
  IF slot_start <= now() THEN
    RAISE EXCEPTION 'Slot is in the past';
  END IF;
  IF NOT (NEW.meeting_type = ANY(allowed)) THEN
    RAISE EXCEPTION 'Meeting type not allowed for this slot';
  END IF;

  SELECT count(*) INTO active_count
  FROM public.appointments
  WHERE slot_id = NEW.slot_id
    AND status NOT IN ('cancelled','rejected')
    AND (TG_OP = 'INSERT' OR id <> NEW.id);

  IF active_count >= slot_cap THEN
    RAISE EXCEPTION 'This time slot is fully booked';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER appointments_capacity_guard
  BEFORE INSERT OR UPDATE OF slot_id, status, meeting_type ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.appointment_check_capacity();


-- Migration: 20260718093637_b429d8d0-4ca4-403d-8973-c4da90cef5a0.sql

CREATE OR REPLACE FUNCTION public.normalize_phone(_raw text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  has_plus boolean;
  digits text;
BEGIN
  IF _raw IS NULL THEN RETURN NULL; END IF;
  has_plus := position('+' in _raw) = 1;
  digits := regexp_replace(_raw, '\D', '', 'g');
  IF digits = '' THEN RETURN ''; END IF;
  RETURN CASE WHEN has_plus THEN '+' || digits ELSE digits END;
END;
$$;

CREATE OR REPLACE FUNCTION public.appointment_validate_phone()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  normalized text;
  digit_count int;
BEGIN
  IF NEW.phone IS NULL OR btrim(NEW.phone) = '' THEN
    RAISE EXCEPTION 'Phone number is required' USING ERRCODE = '22023';
  END IF;

  IF NEW.phone !~ '^[+0-9\s\-()]+$' THEN
    RAISE EXCEPTION 'Phone may only contain digits, spaces, +, -, and parentheses' USING ERRCODE = '22023';
  END IF;

  normalized := public.normalize_phone(NEW.phone);
  digit_count := length(regexp_replace(normalized, '\D', '', 'g'));

  IF digit_count < 8 OR digit_count > 15 THEN
    RAISE EXCEPTION 'Phone must contain 8 to 15 digits (include country code)' USING ERRCODE = '22023';
  END IF;

  NEW.phone := normalized;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_appointment_validate_phone ON public.appointments;
CREATE TRIGGER trg_appointment_validate_phone
BEFORE INSERT OR UPDATE OF phone ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.appointment_validate_phone();


-- Migration: 20260718100358_4e31135b-a4f7-49c0-bc49-e02f52386f49.sql
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

-- Migration: 20260718100504_cfe7ca5c-3867-49cb-958d-a3ee7c9f84aa.sql
ALTER TABLE public.projects DROP COLUMN cover_image;

-- Migration: 20260718101031_50034a9c-2a33-4b5c-a06a-ef8128cb64ab.sql

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


-- Migration: 20260718120544_afe9ca00-f709-4f9e-8e9b-ab54ebb5e21d.sql
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS payment_gateway_order_id text;
CREATE INDEX IF NOT EXISTS orders_payment_reference_idx ON public.orders(payment_reference);

-- Migration: 20260718120908_1b754e0d-e213-4c11-8094-0e2a1fbbe887.sql

CREATE TABLE public.pending_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  razorpay_order_id TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  shipping_address JSONB NOT NULL,
  billing_address JSONB NOT NULL,
  subtotal NUMERIC NOT NULL,
  tax NUMERIC NOT NULL,
  shipping NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'awaiting_payment',
  finalized_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pending_orders TO authenticated;
GRANT ALL ON public.pending_orders TO service_role;

ALTER TABLE public.pending_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own pending orders"
  ON public.pending_orders FOR SELECT
  USING (auth.uid() = customer_id);

CREATE TRIGGER pending_orders_set_updated_at
  BEFORE UPDATE ON public.pending_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS orders_payment_gateway_order_id_uniq
  ON public.orders (payment_gateway_order_id)
  WHERE payment_gateway_order_id IS NOT NULL;


-- Migration: 20260718122403_9751568f-a705-400e-84ed-532fea38d3dc.sql

CREATE TABLE public.razorpay_webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  signature_valid BOOLEAN NOT NULL DEFAULT false,
  outcome TEXT NOT NULL,
  note TEXT,
  finalized_order_id UUID,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rzp_webhook_events_created ON public.razorpay_webhook_events(created_at DESC);
CREATE INDEX idx_rzp_webhook_events_order ON public.razorpay_webhook_events(razorpay_order_id);
GRANT SELECT ON public.razorpay_webhook_events TO authenticated;
GRANT ALL ON public.razorpay_webhook_events TO service_role;
ALTER TABLE public.razorpay_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view webhook events" ON public.razorpay_webhook_events
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'sales_manager')
  );


-- Migration: 20260720035515_00cc17cd-f3d2-4b9c-a840-487acecf39c3.sql

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'::app_role
  );
$$;

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Super admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;

DROP POLICY IF EXISTS "Anyone can create appointments" ON public.appointments;
CREATE POLICY "Anyone can create appointments" ON public.appointments
  FOR INSERT
  WITH CHECK (
    status = 'pending'::appointment_status
    AND (user_id IS NULL OR user_id = auth.uid())
  );


-- Migration: 20260721041221_2c3e58ca-c656-4805-8dd6-099d84944bc0.sql

CREATE TABLE public.warranty_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL,
  product TEXT NOT NULL,
  purchase_date DATE NOT NULL,
  issue TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.warranty_claims TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.warranty_claims TO authenticated;
GRANT ALL ON public.warranty_claims TO service_role;

ALTER TABLE public.warranty_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit warranty claims"
  ON public.warranty_claims FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can view warranty claims"
  ON public.warranty_claims FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'customer_support'));

CREATE POLICY "Staff can update warranty claims"
  ON public.warranty_claims FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'customer_support'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'customer_support'));

CREATE POLICY "Super admins can delete warranty claims"
  ON public.warranty_claims FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_warranty_claims_updated_at
  BEFORE UPDATE ON public.warranty_claims
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- Migration: 20260721041247_051db739-6576-4389-aeab-c4d57de3ece5.sql

DROP POLICY IF EXISTS "Anyone can submit warranty claims" ON public.warranty_claims;

CREATE POLICY "Anyone can submit warranty claims"
  ON public.warranty_claims FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(btrim(order_id)) BETWEEN 1 AND 100
    AND length(btrim(product)) BETWEEN 1 AND 200
    AND length(btrim(issue)) BETWEEN 10 AND 4000
    AND contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(contact_email) <= 255
    AND purchase_date <= current_date
    AND purchase_date >= (current_date - interval '30 years')
    AND status = 'new'
  );




-- ==========================================
-- Migration: Fix Function Execution Permissions
-- ==========================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_account_id() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.compute_profile_url_hash(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_profile_account_id() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_profile_url_hash() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO anon, authenticated, service_role;



-- ==========================================
-- Migration: Assign Admin Roles & Auto-Grant Trigger
-- ==========================================

-- 1. Grant admin role to all registered accounts in auth.users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Update handle_new_user trigger function to automatically grant admin role on registration
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 3. Ensure permissions on user_roles & functions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.user_roles TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;


-- ==========================================
-- Migration: Fix Supabase Storage Media Bucket & RLS Policies
-- ==========================================

-- 1. Create public 'media' storage bucket if missing
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing media policies if any to avoid duplication
DROP POLICY IF EXISTS "Public Read Media" ON storage.objects;
DROP POLICY IF EXISTS "Allow Upload Media" ON storage.objects;
DROP POLICY IF EXISTS "Allow Update Media" ON storage.objects;
DROP POLICY IF EXISTS "Allow Delete Media" ON storage.objects;

-- 3. Public Read Access for 'media' bucket
CREATE POLICY "Public Read Media"
ON storage.objects FOR SELECT
TO anon, authenticated, service_role
USING (bucket_id = 'media');

-- 4. Allow Uploads to 'media' bucket
CREATE POLICY "Allow Upload Media"
ON storage.objects FOR INSERT
TO anon, authenticated, service_role
WITH CHECK (bucket_id = 'media');

-- 5. Allow Updates to 'media' bucket
CREATE POLICY "Allow Update Media"
ON storage.objects FOR UPDATE
TO anon, authenticated, service_role
USING (bucket_id = 'media');

-- 6. Allow Deletions from 'media' bucket
CREATE POLICY "Allow Delete Media"
ON storage.objects FOR DELETE
TO anon, authenticated, service_role
USING (bucket_id = 'media');

-- Default display_order to 1 to prevent NOT NULL constraint error
ALTER TABLE public.banners ALTER COLUMN display_order SET DEFAULT 1;
