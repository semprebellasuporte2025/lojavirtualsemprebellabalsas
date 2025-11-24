// Script para testar se a função RPC criar_pedido está disponível
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRpcFunction() {
  console.log('🧪 Testando função RPC criar_pedido...');
  
  try {
    // Testar chamada da função com parâmetros mínimos
    const { data, error } = await supabase.rpc('criar_pedido', {
      p_numero_pedido: 'TEST-' + Date.now(),
      p_subtotal: 100,
      p_total: 100,
      p_forma_pagamento: 'teste'
    });
    
    if (error) {
      console.log('❌ Erro na função RPC:', error.message);
      
      if (error.message.includes('function criar_pedido') || 
          error.message.includes('not found') ||
          error.message.includes('does not exist')) {
        console.log('❗ A função criar_pedido não existe no banco de dados');
        console.log('💡 Execute o arquivo de migração: supabase/migrations/20250201_create_criar_pedido_function.sql');
      } else if (error.message.includes('missing required input')) {
        console.log('✅ Função encontrada! Erro esperado por parâmetros incompletos');
      } else {
        console.log('⚠️ Outro erro na função:', error.message);
      }
    } else {
      console.log('✅ Função RPC criar_pedido funcionando! ID do pedido:', data);
    }
    
  } catch (error) {
    console.log('💥 Erro geral ao testar RPC:', error.message);
  }
}

async function checkFunctionExists() {
  console.log('🔍 Verificando se a função criar_pedido existe...');
  
  try {
    // Consulta direta para verificar se a função existe
    const { data, error } = await supabase
      .from('pg_proc')
      .select('proname')
      .ilike('proname', 'criar_pedido')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro ao consultar pg_proc:', error.message);
    } else if (data && data.length > 0) {
      console.log('✅ Função criar_pedido encontrada no banco de dados');
    } else {
      console.log('❌ Função criar_pedido NÃO encontrada no banco de dados');
    }
    
  } catch (error) {
    console.log('💥 Erro ao verificar função:', error.message);
  }
}

async function main() {
  console.log('🔑 Credenciais:');
  console.log('  Supabase URL:', supabaseUrl);
  console.log('  Anon Key:', supabaseAnonKey?.slice(0, 10) + '...');
  
  await checkFunctionExists();
  await testRpcFunction();
  
  console.log('\n✅ Teste de função RPC concluído');
}

main().catch(console.error);