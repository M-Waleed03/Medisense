alter table public.users
  add column if not exists profile_photo_url text,
  add column if not exists date_of_birth date,
  add column if not exists last_seen_at timestamptz;

alter table public.symptoms
  add column if not exists clinical_inputs jsonb not null default '{}'::jsonb,
  add column if not exists recommended_tests text[] not null default '{}',
  add column if not exists precautions text[] not null default '{}';

alter table public.reports
  add column if not exists mcv double precision,
  add column if not exists mch double precision,
  add column if not exists mchc double precision,
  add column if not exists neutrophils double precision,
  add column if not exists lymphocytes double precision,
  add column if not exists extracted_values jsonb not null default '{}'::jsonb,
  add column if not exists ocr_confidence double precision,
  add column if not exists status text not null default 'completed' check (status in ('uploaded', 'processing', 'completed', 'failed'));

create table if not exists public.report_values (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  marker text not null,
  value double precision,
  unit text,
  reference_low double precision,
  reference_high double precision,
  status text not null check (status in ('low', 'normal', 'high', 'critical', 'unknown')),
  interpretation text,
  created_at timestamptz not null default now()
);

create table if not exists public.disease_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  symptom_check_id uuid references public.symptoms(id) on delete set null,
  disease text not null,
  confidence_score double precision not null default 0,
  risk_level text,
  explanation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  source_type text not null check (source_type in ('symptom_check', 'report', 'chatbot', 'manual')),
  source_id uuid,
  title text not null,
  detail text not null,
  urgency text not null default 'routine',
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.health_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  event_type text not null,
  event_id uuid,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.dashboard_analytics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  metric text not null,
  value double precision,
  payload jsonb not null default '{}'::jsonb,
  measured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.report_values enable row level security;
alter table public.disease_predictions enable row level security;
alter table public.recommendations enable row level security;
alter table public.health_history enable row level security;
alter table public.dashboard_analytics enable row level security;

drop policy if exists "Users can manage own report values" on public.report_values;
create policy "Users can manage own report values" on public.report_values
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage own disease predictions" on public.disease_predictions;
create policy "Users can manage own disease predictions" on public.disease_predictions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage own recommendations" on public.recommendations;
create policy "Users can manage own recommendations" on public.recommendations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage own health history" on public.health_history;
create policy "Users can manage own health history" on public.health_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage own dashboard analytics" on public.dashboard_analytics;
create policy "Users can manage own dashboard analytics" on public.dashboard_analytics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can update own reports" on storage.objects;
create policy "Users can update own reports" on storage.objects
  for update using (bucket_id = 'reports' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'reports' and auth.uid()::text = (storage.foldername(name))[1]);
