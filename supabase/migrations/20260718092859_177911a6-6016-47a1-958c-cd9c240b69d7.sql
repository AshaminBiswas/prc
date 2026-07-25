
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
