# Cavaquinho Fácil — Aprenda cavaquinho praticando, no seu ritmo

Aplicativo web comercial (pagamento único R$ 19,90 via Hotmart): biblioteca de 12 acordes com som real (Web Audio API), treinador de trocas, plano de 7 dias, metrônomo preciso e progresso salvo (Supabase + Netlify Functions).

## 1. Instalar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
npm run test     # vitest run
```

## 2. Executar localmente

```bash
cp .env.example .env  # preencha
npm run dev
```

Sem Supabase configurado, o frontend roda em modo demonstração (dados locais). Login e salvamento no servidor exigem as variáveis abaixo.

## 3. Configurar Supabase (Free)

1. Crie um projeto em https://supabase.com (Free, sem cartão).
2. Em **SQL Editor**, rode `supabase/migrations/001_initial.sql` e depois `supabase/migrations/002_webhook_idempotency_analytics.sql` (idempotência + analytics).
3. Em **Project Settings → API**, copie:
   - `SUPABASE_URL` (= `VITE_SUPABASE_URL` para o frontend, só leitura pública se precisar)
   - `anon key` → `VITE_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` (**só nas Netlify Functions, nunca no frontend**)
4. RLS já nega leitura pública das tabelas privadas. Não crie policies públicas para `purchases`, `study_progress`, `practice_sessions`, `login_attempts`, `analytics_events`, `webhook_events`.

## 4. Configurar Hotmart (novo produto)

1. Crie o produto **Cavaquinho Fácil** (R$ 19,90, pagamento único) no painel Hotmart.
2. Copie o **link do checkout** → `HOTMART_CHECKOUT_URL` e `VITE_HOTMART_CHECKOUT_URL` (e `VITE_APP_URL=https://seu-site.netlify.app`).
3. Em **Ferramentas → Webhook**, crie um webhook versão **2.0.0** para `https://seu-site.netlify.app/.netlify/functions/hotmart-webhook`.
4. Copie o **Hottok** → `HOTMART_HOTTOK` e o **ID do produto** → `HOTMART_PRODUCT_ID`.
5. Sem `HOTMART_CHECKOUT_URL`, o site exibe “Checkout em configuração” (não inventa link).

Eventos tratados (idempotentes, unique no banco em webhook_events[transaction_hash, event]): `PURCHASE_APPROVED`, `PURCHASE_COMPLETE` (só com prova de pagamento — sem status pago, não libera), `PURCHASE_REFUNDED`, `PURCHASE_CHARGEBACK`, `PURCHASE_CANCELED/CANCELLED`. Reembolso/chargeback revoga o acesso e invalida a sessão. Aprovação que chega depois de revogação (fora de ordem) não reativa. Falha de banco retorna 5xx para a Hotmart retentar — nunca 200 afirmando compra não registrada.

## 5. Testar pagamento sem cobrança real

1. **Nunca faça compra real para testar.** Use o ambiente de testes da Hotmart ou um produto de R$ 1 em modo teste, se disponível.
2. Para desenvolvimento, libere mocks apenas com `ALLOW_MOCK_WEBHOOK=true` (nunca em produção):
```bash
curl -X POST http://localhost:8888/.netlify/functions/hotmart-webhook \
  -H 'Content-Type: application/json' -H 'X-HOTMART-HOTTOK: <seu-hottok>' -H 'X-Mock: true' \
  -d '{"_mock":true,"event":"PURCHASE_APPROVED","data":{"product":{"id":"<HOTMART_PRODUCT_ID>"},"purchase":{"transaction":"TESTE123"},"buyer":{"email":"aluno@teste.com"}}}'
```
3. Rode `netlify dev` para testar Functions localmente, ou `npm run test` para os mocks automatizados.

## 6. Publicar na Netlify (Free, sem cartão)

