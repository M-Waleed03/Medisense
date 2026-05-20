create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text unique,
  avatar_url text,
  profile_photo_url text,
  age integer check (age is null or (age >= 0 and age <= 130)),
  gender text,
  blood_group text,
  height_cm numeric(6,2) check (height_cm is null or height_cm > 0),
  weight_kg numeric(6,2) check (weight_kg is null or weight_kg > 0),
  allergies text[] not null default '{}',
  medical_conditions text[] not null default '{}',
  emergency_contact text,
  phone text,
  address text,
  role text not null default 'user' check (role in ('user', 'admin')),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.symptom_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  symptom_list jsonb not null default '[]'::jsonb,
  clinical_inputs jsonb not null default '{}'::jsonb,
  predicted_disease text not null,
  confidence_score double precision not null default 0,
  risk_level text,
  recommendations text,
  recommended_tests text[] not null default '{}',
  precautions text[] not null default '{}',
  explanation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.medical_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  report_url text,
  file_name text,
  mime_type text,
  extracted_text text,
  extracted_values jsonb not null default '{}'::jsonb,
  platelets integer,
  wbc integer,
  rbc double precision,
  hemoglobin double precision,
  hematocrit double precision,
  mcv double precision,
  mch double precision,
  mchc double precision,
  neutrophils double precision,
  lymphocytes double precision,
  diagnosis text,
  flags jsonb not null default '[]'::jsonb,
  status text not null default 'completed' check (status in ('uploaded', 'processing', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

create table if not exists public.report_values (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  report_id uuid not null references public.medical_reports(id) on delete cascade,
  marker text not null,
  value double precision,
  unit text,
  reference_low double precision,
  reference_high double precision,
  status text not null check (status in ('low', 'normal', 'high', 'critical', 'unknown')),
  interpretation text,
  created_at timestamptz not null default now()
);

create table if not exists public.chatbot_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_message text not null,
  ai_response text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_type text not null check (source_type in ('symptom_check', 'report', 'chatbot', 'manual')),
  source_id uuid,
  title text not null,
  detail text not null,
  urgency text not null default 'routine',
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  email_notifications boolean not null default true,
  report_alerts boolean not null default true,
  symptom_reminders boolean not null default false,
  theme text not null default 'light' check (theme in ('light', 'system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.disease_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  symptom_check_id uuid references public.symptom_checks(id) on delete set null,
  disease text not null,
  confidence_score double precision not null default 0,
  risk_level text,
  explanation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.health_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  event_id uuid,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.dashboard_analytics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  metric text not null,
  value double precision,
  payload jsonb not null default '{}'::jsonb,
  measured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conrelid::regclass as table_name, conname
    from pg_constraint
    where contype = 'f'
      and connamespace = 'public'::regnamespace
      and conrelid in (
        'public.chatbot_messages'::regclass,
        'public.recommendations'::regclass,
        'public.report_values'::regclass,
        'public.disease_predictions'::regclass,
        'public.health_history'::regclass,
        'public.dashboard_analytics'::regclass
      )
  loop
    execute format('alter table %s drop constraint if exists %I', constraint_record.table_name, constraint_record.conname);
  end loop;
end $$;

alter table public.chatbot_messages
  add constraint chatbot_messages_user_id_profiles_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.recommendations
  add constraint recommendations_user_id_profiles_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.report_values
  add constraint report_values_user_id_profiles_fkey foreign key (user_id) references public.profiles(id) on delete cascade,
  add constraint report_values_report_id_medical_reports_fkey foreign key (report_id) references public.medical_reports(id) on delete cascade;
alter table public.disease_predictions
  add constraint disease_predictions_user_id_profiles_fkey foreign key (user_id) references public.profiles(id) on delete cascade,
  add constraint disease_predictions_symptom_check_id_fkey foreign key (symptom_check_id) references public.symptom_checks(id) on delete set null;
alter table public.health_history
  add constraint health_history_user_id_profiles_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.dashboard_analytics
  add constraint dashboard_analytics_user_id_profiles_fkey foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.profiles enable row level security;
alter table public.symptom_checks enable row level security;
alter table public.medical_reports enable row level security;
alter table public.report_values enable row level security;
alter table public.chatbot_messages enable row level security;
alter table public.recommendations enable row level security;
alter table public.user_settings enable row level security;
alter table public.disease_predictions enable row level security;
alter table public.health_history enable row level security;
alter table public.dashboard_analytics enable row level security;

drop policy if exists "profiles_owner_select" on public.profiles;
create policy "profiles_owner_select" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles_owner_insert" on public.profiles;
create policy "profiles_owner_insert" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles_owner_update" on public.profiles;
create policy "profiles_owner_update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "symptom_checks_owner_all" on public.symptom_checks;
create policy "symptom_checks_owner_all" on public.symptom_checks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "medical_reports_owner_all" on public.medical_reports;
create policy "medical_reports_owner_all" on public.medical_reports for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "report_values_owner_all" on public.report_values;
create policy "report_values_owner_all" on public.report_values for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "chatbot_messages_owner_all" on public.chatbot_messages;
create policy "chatbot_messages_owner_all" on public.chatbot_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "recommendations_owner_all" on public.recommendations;
create policy "recommendations_owner_all" on public.recommendations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "user_settings_owner_all" on public.user_settings;
create policy "user_settings_owner_all" on public.user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "disease_predictions_owner_all" on public.disease_predictions;
create policy "disease_predictions_owner_all" on public.disease_predictions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "health_history_owner_all" on public.health_history;
create policy "health_history_owner_all" on public.health_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "dashboard_analytics_owner_all" on public.dashboard_analytics;
create policy "dashboard_analytics_owner_all" on public.dashboard_analytics for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at before update on public.user_settings for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do update set
    email = excluded.email,
    name = coalesce(public.profiles.name, excluded.name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('reports', 'reports', false), ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "reports_owner_insert" on storage.objects;
create policy "reports_owner_insert" on storage.objects
  for insert with check (bucket_id = 'reports' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists "reports_owner_select" on storage.objects;
create policy "reports_owner_select" on storage.objects
  for select using (bucket_id = 'reports' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists "avatars_owner_all" on storage.objects;
create policy "avatars_owner_all" on storage.objects
  for all using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
