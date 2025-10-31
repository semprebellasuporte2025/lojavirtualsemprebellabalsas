# Webhook de Checkout — Envio dos dados do pedido

Esta integração dispara uma requisição HTTP POST ao finalizar o pedido contendo todas as informações necessárias para processamento externo.

## Configuração (Somente Backend)

- Função criada: `supabase/functions/dispatch-order-webhook/index.ts`.
- Configure os segredos na função (sem expor no frontend):

```
supabase functions secrets set ORDER_WEBHOOK_URL="https://seu-endpoint.com/webhook"
supabase functions secrets set SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
supabase functions secrets set SUPABASE_SERVICE_ROLE_KEY="..."
```

- Faça o deploy da função:

```
supabase functions deploy dispatch-order-webhook --no-verify-jwt
```

> Observação: usamos a Service Role Key na função (server-side) para montar o payload e enviar `application/json` sem CORS.

## Quando dispara

- Após a criação do `pedido` e a inserção de todos os `itens_pedido` no Supabase, a Edge Function é invocada e entrega o payload.
- Falhas no webhook NÃO bloqueiam a conclusão do pedido; o erro é logado nos logs da função.

## Payload (exemplo)

```json
{
  "numero_pedido": "20251234",
  "pedido_id": "abc123",
  "criado_em": "2025-01-10T16:22:33.000Z",
  "status": "pendente",
  "forma_pagamento": "pix",
  "subtotal": 189.9,
  "desconto": 0,
  "frete": 0,
  "total": 189.9,
  "frete_metodo": "Entrega Grátis",
  "cliente": {
    "id": "uuid-do-cliente",
    "nome": "Maria da Silva",
    "email": "maria@example.com"
  },
  "endereco_entrega": {
    "id": 99,
    "nome": "Maria da Silva",
    "cep": "78700-000",
    "endereco": "Av. das Flores",
    "numero": 123,
    "complemento": "Apto 201",
    "bairro": "Centro",
    "cidade": "Balsas",
    "estado": "MA"
  },
  "itens": [
    {
      "produto_id": "42",
      "nome": "Vestido Floral Midi",
      "quantidade": 1,
      "preco_unitario": 189.9,
      "subtotal": 189.9,
      "tamanho": "P",
      "cor": "Preto",
      "imagem": "https://.../produto.jpg"
    }
  ]
}
```

## Dicas de teste

- Use um endpoint temporário (ex.: webhook.site) para inspecionar o recebimento.
- Verifique os logs da Edge Function no Supabase (Dashboard/Functions) em caso de falha.

## Arquivos alterados

- `supabase/functions/dispatch-order-webhook/index.ts` — consulta pedido e itens no Supabase e entrega ao endpoint com `application/json` (sem CORS).
- `src/pages/checkout/components/CheckoutForm.tsx` — invoca a Edge Function após inserir itens do pedido (sem fallback no cliente).
 

## Variáveis de ambiente

- Frontend (Vite): apenas `VITE_PUBLIC_SUPABASE_URL` e `VITE_PUBLIC_SUPABASE_ANON_KEY` são necessários.
- O `VITE_ORDER_WEBHOOK_URL` não é usado; o endpoint é configurado como segredo da função.