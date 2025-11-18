# Mercado Pago — Checkout Pro (Sandbox)

Este guia configura o Checkout Pro do Mercado Pago em modo de teste, com criação de preferência via Edge Function e redirecionamento para o link de pagamento.

## 1) Credenciais de teste

- Gere um `Access Token` de teste (prefixo `TEST-...`) no painel do Mercado Pago.
- Opcional: gere `Public Key` de teste (se for usar Bricks/Cartão no front).
- Crie usuários de teste (comprador/vendedor), conforme docs oficiais.

## 2) Secrets na função (server-side)

Configure os segredos na função (não exponha no frontend):

```bash
supabase functions secrets set MERCADOPAGO_ACCESS_TOKEN="TEST-..."
supabase functions secrets set SITE_URL="https://seu-dominio.vercel.app"
# Opcional (para IPN):
supabase functions secrets set MERCADOPAGO_NOTIFICATION_URL="https://seu-dominio.vercel.app/api/mercadopago/webhook"
```

## 3) Deploy da função

```bash
supabase functions deploy mercado-pago-checkout-pro --no-verify-jwt
```

> Use `--no-verify-jwt` para permitir chamadas sem login durante os testes. Em produção, considere exigir autenticação.

## 4) Teste rápido via curl

```bash
curl -X POST "https://YOUR-PROJECT.supabase.co/functions/v1/mercado-pago-checkout-pro" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{ "title": "Pedido teste", "quantity": 1, "unit_price": 1, "currency_id": "BRL" }],
    "back_urls": {
      "success": "https://seu-dominio.vercel.app/checkout/sucesso",
      "failure": "https://seu-dominio.vercel.app/checkout/erro",
      "pending": "https://seu-dominio.vercel.app/checkout/pendente"
    }
  }'
```

Resposta esperada:

```json
{
  "id": "1234567890",
  "init_point": "https://www.mercadopago.com.br/...",
  "sandbox_init_point": "https://sandbox.mercadopago.com.br/...",
  "back_urls": { "success": "...", "failure": "...", "pending": "..." }
}
```

Abra `sandbox_init_point` para testar em sandbox.

## 5) Webhook (IPN) de pagamento

- Defina `notification_url` apontando para um endpoint público do seu backend.
- Em Supabase, você pode criar outra Edge Function para receber o IPN e atualizar o status do pedido (`paid`, `pending`, `rejected`).
- Lembre-se de validar o `topic` e consultar o pagamento via API para confirmar status.

## 6) Integração no frontend (opcional)

- Chame a função via `fetch` e redirecione o usuário para `sandbox_init_point`.
- Em produção, use `init_point`.

## 7) Dicas

- Não exponha `Access Token` em variáveis `VITE_`.
- Use `SITE_URL` para manter consistência nos `back_urls`.
- Verifique o Dashboard do Mercado Pago para o status dos pagamentos.