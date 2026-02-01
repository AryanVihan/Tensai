-- Tensai: Users (extends auth.users mapping)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  github_id bigint unique,
  github_username text,
  email text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Backfill public.users from existing auth.users (for users created before trigger existed)
insert into public.users (id, email, created_at, updated_at)
select id, email, created_at, now()
from auth.users
on conflict (id) do update set updated_at = now();

-- Connected repositories
create table if not exists public.connected_repositories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  owner text not null,
  repo text not null,
  default_branch text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, owner, repo)
);

-- Repo analysis results (project type, tech stack, summary)
create table if not exists public.repo_analysis_results (
  id uuid primary key default gen_random_uuid(),
  repo_id uuid not null references public.connected_repositories(id) on delete cascade,
  project_type text,
  tech_stack jsonb default '[]',
  entry_points jsonb default '[]',
  config_files jsonb default '[]',
  summary text,
  raw_tree jsonb,
  created_at timestamptz default now()
);

-- Encrypted env/secrets per repo (user-provided only; never from repo .env)
create table if not exists public.repo_secrets (
  id uuid primary key default gen_random_uuid(),
  repo_id uuid not null references public.connected_repositories(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  key_name text not null,
  encrypted_value text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(repo_id, key_name)
);

-- RLS
alter table public.users enable row level security;
alter table public.connected_repositories enable row level security;
alter table public.repo_analysis_results enable row level security;
alter table public.repo_secrets enable row level security;

drop policy if exists "Users can read own row" on public.users;
drop policy if exists "Users can update own row" on public.users;
drop policy if exists "Users can insert own row" on public.users;
create policy "Users can read own row" on public.users for select using (auth.uid() = id);
create policy "Users can update own row" on public.users for update using (auth.uid() = id);
create policy "Users can insert own row" on public.users for insert with check (auth.uid() = id);

drop policy if exists "Users can CRUD own repos" on public.connected_repositories;
create policy "Users can CRUD own repos" on public.connected_repositories
  for all using (auth.uid() = user_id);

drop policy if exists "Users can read analysis for own repos" on public.repo_analysis_results;
drop policy if exists "Users can insert analysis for own repos" on public.repo_analysis_results;
create policy "Users can read analysis for own repos" on public.repo_analysis_results
  for select using (
    exists (select 1 from public.connected_repositories r where r.id = repo_id and r.user_id = auth.uid())
  );
create policy "Users can insert analysis for own repos" on public.repo_analysis_results
  for insert with check (
    exists (select 1 from public.connected_repositories r where r.id = repo_id and r.user_id = auth.uid())
  );

drop policy if exists "Users can CRUD own repo secrets" on public.repo_secrets;
create policy "Users can CRUD own repo secrets" on public.repo_secrets
  for all using (auth.uid() = user_id);

-- Trigger to sync auth.users -> public.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, created_at, updated_at)
  values (new.id, new.email, now(), now())
  on conflict (id) do update set updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Indexes
create index if not exists idx_connected_repositories_user_id on public.connected_repositories(user_id);
create index if not exists idx_repo_analysis_results_repo_id on public.repo_analysis_results(repo_id);
create index if not exists idx_repo_secrets_repo_id on public.repo_secrets(repo_id);
