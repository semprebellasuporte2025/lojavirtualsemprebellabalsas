// Teste direto do endpoint do n8n

const WEBHOOK_URL = "https://portaln8n.semprebellabalsas.com.br/webhook/notifica_pedido_cliente_e_proprietario";

async function testN8nEndpoint() {
  console.log('🔍 Testando endpoint do n8n:', WEBHOOK_URL);
  
  try {
    const testPayload = {
      teste: "conexao",
      numero_pedido: "20257091",
      timestamp: new Date().toISOString()
    };
    
    console.log('📤 Enviando payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'SempreBella-Test/1.0'
      },
      body: JSON.stringify(testPayload),
      timeout: 10000
    });
    
    console.log('📥 Resposta do n8n:');
    console.log('- Status:', response.status);
    console.log('- Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('- Body:', responseText);
    
    if (response.ok) {
      console.log('✅ Endpoint do n8n está respondendo!');
    } else {
      console.log('❌ Endpoint retornou erro:', response.status);
    }
    
  } catch (error) {
    console.error('💥 Erro ao testar endpoint:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🔴 O servidor do n8n parece estar offline ou inacessível');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('⏰ Timeout - O n8n não respondeu em 10 segundos');
    } else if (error.code === 'ENOTFOUND') {
      console.log('🌐 DNS não encontrado - Verifique a URL do webhook');
    }
  }
}

testN8nEndpoint();