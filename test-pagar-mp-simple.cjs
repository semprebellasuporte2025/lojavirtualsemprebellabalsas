require('dotenv').config();

const SUPABASE_URL = process.env.VITE_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('❌ Defina VITE_PUBLIC_SUPABASE_URL e VITE_PUBLIC_SUPABASE_ANON_KEY no ambiente');
  process.exit(1);
}

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/pagar-mp`;

async function testPagarMP() {
  console.log('Testando função pagar-mp com JWT de usuário...');
  
  try {
    // Primeiro, fazer login para obter JWT
    console.log('Fazendo login...');
    const loginResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY
      },
      body: JSON.stringify({
        email: 'everaldozs@gmail.com',
        password: '1234567'
      })
    });
    
    if (!loginResponse.ok) {
      const error = await loginResponse.text();
      console.error('Erro no login:', loginResponse.status, error);
      return;
    }
    
    const authData = await loginResponse.json();
    const userJWT = authData.access_token;
    
    console.log('Login bem-sucedido!');
    console.log('User ID:', authData.user.id);
    
    // Testar a função pagar-mp com JWT do usuário
    console.log('\n=== Testando pagar-mp com JWT ===');
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userJWT}`,
        'Origin': 'http://localhost:3002'
      },
      body: JSON.stringify({
        method: 'pix',
        amount: 10.50,
        description: 'Teste de pagamento com JWT',
        payer: {
          email: 'everaldozs@gmail.com'
        }
      })
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json();
      console.log('Resposta:', JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('Resposta Text:', text);
    }
    
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
  } catch (error) {
    console.error('Erro ao testar função:', error);
  }
}

testPagarMP();