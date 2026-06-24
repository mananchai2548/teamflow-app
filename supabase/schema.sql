-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  email text,
  phone_number text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Teams Table
create table public.teams (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  invite_code text unique not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Team Members Table
create table public.team_members (
  team_id uuid references public.teams(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('owner', 'member')) default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (team_id, user_id)
);

-- 4. Tasks Table
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  title text not null,
  description text,
  status text check (status in ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE')) default 'TODO',
  priority text check (priority in ('LOW', 'MEDIUM', 'HIGH')) default 'MEDIUM',
  assigned_to uuid references public.profiles(id) on delete set null,
  due_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Daily Notes Table (Calendar)
create table public.daily_notes (
  id uuid default uuid_generate_v4() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  date date not null,
  content text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (team_id, date)
);

-- Realtime enablement
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.daily_notes;

-- Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.tasks enable row level security;
alter table public.daily_notes enable row level security;

-- RLS Policies for profiles
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- RLS Policies for teams
create policy "Teams are viewable by team members." on public.teams
  for select using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = teams.id
      and team_members.user_id = auth.uid()
    )
  );

create policy "Users can insert teams." on public.teams
  for insert with check (auth.uid() = created_by);

create policy "Team owners can update teams." on public.teams
  for update using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = teams.id
      and team_members.user_id = auth.uid()
      and team_members.role = 'owner'
    )
  );

-- RLS Policies for team_members
create policy "Team members are viewable by other team members." on public.team_members
  for select using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = team_members.team_id
      and tm.user_id = auth.uid()
    )
  );

create policy "Users can insert themselves into teams via invite." on public.team_members
  for insert with check (auth.uid() = user_id);

create policy "Team owners can update member roles." on public.team_members
  for update using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = team_members.team_id
      and tm.user_id = auth.uid()
      and tm.role = 'owner'
    )
  );

-- RLS Policies for tasks
create policy "Tasks are viewable by team members." on public.tasks
  for select using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = tasks.team_id
      and team_members.user_id = auth.uid()
    )
  );

create policy "Team members can insert tasks." on public.tasks
  for insert with check (
    exists (
      select 1 from public.team_members
      where team_members.team_id = tasks.team_id
      and team_members.user_id = auth.uid()
    )
  );

create policy "Team members can update tasks." on public.tasks
  for update using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = tasks.team_id
      and team_members.user_id = auth.uid()
    )
  );

create policy "Team members can delete tasks." on public.tasks
  for delete using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = tasks.team_id
      and team_members.user_id = auth.uid()
    )
  );

-- RLS Policies for daily_notes
create policy "Daily notes are viewable by team members." on public.daily_notes
  for select using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = daily_notes.team_id
      and team_members.user_id = auth.uid()
    )
  );

create policy "Team members can insert daily notes." on public.daily_notes
  for insert with check (
    exists (
      select 1 from public.team_members
      where team_members.team_id = daily_notes.team_id
      and team_members.user_id = auth.uid()
    )
  );

create policy "Team members can update daily notes." on public.daily_notes
  for update using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = daily_notes.team_id
      and team_members.user_id = auth.uid()
    )
  );

-- Trigger to automatically create a profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger to update updated_at on tasks
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute procedure public.handle_updated_at();

create trigger daily_notes_updated_at
  before update on public.daily_notes
  for each row execute procedure public.handle_updated_at();
