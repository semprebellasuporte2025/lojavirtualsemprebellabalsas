// Script detalhado para verificar o estado dos banners
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Defina VITE_PUBLIC_SUPABASE_URL e VITE_PUBLIC_SUPABASE_ANON_KEY no ambiente');
  process.exit(1);
}

console.log('🔍 Verificando detalhes dos banners...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

// Buscar todos os detalhes dos banners ativos
supabase
  .from('banners')
  .select('*')
  .eq('ativo', true)
  .order('ordem_exibicao')
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Erro ao buscar banners:', error);
      process.exit(1);
    }
    
    console.log(`📊 Total de banners ativos: ${data.length}\n`);
    
    if (data.length === 0) {
      console.log('ℹ️  Nenhum banner ativo encontrado.');
      process.exit(0);
    }
    
    // Verificar cada banner detalhadamente
    data.forEach((banner, index) => {
      console.log(`--- BANNER ${index + 1} ---`);
      console.log(`ID: ${banner.id}`);
      console.log(`Título: "${banner.titulo || '(vazio)'}"`);
      console.log(`Subtítulo: "${banner.subtitulo || '(vazio)'}"`);
      console.log(`Ordem: ${banner.ordem_exibicao}`);
      console.log(`Ativo: ${banner.ativo}`);
      console.log(`Imagem URL: ${banner.imagem_url || '(vazio)'}`);
      console.log(`Imagem Mobile URL: ${banner.imagem_url_mobile || '(vazio)'}`);
      console.log(`Link Destino: ${banner.link_destino || '(vazio)'}`);
      console.log(`Texto Botão: ${banner.texto_botao || '(vazio)'}`);
      console.log(`Criado em: ${banner.created_at}`);
      console.log(`Atualizado em: ${banner.updated_at}`);
      console.log('');
    });
    
    // Verificar problemas comuns
    console.log('🔎 DIAGNÓSTICO:');
    
    const bannersSemTitulo = data.filter(b => !b.titulo || b.titulo.trim() === '');
    const bannersSemImagem = data.filter(b => !b.imagem_url || b.imagem_url.trim() === '');
    const bannersSemLink = data.filter(b => !b.link_destino || b.link_destino.trim() === '');
    
    if (bannersSemTitulo.length > 0) {
      console.log(`❌ ${bannersSemTitulo.length} banner(s) sem título`);
    }
    
    if (bannersSemImagem.length > 0) {
      console.log(`❌ ${bannersSemImagem.length} banner(s) sem imagem`);
    }
    
    if (bannersSemLink.length > 0) {
      console.log(`⚠️  ${bannersSemLink.length} banner(s) sem link de destino`);
    }
    
    if (bannersSemTitulo.length === 0 && bannersSemImagem.length === 0) {
      console.log('✅ Todos os banners têm título e imagem preenchidos');
    }
    
    console.log('\n💡 RECOMENDAÇÕES:');
    console.log('1. Verifique no painel do Supabase se os banners têm título e imagem');
    console.log('2. Confirme se as URLs das imagens são válidas e acessíveis');
    console.log('3. Teste se as políticas RLS permitem acesso público');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erro inesperado:', err);
    process.exit(1);
  });