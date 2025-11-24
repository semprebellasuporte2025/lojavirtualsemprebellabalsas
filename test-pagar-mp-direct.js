import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://cproxdqrraiujnewbsvp.supabase.co';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/pagar-mp`;

async function testPagarMP() {
  console.log('Testando função pagar-mp diretamente...');
  console.log('URL:', FUNCTION_URL);
  
  try {
    // Teste OPTIONS primeiro
    console.log('\n=== Teste OPTIONS ===');
    const optionsResponse = await fetch(FUNCTION_URL, {
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'POST',
        'Origin': 'http://localhost:3002'
      }
    });
    
    console.log('OPTIONS Status:', optionsResponse.status);
    console.log('OPTIONS Headers:', Object.fromEntries(optionsResponse.headers.entries()));
    
    // Teste POST
    console.log('\n=== Teste POST ===');
    const postResponse = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
        'Origin': 'http://localhost:3002'
      },
      body: JSON.stringify({
        method: 'pix',
        amount: 10.50,
        description: 'Teste de pagamento',
        payer: {
          email: 'test@example.com'
        }
      })
    });
    
    console.log('POST Status:', postResponse.status);
    console.log('POST Status Text:', postResponse.statusText);
    
    if (postResponse.headers.get('content-type')?.includes('application/json')) {
      const data = await postResponse.json();
      console.log('POST Response:', JSON.stringify(data, null, 2));
    } else {
      const text = await postResponse.text();
      console.log('POST Response Text:', text);
    }
    
    console.log('POST Headers:', Object.fromEntries(postResponse.headers.entries()));
    
  } catch (error) {
    console.error('Erro ao testar função:', error);
  }
}

testPagarMP();