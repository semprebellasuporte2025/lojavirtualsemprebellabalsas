// Script para executar a função SQL manualmente
const { createClient } = require('@supabase/supabase-js');

// Estas variáveis precisam ser configuradas com suas credenciais reais
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://seu-projeto.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sua_chave_de_servico';

async function executeSQL() {
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    
    // SQL da função get_formas_pagamento_stats
    const sql = `
      CREATE OR REPLACE FUNCTION get_formas_pagamento_stats()
      RETURNS TABLE (
        forma_pagamento TEXT,
        quantidade BIGINT,
        valor_total NUMERIC
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          p.forma_pagamento::TEXT,
          COUNT(*)::BIGINT as quantidade,
          COALESCE(SUM(p.total), 0)::NUMERIC as valor_total
        FROM pedidos p
        WHERE p.status != 'cancelado'
          AND p.forma_pagamento IS NOT NULL
        GROUP BY p.forma_pagamento
        ORDER BY quantidade DESC;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Conceder permissões para usuários autenticados
      GRANT EXECUTE ON FUNCTION get_formas_pagamento_stats() TO authenticated;
      GRANT EXECUTE ON FUNCTION get_formas_pagamento_stats() TO anon;
    `;
    
    console.log('Executando SQL para criar a função...');
    
    // Executar o SQL
    const { data, error } = await supabase.rpc('execute_sql', { sql });
    
    if (error) {
      console.error('Erro ao executar SQL:', error);
      
      // Tentar método alternativo se o RPC não estiver disponível
      console.log('Tentando método alternativo...');
      
      // Para executar SQL diretamente, você precisaria de acesso direto ao banco
      // ou usar o Supabase Studio para executar manualmente
      console.log('\nPor favor, execute manualmente no Supabase Studio:');
      console.log('1. Acesse https://app.supabase.com');
      console.log('2. Selecione seu projeto');
      console.log('3. Vá para "SQL Editor"');
      console.log('4. Cole o seguinte SQL:');
      console.log(sql);
      console.log('5. Execute o script');
      
    } else {
      console.log('Função criada com sucesso!');
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
    
    console.log('\nInstruções para execução manual:');
    console.log('1. Acesse o Supabase Studio: https://app.supabase.com');
    console.log('2. Selecione seu projeto');
    console.log('3. Vá para "SQL Editor"');
    console.log('4. Cole o código SQL do arquivo:');
    console.log('supabase/migrations/20250101000000_create_formas_pagamento_stats_function.sql');
    console.log('5. Execute o script');
  }
}

// Verificar se as credenciais estão disponíveis
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('⚠️  Credenciais não encontradas nas variáveis de ambiente');
  console.log('Para usar este script, configure:');
  console.log('SUPABASE_URL=https://seu-projeto.supabase.co');
  console.log('SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico_aqui');
  console.log('\nOu execute manualmente no Supabase Studio');
}

executeSQL();