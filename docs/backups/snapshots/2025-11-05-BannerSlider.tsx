import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface Banner {
  id: string;
  titulo: string;
  subtitulo: string;
  imagem_url: string;
  link_destino?: string;
  texto_botao?: string;
  ordem_exibicao: number;
}

export default function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState<boolean[]>([]);
  const cacheRef = useRef<{ data: Banner[]; timestamp: number } | null>(null);

  const fetchBanners = async () => {
    // Verificar cache (5 minutos de validade)
    const now = Date.now();
    if (cacheRef.current && now - cacheRef.current.timestamp < 5 * 60 * 1000) {
      setBanners(cacheRef.current.data);
      setLoading(false);
      setImagesLoaded(new Array(cacheRef.current.data.length).fill(false));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('banners')
        .select('id, titulo, subtitulo, imagem_url, link_destino, texto_botao, ordem_exibicao')
        .eq('ativo', true)
        .order('ordem_exibicao', { ascending: true })
        .limit(10);

      if (error) throw error;

      const bannersData = data || [];
      setBanners(bannersData);
      setImagesLoaded(new Array(bannersData.length).fill(false));
      
      // Atualizar cache
      cacheRef.current = {
        data: bannersData,
        timestamp: now
      };
    } catch (error) {
      console.error('Erro ao carregar banners:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleImageLoad = (index: number) => {
    setImagesLoaded(prev => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === banners.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? banners.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div className="relative w-full h-96 bg-gray-100 overflow-hidden">
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-full h-full bg-gray-200 animate-shimmer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300 to-transparent animate-shimmer"></div>
          </div>
        </div>
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <div className="relative w-full h-96 bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500 text-lg">Nenhum banner disponível</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 overflow-hidden group">
      {/* Botões de navegação */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 z-10"
        aria-label="Banner anterior"
      >
        <ChevronLeftIcon className="w-6 h-6" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 z-10"
        aria-label="Próximo banner"
      >
        <ChevronRightIcon className="w-6 h-6" />
      </button>

      {/* Carrossel de banners */}
      <div className="w-full h-full">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Skeleton loading */}
            {!imagesLoaded[index] && (
              <div className="absolute inset-0 bg-gray-200 animate-shimmer">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300 to-transparent animate-shimmer"></div>
              </div>
            )}
            
            {/* Imagem do banner */}
            <img
              src={banner.imagem_url}
              alt={banner.titulo}
              loading="lazy"
              onLoad={() => handleImageLoad(index)}
              onError={(e) => {
                console.error('Erro ao carregar imagem do banner:', banner.imagem_url);
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-large.svg';
                handleImageLoad(index);
              }}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imagesLoaded[index] ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Overlay de conteúdo */}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="text-center text-white max-w-2xl px-4">
                <h2 className="text-4xl font-bold mb-4 drop-shadow-lg">
                  {banner.titulo}
                </h2>
                <p className="text-xl mb-6 drop-shadow-lg">
                  {banner.subtitulo}
                </p>
                {banner.link_destino && (
                  <a
                    href={banner.link_destino}
                    className="inline-block bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                  >
                    {banner.texto_botao || 'Ver Mais'}
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Indicadores */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex 
                ? 'bg-white' 
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Ir para banner ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}