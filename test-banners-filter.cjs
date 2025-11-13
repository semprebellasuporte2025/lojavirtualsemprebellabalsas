const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Função simulada da fetchActiveBanners com o filtro
async function testFetchActiveBanners() {
  try {
    console.log('🔍 Testando função fetchActiveBanners com filtro...');
    
    // Simular a consulta original
    let query = supabase
      .from('banners')
      .select('id, titulo, subtitulo, imagem_url, imagem_url_mobile, link_destino, texto_botao, ordem_exibicao, ativo')
      .eq('ativo', true)
      .order('ordem_exibicao', { ascending: true })
      .limit(10);

    let { data, error } = await query;

    if (error) {
      console.error('❌ Erro na consulta:', error.message);
      return [];
    }

    console.log(`📊 Total de banners ativos encontrados: ${data.length}`);
    
    // Aplicar o filtro (mesma lógica implementada)
    const filteredBanners = (data || []).filter(banner => 
      banner.titulo && banner.titulo.trim() !== '' && 
      banner.imagem_url && banner.imagem_url.trim() !== ''
    );

    console.log(`✅ Banners após filtro (com título e imagem): ${filteredBanners.length}`);
    
    // Exibir detalhes dos banners
    filteredBanners.forEach((banner, index) => {
      console.log(`\n--- Banner ${index + 1} ---`);
      console.log(`ID: ${banner.id}`);
      console.log(`Título: "${banner.titulo}"`);
      console.log(`Imagem URL: ${banner.imagem_url}`);
      console.log(`Link Destino: ${banner.link_destino || 'Nenhum'}`);
      console.log(`Ativo: ${banner.ativo}`);
    });

    // Exibir banners que foram filtrados
    const invalidBanners = (data || []).filter(banner => 
      !banner.titulo || banner.titulo.trim() === '' || 
      !banner.imagem_url || banner.imagem_url.trim() === ''
    );

    if (invalidBanners.length > 0) {
      console.log(`\n❌ Banners filtrados (sem título ou imagem): ${invalidBanners.length}`);
      invalidBanners.forEach((banner, index) => {
        console.log(`\n--- Banner Inválido ${index + 1} ---`);
        console.log(`ID: ${banner.id}`);
        console.log(`Título: "${banner.titulo || 'VAZIO'}"`);
        console.log(`Imagem URL: ${banner.imagem_url || 'VAZIA'}`);
        console.log(`Ativo: ${banner.ativo}`);
      });
    }

    return filteredBanners;

  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
    return [];
  }
}

// Executar o teste
async function main() {
  console.log('🚀 Iniciando teste do filtro de banners...\n');
  
  const validBanners = await testFetchActiveBanners();
  
  console.log('\n' + '='.repeat(50));
  if (validBanners.length > 0) {
    console.log(`🎉 Sucesso! ${validBanners.length} banners válidos serão exibidos.`);
  } else {
    console.log('⚠️  Nenhum banner válido encontrado para exibição.');
    console.log('💡 Verifique se há banners com título e imagem_url preenchidos no Supabase.');
  }
  console.log('='.repeat(50));
}

main();