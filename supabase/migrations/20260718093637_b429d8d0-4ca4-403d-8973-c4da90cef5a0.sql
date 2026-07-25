
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
