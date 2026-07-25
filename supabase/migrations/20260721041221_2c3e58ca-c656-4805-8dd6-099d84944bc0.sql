
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
