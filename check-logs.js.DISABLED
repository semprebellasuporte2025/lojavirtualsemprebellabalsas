// Verificar logs da Edge Function
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

async function checkFunctionLogs() {
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    
    console.log('📋 Verificando logs da função...');
    
    // Tentar uma chamada mais simples para ver o erro real
    const result = await supabase.functions.invoke('dispatch-order-webhook', {
      body: { 
        teste: "debug"
      }
    });
    
    console.log('📤 Resposta completa:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('💥 Erro detalhado:');
    console.error('- Mensagem:', error.message);
    console.error('- Código:', error.code);
    
    // Tentar ver o corpo da resposta de erro
    if (error.context && error.context.body) {
      try {
        const reader = error.context.body.getReader();
        const { value } = await reader.read();
        const decoder = new TextDecoder();
        const errorBody = decoder.decode(value);
        console.log('- Corpo do erro:', errorBody);
      } catch (e) {
        console.log('- Não foi possível ler o corpo do erro');
      }
    }
  }
}

checkFunctionLogs();