create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text,
  image text,
  tier text not null default 'FREE' check (tier in ('FREE', 'YEARLY_999', 'TWO_YEAR_UNLIMITED')),
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  stripe_current_period_end timestamptz,
  plan_start_at timestamptz,
  plan_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  raw_text text not null default '',
  jd_text text not null default '',
  jd_url text,
  keywords text not null default '[]',
  ats_score integer not null default 0 check (ats_score between 0 and 100),
  content_json text not null default '{}',
  cover_letter text,
  template_id text not null default 'classic',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analysis_usages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists resumes_user_updated_idx on public.resumes(user_id, updated_at desc);
create index if not exists analysis_usages_user_created_idx on public.analysis_usages(user_id, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists set_resumes_updated_at on public.resumes;
create trigger set_resumes_updated_at
before update on public.resumes
for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.resumes enable row level security;
alter table public.analysis_usages enable row level security;

drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
on public.users for select
using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
on public.users for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can manage own resumes" on public.resumes;
create policy "Users can manage own resumes"
on public.resumes for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can read own analysis usage" on public.analysis_usages;
create policy "Users can read own analysis usage"
on public.analysis_usages for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own analysis usage" on public.analysis_usages;
create policy "Users can insert own analysis usage"
on public.analysis_usages for insert
with check (auth.uid() = user_id);
