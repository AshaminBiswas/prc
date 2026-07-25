
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
