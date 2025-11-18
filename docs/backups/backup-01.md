# Ponto de Restauração — Backup01

Este ponto documenta o estado atual da aplicação e mudanças recentes relevantes para checkout com Mercado Pago e execução local.

## Resumo do Estado
- Servidor de desenvolvimento ativo em `http://localhost:3002/` (Vite).
- Função Edge `mercado-pago-checkout-pro` ajustada para CORS e preflight `OPTIONS`.
- Correção de TypeScript no ambiente Deno (TS2669) para declaração global de `Deno`.
- Fluxo de checkout atualizado para criar preferência no Mercado Pago e redirecionar para sandbox.
- Páginas de retorno (`/checkout/sucesso`, `/erro`, `/pendente`) persistem status e observações no Supabase.
- Pontos de restauração antigos foram removidos (backup-01..09 e `snapshots/`).

## Arquivos Impactados
- `supabase/functions/mercado-pago-checkout-pro/index.ts`
  - CORS: `Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type`.
  - `Access-Control-Allow-Methods: POST, OPTIONS`, `Access-Control-Max-Age: 86400`.
  - Resposta 200 para preflight.
- `supabase/functions/mercado-pago-checkout-pro/deno-ambient.d.ts`
  - Troca de `declare global { var Deno: ... }` por `declare var Deno: ...`.
- `src/pages/checkout/components/CheckoutForm.tsx`
  - Invoca função `mercado-pago-checkout-pro`, usa `auto_return: 'approved'` e redireciona para `sandbox_init_point`.
  - Persiste `last_order_numero_pedido` em `localStorage`.
- `src/pages/checkout/sucesso/page.tsx`
  - Seta status `confirmado` e registra parâmetros de retorno em `observacoes`.
- `src/pages/checkout/erro/page.tsx`
  - Seta status `cancelado` e registra parâmetros de retorno.
- `src/pages/checkout/pendente/page.tsx`
  - Mantém status `pendente` e registra parâmetros de retorno.

## Como Restaurar Este Estado
1. Deploy da função (necessário no projeto Supabase):
   - `supabase functions deploy mercado-pago-checkout-pro --no-verify-jwt`
   - Verifique segredos: `MERCADOPAGO_ACCESS_TOKEN` (TEST), `SITE_URL` (opcional), `MERCADOPAGO_NOTIFICATION_URL` (opcional).
2. Frontend:
   - Garanta `VITE_PUBLIC_SUPABASE_URL` e `VITE_PUBLIC_SUPABASE_ANON_KEY`.
   - Inicie com `npm run dev -- --port 3002`.
3. Teste rápido:
   - `node scripts/test-mercado-pago-checkout-pro.js` com `SUPABASE_URL` e `SITE_URL` definidos.

## Observações
- Em produção, considere remover `--no-verify-jwt` e exigir autenticação.
- Se a preflight falhar novamente, verifique os headers retornados pela função e os logs no Dashboard do Supabase.