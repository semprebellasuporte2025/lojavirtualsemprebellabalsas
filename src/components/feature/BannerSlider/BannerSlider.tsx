'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';

interface Banner {
  id: string;
  titulo: string;
  subtitulo: string | null;
  imagem_url: string;
  link_destino: string | null;
  texto_botao: string | null; // Adicionado
  ordem_exibicao: number;
  ativo: boolean;
}

export default function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState<Set<string>>(new Set());
  const cacheRef = useRef<{
    banners: Banner[];
    timestamp: number;
  } | null>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % banners.length);
      }, 5000); // Troca slide a cada 5 segundos

      return () => clearInterval(interval);
    }
  }, [banners.length]);

  const fetchBanners = async () => {
    // Verificar cache (válido por 5 minutos)
    const now = Date.now();
    if (cacheRef.current && now - cacheRef.current.timestamp < 5 * 60 * 1000) {
      setBanners(cacheRef.current.banners);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('banners')
        .select('id, titulo, subtitulo, imagem_url, link_destino, texto_botao, ordem_exibicao') // Selecionar apenas campos necessários
        .eq('ativo', true)
        .order('ordem_exibicao', { ascending: true })
        .limit(10); // Limitar número de banners

      if (error) {
        console.error('Erro ao buscar banners:', error);
        return;
      }

      const bannersData = data || [];
      setBanners(bannersData);
      
      // Atualizar cache
      cacheRef.current = {
        banners: bannersData,
        timestamp: now
      };
    } catch (error) {
      console.error('Erro inesperado:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const handleBannerClick = (banner: Banner) => {
    if (banner.link_destino) {
      window.open(banner.link_destino, '_blank');
    }
  };

  const handleImageLoad = (imageUrl: string) => {
    setImagesLoaded(prev => new Set(prev).add(imageUrl));
  };

  if (loading) {
    return (
      <div className="relative w-full h-[300px] md:h-[450px] lg:h-[600px] bg-gray-200 dark:bg-gray-700 overflow-hidden shadow-lg">
        {/* Skeleton Loading com shimmer effect */}
        <div className="absolute inset-0 flex animate-pulse">
          <div className="min-w-full h-full relative">
            <div className="w-full h-full bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 animate-shimmer">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
            
            {/* Conteúdo do skeleton */}
            <div className="absolute inset-0 flex items-center justify-start p-12 md:p-24">
              <div className="max-w-lg space-y-4">
                <div className="h-8 bg-gray-400 rounded w-3/4"></div>
                <div className="h-6 bg-gray-400 rounded w-1/2"></div>
                <div className="h-10 bg-pink-500 rounded w-32"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">Carregando banners...</div>
        </div>
      </div>
    );
  }

  if (banners.length === 0) {
    return null; // Não exibe nada se não houver banners
  }

  return (
    <div className="relative w-full h-[300px] md:h-[450px] lg:h-[600px] overflow-hidden shadow-lg">
      {/* Slides */}
      <div 
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="min-w-full h-full relative cursor-pointer"
            onClick={() => handleBannerClick(banner)}
          >
            <img
              src={banner.imagem_url}
              alt={banner.titulo}
              className="w-full h-full object-cover object-top transition-opacity duration-300"
              style={{
                opacity: imagesLoaded.has(banner.imagem_url) ? 1 : 0,
              }}
              loading="lazy"
              onLoad={() => handleImageLoad(banner.imagem_url)}
              onError={(e) => {
                // Fallback para imagem quebrada
                const target = e.target as HTMLImageElement;
                target.style.opacity = '1';
                target.src = '/placeholder-banner.svg';
              }}
            />
            
            {/* Conteúdo do banner */}
            <div className="absolute inset-0 flex items-center justify-start p-12 md:p-24">
              <div className="max-w-lg">
                <h2 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4 text-white text-shadow">
                  {banner.titulo}
                </h2>
                {banner.subtitulo && (
                  <p className="text-lg md:text-xl mb-4 md:mb-6 text-white text-shadow opacity-90">
                    {banner.subtitulo}
                  </p>
                )}
                {banner.link_destino && banner.texto_botao && (
                  <button className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                    {banner.texto_botao}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Setas de navegação */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
          >
            <i className="ri-arrow-left-line text-xl"></i>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
          >
            <i className="ri-arrow-right-line text-xl"></i>
          </button>
        </>
      )}

      {/* Indicadores */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide
                  ? 'bg-white'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}