
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import type { Categoria } from '../../lib/supabase';

export default function Categories({ initialCategorias, catalogLoading }: { initialCategorias?: Categoria[]; catalogLoading?: boolean }) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const autoSlideRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (initialCategorias && initialCategorias.length > 0) {
      setCategorias(initialCategorias);
      setLoading(false);
    } else if (!catalogLoading) {
      carregarCategorias();
    }
  }, [initialCategorias, catalogLoading]); // Removida refreshKey para evitar loop infinito

  // Auto-slide para mobile
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile && categorias.length > 0) {
      autoSlideRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % categorias.length);
      }, 4000); // Muda a cada 4 segundos

      return () => {
        if (autoSlideRef.current) {
          clearInterval(autoSlideRef.current);
        }
      };
    }
  }, [categorias.length]);

  const carregarCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('ativa', true);

      if (error) throw error;
      setCategorias(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (nome: string) => {
    window.REACT_APP_NAVIGATE(`/categoria/${encodeURIComponent(nome)}`);
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
      // Loop infinito para mobile
      setCurrentIndex(prev => prev === 0 ? categorias.length - 1 : prev - 1);
    } else {
      // Lógica desktop
      const newIndex = currentIndex > 0 ? currentIndex - 1 : 0;
      scrollToIndex(newIndex);
    }
  };

  const handleNext = () => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      // Loop infinito para mobile
      setCurrentIndex(prev => (prev + 1) % categorias.length);
    } else {
      // Lógica desktop
      const maxIndex = Math.max(0, categorias.length - 4);
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
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
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
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
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
            {/* Desktop: Grid de 4 colunas */}
            <div className="hidden md:flex gap-8">
              {categorias.slice(currentIndex, currentIndex + 4).map((categoria) => (
                <div
                  key={categoria.id}
                  onClick={() => handleCategoryClick(categoria.nome)}
                  className="flex flex-col items-center cursor-pointer group flex-shrink-0"
                  style={{ width: '200px' }}
                >
                  <div className="relative w-40 h-40 rounded-full overflow-hidden mb-4 shadow-md group-hover:shadow-xl transition-all">
                    <img
                      src={categoria.imagem_url || '/placeholder-category.svg'}
                      alt={categoria.nome}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
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

            {/* Mobile: Slider com loop infinito */}
            <div className="flex md:hidden justify-center relative">
              <div className="w-full max-w-sm">
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ 
                    transform: `translateX(-${currentIndex * 100}%)`,
                    width: `${categorias.length * 100}%`
                  }}
                >
                  {categorias.map((categoria, index) => (
                    <div
                      key={categoria.id}
                      onClick={() => handleCategoryClick(categoria.nome)}
                      className="flex flex-col items-center cursor-pointer group w-full flex-shrink-0 px-4"
                    >
                      <div className="relative w-40 h-40 rounded-full overflow-hidden mb-4 shadow-md group-hover:shadow-xl transition-all">
                        <img
                          src={categoria.imagem_url || '/placeholder-category.svg'}
                          alt={categoria.nome}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
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
            </div>
          </div>

          {/* Botão próximo para desktop */}
          {currentIndex < categorias.length - 4 && (
            <button
              onClick={handleNext}
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 z-10 w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center hover:bg-pink-50 transition-colors cursor-pointer"
            >
              <i className="ri-arrow-right-s-line text-2xl text-pink-600"></i>
            </button>
          )}

          {/* Botões de navegação para mobile - abaixo das categorias */}
          <div className="flex md:hidden justify-center items-center gap-4 mt-8">
            <button
              onClick={handlePrev}
              className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-pink-50 transition-colors cursor-pointer"
            >
              <i className="ri-arrow-left-s-line text-xl text-pink-600"></i>
            </button>
            
            {/* Indicadores de página */}
            <div className="flex gap-2">
              {categorias.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    currentIndex === index ? 'bg-pink-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-pink-50 transition-colors cursor-pointer"
            >
              <i className="ri-arrow-right-s-line text-xl text-pink-600"></i>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
