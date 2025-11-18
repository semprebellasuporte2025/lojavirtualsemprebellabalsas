const { createClient } = require('@supabase/supabase-js');

// Configuração para teste local
const supabaseUrl = 'https://your-project-ref.supabase.co';
const supabaseKey = 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMercadoPagoFunction() {
  console.log('Testando função mercado-pago-checkout-pro...');
  
  const testPayload = {
    items: [
      {
        title: "Produto Teste",
        quantity: 1,
        unit_price: 10.50,
        currency_id: "BRL",
      }
    ],
    back_urls: {
      success: "http://localhost:3002/checkout/sucesso",
      failure: "http://localhost:3002/checkout/erro", 
      pending: "http://localhost:3002/checkout/pendente"
    },
    auto_return: "approved",
    metadata: {
      source: "test_script",
      items_count: 1,
      subtotal: 10.50,
      shipping_cost: 0,
      total: 10.50
    }
  };

  try {
    console.log('Enviando payload:', JSON.stringify(testPayload, null, 2));
    
    const { data, error } = await supabase.functions.invoke('mercado-pago-checkout-pro', {
      body: testPayload
    });

    if (error) {
      console.error('Erro na função:', error);
      console.error('Mensagem:', error.message);
      console.error('Status:', error.status);
      return;
    }

    console.log('Resposta da função:', JSON.stringify(data, null, 2));
    
    if (data && (data.init_point || data.sandbox_init_point)) {
      console.log('✅ Sucesso! Link de pagamento gerado:');
      console.log('Sandbox:', data.sandbox_init_point || 'N/A');
      console.log('Production:', data.init_point || 'N/A');
    } else {
      console.log('❌ Resposta inesperada da função');
    }

  } catch (err) {
    console.error('Erro geral:', err);
    console.error('Stack:', err.stack);
  }
}

testMercadoPagoFunction();