const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createMovimentacoesTable() {
  try {
    console.log('🔄 Criando tabela de movimentações de estoque...');
    
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'supabase', 'create_movimentacoes_estoque_table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Executar o SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Erro ao criar tabela:', error);
      return;
    }
    
    console.log('✅ Tabela de movimentações criada com sucesso!');
    
    // Verificar se a tabela foi criada
    const { data: tables, error: tablesError } = await supabase
      .from('movimentacoes_estoque')
      .select('count(*)')
      .limit(1);
    
    if (!tablesError) {
      console.log('✅ Tabela verificada e funcionando!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

createMovimentacoesTable();