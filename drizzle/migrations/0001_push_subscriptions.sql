CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.push_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.push_subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.push_subscriptions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.push_notified (
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  notified_on date NOT NULL,
  PRIMARY KEY (task_id, notified_on)
);
GRANT ALL ON public.push_notified TO service_role;
ALTER TABLE public.push_notified ENABLE ROW LEVEL SECURITY;