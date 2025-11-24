require('dotenv').config();

const SUPABASE_URL = process.env.VITE_PUBLIC_SUPABASE_URL || 'https://cproxdqrraiujnewbsvp.supabase.co';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/pagar-mp`;

async function run() {
  console.log('Criando preferência de CARTÃO via pagar-mp (Checkout Pro)...');

  try {
    // Login para obter JWT de usuário
    const loginResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email: process.env.TEST_USER_EMAIL || 'everaldozs@gmail.com',
        password: process.env.TEST_USER_PASSWORD || '1234567',
      }),
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error('Falha no login:', loginResponse.status, errorText);
      return;
    }

    const authData = await loginResponse.json();
    const userJWT = authData.access_token;
    console.log('Login ok. User ID:', authData.user?.id);

    // Invocar função pagar-mp para fluxo de CARTÃO com redirectUrl
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userJWT}`,
        Origin: 'http://localhost:3002',
      },
      body: JSON.stringify({
        method: 'card',
        amount: 1.0,
        description: 'Teste excluir PIX no fluxo de cartão',
        orderNumber: `TEST-${Date.now()}`,
        payer: { email: process.env.TEST_USER_EMAIL || 'everaldozs@gmail.com' },
        redirectUrl: process.env.TEST_REDIRECT_URL || 'https://example.com/retorno',
      }),
    });

    console.log('Status:', response.status, response.statusText);
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Resposta JSON:\n', JSON.stringify(data, null, 2));
      if (data?.init_point || data?.sandbox_init_point) {
        console.log('\nAbra este link e verifique se PIX NÃO aparece:');
        console.log(data.init_point || data.sandbox_init_point);
      }
    } else {
      const text = await response.text();
      console.log('Resposta Texto:\n', text);
    }
  } catch (err) {
    console.error('Erro ao criar preferência de cartão:', err);
  }
}

run();