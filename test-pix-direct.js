// Teste direto da Edge Function pagar-mp para verificar deploy e resposta
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('❌ Defina VITE_PUBLIC_SUPABASE_URL e VITE_PUBLIC_SUPABASE_ANON_KEY no ambiente');
  process.exit(1);
}

async function testPagarMp() {
  const url = `${SUPABASE_URL}/functions/v1/pagar-mp`;
  const payload = {
    method: 'pix',
    amount: 1,
    description: 'Teste PIX direto',
    orderNumber: `TEST-${Date.now()}`,
    payer: {
      email: 'dev@example.com',
      first_name: 'Dev',
      last_name: 'Test',
      identification: { type: 'CPF', number: '12345678909' },
    },
  };

  console.log('🌐 URL:', url);
  console.log('🔑 Usando ANON KEY:', ANON_KEY ? 'definida' : 'não definida');

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    console.log('📊 Status:', resp.status, resp.statusText);
    console.log('📦 Resposta:', JSON.stringify(json, null, 2));

    if (resp.status === 404) {
      console.log('\n❗ 404 indica que a função não está deployada ou o caminho está incorreto.');
      console.log('   Verifique: supabase functions deploy pagar-mp e a chave MP_ACCESS_TOKEN.');
    }
  } catch (err) {
    console.error('💥 Falha na requisição:', err?.message || err);
    console.log('\nObs.: Em Node não há CORS; erros aqui costumam ser DNS/rede ou 404 do gateway.');
  }
}

testPagarMp();