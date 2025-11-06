// Teste manual da Edge Function com suas credenciais
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Testando conexão com Supabase...');
console.log('- URL:', SUPABASE_URL);
console.log('- Service Key presente:', !!SERVICE_ROLE_KEY);

async function testEdgeFunction() {
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    
    console.log('🚀 Invocando função dispatch-order-webhook...');
    
    // Testa com o número do pedido que você forneceu
    const result = await supabase.functions.invoke('dispatch-order-webhook', {
      body: { 
        numero_pedido: '20257091'
      }
    });
    
    console.log('📤 Resposta da Edge Function:');
    console.log('- Status:', result.status);
    console.log('- Dados:', result.data);
    console.log('- Erro:', result.error);
    
    if (result.error) {
      console.log('❌ Erro na função - Provavelmente secrets não configurados');
    } else {
      console.log('✅ Função executada com sucesso!');
    }
    
  } catch (error) {
    console.error('💥 Erro ao invocar função:', error.message);
    
    if (error.message.includes('JWT')) {
      console.log('🔐 Precisa deployar com --no-verify-jwt');
    }
  }
}

testEdgeFunction();