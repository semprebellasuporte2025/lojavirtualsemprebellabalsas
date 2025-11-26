// Teste simples para verificar URLs dos banners
const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = "https://cproxdqrraiujnewbsvp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcm94ZHFycmFpdWpuZXdic3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNTc4ODEsImV4cCI6MjA3NjczMzg4MX0.GuWZ81NEj9V8I77bSqaD6qItJwKFmQjVuJcFMbIyUjo";

console.log('Testando URLs dos banners...');

const supabase = createClient(supabaseUrl, supabaseKey);

// Buscar banners ativos
supabase
  .from('banners')
  .select('id, titulo, imagem_url, imagem_url_mobile')
  .eq('ativo', true)
  .order('ordem_exibicao')
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Erro:', error);
      process.exit(1);
    }
    
    console.log(`✅ ${data.length} banners encontrados:`);
    
    data.forEach((banner, index) => {
      console.log(`\n--- Banner ${index + 1} ---`);
      console.log(`ID: ${banner.id}`);
      console.log(`Título: "${banner.titulo || '(sem título)'}"`);
      console.log(`URL Desktop: ${banner.imagem_url}`);
      console.log(`URL Mobile: ${banner.imagem_url_mobile || '(não definida)'}`);
      
      // Verificar se a URL é válida
      if (banner.imagem_url) {
        console.log(`✅ URL Desktop parece válida`);
      } else {
        console.log(`❌ URL Desktop está vazia`);
      }
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erro inesperado:', err);
    process.exit(1);
  });