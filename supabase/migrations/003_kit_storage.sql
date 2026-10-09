-- Cavaquinho Fácil — migration 003
-- Bucket privado para os PDFs pagos do Kit de Apoio.
-- Os arquivos NUNCA vão para public/ ou dist/: ficam aqui e saem
-- apenas via URL assinada de curta duração (kit-download).

insert into storage.buckets (id, name, public)
values ('kit-pdfs', 'kit-pdfs', false)
on conflict (id) do nothing;

-- RLS do Storage: sem policies públicas, anon/authenticated não leem nada.
-- Somente service_role (Netlify Functions) gera as URLs assinadas.
-- Não criar policy de leitura pública para este bucket.
