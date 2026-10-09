-- Cavaquinho Fácil — schema inicial (Supabase PostgreSQL Free)
-- Tabelas: purchases, webhook_events, study_progress, practice_sessions, login_attempts

create extension if not exists "pgcrypto";

-- Compras aprovadas (acesso). transaction NUNCA em texto puro: apenas HMAC.
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  transaction_hash text not null unique,
  hotmart_product_id text not null,
  status text not null default 'approved' check (status in ('approved','refunded','charged_back','cancelled')),
  approved_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists purchases_email_idx on public.purchases (lower(email));

-- Auditoria de webhooks (mínimo necessário, sem e-mail desnecessário em texto puro).
create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  hotmart_product_id text,
  transaction_hash text,
  purchase_id uuid references public.purchases(id),
  status text not null default 'received',
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists webhook_events_event_idx on public.webhook_events (event);

-- Progresso de estudo (dias concluídos)
create table if not exists public.study_progress (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  day int not null check (day between 1 and 7),
  completed_at timestamptz not null default now(),
  unique (purchase_id, day)
);

-- Sessões de prática (treinador / metrônomo)
create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  kind text not null default 'trainer' check (kind in ('trainer','lesson','metronome')),
  chord_a text,
  chord_b text,
  swaps int check (swaps is null or (swaps between 0 and 500)),
  minutes int check (minutes is null or (minutes between 1 and 600)),
  created_at timestamptz not null default now()
);
create index if not exists practice_purchase_idx on public.practice_sessions (purchase_id, created_at desc);

-- Tentativas de login (rate limit + auditoria). IP pode ser null atrás de proxy.
create table if not exists public.login_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  ip text,
  success boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists login_attempts_email_time_idx on public.login_attempts (lower(email), created_at desc);
create index if not exists login_attempts_ip_time_idx on public.login_attempts (ip, created_at desc);

-- RLS: negar tudo ao público. Somente service_role (Netlify Functions) acessa.
alter table public.purchases enable row level security;
alter table public.webhook_events enable row level security;
alter table public.study_progress enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.login_attempts enable row level security;

-- Sem policies públicas = anon/authenticated não leem nem escrevem.
-- (service_role bypassa RLS por padrão no Supabase.)
