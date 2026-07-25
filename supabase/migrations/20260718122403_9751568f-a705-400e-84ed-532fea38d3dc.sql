
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
