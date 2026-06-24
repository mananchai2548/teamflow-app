-- Notifications Table Schema

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can read their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert notifications
CREATE POLICY "Users can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own notifications (to mark as read)
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable realtime
alter publication supabase_realtime add table notifications;
