// Script simples para testar conexão com Supabase e buscar banners
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase via ambiente
const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testando conexão com Supabase...');
console.log('URL:', supabaseUrl);
console.log('Chave:', supabaseKey ? '***' + supabaseKey.slice(-8) : 'Não configurada');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Defina VITE_PUBLIC_SUPABASE_URL e VITE_PUBLIC_SUPABASE_ANON_KEY no ambiente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Testar busca de banners ativos
console.log('\nBuscando banners ativos...');
supabase
  .from('banners')
  .select('*')
  .eq('ativo', true)
  .order('ordem_exibicao')
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Erro ao buscar banners:', error);
      console.log('\n💡 Possíveis causas:');
      console.log('1. Políticas RLS muito restritivas');
      console.log('2. Tabela banners não existe');
      console.log('3. Problemas de conexão com o Supabase');
      process.exit(1);
    }
    
    console.log('✅ Banners encontrados:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('\n📋 Primeiros 3 banners:');
      data.slice(0, 3).forEach((banner, index) => {
        console.log(`${index + 1}. ${banner.titulo} (ID: ${banner.id}, Ativo: ${banner.ativo})`);
      });
    } else {
      console.log('ℹ️  Nenhum banner ativo encontrado na tabela.');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erro inesperado:', err);
    process.exit(1);
  });