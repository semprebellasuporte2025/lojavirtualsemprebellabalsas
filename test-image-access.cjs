// Script para testar se as imagens dos banners estão acessíveis
const https = require('https');

// URLs das imagens dos banners
const imageUrls = [
  'https://cproxdqrraiujnewbsvp.supabase.co/storage/v1/object/public/banners/banners/banner-1762869154383-3.png',
  'https://cproxdqrraiujnewbsvp.supabase.co/storage/v1/object/public/banners/banners/banner-1762982069797.png',
  'https://cproxdqrraiujnewbsvp.supabase.co/storage/v1/object/public/banners/banners/1762869146979-2.png',
  'https://cproxdqrraiujnewbsvp.supabase.co/storage/v1/object/public/banners/banners/1762869161446-1.png'
];

console.log('🌐 Testando acesso às imagens dos banners...\n');

function testImageAccess(url) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      const statusCode = res.statusCode;
      const contentType = res.headers['content-type'];
      
      if (statusCode === 200 && contentType && contentType.startsWith('image/')) {
        resolve({ url, status: '✅ ACESSÍVEL', statusCode, contentType });
      } else {
        resolve({ url, status: '❌ INACESSÍVEL', statusCode, contentType });
      }
      
      res.resume(); // Liberar a conexão
    });
    
    req.on('error', (err) => {
      resolve({ url, status: '❌ ERRO', error: err.message });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ url, status: '⏰ TIMEOUT' });
    });
  });
}

async function testAllImages() {
  const results = [];
  
  for (const url of imageUrls) {
    const result = await testImageAccess(url);
    results.push(result);
    
    // Pequena pausa entre requisições
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('📊 RESULTADOS DO TESTE DE IMAGENS:');
  console.log('');
  
  results.forEach((result, index) => {
    console.log(`Imagem ${index + 1}:`);
    console.log(`URL: ${result.url}`);
    console.log(`Status: ${result.status}`);
    
    if (result.statusCode) {
      console.log(`Código HTTP: ${result.statusCode}`);
    }
    
    if (result.contentType) {
      console.log(`Tipo de conteúdo: ${result.contentType}`);
    }
    
    if (result.error) {
      console.log(`Erro: ${result.error}`);
    }
    
    console.log('---');
  });
  
  // Resumo
  const accessible = results.filter(r => r.status === '✅ ACESSÍVEL').length;
  const inaccessible = results.filter(r => r.status !== '✅ ACESSÍVEL').length;
  
  console.log(`\n📈 RESUMO: ${accessible} acessível(is), ${inaccessible} inacessível(is)`);
  
  if (inaccessible > 0) {
    console.log('\n⚠️  ALGUMAS IMAGENS NÃO ESTÃO ACESSÍVEIS - ISSO PODE EXPLICAR OS BANNERS NÃO APARECEREM');
  } else {
    console.log('\n✅ TODAS AS IMAGENS ESTÃO ACESSÍVEIS - O PROBLEMA DEVE SER NA LÓGICA DE EXIBIÇÃO');
  }
}

testAllImages().catch(console.error);