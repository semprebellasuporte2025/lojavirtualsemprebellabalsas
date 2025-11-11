import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Produto } from '../../../lib/supabase';
import { Link } from 'react-router-dom'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'

interface RelatedProductsProps {
  categoriaId?: string;
  produtoAtualId: string;
}

export default function RelatedProducts({ categoriaId, produtoAtualId }: RelatedProductsProps) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (produtoAtualId) {
      carregarProdutos();
    }
  }, [categoriaId, produtoAtualId]);

  const carregarProdutos = async () => {
    try {
      let query = supabase
        .from('products_with_ratings')
        .select(`*, categorias(nome), variantes_produto(cor, cor_hex)`)
        .eq('ativo', true)
        .neq('id', produtoAtualId)
        .limit(12);

      if (categoriaId) {
        query = query.eq('categoria_id', categoriaId);
      }

      let { data, error } = await query;

      if (error) {
        let fallbackQuery = supabase
          .from('produtos')
          .select(`*, categorias(nome), variantes_produto(cor, cor_hex)`)
          .eq('ativo', true)
          .neq('id', produtoAtualId)
          .limit(12);

        if (categoriaId) {
          fallbackQuery = fallbackQuery.eq('categoria_id', categoriaId);
        }

        const fallback = await fallbackQuery;
        if (fallback.error) throw fallback.error;
        data = fallback.data;
      }

      setProdutos((data || []) as Produto[]);
    } catch (error) {
      console.error('Erro ao carregar produtos relacionados:', error);
    } finally {
      setLoading(false);
    }
  };

  // IMPORTANTE: chame hooks SEMPRE na mesma ordem em todos os renders
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start', slidesToScroll: 1 },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  );

  if (loading || produtos.length === 0) {
    // Mantemos a ordem dos hooks acima; aqui apenas evitamos renderizar conteúdo
    return null;
  }

  return (
    <section className="py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Produtos Relacionados</h2>
        <div className="flex gap-2">
          <button onClick={() => emblaApi?.scrollPrev()} className="btn-embla">
            <i className="ri-arrow-left-s-line"></i>
          </button>
          <button onClick={() => emblaApi?.scrollNext()} className="btn-embla">
            <i className="ri-arrow-right-s-line"></i>
          </button>
        </div>
      </div>

      <div className="embla">
        <div className="embla__viewport" ref={emblaRef}>
          <div className="embla__container flex gap-4">
            {produtos.map((produto) => (
              <div
                key={produto.id}
                className="embla__slide shrink-0 basis-3/4 sm:basis-1/2 md:basis-1/3 lg:basis-1/4 bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow group"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={produto.imagens?.[0] || '/placeholder-product.svg'}
                    alt={produto.nome}
                    className="w-full h-72 sm:h-96 object-cover object-top bg-gray-50 group-hover:scale-105 transition-transform duration-300"
                  />
                  {produto.preco_promocional && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold z-10">
                      -{Math.round(((produto.preco - produto.preco_promocional) / produto.preco) * 100)}%
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-2">
                    {produto.nome}
                  </h3>

                  <div className="flex items-center gap-1 mb-1">
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

                  <div className="flex items-center justify-between mt-2">
                    <div>
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

                  <Link
                    to={`/produto/${produto.id}`}
                    onClick={(e) => { e.stopPropagation(); }}
                    className="mt-2 w-full block text-center py-2.5 bg-pink-600 text-white text-sm font-semibold rounded hover:bg-pink-700 transition-colors whitespace-nowrap"
                  >
                    Ver Detalhes
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}