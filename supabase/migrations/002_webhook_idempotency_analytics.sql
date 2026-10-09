-- Cavaquinho Fácil — migration 002
-- 1) Idempotência confiável do webhook no banco (não só no código).
-- 2) Tabela de analytics de primeira parte (sem PII).

-- Idempotência: mesmo (evento + transação) só pode existir uma vez.
-- Parcial (WHERE NOT NULL) porque auditorias genéricas podem não ter transaction_hash.
create unique index if not exists webhook_events_tx_event_uidx
  on public.webhook_events (transaction_hash, event)
  where transaction_hash is not null;

create index if not exists webhook_events_tx_idx
  on public.webhook_events (transaction_hash);

-- Analytics de primeira parte: visitas, cliques em demo e cliques no checkout.
-- Compras confirmadas NÃO entram aqui (vão para webhook_events/purchases via webhook).
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  name text not null check (name in ('visit_landing', 'click_demo', 'click_buy')),
  path text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists analytics_events_name_time_idx on public.analytics_events (name, created_at desc);
create index if not exists analytics_events_campaign_idx on public.analytics_events (utm_campaign);

alter table public.analytics_events enable row level security;
-- Sem policies públicas: somente service_role (Netlify Functions) lê/escreve.
