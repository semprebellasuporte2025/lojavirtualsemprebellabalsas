// Teste HTTP direto para ver o erro completo
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

async function testHttpDirect() {
  try {
    const functionUrl = `${SUPABASE_URL}/functions/v1/dispatch-order-webhook`;
    
    console.log('🌐 Fazendo requisição HTTP direta para:', functionUrl);
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ numero_pedido: "20257091" })
    });
    
    console.log('📊 Status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Erro completo:');
      console.log(errorText);
      
      // Tentar parsear como JSON
      try {
        const errorJson = JSON.parse(errorText);
        console.log('📋 Erro em JSON:');
        console.log(JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.log('📋 Erro em texto simples');
      }
    } else {
      const data = await response.json();
      console.log('✅ Sucesso:', data);
    }
    
  } catch (error) {
    console.error('💥 Erro na requisição:', error.message);
  }
}

testHttpDirect();