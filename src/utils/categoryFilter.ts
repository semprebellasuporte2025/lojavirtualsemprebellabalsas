import { supabase } from '../lib/supabase';
import type { Categoria } from '../lib/supabase';

// Detecta abortos de rede/HMR para evitar poluir logs com erros não fatais
function isNetworkAbort(err: any): boolean {
  try {
    const msg = String(err?.message || err);
    return msg.includes('Failed to fetch') || msg.includes('AbortError');
  } catch {
    return false;
  }
}

export async function filterCategoriesWithProducts(categorias: Categoria[]): Promise<Categoria[]> {
  const categoriasComProdutos: Categoria[] = [];

  // Otimização: uma única chamada para todas as categorias
  try {
    const ids = categorias.map(c => c.id).filter(Boolean);
    if (ids.length === 0) return [];

    const orFilter = ids.map(id => `categoria_id.eq.${id}`).join(',');
    const { data, error } = await supabase
      .from('produtos')
      .select('categoria_id')
      .eq('ativo', true)
      .or(orFilter);

    if (error) {
      if (isNetworkAbort(error)) return [];
      console.error('Erro ao verificar produtos por categorias:', error);
      return [];
    }

    const presentes = new Set<string>((data || []).map((row: any) => row.categoria_id));
    categorias.forEach(c => { if (presentes.has(c.id)) categoriasComProdutos.push(c); });
  } catch (error) {
    if (!isNetworkAbort(error)) {
      console.error('Erro ao processar verificação de categorias:', error);
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

    if (catError) {
      if (isNetworkAbort(catError)) return false;
      throw catError;
    }
    if (!categoriaData || categoriaData.length === 0) return false;

    const categoriaId = categoriaData[0].id;

    // Verifica se existem produtos ativos nesta categoria (HEAD + count)
    const { count, error: prodError } = await supabase
      .from('produtos')
      .select('id', { count: 'exact', head: true })
      .eq('categoria_id', categoriaId)
      .eq('ativo', true);

    if (prodError) {
      if (isNetworkAbort(prodError)) return false;
      throw prodError;
    }

    return (count ?? 0) > 0;
  } catch (error) {
    if (isNetworkAbort(error)) {
      console.debug(`Requisição abortada na verificação da categoria ${categoryName}`);
      return false;
    }
    console.error(`Erro ao verificar produtos na categoria ${categoryName}:`, error);
    return false;
  }
}

// Obtém nomes de categorias que possuem produtos ativos, em uma única busca batida
export async function getCategoriesWithProductsByNames(names: string[]): Promise<string[]> {
  try {
    if (!Array.isArray(names) || names.length === 0) return [];

    // 1) Buscar IDs das categorias pelos nomes
    const { data: categorias, error: catError } = await supabase
      .from('categorias')
      .select('id, nome')
      .in('nome', names)
      .eq('ativa', true);

    if (catError) {
      if (isNetworkAbort(catError)) return [];
      throw catError;
    }

    const idPorNome = new Map<string, string>();
    (categorias || []).forEach((c: any) => {
      if (c?.id && c?.nome) idPorNome.set(c.nome, c.id);
    });
    const ids = Array.from(idPorNome.values());
    if (ids.length === 0) return [];

    // 2) Buscar produtos ativos dessas categorias em uma única consulta
    const { data: produtos, error: prodError } = await supabase
      .from('produtos')
      .select('categoria_id')
      .in('categoria_id', ids)
      .eq('ativo', true);

    if (prodError) {
      if (isNetworkAbort(prodError)) return [];
      throw prodError;
    }

    const presentes = new Set<string>((produtos || []).map((p: any) => p.categoria_id));
    const validos: string[] = [];
    idPorNome.forEach((id, nome) => { if (presentes.has(id)) validos.push(nome); });
    return validos;
  } catch (error) {
    if (!isNetworkAbort(error)) console.error('Erro ao obter categorias com produtos:', error);
    return [];
  }
}