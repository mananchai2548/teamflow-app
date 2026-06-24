-- ADVANCED KANBAN BOARD FEATURES --

-- 1. Modify Tasks Table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;

-- 2. Task Comments Table
CREATE TABLE IF NOT EXISTS public.task_comments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Subtasks Table
CREATE TABLE IF NOT EXISTS public.subtasks (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  is_completed boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Task Attachments Table
CREATE TABLE IF NOT EXISTS public.task_attachments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Realtime Enablement
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subtasks;

-- 6. Row Level Security (RLS)
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- 7. Policies for Task Comments
CREATE POLICY "Comments viewable by team members" ON public.task_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      JOIN public.team_members ON team_members.team_id = tasks.team_id
      WHERE tasks.id = task_comments.task_id AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert comments" ON public.task_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks
      JOIN public.team_members ON team_members.team_id = tasks.team_id
      WHERE tasks.id = task_comments.task_id AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own comments" ON public.task_comments
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Policies for Subtasks
CREATE POLICY "Subtasks viewable by team members" ON public.subtasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      JOIN public.team_members ON team_members.team_id = tasks.team_id
      WHERE tasks.id = subtasks.task_id AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert subtasks" ON public.subtasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks
      JOIN public.team_members ON team_members.team_id = tasks.team_id
      WHERE tasks.id = subtasks.task_id AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can update subtasks" ON public.subtasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      JOIN public.team_members ON team_members.team_id = tasks.team_id
      WHERE tasks.id = subtasks.task_id AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can delete subtasks" ON public.subtasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      JOIN public.team_members ON team_members.team_id = tasks.team_id
      WHERE tasks.id = subtasks.task_id AND team_members.user_id = auth.uid()
    )
  );

-- 9. Policies for Task Attachments
CREATE POLICY "Attachments viewable by team members" ON public.task_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      JOIN public.team_members ON team_members.team_id = tasks.team_id
      WHERE tasks.id = task_attachments.task_id AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert attachments" ON public.task_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks
      JOIN public.team_members ON team_members.team_id = tasks.team_id
      WHERE tasks.id = task_attachments.task_id AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own attachments" ON public.task_attachments
  FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket 'task_files' MUST be created manually and set to PUBLIC.
-- Here are the storage policies (requires inserting into storage.buckets and storage.objects):
INSERT INTO storage.buckets (id, name, public) 
VALUES ('task_files', 'task_files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'task_files');
CREATE POLICY "Auth Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'task_files' AND auth.role() = 'authenticated');
CREATE POLICY "Auth Delete" ON storage.objects FOR DELETE USING (bucket_id = 'task_files' AND auth.role() = 'authenticated');
