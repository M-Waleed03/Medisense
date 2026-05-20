create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text unique,
  avatar_url text,
  age integer check (age is null or (age >= 0 and age <= 130)),
  gender text,
  weight_kg numeric(6,2) check (weight_kg is null or weight_kg > 0),
  height_cm numeric(6,2) check (height_cm is null or height_cm > 0),
  blood_group text,
  medical_conditions text[] not null default '{}',
  allergies text[] not null default '{}',
  phone text,
  address text,
  emergency_contact text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.symptoms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  symptom_list jsonb not null default '[]'::jsonb,
  predicted_disease text not null,
  confidence_score double precision not null default 0,
  risk_level text,
  recommendations text,
  explanation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  report_url text,
  file_name text,
  mime_type text,
  extracted_text text,
  platelets integer,
  wbc integer,
  rbc double precision,
  hemoglobin double precision,
  hematocrit double precision,
  diagnosis text,
  flags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.chatbot_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  user_message text not null,
  ai_response text not null,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.symptoms enable row level security;
alter table public.reports enable row level security;
alter table public.chatbot_messages enable row level security;

create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

create policy "Users can manage own symptoms" on public.symptoms for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own reports" on public.reports for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own chatbot messages" on public.chatbot_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do update set
    email = excluded.email,
    name = coalesce(public.users.name, excluded.name),
    avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('reports', 'reports', false), ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Users can upload own reports" on storage.objects
  for insert with check (bucket_id = 'reports' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can read own reports" on storage.objects
  for select using (bucket_id = 'reports' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can manage own avatars" on storage.objects
  for all using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
