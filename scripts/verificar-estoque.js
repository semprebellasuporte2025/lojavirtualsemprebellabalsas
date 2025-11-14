// Script para verificar estoque dos produtos usando a API do Supabase
import { createClient } from '@supabase/supabase-js';

// Configuração - substitua com suas credenciais reais
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://seu-projeto.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sua-chave-anonima';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarEstoque() {
  console.log('🔍 Verificando estoque dos produtos...\n');

  try {
    // 1. Buscar todos os produtos ativos
    const { data: produtos, error } = await supabase
      .from('products_with_ratings')
      .select('id, nome, estoque, ativo')
      .eq('ativo', true)
      .order('nome');

    if (error) {
      console.error('❌ Erro ao buscar produtos:', error);
      return;
    }

    console.log(`📊 Total de produtos ativos: ${produtos.length}\n`);

    // 2. Contar produtos com estoque
    const comEstoque = produtos.filter(p => p.estoque > 0);
    const semEstoque = produtos.filter(p => p.estoque === 0);
    const estoqueNull = produtos.filter(p => p.estoque === null || p.estoque === undefined);

    console.log(`✅ Produtos com estoque > 0: ${comEstoque.length}`);
    console.log(`❌ Produtos com estoque = 0: ${semEstoque.length}`);
    console.log(`⚠️  Produtos com estoque NULL: ${estoqueNull.length}\n`);

    // 3. Mostrar alguns produtos sem estoque
    if (semEstoque.length > 0) {
      console.log('📋 Produtos sem estoque (primeiros 10):');
      semEstoque.slice(0, 10).forEach(p => {
        console.log(`   - ${p.nome} (ID: ${p.id}) - Estoque: ${p.estoque}`);
      });
      console.log('');
    }

    // 4. Verificar variantes para produtos sem estoque
    console.log('🔍 Verificando variantes de produtos sem estoque...\n');
    
    for (const produto of semEstoque.slice(0, 5)) {
      const { data: variantes, error: varError } = await supabase
        .from('variantes_produto')
        .select('id, tamanho, cor, estoque')
        .eq('produto_id', produto.id);

      if (varError) {
        console.error(`❌ Erro ao buscar variantes de ${produto.nome}:`, varError);
        continue;
      }

      if (variantes && variantes.length > 0) {
        const totalEstoqueVariantes = variantes.reduce((sum, v) => sum + (v.estoque || 0), 0);
        console.log(`📦 ${produto.nome}:`);
        console.log(`   Variantes encontradas: ${variantes.length}`);
        console.log(`   Estoque total nas variantes: ${totalEstoqueVariantes}`);
        
        if (totalEstoqueVariantes > 0) {
          console.log(`   ⚠️  ATENÇÃO: Produto tem ${totalEstoqueVariantes} unidades em variantes!`);
        }
        
        variantes.forEach(v => {
          console.log(`     - ${v.tamanho || 'N/A'} ${v.cor || 'N/A'}: ${v.estoque || 0}`);
        });
        console.log('');
      }
    }

    // 5. Recomendações
    console.log('💡 RECOMENDAÇÕES:');
    console.log('   1. Verifique se o estoque está realmente zerado no banco');
    console.log('   2. Confirme se há variantes com estoque disponível');
    console.log('   3. Atualize o estoque nas variantes dos produtos (campo variantes_produto.estoque)');
    console.log('   4. Verifique a lógica em ProductInfo.tsx para cálculo de estoque');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  verificarEstoque();
}

export { verificarEstoque };