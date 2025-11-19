import 'dotenv/config';

const MP_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const BASE_FUNC_URL = 'https://cproxdqrraiujnewbsvp.supabase.co/functions/v1';
const WEBHOOK_URL = `${BASE_FUNC_URL}/mercado-pago-webhook`;

function tryParseJson(text) {
  try { return JSON.parse(text); } catch { return text; }
}

async function createPixPaymentDirect() {
  if (!MP_TOKEN) throw new Error('MERCADOPAGO_ACCESS_TOKEN não definido');
  const payload = {
    transaction_amount: 1,
    description: 'Teste PIX webhook',
    payment_method_id: 'pix',
    payer: {
      email: 'webhook-tester@semprebella.com.br'
    },
    metadata: {
      source: 'webhook-e2e-direct'
    }
  };
  const res = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${MP_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': `webhook-test-${Date.now()}`
    },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Falha ao criar pagamento direto: ${res.status} ${text}`);
  const body = tryParseJson(text);
  const id = body?.id;
  if (!id) throw new Error(`Resposta sem payment_id: ${text}`);
  return { id, body };
}

async function triggerWebhook(id) {
  const getUrl = `${WEBHOOK_URL}?topic=payment&id=${encodeURIComponent(id)}`;
  const getRes = await fetch(getUrl);
  const getBody = tryParseJson(await getRes.text());

  const postRes = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic: 'payment', id }),
  });
  const postBody = tryParseJson(await postRes.text());

  return {
    get: { status: getRes.status, body: getBody },
    post: { status: postRes.status, body: postBody },
  };
}

async function main() {
  try {
    console.log('Criando pagamento PIX direto na API do Mercado Pago...');
    const { id, body } = await createPixPaymentDirect();
    console.log('Pagamento criado:', { id, status: body?.status });
    console.log('Acionando webhook (GET e POST)...');
    const result = await triggerWebhook(id);
    console.log('Webhook GET:', result.get);
    console.log('Webhook POST:', result.post);
  } catch (e) {
    console.error('Erro no teste direto do webhook:', e.message || e);
    process.exitCode = 1;
  }
}

main();