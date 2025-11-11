import { supabase } from '../lib/supabase';
import type { Categoria } from '../lib/supabase';

export async function filterCategoriesWithProducts(categorias: Categoria[]): Promise<Categoria[]> {
  const categoriasComProdutos: Categoria[] = [];

  for (const categoria of categorias) {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('id')
        .eq('categoria_id', categoria.id)
        .eq('ativo', true)
        .limit(1);

      if (error) {
        console.error(`Erro ao verificar produtos para categoria ${categoria.nome}:`, error);
        continue;
      }

      if (data && data.length > 0) {
        categoriasComProdutos.push(categoria);
      }
    } catch (error) {
      console.error(`Erro ao processar categoria ${categoria.nome}:`, error);
    }
  }

  return categoriasComProdutos;
}

export async function loadCategoriesWithProducts(): Promise<Categoria[]> {
  try {
    const { data: categorias, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('ativa', true);

    if (error) throw error;

    return await filterCategoriesWithProducts(categorias || []);
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
    return [];
  }
}

export async function hasProductsInCategory(categoryName: string): Promise<boolean> {
  try {
    // Primeiro busca a categoria pelo nome
    const { data: categoriaData, error: catError } = await supabase
      .from('categorias')
      .select('id')
      .eq('nome', categoryName)
      .eq('ativa', true)
      .limit(1);

    if (catError) throw catError;
    if (!categoriaData || categoriaData.length === 0) return false;

    const categoriaId = categoriaData[0].id;

    // Verifica se existem produtos ativos nesta categoria
    const { data: produtosData, error: prodError } = await supabase
      .from('produtos')
      .select('id')
      .eq('categoria_id', categoriaId)
      .eq('ativo', true)
      .limit(1);

    if (prodError) throw prodError;

    return produtosData && produtosData.length > 0;
  } catch (error) {
    console.error(`Erro ao verificar produtos na categoria ${categoryName}:`, error);
    return false;
  }
}