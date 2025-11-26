import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase (somente via variáveis de ambiente)
const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltam variáveis de ambiente: defina VITE_PUBLIC_SUPABASE_URL e VITE_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRpcFunction() {
  try {
    console.log('Verificando se a função inserir_itens_pedido existe...');
    
    // Verificar se a função existe
    const { data, error } = await supabase
      .rpc('inserir_itens_pedido', { itens: [] });
    
    if (error) {
      if (error.code === '42883') {
        console.log('❌ Função inserir_itens_pedido não existe no banco de dados');
        console.log('Erro:', error.message);
        return false;
      } else {
        console.log('✅ Função existe, mas retornou outro erro:', error.message);
        return true;
      }
    }
    
    console.log('✅ Função inserir_itens_pedido existe e funciona corretamente');
    return true;
    
  } catch (err) {
    console.log('❌ Erro ao verificar função:', err.message);
    return false;
  }
}

async function applyMigration() {
  console.log('\n📋 Aplicando migração da função RPC...');
  
  // Ler o arquivo de migração
  const fs = require('fs');
  const path = require('path');
  
  const migrationFile = path.join(__dirname, '..', 'supabase', 'migrations', '20250124_create_inserir_itens_pedido_function.sql');
  
  if (!fs.existsSync(migrationFile)) {
    console.log('❌ Arquivo de migração não encontrado:', migrationFile);
    return false;
  }
  
  const sql = fs.readFileSync(migrationFile, 'utf8');
  console.log('📝 SQL para executar:', sql);
  
  // Aqui você precisaria executar o SQL no Supabase Studio ou via CLI
  console.log('\n⚠️  Para aplicar a migração:');
  console.log('1. Acesse https://app.supabase.com/');
  console.log('2. Vá para o projeto SempreBella');
  console.log('3. Clique em "SQL Editor" no menu lateral');
  console.log('4. Cole o conteúdo do arquivo:');
  console.log('   supabase/migrations/20250124_create_inserir_itens_pedido_function.sql');
  console.log('5. Execute o SQL');
  
  return true;
}

async function main() {
  const functionExists = await checkRpcFunction();
  
  if (!functionExists) {
    console.log('\n🔧 Função não existe, aplicando migração...');
    await applyMigration();
  } else {
    console.log('\n✅ Tudo ok! A função RPC está disponível.');
  }
}

main().catch(console.error);