1. Suba o código para o GitHub.
2. Em https://app.netlify.com → **Add new site → Import an existing project**.
3. Build: `npm run build` · Publish: `dist` · Functions: `netlify/functions` (o `netlify.toml` já define).
4. Em **Site settings → Environment variables**, cadastre (nunca commite valores):
   - Servidor: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `HOTMART_HOTTOK`, `HOTMART_PRODUCT_ID`, `SESSION_SECRET`, `TRANSACTION_HMAC_SECRET`, `ADMIN_RESTORE_KEY`, `KIT_BUCKET=kit-pdfs`, `KIT_URL_EXPIRY_SECONDS=120`
   - Frontend: `VITE_HOTMART_CHECKOUT_URL`, `VITE_SUPPORT_EMAIL`, `VITE_APP_URL=https://cavaquinho-facil.netlify.app`
   - Não usadas pelo código atual (podem ficar vazias): `HOTMART_CHECKOUT_URL` (servidor), `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — o navegador nunca fala com o Supabase direto; tudo passa pelas Functions com `service_role`.
5. Deploy e confira `/.netlify/functions/analytics` respondendo.

## 7. Verificar webhooks

- **Logs:** Netlify → Functions → `hotmart-webhook` → logs.
- **Banco:** `select event, hotmart_product_id, created_at from webhook_events order by created_at desc limit 20;`
- **Compra:** `select email, status, approved_at from purchases order by created_at desc limit 10;`
- Teste de duplicado: reenvie o mesmo evento+transação → resposta `{ok:true, deduped:true}` sem duplicar.
- Teste de outro produto: produto diferente → `{ok:true, ignored:'outro produto'}`.

## 8. Restaurar acesso de cliente (webhook falhou)

1. Confira no painel Hotmart: produto = Cavaquinho Fácil, e-mail, transação e status pago.
2. Chame (com a chave admin, fora do navegador do cliente):
```bash
curl -X POST https://seu-site.netlify.app/.netlify/functions/admin-grant \
  -H 'Content-Type: application/json' \
  -d '{"adminKey":"<ADMIN_RESTORE_KEY>","email":"cliente@email.com","transactionCode":"HP..."}'
```
3. Peça ao cliente para entrar em `/acessar` com e-mail + código da transação.

## 10. Kit de Apoio (3 PDFs pagos)

Os arquivos `01_Guia_de_Inicio_*` (14 págs.), `02_10_Acordes_Ilustrados_*` (4 págs.) e
`03_Planner_de_Estudos_*` (4 págs.) fazem parte da mesma compra de R$ 19,90 — sem
novo checkout. Eles **não** vão para `public/` nem `dist/`.

1. No Supabase, rode `supabase/migrations/003_kit_storage.sql` (cria o bucket privado `kit-pdfs`).
2. Em **Storage → kit-pdfs → Upload**, suba exatamente estes objetos:
   - `guia-de-inicio.pdf`
   - `acordes-ilustrados.pdf`
   - `planner-de-estudos.pdf`
   O bucket deve continuar **privado** (nenhuma policy pública de leitura).
3. Na Netlify, cadastre `KIT_BUCKET=kit-pdfs` (e opcional `KIT_URL_EXPIRY_SECONDS=120`, entre 60–600).
4. Teste o fluxo: entre em `/acessar` com uma compra aprovada, abra `/app/kit` e baixe os 3 PDFs no celular e no computador. Cada botão pede `GET /.netlify/functions/kit-download?file=<id>` e recebe URL assinada de ~2 minutos.
5. Teste o bloqueio: sem login, a função retorna 401; na `/demo` não há botão de download. IDs fora da lista fixa retornam 400.

## 11. Administrar o produto

- **Preço:** exibido como R$ 19,90 pagamento único (alterar exige atualizar Hotmart + textos).
- **UTM Meta Ads (R$ 10):** use `?utm_source=meta&utm_medium=cpc&utm_campaign=cavaquinho-10&utm_content=video1`. O app captura e guarda UTM da sessão.
- **Analytics real:** visitas/cliques (`analytics_events`) + compras via webhook (`purchases`/`webhook_events`). O navegador nunca registra compra (anti-fraude). Relatório do teste:
```bash
curl "https://seu-site.netlify.app/.netlify/functions/analytics-report?adminKey=<ADMIN_RESTORE_KEY>"
# => { visits, demoClicks, buyClicks, confirmedPurchases, byCampaign }
```
- **Aulas:** o bundle público contém só títulos/metas; os textos vêm de `GET /.netlify/functions/lessons` com sessão. Sem sessão, 401.
- **Suporte:** página `/suporte` orienta onde achar o código da transação; o e-mail oficial vem de `VITE_SUPPORT_EMAIL` (sem valor, nada é inventado).
