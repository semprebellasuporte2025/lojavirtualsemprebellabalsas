// Teste simples da função
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

async function testSimple() {
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    
    console.log('🧪 Testando função com corpo vazio...');
    
    // Testar com corpo vazio
    const result = await supabase.functions.invoke('dispatch-order-webhook', {
      body: {}
    });
    
    console.log('✅ Função respondeu:', result.status);
    console.log('Dados:', result.data);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    
    // Tentar fazer uma requisição HTTP direta
    console.log('🌐 Tentando requisição HTTP direta...');
    
    const functionUrl = `${SUPABASE_URL}/functions/v1/dispatch-order-webhook`;
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });
    
    console.log('📊 Status HTTP:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Erro detalhado:', errorText);
    } else {
      const data = await response.json();
      console.log('Resposta:', data);
    }
  }
}

testSimple();