import 'dotenv/config';

const MP_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const PROJECT_FUNC_URL = 'https://cproxdqrraiujnewbsvp.supabase.co/functions/v1/mercado-pago-webhook';
const WEBHOOK_URL = process.env.MERCADOPAGO_NOTIFICATION_URL || PROJECT_FUNC_URL;

async function getLatestPaymentId() {
  if (!MP_TOKEN) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN não definido no ambiente');
  }
  const url = 'https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=1';
  const res = await fetch(url, { headers: { Authorization: `Bearer ${MP_TOKEN}` } });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Falha ao buscar pagamentos: ${res.status} ${JSON.stringify(data)}`);
  }
  const results = Array.isArray(data?.results) ? data.results : [];
  if (!results.length) {
    throw new Error('Nenhum pagamento encontrado para testar');
  }
  return results[0]?.id;
}

async function callWebhook(id) {
  const getUrl = `${WEBHOOK_URL}?topic=payment&id=${encodeURIComponent(id)}`;
  const getRes = await fetch(getUrl);
  const getBody = await getRes.text();

  const postRes = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic: 'payment', id }),
  });
  const postBody = await postRes.text();

  return {
    get: { status: getRes.status, body: tryParseJson(getBody) },
    post: { status: postRes.status, body: tryParseJson(postBody) },
  };
}

function tryParseJson(text) {
  try { return JSON.parse(text); } catch { return text; }
}

async function main() {
  try {
    const cliId = process.argv[2];
    const paymentId = cliId || await getLatestPaymentId();
    console.log('Testando webhook com payment_id:', paymentId);
    const result = await callWebhook(paymentId);
    console.log('GET result:', result.get);
    console.log('POST result:', result.post);
  } catch (e) {
    console.error('Erro no teste do webhook:', e.message || e);
    process.exitCode = 1;
  }
}

main();