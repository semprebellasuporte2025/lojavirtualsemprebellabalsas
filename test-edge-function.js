// Script para testar a Edge Function create-mp-preference
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://cproxdqrraiujnewbsvp.supabase.co';
const supabaseKey = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY || 'sua-chave-anon-aqui';

const supabase = createClient(supabaseUrl, supabaseKey);

// Dados de teste
const testData = {
  items: [
    {
      id: 'test-product-1',
      name: 'Produto Teste',
      price: 99.90,
      quantity: 1,
      image: 'https://example.com/product.jpg'
    }
  ],
  externalReference: 'TEST2024123456',
  cliente: {
    nome: 'Cliente Teste',
    email: 'teste@example.com',
    cpf: '12345678900'
  },
  backUrls: {
    success: 'https://semprebella.com/checkout/success',
    pending: 'https://semprebella.com/checkout/pending',
    failure: 'https://semprebella.com/checkout/failure'
  },
  preferredPaymentMethodId: 'pix'
};

async function testEdgeFunction() {
  try {
    console.log('Testando Edge Function create-mp-preference...');
    
    const { data, error } = await supabase.functions.invoke('create-mp-preference', {
      body: testData
    });

    if (error) {
      console.error('Erro na chamada:', error);
      return;
    }

    console.log('Resposta da função:', data);
    
  } catch (err) {
    console.error('Erro no teste:', err);
  }
}

// Executar teste
if (require.main === module) {
  if (!supabaseKey.includes('sua-chave')) {
    testEdgeFunction();
  } else {
    console.log('Por favor, configure a VITE_PUBLIC_SUPABASE_ANON_KEY no ambiente');
    console.log('Execute: export VITE_PUBLIC_SUPABASE_ANON_KEY=sua-chave-aqui');
  }
}

module.exports = { testEdgeFunction };