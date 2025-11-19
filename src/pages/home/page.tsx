import { useState, useEffect } from 'react';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import BannerSlider from '../../components/feature/BannerSlider';
import Categories from '../../components/feature/Categories';
import BestSellers from '../../components/feature/BestSellers';
import CategorySection from '../../components/feature/CategorySection';
import SEOHead from '../../components/feature/SEOHead';
import { supabase } from '../../lib/supabase';
import type { Produto } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import Newsletter from '../../components/feature/Newsletter';
import { getCategoriesWithProductsByNames } from '../../utils/categoryFilter';

export default function HomePage() {
  const [recentProducts, setRecentProducts] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesToShow, setCategoriesToShow] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    carregarProdutosRecentes(controller.signal);

    return () => {
      controller.abort();
    };
  }, []);

  // Incrementa contador local de visitas à Home
  useEffect(() => {
    try {
      const key = 'home_visit_count';
      const raw = localStorage.getItem(key);
      const current = raw ? parseInt(raw, 10) : 0;
      const next = Number.isFinite(current) ? current + 1 : 1;
      localStorage.setItem(key, String(next));
    } catch (err) {
      console.warn('Contador de visitas local indisponível:', (err as any)?.message);
    }
  }, []);

  // Verifica quais categorias têm produtos para exibir
  useEffect(() => {
    const checkCategoriesWithProducts = async () => {
      const categoriesToCheck = [
        'Vestidos',
        'Blusas', 
        'Calças',
        'Saias',
        'Fitness',
        'Acessórios'
      ];

      try {
        const valid = await getCategoriesWithProductsByNames(categoriesToCheck);
        setCategoriesToShow(valid);
      } catch (error) {
        console.error('Erro ao verificar categorias com produtos:', error);
      }
    };

    checkCategoriesWithProducts();
  }, []);

  const carregarProdutosRecentes = async (signal: AbortSignal) => {
    try {
      // Usar a view que já soma estoque das variantes
      const { data, error } = await supabase
        .from('produtos')
        .select('*, categorias(nome), variantes_produto(cor, cor_hex)')
        .eq('ativo', true)
        .eq('nome_invisivel', false)
        .order('created_at', { ascending: false })
        .limit(12)
        .abortSignal(signal);

      if (error) {
        const msg = String((error as any)?.message || '');
        if ((error as any)?.name === 'AbortError') {
          return;
        }
        if (/nome_invisivel/i.test(msg) && /does not exist|column/i.test(msg)) {
          const { data: data2, error: err2 } = await supabase
            .from('produtos')
            .select('*, categorias(nome), variantes_produto(cor, cor_hex)')
            .eq('ativo', true)
            .gt('estoque', 0)
            .order('created_at', { ascending: false })
            .limit(12)
            .abortSignal(signal);
          if (!err2 && !signal.aborted) {
            const safe = (data2 || []).filter((p: any) => p?.ativo === true && p?.nome_invisivel !== true);
            setRecentProducts(safe as Produto[]);
            return;
          }
        }
        throw error;
      }

      if (!signal.aborted) {
        setRecentProducts((data || []) as Produto[]);
      }
    } catch (error: any) {
      if (error && error.message && !error.message.includes('AbortError')) {
        console.error('Erro ao carregar produtos recentes:', error);
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  };

  const handleProductClick = (produto: Produto) => {
    navigate(`/produto/${produto.slug || produto.id}`);
  };

  const handleVerMaisRecentes = () => {
    navigate('/categoria/recentes');
  };

  const getCoresUnicas = (variantes: any[]) => {
    const coresMap = new Map();
    variantes.forEach(v => {
      if (v.cor_hex && !coresMap.has(v.cor_hex)) {
        coresMap.set(v.cor_hex, { cor: v.cor, cor_hex: v.cor_hex });
      }
    });
    return Array.from(coresMap.values()).slice(0, 4);
  };

  const displayRecentProducts = recentProducts.slice(0, 8);
  const hasMoreRecent = recentProducts.length > 8;

  return (
    <>
      <SEOHead
        title="Loja de Moda Feminina - Roupas e Acessórios"
        description="Descubra as últimas tendências em moda feminina. Vestidos, blusas, calças e acessórios com os melhores preços e qualidade."
        keywords="moda feminina, roupas femininas, vestidos, blusas, calças, acessórios, loja online"
      />
      <div className="min-h-screen bg-white">
        <Header />
        
          <BannerSlider />
          <Categories />
          
          {!loading && recentProducts.length > 0 && (
            <section className="py-16 bg-gray-50">
              <div className="container mx-auto px-6 sm:px-12 md:px-20 lg:px-28 xl:px-36 2xl:px-48">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-800">Recém Chegados</h2>
                  {hasMoreRecent && (
                    <button
                      onClick={handleVerMaisRecentes}
                      className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors whitespace-nowrap"
                    >
                      Ver Mais
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                  {displayRecentProducts.map((produto) => {
                    const cores = getCoresUnicas(produto.variantes_produto || []);
                    const categoriaNome = produto.categorias?.nome || 'Produtos';
                    
                    return (
                      <div
                        key={produto.id}
                        onClick={() => handleProductClick(produto)}
                        className="bg-white rounded-lg overflow-hidden hover:shadow-xl transition-shadow group border border-gray-200 cursor-pointer"
                      >
                        <div className="relative overflow-hidden bg-gray-50">
                          {produto.preco_promocional && (
                            <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold z-10">
                              -{Math.round(((produto.preco - produto.preco_promocional) / produto.preco) * 100)}%
                            </div>
                          )}
                          <div className="absolute top-3 right-3 bg-green-600 text-white px-2 py-1 rounded text-xs font-bold z-10">
                            Novo
                          </div>
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

                        <div className="px-2 py-3">
                          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">{categoriaNome}</p>
                          
                          <h3 className="text-sm font-medium text-gray-800 mb-1 line-clamp-2">
                            {produto.nome}
                          </h3>

                          <div className="flex items-center gap-1 mb-1">
                            <div className="flex text-yellow-400">
                              {[...Array(Math.round((produto as any).average_rating || 0))].map((_, i) => (
                                <i key={i} className="ri-star-fill text-xs"></i>
                              ))}
                              {[...Array(5 - Math.round((produto as any).average_rating || 0))].map((_, i) => (
                                <i key={i} className="ri-star-line text-xs"></i>
                              ))}
                            </div>
                            <span className="text-xs text-gray-500 ml-1">({(produto as any).review_count || 0})</span>
                          </div>

                          {cores.length > 0 && (
                            <>
                              <p className="text-xs text-gray-600 mb-1">Cores disponíveis:</p>
                              <div className="flex gap-3 mb-2">
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

                          <div className="mt-2">
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
                            to={`/produto/${produto.slug || produto.id}`}
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
              </div>
            </section>
          )}
          
          <BestSellers />
          {categoriesToShow.map(category => (
            <CategorySection 
              key={category}
              title={category} 
              categoryName={category} 
            />
          ))}
          <Newsletter />

        <Footer />
      </div>
    </>
  );
}
