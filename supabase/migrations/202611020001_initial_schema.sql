create extension if not exists pgcrypto;

create type public.project_status as enum ('planning', 'active', 'on_hold', 'completed');
create type public.task_status as enum ('backlog', 'todo', 'in_progress', 'review', 'done');
create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');
create type public.bug_severity as enum ('low', 'medium', 'high', 'critical');
create type public.bug_status as enum ('open', 'in_progress', 'resolved');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '',
  color text not null default '#b7f36b' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  status public.project_status not null default 'planning',
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 240),
  description text not null default '',
  status public.task_status not null default 'todo',
  priority public.task_priority not null default 'medium',
  labels text[] not null default '{}',
  assignee_id uuid references public.profiles (id) on delete set null,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_project_owner_match foreign key (project_id, owner_id)
    references public.projects (id, owner_id) on delete cascade
);

create table public.bugs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 240),
  description text not null default '',
  severity public.bug_severity not null default 'medium',
  status public.bug_status not null default 'open',
  reported_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bugs_project_owner_match foreign key (project_id, owner_id)
    references public.projects (id, owner_id) on delete cascade
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  actor_id uuid references public.profiles (id) on delete set null,
  entity_type text not null check (entity_type in ('project', 'task', 'bug', 'github')),
  entity_id uuid,
  action text not null check (char_length(action) between 1 and 80),
  summary text not null check (char_length(summary) between 1 and 500),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.github_connections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  github_user_id bigint not null,
  github_login text not null,
  -- Store only an application-encrypted OAuth token; never a plaintext token.
  access_token_ciphertext text not null,
  scopes text[] not null default '{}',
  connected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_repositories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  repository_id bigint not null,
  repository_full_name text not null,
  repository_url text not null,
  created_at timestamptz not null default now(),
  unique (project_id, repository_id),
  constraint project_repositories_project_owner_match foreign key (project_id, owner_id)
    references public.projects (id, owner_id) on delete cascade
);

create unique index tasks_id_owner_id_idx on public.tasks (id, owner_id);
create unique index bugs_id_owner_id_idx on public.bugs (id, owner_id);
create index projects_owner_updated_idx on public.projects (owner_id, updated_at desc);
create index tasks_owner_status_due_idx on public.tasks (owner_id, status, due_date);
create index tasks_project_status_idx on public.tasks (project_id, status);
create index bugs_owner_status_severity_idx on public.bugs (owner_id, status, severity);
create index bugs_project_reported_idx on public.bugs (project_id, reported_at desc);
create index activity_owner_created_idx on public.activity_logs (owner_id, created_at desc);
create index activity_project_created_idx on public.activity_logs (project_id, created_at desc);
create index project_repositories_owner_idx on public.project_repositories (owner_id, project_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger tasks_set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();
create trigger bugs_set_updated_at before update on public.bugs
  for each row execute function public.set_updated_at();
create trigger github_connections_set_updated_at before update on public.github_connections
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.bugs enable row level security;
alter table public.activity_logs enable row level security;
alter table public.github_connections enable row level security;
alter table public.project_repositories enable row level security;

create policy "Profiles are private to their owner" on public.profiles
  for all using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Projects are private to their owner" on public.projects
  for all using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "Tasks are private to their owner" on public.tasks
  for all using ((select auth.uid()) = owner_id) with check (
    (select auth.uid()) = owner_id
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = (select auth.uid())
    )
  );
create policy "Bugs are private to their owner" on public.bugs
  for all using ((select auth.uid()) = owner_id) with check (
    (select auth.uid()) = owner_id
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = (select auth.uid())
    )
  );
create policy "Activity is private to its owner" on public.activity_logs
  for all using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "GitHub connection is private to its owner" on public.github_connections
  for all using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "Repository links are private to their owner" on public.project_repositories
  for all using ((select auth.uid()) = owner_id) with check (
    (select auth.uid()) = owner_id
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = (select auth.uid())
    )
  );

create function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();
