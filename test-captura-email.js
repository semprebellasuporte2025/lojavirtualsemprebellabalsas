import fetch from 'node-fetch';

const url = 'https://portaln8n.semprebellabalsas.com.br/webhook/captura_email';
const data = {
  email: 'teste.gemini@example.com',
  nome: 'Teste Gemini'
};

async function testWebhook() {
  console.log(`Enviando dados para: ${url}`);
  console.log('Payload:', JSON.stringify(data, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    const responseBody = await response.text();
    console.log('Corpo da Resposta:', responseBody);

  } catch (error) {
    console.error('Erro ao chamar o webhook:', error);
  }
}

testWebhook();