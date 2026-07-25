
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
