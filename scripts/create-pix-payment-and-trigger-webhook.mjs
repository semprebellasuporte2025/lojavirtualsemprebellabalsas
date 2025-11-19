import 'dotenv/config';

const BASE_FUNC_URL = 'https://cproxdqrraiujnewbsvp.supabase.co/functions/v1';
const WEBHOOK_URL = `${BASE_FUNC_URL}/mercado-pago-webhook`;

function tryParseJson(text) {
  try { return JSON.parse(text); } catch { return text; }
}

async function createPixPayment() {
  const payload = {
    transaction_amount: 1,
    payment_method_id: 'pix',
    payer: {
      email: 'webhook-tester@semprebella.com.br'
    },
    metadata: {
      source: 'webhook-e2e',
      description: 'Teste webhook PIX',
    },
  };
  const res = await fetch(`${BASE_FUNC_URL}/mercado-pago-payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  const body = tryParseJson(text);
  if (!res.ok) {
    throw new Error(`Falha ao criar pagamento PIX: ${res.status} ${text}`);
  }
  const id = body?.id;
  if (!id) {
    throw new Error(`Resposta sem payment_id: ${text}`);
  }
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
    console.log('Criando pagamento PIX de teste...');
    const { id, body } = await createPixPayment();
    console.log('Pagamento criado:', { id, status: body?.status });
    console.log('Acionando webhook (GET e POST)...');
    const result = await triggerWebhook(id);
    console.log('Webhook GET:', result.get);
    console.log('Webhook POST:', result.post);
  } catch (e) {
    console.error('Erro no teste end-to-end do webhook:', e.message || e);
    process.exitCode = 1;
  }
}

main();