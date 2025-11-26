// Script simples para testar conexão com Supabase
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Defina VITE_PUBLIC_SUPABASE_URL e VITE_PUBLIC_SUPABASE_ANON_KEY no ambiente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔍 Testando conexão com Supabase...');
  
  try {
    // Testar consulta simples
    const { data, error } = await supabase
      .from('produtos')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro na consulta:', error);
      return;
    }
    
    console.log('✅ Conexão bem-sucedida! Dados:', data);
    
    // Testar consulta específica que estava falhando
    console.log('\n🔍 Testando consulta específica...');
    const { data: specificData, error: specificError } = await supabase
      .from('produtos')
      .select('estoque')
      .eq('id', '8291d3e0-0917-4e59-974d-a1cfdde9e86c')
      .maybeSingle();
    
    if (specificError) {
      console.error('❌ Erro na consulta específica:', specificError);
      return;
    }
    
    console.log('✅ Consulta específica bem-sucedida! Dados:', specificData);
    
  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

testConnection();