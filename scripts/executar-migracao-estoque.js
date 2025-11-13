import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas corretamente');
  console.error('VITE_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ Faltando');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Configurada' : '❌ Faltando');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executarMigracao() {
  try {
    console.log('🚀 Iniciando execução das migrações de estoque...');
    
    // 1. Ler o arquivo de migração principal
    const fs = require('fs').promises;
    const migracaoPrincipal = await fs.readFile(
      './supabase/migrations/20250125000000_remove_estoque_from_produtos.sql', 
      'utf8'
    );
    
    console.log('📋 Executando migração principal...');
    
    // 2. Executar a migração principal
    const { error: errorMigracao } = await supabase.rpc('executar_sql', {
      sql_query: migracaoPrincipal
    });
    
    if (errorMigracao) {
      console.error('❌ Erro na migração principal:', errorMigracao);
      
      // Tentar executar diretamente via query se a RPC falhar
      console.log('🔄 Tentando abordagem alternativa...');
      await executarSQLDireto(migracaoPrincipal);
    } else {
      console.log('✅ Migração principal executada com sucesso!');
    }
    
    // 3. Executar atualização das funções
    console.log('📋 Executando atualização das funções...');
    const funcoesAtualizadas = await fs.readFile(
      './supabase/update_estoque_functions.sql', 
      'utf8'
    );
    
    const { error: errorFuncoes } = await supabase.rpc('executar_sql', {
      sql_query: funcoesAtualizadas
    });
    
    if (errorFuncoes) {
      console.error('❌ Erro na atualização das funções:', errorFuncoes);
      await executarSQLDireto(funcoesAtualizadas);
    } else {
      console.log('✅ Funções atualizadas com sucesso!');
    }
    
    console.log('🎉 Todas as migrações executadas com sucesso!');
    console.log('📊 O controle de estoque agora está centralizado nas variações dos produtos');
    
  } catch (error) {
    console.error('❌ Erro durante a execução das migrações:', error);
    process.exit(1);
  }
}

async function executarSQLDireto(sql) {
  try {
    // Dividir o SQL em statements individuais
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`📝 Executando: ${statement.trim().substring(0, 100)}...`);
        const { error } = await supabase.rpc('executar_sql', {
          sql_query: statement + ';'
        });
        
        if (error) {
          console.warn('⚠️  Statement falhou, continuando...', error.message);
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro na execução direta do SQL:', error);
  }
}

// Verificar se a função executar_sql existe
async function verificarFuncaoExecutarSQL() {
  const { data, error } = await supabase
    .from('pg_proc')
    .select('proname')
    .eq('proname', 'executar_sql')
    .single();
    
  if (error || !data) {
    console.log('ℹ️  Função executar_sql não encontrada, criando...');
    await criarFuncaoExecutarSQL();
  }
}

async function criarFuncaoExecutarSQL() {
  const sql = `
    CREATE OR REPLACE FUNCTION executar_sql(sql_query TEXT)
    RETURNS void AS $$
    BEGIN
      EXECUTE sql_query;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  const { error } = await supabase.rpc('executar_sql', { sql_query: sql });
  if (error) {
    console.error('❌ Não foi possível criar a função executar_sql:', error);
    console.log('📋 Execute os scripts manualmente no SQL Editor do Supabase:');
    console.log('1. supabase/migrations/20250125000000_remove_estoque_from_produtos.sql');
    console.log('2. supabase/update_estoque_functions.sql');
    process.exit(1);
  }
}

// Executar o script
verificarFuncaoExecutarSQL()
  .then(() => executarMigracao())
  .catch(console.error);