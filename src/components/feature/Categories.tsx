
import { useState, useEffect, useRef } from 'react';
import { supabase, Categoria } from '../../lib/supabase';

export default function Categories({ initialCategorias, catalogLoading }: { initialCategorias?: Categoria[]; catalogLoading?: boolean }) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialCategorias && initialCategorias.length > 0) {
      setCategorias(initialCategorias);
      setLoading(false);
    } else if (!catalogLoading) {
      carregarCategorias();
    }
  }, [initialCategorias, catalogLoading]); // Removida refreshKey para evitar loop infinito

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
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const itemWidth = 240; // largura do item + gap
      container.scrollTo({
        left: itemWidth * index,
        behavior: 'smooth'
      });
      setCurrentIndex(index);
    }
  };

  const handlePrev = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : 0;
    scrollToIndex(newIndex);
  };

  const handleNext = () => {
    const maxIndex = Math.max(0, categorias.length - 4);
    const newIndex = currentIndex < maxIndex ? currentIndex + 1 : maxIndex;
    scrollToIndex(newIndex);
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
          {/* Botão Anterior */}
          {currentIndex > 0 && (
            <button
              onClick={handlePrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-pink-50 transition-colors cursor-pointer"
            >
              <i className="ri-arrow-left-s-line text-2xl text-pink-600"></i>
            </button>
          )}

          {/* Container de Categorias */}
          <div
            ref={scrollContainerRef}
            className="overflow-hidden"
          >
            <div className="flex gap-8">
              {categorias.map((categoria) => (
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
          </div>

          {/* Botão Próximo */}
          {currentIndex < categorias.length - 4 && (
            <button
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-pink-50 transition-colors cursor-pointer"
            >
              <i className="ri-arrow-right-s-line text-2xl text-pink-600"></i>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
