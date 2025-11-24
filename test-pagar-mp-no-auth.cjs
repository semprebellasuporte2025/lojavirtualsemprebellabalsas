// Script para testar a função pagar-mp sem autenticação (CommonJS)
const fetch = require('node-fetch').default;
require('dotenv').config();

const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  console.error('❌ Variável VITE_PUBLIC_SUPABASE_URL não configurada');
  process.exit(1);
}

console.log('🔗 Testando função pagar-mp sem autenticação...');
console.log('   URL:', supabaseUrl + '/functions/v1/pagar-mp');

async function testPagarMP() {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/pagar-mp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tipo: 'pix',
        valor: 10.50,
        descricao: 'Teste de pagamento sem auth',
        pedido_id: 'test-no-auth-' + Date.now()
      })
    });
    
    console.log('📋 Status:', response.status);
    console.log('📋 Status text:', response.statusText);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Resposta:', JSON.stringify(result, null, 2));
    } else {
      const errorText = await response.text();
      console.error('❌ Erro:', errorText);
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

// Executar teste
testPagarMP();