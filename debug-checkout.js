import fetch from 'node-fetch';

const debugCheckout = async () => {
  console.log('🔍 Debugando fluxo de checkout...');
  
  try {
    // Simular exatamente os dados que o frontend está enviando
    const cartData = {
      items: [
        {
          id: '9a1398e1-c116-4e76-918f-24687f1b304e',
          name: 'Teste',
          price: 1,
          quantity: 1,
          image: 'https://example.com/image.jpg',
          size: 'M',
          color: 'Preto'
        }
      ],
      externalReference: 'test-' + Date.now(),
      cliente: {
        nome: 'Teste Cliente',
        email: 'teste@example.com'
      },
      backUrls: {
        success: 'https://semprebella2.vercel.app/minha-conta?pedido=test-123',
        pending: 'https://semprebella2.vercel.app/minha-conta?pedido=test-123',
        failure: 'https://semprebellabalsas.com.br'
      },
      notificationUrl: 'https://portaln8n.semprebellabalsas.com.br/webhook/notifica_pedido_cliente_e_proprietario'
    };
    
    console.log('📦 Dados sendo enviados:');
    console.log(JSON.stringify(cartData, null, 2));
    
    console.log('\n🔗 Chamando Edge Function...');
    
    const response = await fetch('https://cproxdqrraiujnewbsvp.supabase.co/functions/v1/create-mp-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcm94ZHFycmFpdWpuZXdic3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDc2MDA0MTcsImV4cCI6MjAyMzE3NjQxN30.5U3vQvQv7h3v3QvQv7h3v3QvQv7h3v3QvQv7h3v3Q'
      },
      body: JSON.stringify(cartData)
    });
    
    console.log('📊 Status:', response.status);
    console.log('📋 Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('📝 Resposta completa:');
    console.log(responseText);
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ SUCESSO!');
        console.log('Preference ID:', data.id);
        console.log('Init Point:', data.init_point);
      } catch (e) {
        console.log('⚠️  Resposta não é JSON válido:', responseText);
      }
    } else {
      console.log('❌ ERRO:');
      try {
        const errorData = JSON.parse(responseText);
        console.log('Detalhes do erro:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.log('Mensagem de erro:', responseText);
      }
    }
    
  } catch (error) {
    console.log('🚨 Erro na requisição:', error.message);
    console.log('Stack:', error.stack);
  }
};

debugCheckout();