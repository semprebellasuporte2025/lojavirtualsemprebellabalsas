import { supabase } from '../src/lib/supabase.ts';

async function testProductsAndCart() {
  console.log('🔍 Verificando produtos disponíveis no banco de dados...\n');

  try {
    // 1. Buscar produtos ativos no banco
    const { data: produtos, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('ativo', true)
      .order('nome')
      .limit(10);

    if (error) {
      console.error('❌ Erro ao buscar produtos:', error.message);
      return;
    }

    if (!produtos || produtos.length === 0) {
      console.log('⚠️  Nenhum produto ativo encontrado no banco de dados.');
      console.log('💡 Verificando se há produtos inativos...');
      
      const { data: produtosInativos } = await supabase
        .from('produtos')
        .select('id, nome, ativo, estoque')
        .eq('ativo', false)
        .limit(5);

      if (produtosInativos && produtosInativos.length > 0) {
        console.log('📦 Produtos inativos encontrados:');
        produtosInativos.forEach(p => {
          console.log(`   - ${p.nome} (ID: ${p.id}, Estoque: ${p.estoque}, Ativo: ${p.ativo})`);
        });
      }
      return;
    }

    console.log(`✅ ${produtos.length} produto(s) ativo(s) encontrado(s):\n`);
    
    produtos.forEach((produto, index) => {
      console.log(`${index + 1}. ${produto.nome}`);
      console.log(`   ID: ${produto.id}`);
      console.log(`   Preço: R$ ${produto.preco?.toFixed(2) || 'N/A'}`);
      if (produto.preco_promocional) {
        console.log(`   Preço Promo: R$ ${produto.preco_promocional.toFixed(2)}`);
      }
      console.log(`   Estoque: ${produto.estoque || 0}`);
      console.log(`   Categoria: ${produto.categoria_id || 'N/A'}`);
      console.log(`   Slug: ${produto.slug || 'N/A'}`);
      console.log('');
    });

    // 2. Escolher o produto para teste: prioriza "teste" e cai para o primeiro
    const produtoTeste = (produtos.find(p => (p.nome || '').toLowerCase() === 'teste') || produtos[0]);
    console.log(`🛒 Testando adição do produto "${produtoTeste.nome}" ao carrinho...`);

    // Simular adição ao carrinho (usando localStorage ou session)
    const itemCarrinho = {
      id: produtoTeste.id,
      nome: produtoTeste.nome,
      preco: produtoTeste.preco_promocional || produtoTeste.preco,
      quantidade: 1,
      imagem: produtoTeste.imagens?.[0] || '/placeholder-product.svg',
      slug: produtoTeste.slug
    };

    console.log('✅ Produto preparado para adição ao carrinho:');
    console.log(`   - Nome: ${itemCarrinho.nome}`);
    console.log(`   - Preço: R$ ${itemCarrinho.preco?.toFixed(2) || 'N/A'}`);
    console.log(`   - Quantidade: ${itemCarrinho.quantidade}`);
    console.log(`   - ID: ${itemCarrinho.id}`);

    // 3. Verificar se o produto tem variantes
    console.log('\n🔍 Verificando variantes do produto...');
    
    const { data: variantes, error: errorVariantes } = await supabase
      .from('variantes_produto')
      .select('*')
      .eq('produto_id', produtoTeste.id)
      .eq('ativo', true);

    if (errorVariantes) {
      console.log('ℹ️  Nenhuma variante encontrada ou erro ao buscar variantes:', errorVariantes.message);
    } else if (variantes && variantes.length > 0) {
      console.log(`✅ ${variantes.length} variante(s) encontrada(s):`);
      variantes.forEach((v, i) => {
        console.log(`   ${i + 1}. Tamanho: ${v.tamanho || 'N/A'}, Cor: ${v.cor || 'N/A'}, Estoque: ${v.estoque || 0}`);
      });
    }

    console.log('\n🎯 Próximos passos:');
    console.log('1. Acesse a aplicação em http://localhost:3002');
    console.log('2. Faça login com everaldozs@gmail.com / 1234567');
    console.log(`3. Navegue até o produto: ${produtoTeste.nome}`);
    console.log('4. Adicione o produto ao carrinho');
    console.log('5. Prossiga para o checkout');

  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

// Executar o teste
testProductsAndCart();