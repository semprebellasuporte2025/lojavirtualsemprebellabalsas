// Script para testar conexão com Supabase e verificar banners
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Defina VITE_PUBLIC_SUPABASE_URL e VITE_PUBLIC_SUPABASE_ANON_KEY no ambiente');
  process.exit(1);
}

console.log('URL do Supabase:', supabaseUrl);
console.log('Tentando conectar ao Supabase...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBanners() {
  try {
    console.log('\n=== TESTANDO CONEXÃO COM SUPABASE ===');
    
    // Testar conexão básica
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.log('❌ Erro de autenticação:', authError.message);
    } else {
      console.log('✅ Conexão de autenticação OK');
    }
    
    // Testar busca de banners
    console.log('\n=== BUSCANDO BANNERS ATIVOS ===');
    const { data, error } = await supabase
      .from('banners')
      .select('id, titulo, imagem_url, ativo, ordem_exibicao')
      .eq('ativo', true)
      .order('ordem_exibicao', { ascending: true })
      .limit(5);
    
    if (error) {
      console.log('❌ Erro ao buscar banners:', error.message);
      console.log('Código:', error.code);
      console.log('Detalhes:', error.details);
      console.log('Hint:', error.hint);
      return;
    }
    
    console.log('✅ Busca de banners concluída');
    console.log('Banners encontrados:', data?.length || 0);
    
    if (data && data.length > 0) {
      console.log('\n=== BANNERS ATIVOS ===');
      data.forEach((banner, index) => {
        console.log(`${index + 1}. ${banner.titulo} (ID: ${banner.id})`);
        console.log(`   URL: ${banner.imagem_url}`);
        console.log(`   Ativo: ${banner.ativo}`);
        console.log(`   Ordem: ${banner.ordem_exibicao}`);
        console.log('---');
      });
    } else {
      console.log('ℹ️ Nenhum banner ativo encontrado no banco de dados');
      console.log('Verifique se há banners com campo "ativo" = true na tabela banners');
    }
    
  } catch (err) {
    console.log('❌ Erro inesperado:', err.message);
  }
}

testBanners().catch(console.error);