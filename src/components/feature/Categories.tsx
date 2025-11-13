
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import type { Categoria } from '../../lib/supabase';
import { filterCategoriesWithProducts } from '../../utils/categoryFilter';
import { generateSlug } from '../../utils/formatters';

export default function Categories({ initialCategorias, catalogLoading }: { initialCategorias?: Categoria[]; catalogLoading?: boolean }) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const autoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (initialCategorias && initialCategorias.length > 0) {
      setCategorias(initialCategorias);
      setLoading(false);
    } else if (!catalogLoading) {
      carregarCategorias();
    }
  }, [initialCategorias, catalogLoading]); // Removida refreshKey para evitar loop infinito

  // Remover auto-slide para mobile
  // useEffect(() => {
  //   const isMobile = window.innerWidth < 768;
  //   if (isMobile && categorias.length > 0) {
  //     autoSlideRef.current = setInterval(() => {
  //       setCurrentIndex(prev => (prev + 1) % categorias.length);
  //     }, 4000); // Muda a cada 4 segundos
  //
  //     return () => {
  //       if (autoSlideRef.current) {
  //         clearInterval(autoSlideRef.current);
  //       }
  //     };
  //   }
  // }, [categorias.length]);

  const carregarCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('ativa', true);

      if (error) throw error;
      
      // Filtrar categorias que possuem produtos ativos
      const categoriasComProdutos = await filterCategoriesWithProducts(data || []);
      setCategorias(categoriasComProdutos);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoria: any) => {
    const slug = categoria.slug || generateSlug(categoria.nome);
    if (typeof window.REACT_APP_NAVIGATE === 'function') {
      window.REACT_APP_NAVIGATE(`/categoria/${slug}`);
    } else {
      // Fallback para navegação padrão caso a função não esteja disponível
      window.location.href = `/categoria/${slug}`;
    }
  };

  const scrollToIndex = (index: number) => {
    setCurrentIndex(index);
    // Parar auto-slide quando usuário interage
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
    }
  };

  const handlePrev = () => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      // Navegação linear para mobile (sem loop infinito)
      setCurrentIndex(prev => prev > 0 ? prev - 1 : 0);
    } else {
      // Lógica desktop
      const newIndex = currentIndex > 0 ? currentIndex - 1 : 0;
      scrollToIndex(newIndex);
    }
  };

  const handleNext = () => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      // Navegação linear para mobile (sem loop infinito)
      setCurrentIndex(prev => prev < categorias.length - 1 ? prev + 1 : categorias.length - 1);
    } else {
      // Lógica desktop - mostrar 3 categorias por vez
      const maxIndex = Math.max(0, categorias.length - 3);
      const newIndex = currentIndex < maxIndex ? currentIndex + 1 : maxIndex;
      scrollToIndex(newIndex);
    }
  };

  // Handlers para swipe/touch
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
      handlePrev();
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6 sm:px-12 md:px-20 lg:px-28 xl:px-36 2xl:px-48">
          <div className="text-center">
            <i className="ri-loader-4-line text-4xl text-pink-600 animate-spin"></i>
          </div>
        </div>
      </section>
    );
  }

  if (categorias.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-6 sm:px-12 md:px-20 lg:px-28 xl:px-36 2xl:px-48">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Categorias
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore nossa coleção completa de produtos organizados por categoria
          </p>
        </div>

        <div className="relative max-w-6xl mx-auto">
          {/* Botões de navegação para desktop */}
          {currentIndex > 0 && (
            <button
              onClick={handlePrev}
              className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 z-10 w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center hover:bg-pink-50 transition-colors cursor-pointer"
            >
              <i className="ri-arrow-left-s-line text-2xl text-pink-600"></i>
            </button>
          )}

          {/* Container de Categorias */}
          <div
            ref={scrollContainerRef}
            className="overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Desktop: Grid de categorias */}
            <div className="hidden md:block relative">
              <div 
                ref={scrollContainerRef}
                className="flex gap-8 transition-transform duration-500 ease-in-out"
                style={{ 
                  transform: `translateX(-${currentIndex * 280}px)` // Ajustado para melhor espaçamento
                }}
              >
                {categorias.map((categoria) => (
                  <div
                    key={categoria.id}
                    onClick={() => handleCategoryClick(categoria)}
                    className="flex flex-col items-center cursor-pointer group min-w-[240px]" // Largura fixa para desktop
                  >
                    <div className="relative w-48 h-48 rounded-full overflow-hidden mb-4 shadow-md group-hover:shadow-xl transition-all">
                      <img
                        src={categoria.imagem_url || '/placeholder-category.svg'}
                        alt={categoria.nome}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                        decoding="async"
                        onAbort={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          img.onerror = null;
                          img.src = '/placeholder-category.svg';
                        }}
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          img.onerror = null;
                          img.src = '/placeholder-category.svg';
                        }}
                      />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-pink-600 transition-colors text-center">
                      {categoria.nome}
                    </h3>
                    {categoria.descricao && (
                      <p className="text-sm text-gray-600 text-center mt-2 line-clamp-2">
                        {categoria.descricao}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile: Layout estático em grid */}
            <div className="md:hidden">
              <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
                {categorias.map((categoria) => (
                  <div
                    key={categoria.id}
                    onClick={() => handleCategoryClick(categoria)}
                    className="flex flex-col items-center cursor-pointer group"
                  >
                    <div className="relative w-32 h-32 rounded-full overflow-hidden mb-3 shadow-md group-hover:shadow-xl transition-all">
                      <img
                        src={categoria.imagem_url || '/placeholder-category.svg'}
                        alt={categoria.nome}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                        decoding="async"
                        onAbort={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          img.onerror = null;
                          img.src = '/placeholder-category.svg';
                        }}
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          img.onerror = null;
                          img.src = '/placeholder-category.svg';
                        }}
                      />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-pink-600 transition-colors text-center">
                      {categoria.nome}
                    </h3>
                    {categoria.descricao && (
                      <p className="text-xs text-gray-600 text-center mt-1 line-clamp-2">
                        {categoria.descricao}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Botões de navegação apenas para desktop */}
          {currentIndex > 0 && (
            <button
              onClick={handlePrev}
              className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 z-10 w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center hover:bg-pink-50 transition-colors cursor-pointer"
            >
              <i className="ri-arrow-left-s-line text-2xl text-pink-600"></i>
            </button>
          )}

          {/* Botão próximo para desktop */}
          {currentIndex < categorias.length - 3 && (
            <button
              onClick={handleNext}
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 z-10 w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center hover:bg-pink-50 transition-colors cursor-pointer"
            >
              <i className="ri-arrow-right-s-line text-2xl text-pink-600"></i>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
