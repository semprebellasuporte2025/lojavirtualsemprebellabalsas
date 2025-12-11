import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Produto } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { generateSlug } from '../../utils/formatters';
import { buildProductUrl } from '../../utils/productUrl';

interface CategorySectionProps {
  title: string;
  categoryName: string;
}

export default function CategorySection({ title, categoryName }: CategorySectionProps) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    carregarProdutos(controller.signal);

    return () => {
      controller.abort();
    };
  }, [categoryName]);

  const carregarProdutos = async (signal: AbortSignal) => {
    setLoading(true);
    try {
      const { data: catRows, error: catError } = await supabase
        .from('categorias')
        .select('id, nome')
        .eq('nome', categoryName)
        .order('created_at', { ascending: false })
        .limit(1)
        .abortSignal(signal);

      if (catError) throw catError;

      const categoria = (Array.isArray(catRows) ? catRows[0] : null) as { id: string; nome: string } | null;

      if (!categoria) {
        setProdutos([]);
        setLoading(false);
        return;
      }

      const { data: produtosBase, error: produtosError } = await supabase
        .from('produtos')
        .select('*')
        .eq('ativo', true)
        .eq('nome_invisivel', false)
        .eq('categoria_id', categoria.id)
        .order('created_at', { ascending: false })
        .limit(12)
        .abortSignal(signal);

      let produtos = produtosBase || [];
      if (produtosError) {
        const msg = String((produtosError as any)?.message || '');
        if (/nome_invisivel/i.test(msg) && /does not exist|column/i.test(msg)) {
          const { data: p2, error: e2 } = await supabase
            .from('produtos')
            .select('*')
            .eq('ativo', true)
            .eq('categoria_id', categoria.id)
            .order('created_at', { ascending: false })
            .limit(12)
            .abortSignal(signal);
          if (!e2) {
            produtos = (p2 || []).filter((p: any) => p?.ativo === true && p?.nome_invisivel !== true);
          }
        } else {
          throw produtosError;
        }
      }
      const produtoIds = produtos.map((p) => p.id);

      const { data: variantesData, error: variantesError } = await supabase
        .from('variantes_produto')
        .select('produto_id, cor, cor_hex')
        .in('produto_id', produtoIds.length > 0 ? produtoIds : ['00000000-0000-0000-0000-000000000000'])
        .abortSignal(signal);
        
      if (variantesError) throw variantesError;

      const variantesMap = new Map<string, Array<{ cor?: string; cor_hex?: string }>>();
      (variantesData || []).forEach((v) => {
        const arr = variantesMap.get(v.produto_id) || [];
        arr.push({ cor: v.cor, cor_hex: v.cor_hex });
        variantesMap.set(v.produto_id, arr);
      });

      const enriquecidos = produtos.map((p) => ({
        ...p,
        categorias: categoria ? { id: categoria.id, nome: categoria.nome } : undefined,
        variantes_produto: variantesMap.get(p.id) || [],
      })) as unknown as Produto[];

      if (!signal.aborted) {
        setProdutos(enriquecidos);
      }
    } catch (error: any) {
      if (error && error.message && !error.message.includes('AbortError')) {
        console.error('Erro ao carregar produtos:', error);
      }
      if (!signal.aborted) {
        setProdutos([]);
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  };

  const navigate = useNavigate();
  const handleProductClick = (produto: Produto) => {
    navigate(buildProductUrl({ id: produto.id, nome: produto.nome, slug: (produto as any).slug }));
  };

  const handleVerMais = () => {
    const slug = generateSlug(categoryName);
    navigate(`/categoria/${slug}`);
  };

  const getCoresUnicas = (variantes: any[]) => {
    if (!variantes || variantes.length === 0) return [];
    
    const coresMap = new Map();
    variantes.forEach(v => {
      if (v.cor_hex && !coresMap.has(v.cor_hex)) {
        coresMap.set(v.cor_hex, { cor: v.cor, cor_hex: v.cor_hex });
      }
    });
    
    return Array.from(coresMap.values()).slice(0, 4);
  };

  if (loading) {
    return (
      <section className="py-6 md:py-10 bg-white">
        <div className="container mx-auto px-2 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="text-center">
            <i className="ri-loader-4-line text-4xl text-pink-600 animate-spin"></i>
          </div>
        </div>
      </section>
    );
  }

  if (produtos.length === 0) {
    return null;
  }

  const displayProdutos = produtos.slice(0, 8);
  const hasMore = produtos.length > 8;

  return (
    <section className="py-6 md:py-10 bg-white">
      <div className="container mx-auto px-6 sm:px-12 md:px-20 lg:px-28 xl:px-36 2xl:px-48">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800">{title}</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6" data-product-shop>
          {displayProdutos.map((produto) => {
            const cores = getCoresUnicas(produto.variantes_produto || []);
            const categoriaNome = produto.categorias?.nome || categoryName;
            const price = Number((produto as any).preco);
            const promo = Number((produto as any).preco_promocional);
            const hasDiscount = Number.isFinite(price) && Number.isFinite(promo) && promo > 0 && promo < price;
            
            return (
              <div
                  key={produto.id}
                  onClick={() => handleProductClick(produto)}
                  className="bg-white rounded-lg overflow-hidden hover:shadow-xl transition-shadow group border border-gray-200 cursor-pointer"
                >
                <div className="relative overflow-hidden bg-gray-50">
                  {hasDiscount && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold z-10">
                      -{Math.round(((price - promo) / price) * 100)}%
                    </div>
                  )}
                  <img
                    src={produto.imagens?.[0] || '/placeholder-product.svg'}
                    alt={produto.nome}
                    className="w-full h-72 sm:h-96 object-cover object-top group-hover:scale-105 transition-transform duration-300 bg-gray-50"
                    loading="lazy"
                  decoding="async"
                  onAbort={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.onerror = null;
                    img.src = '/placeholder-product.svg';
                  }}
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.onerror = null;
                    img.src = '/placeholder-product.svg';
                  }}
                />
                </div>
                <div className="p-3">
                  <p className="text-sm text-gray-500 mb-1">{categoriaNome}</p>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-2">{produto.nome}</h3>

                  <div className="flex items-center mb-1">
                    <div className="flex text-yellow-400">
                      {[...Array(Math.round(produto.average_rating || 0))].map((_, i) => (
                        <i key={i} className="ri-star-fill text-sm"></i>
                      ))}
                      {[...Array(5 - Math.round(produto.average_rating || 0))].map((_, i) => (
                        <i key={i} className="ri-star-line text-sm"></i>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 ml-1">({produto.review_count || 0})</span>
                  </div>

                  {cores.length > 0 && (
                    <div className="mb-1">
                      <p className="text-sm text-gray-600 mb-1">Cores disponíveis:</p>
                      <div className="flex space-x-2">
                        {cores.map((cor) => (
                          <div key={cor.cor_hex} className="relative group">
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 rounded-full bg-white text-gray-800 border border-gray-300 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none shadow-sm">
                              {cor.cor}
                            </span>
                            <div
                              className="w-5 h-5 rounded-full border border-gray-300 cursor-pointer"
                              style={{ backgroundColor: cor.cor_hex }}
                              aria-label={cor.cor}
                            ></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-2">
                    {hasDiscount ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-gray-500 line-through">
                          R$ {price.toFixed(2)}
                        </span>
                        <span className="text-xl font-bold text-pink-600">
                          R$ {promo.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xl font-bold text-gray-900">
                        R$ {price.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <Link
                    to={buildProductUrl({ id: produto.id, nome: produto.nome, slug: (produto as any).slug })}
                    className="mt-3 w-full block text-center py-2.5 bg-pink-600 text-white text-sm font-semibold rounded hover:bg-pink-700 transition-colors whitespace-nowrap"
                  >
                    Ver Detalhes
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {hasMore && (
          <div className="flex justify-end mt-5">
            <button
              onClick={handleVerMais}
              className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors whitespace-nowrap"
            >
              Ver Mais
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
