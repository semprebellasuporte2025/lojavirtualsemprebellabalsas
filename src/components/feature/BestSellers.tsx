import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Produto } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';

export default function BestSellers() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    carregarProdutos(controller.signal);

    return () => {
      controller.abort();
    };
  }, []);

  const carregarProdutos = async (signal: AbortSignal) => {
    try {
      const { data: produtosBase, error: produtosError } = await supabase
        .from('produtos')
        .select('*')
        .eq('ativo', true)
        .eq('destaque', true)
        .order('created_at', { ascending: false })
        .limit(12)
        .abortSignal(signal);

      if (produtosError) throw produtosError;

      const produtos = produtosBase || [];
      if (produtos.length === 0) {
        if (!signal.aborted) setProdutos([]);
        return;
      }

      const produtoIds = produtos.map((p) => p.id);

      const { data: variantesData, error: variantesError } = await supabase
        .from('variantes_produto')
        .select('produto_id, cor, cor_hex')
        .in('produto_id', produtoIds.length > 0 ? produtoIds : ['00000000-0000-0000-0000-000000000000'])
        .abortSignal(signal);

      if (variantesError) throw variantesError;

      const { data: categoriasData, error: categoriasError } = await supabase
        .from('categorias')
        .select('id, nome')
        .abortSignal(signal);

      if (categoriasError) throw categoriasError;

      const categoriaMap = new Map<string, { id: string; nome: string }>();
      (categoriasData || []).forEach((c) => categoriaMap.set(c.id, c));

      const categoriaOutro = (categoriasData || []).find(cat => cat.nome === 'Outro');

      const variantesMap = new Map<string, Array<{ cor?: string; cor_hex?: string }>>();
      (variantesData || []).forEach((v) => {
        const arr = variantesMap.get(v.produto_id) || [];
        arr.push({ cor: v.cor, cor_hex: v.cor_hex });
        variantesMap.set(v.produto_id, arr);
      });

      const enriquecidos = produtos.map((p) => {
        let categoria = p.categoria_id ? categoriaMap.get(p.categoria_id) : undefined;
        if (!categoria) {
          categoria = categoriaOutro;
        }
        return {
          ...p,
          categorias: categoria,
          variantes_produto: variantesMap.get(p.id) || [],
        };
      }).filter(Boolean) as Produto[];

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

  const handleProductClick = (id: string) => {
    navigate(`/produto/${id}`);
  };

  const handleVerMais = () => {
    navigate('/categoria?destaque=true');
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
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
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
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Queridinhos</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" data-product-shop>
          {displayProdutos.map((produto) => {
            const cores = getCoresUnicas(produto.variantes_produto || []);
            const categoriaNome = produto.categorias?.nome || 'Produtos';
            
            return (
              <div
                key={produto.id}
                onClick={() => handleProductClick(produto.id)}
                className="bg-white rounded-lg overflow-hidden hover:shadow-xl transition-shadow group border border-gray-200 cursor-pointer"
              >
                <div className="relative overflow-hidden bg-gray-50">
                  {produto.preco_promocional && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold z-10">
                      -{Math.round(((produto.preco - produto.preco_promocional) / produto.preco) * 100)}%
                    </div>
                  )}
                  <img
                    src={produto.imagens?.[0] || '/placeholder-product.svg'}
                    alt={produto.nome}
                    className="w-full h-80 object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="p-4">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">{categoriaNome}</p>
                  
                  <h3 className="text-sm font-medium text-gray-800 mb-2 line-clamp-2 min-h-[40px]">
                    {produto.nome}
                  </h3>

                  <div className="flex items-center gap-1 mb-3">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => {
                        const rating = produto.average_rating || 0;
                        if (i < Math.floor(rating)) {
                          return <i key={i} className="ri-star-fill text-xs"></i>;
                        } else if (i < rating) {
                          return <i key={i} className="ri-star-half-fill text-xs"></i>;
                        } else {
                          return <i key={i} className="ri-star-line text-xs"></i>;
                        }
                      })}
                    </div>
                    <span className="text-xs text-gray-500 ml-1">({produto.review_count || 0})</span>
                  </div>

                  {cores.length > 0 && (
                    <>
                      <p className="text-xs text-gray-600 mb-3">Cores disponíveis:</p>
                      <div className="flex gap-3 mb-4">
                        {cores.map((cor, index) => (
                          <div key={index} className="relative group">
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
                    </>
                  )}

                  <div className="mb-4">
                    {produto.preco_promocional ? (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 line-through text-sm">
                          R$ {produto.preco.toFixed(2)}
                        </span>
                        <span className="text-xl font-bold text-pink-600">
                          R$ {produto.preco_promocional.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xl font-bold text-gray-800">
                        R$ {produto.preco.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/produto/${produto.id}`}
                    onClick={(e) => { e.stopPropagation(); }}
                    className="w-full block text-center py-2.5 bg-pink-600 text-white text-sm font-semibold rounded hover:bg-pink-700 transition-colors whitespace-nowrap"
                  >
                    Ver Detalhes
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {hasMore && (
          <div className="flex justify-end mt-8">
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
