import fetch from 'node-fetch';

const testToken = async () => {
  const token = 'APP_USR-3687400521243806-112016-1cd2c353ec5de843bb6521ad57426584-2997053008';
  
  console.log('🔍 Testando token do Mercado Pago...');
  console.log('Token:', token.substring(0, 10) + '...');
  
  try {
    // Testar se o token é válido fazendo uma chamada simples à API
    const response = await fetch('https://api.mercadopago.com/v1/payment_methods', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Status:', response.status);
    console.log('📋 Status Text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Token VÁLIDO!');
      console.log('📦 Número de métodos de pagamento:', data.length);
      if (data.length > 0) {
        console.log('💡 Primeiros métodos:', data.slice(0, 3).map(p => p.name));
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Token INVÁLIDO ou com problemas:');
      console.log('Erro:', errorText);
      
      // Tentar parsear como JSON se possível
      try {
        const errorJson = JSON.parse(errorText);
        console.log('📝 Detalhes do erro:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.log('📝 Mensagem de erro:', errorText);
      }
    }
    
  } catch (error) {
    console.log('🚨 Erro na requisição:', error.message);
    console.log('Stack:', error.stack);
  }
};

testToken();