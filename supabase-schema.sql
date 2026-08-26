create table if not exists public.incidents (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.preventive_tasks (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.approved_workers (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.pending_workers (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.eddie_memories (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.chats (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.incidents enable row level security;
alter table public.preventive_tasks enable row level security;
alter table public.activities enable row level security;
alter table public.approved_workers enable row level security;
alter table public.pending_workers enable row level security;
alter table public.eddie_memories enable row level security;
alter table public.chats enable row level security;
alter table public.app_settings enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['incidents', 'preventive_tasks', 'activities', 'approved_workers', 'pending_workers', 'eddie_memories', 'chats', 'app_settings'] loop
    execute format('drop policy if exists "anon full access" on public.%I', table_name);
    execute format('create policy "anon full access" on public.%I for all to anon, authenticated using (true) with check (true)', table_name);
  end loop;
end $$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['incidents', 'preventive_tasks', 'activities', 'approved_workers', 'pending_workers', 'eddie_memories', 'chats', 'app_settings'] loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;
