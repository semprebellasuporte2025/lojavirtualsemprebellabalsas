// Teste final com o pedido específico
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

async function testFinal() {
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    
    console.log('🚀 Testando webhook com pedido 20257091...');
    
    // Testar com o pedido específico
    const result = await supabase.functions.invoke('dispatch-order-webhook', {
      body: { 
        numero_pedido: "20257091"
      }
    });
    
    console.log('✅ Sucesso!');
    console.log('- Status:', result.status);
    console.log('- Dados:', result.data);
    
    if (result.error) {
      console.log('- Erro:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    
    // Tentar ver se há mais detalhes no erro
    if (error.context && error.context.body) {
      try {
        const reader = error.context.body.getReader();
        const { value } = await reader.read();
        const decoder = new TextDecoder();
        const errorBody = decoder.decode(value);
        console.log('- Detalhes do erro:', errorBody);
      } catch (e) {
        console.log('- Sem detalhes adicionais');
      }
    }
  }
}

testFinal();