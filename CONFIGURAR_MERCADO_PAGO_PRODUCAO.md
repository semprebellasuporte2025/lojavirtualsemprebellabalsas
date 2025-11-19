# 📦 Configuração do Mercado Pago — Produção

Este guia coloca o Mercado Pago em modo de produção usando suas chaves reais, sem expor segredos no frontend.

## 🔑 Credenciais de Produção

- Public Key (frontend, opcional para Bricks): `VITE_MERCADOPAGO_PUBLIC_KEY`
- Access Token (server-side): `MERCADOPAGO_ACCESS_TOKEN`

> Importante: **não** commit credenciais no repositório. Configure-as como secrets nas funções Edge do Supabase e variáveis de ambiente no Vercel.

## ✅ Passo 1 — Definir variáveis no Supabase (secrets)

1) Instale/valide o Supabase CLI:

```bash
supabase --version
```

2) Configure os secrets com as suas credenciais de produção:

```bash
supabase functions secrets set MERCADOPAGO_ACCESS_TOKEN="APP_USR-..."
supabase functions secrets set SITE_URL="https://semprebellabalsas.com.br"
# Opcional: configure o webhook de notificação quando tiver o endpoint implementado
supabase functions secrets set MERCADOPAGO_NOTIFICATION_URL="https://SEU_PROJECT_REF.supabase.co/functions/v1/mercado-pago-webhook"
```

3) Faça o deploy das funções relacionadas ao Mercado Pago:

```bash
supabase functions deploy mercado-pago-checkout-pro
supabase functions deploy mercado-pago-payments
supabase functions deploy mercado-pago-status
```

> Dica: verifique os secrets configurados com `supabase secrets list` e os logs das funções no Dashboard.

## 🌐 Passo 2 — Definir variáveis no Vercel (frontend/build)

Acesse seu projeto no Vercel → Settings → Environment Variables e configure:

```
SITE_URL = https://semprebellabalsas.com.br
# Opcional (somente se usar Bricks/Cartão no cliente)
VITE_MERCADOPAGO_PUBLIC_KEY = APP_USR-...
```

> Observação: o `MERCADOPAGO_ACCESS_TOKEN` **não vai no Vercel** (frontend). Ele é usado apenas nas Edge Functions (Supabase).

## 🔄 Comportamento do Checkout Pro

- Em ambiente HTTPS de produção, o frontend **usa `init_point`** automaticamente.
- Em desenvolvimento (localhost/http), o frontend **usa `sandbox_init_point`** para testes.

Este comportamento já está implementado em `CheckoutForm.tsx`.

## 🧪 Teste rápido

1) Gere uma preferência via função e verifique os links:

```bash
node scripts/test-mercado-pago-checkout-pro.js
```

Defina `SUPABASE_URL` e `SITE_URL` nas variáveis de ambiente do sistema se necessário.

2) Acompanhe o redirecionamento em produção (HTTPS) para o link de pagamento real (`init_point`).

## 🔔 Webhook (IPN) — Produção

- Para receber confirmações automáticas, configure `notification_url` apontando para um endpoint real (por exemplo, uma Edge Function `mercado-pago-webhook`).
- Valide o `topic`/`id` recebido e consulte `GET /v1/payments/:id` com o `MERCADOPAGO_ACCESS_TOKEN` para atualizar o status do pedido.
- Enquanto o webhook não estiver implementado, você pode consultar status via função `mercado-pago-status`.

### Exemplo (projeto atual)

```bash
supabase functions secrets set MERCADOPAGO_NOTIFICATION_URL="https://cproxdqrraiujnewbsvp.supabase.co/functions/v1/mercado-pago-webhook"
supabase functions deploy mercado-pago-webhook
```

Depois do deploy, o Checkout Pro usará `MERCADOPAGO_NOTIFICATION_URL` (ou o fallback automático baseado em `SUPABASE_URL`) ao criar a preferência.

## ⚠️ Boas práticas

- Nunca exponha o `MERCADOPAGO_ACCESS_TOKEN` em variáveis `VITE_`.
- Sempre use HTTPS em `SITE_URL` e `back_urls`.
- Atenção aos logs das funções para diagnosticar qualquer erro de API.

---

Pronto! Com os secrets e variáveis configurados, seu checkout usará produção automaticamente.