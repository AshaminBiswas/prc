
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
