import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Produto } from '../../lib/supabase';
import { Link } from 'react-router-dom';

const ObrigadoInscricaoPage: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        // 1. Buscar os produtos base
        const { data: produtosBase, error: produtosError } = await supabase
          .from('produtos')
          .select('*')
          .eq('ativo', true)
          .limit(30);

        if (produtosError) throw produtosError;
        if (!produtosBase) return;

        // 2. Extrair IDs de produtos e categorias
        const produtoIds = produtosBase.map((p) => p.id);
        const categoriaIds = produtosBase
          .map((p) => p.categoria_id)
          .filter((id): id is string => Boolean(id));

        // 3. Buscar variantes e categorias em paralelo
        const [variantesResult, categoriasResult] = await Promise.all([
          supabase
            .from('variantes_produto')
            .select('produto_id, cor, cor_hex')
            .in('produto_id', produtoIds),
          supabase
            .from('categorias')
            .select('id, nome')
            .in('id', categoriaIds),
        ]);

        const { data: variantesData, error: variantesError } = variantesResult;
        if (variantesError) throw variantesError;

        const { data: categoriasData, error: categoriasError } = categoriasResult;
        if (categoriasError) throw categoriasError;

        // 4. Mapear categorias e variantes para acesso rápido
        const categoriaMap = new Map<string, { id: string; nome: string }>();
        (categoriasData || []).forEach((c) => categoriaMap.set(c.id, c));

        const variantesMap = new Map<string, Array<{ cor?: string; cor_hex?: string }>>();
        (variantesData || []).forEach((v) => {
          const arr = variantesMap.get(v.produto_id) || [];
          arr.push({ cor: v.cor, cor_hex: v.cor_hex });
          variantesMap.set(v.produto_id, arr);
        });

        // 5. Enriquecer os produtos com os dados de categoria e variantes
        const produtosEnriquecidos = produtosBase.map((p) => ({
          ...p,
          categorias: p.categoria_id ? categoriaMap.get(p.categoria_id) : undefined,
          variantes_produto: variantesMap.get(p.id) || [],
        })) as unknown as Produto[];

        // 6. Embaralhar e selecionar 8 produtos
        const shuffled = produtosEnriquecidos.sort(() => 0.5 - Math.random());
        setProdutos(shuffled.slice(0, 8));

      } catch (error) {
        console.error('Erro ao carregar produtos aleatórios:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProdutos();
  }, []);

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

  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Obrigado por se inscrever!</h1>
      <p className="text-lg mb-8">Você receberá em breve um e-mail com seu cupom de 10% de desconto.</p>
      
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Confira alguns de nossos produtos</h2>
        {loading ? (
          <p>Carregando produtos...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {produtos.map((produto) => {
              const cores = getCoresUnicas(produto.variantes_produto || []);
              const categoriaNome = produto.categorias?.nome || 'Produtos';

              return (
                <Link
                  to={`/produto/${produto.id}`}
                  key={produto.id}
                  className="bg-white rounded-lg overflow-hidden hover:shadow-xl transition-shadow group border border-gray-200 cursor-pointer flex flex-col"
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
                      className="w-full h-72 sm:h-96 object-cover object-top group-hover:scale-105 transition-transform duration-300 bg-gray-50"
                    />
                  </div>

                  <div className="p-4 flex flex-col flex-grow">
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">{categoriaNome}</p>
                    
                    <h3 className="text-sm font-medium text-gray-800 mb-1 line-clamp-2 flex-grow">
                      {produto.nome}
                    </h3>

                    <div className="flex items-center gap-1 mb-1">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => {
                          const rating = produto.avaliacao || 0;
                          if (i < Math.floor(rating)) {
                            return <i key={i} className="ri-star-fill text-xs"></i>;
                          } else if (i < rating) {
                            return <i key={i} className="ri-star-half-fill text-xs"></i>;
                          } else {
                            return <i key={i} className="ri-star-line text-xs"></i>;
                          }
                        })}
                      </div>
                      <span className="text-xs text-gray-500 ml-1">({produto.total_avaliacoes || 0})</span>
                    </div>

                    {cores.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-600 mb-1">Cores disponíveis:</p>
                        <div className="flex gap-3">
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
                      </div>
                    )}

                    <div className="mt-auto">
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
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ObrigadoInscricaoPage;