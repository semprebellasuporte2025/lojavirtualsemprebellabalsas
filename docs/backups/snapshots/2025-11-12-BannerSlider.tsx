// @ts-nocheck
'use client';

import { useState, useEffect, useRef } from 'react';
import { supabasePublic } from '../../../lib/supabasePublic';
import { fetchActiveBanners, subscribeToBannerChanges } from './bannerService';
import { getCachedBanners, setCachedBanners, clearBannerCache } from './bannerCache';
import { logBanner } from '../../../lib/logger';
import { toSupabaseRenderUrl, extractBucketAndKey } from './bannerUrlUtils';

interface Banner {
  id: string;
  titulo: string;
  subtitulo: string | null;
  imagem_url: string;
  imagem_url_mobile?: string | null;
  link_destino: string | null;
  texto_botao: string | null; // Adicionado
  ordem_exibicao: number;
  ativo: boolean;
}

// Helpers movidos para bannerUrlUtils.ts

async function validateImage(url: string): Promise<boolean> {
  // Sempre retorna true para evitar bloqueios na exibição dos banners
  // A validação real será feita pelo próprio navegador através dos eventos onError
  return true;
}

export default function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [resolvedDesktop, setResolvedDesktop] = useState<Record<string, string>>({});
  const [resolvedMobile, setResolvedMobile] = useState<Record<string, string>>({});
  const cacheRef = useRef<{
    banners: Banner[];
    timestamp: number;
  } | null>(null);
  // Mantém o último conjunto válido de banners para evitar sumiço em janelas de consistência
  const lastGoodRef = useRef<Banner[] | null>(null);
  // Controla tentativas de refetch em períodos curtos de consistência eventual
  const retryRef = useRef<{ id: any; attempts: number }>({ id: null, attempts: 0 });

  useEffect(() => {
    fetchBanners();

    // Assina mudanças em tempo real para atualizar rapidamente após cadastro/edição/exclusão
    const unsubscribe = subscribeToBannerChanges(supabasePublic, async (payload) => {
      logBanner('info', 'Evento Realtime recebido', payload);
      // Log explícito solicitado: bypass de cache após evento realtime
      logBanner('info', 'Bypass de cache após realtime');
      // Limpa ambos caches: sessionStorage e in-memory
      clearBannerCache();
      cacheRef.current = null;
      // Refaz a busca ignorando caches para refletir mudanças imediatamente
      // Permite lista vazia apenas em eventos DELETE explícitos
      const allowEmpty = String((payload as any)?.eventType || '').toUpperCase() === 'DELETE';
      // Reinicia contador de tentativas
      if (retryRef.current.id) {
        try { clearTimeout(retryRef.current.id); } catch {}
      }
      retryRef.current = { id: null, attempts: 0 };
      await fetchBanners(true, allowEmpty);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % banners.length);
      }, 5000); // Troca slide a cada 5 segundos

      return () => clearInterval(interval);
    }
  }, [banners.length]);

  // Garante que o índice atual seja válido quando o número de banners muda
  useEffect(() => {
    if (banners.length === 0) {
      setCurrentSlide(0);
      return;
    }
    setCurrentSlide((prev) => {
      const next = Math.min(prev, banners.length - 1);
      if (next !== prev) {
        logBanner('debug', 'Clamping currentSlide após mudança de quantidade', { prev, next, length: banners.length });
      }
      return next;
    });
  }, [banners.length]);

  const fetchBanners = async (skipCache: boolean = false, allowEmpty: boolean = false) => {
    // Verificar cache de sessionStorage (TTL 5 minutos) e cacheRef
    const now = Date.now();
    const cachedSession = skipCache ? null : getCachedBanners<Banner[]>();
    if (cachedSession) {
      // Ignorar cache vazio para evitar bloquear exibição
      if (Array.isArray(cachedSession) && cachedSession.length === 0) {
        logBanner('info', 'Cache sessionStorage vazio; ignorando');
      } else {
        const hasFallback = Array.isArray(cachedSession) && cachedSession.some((b) => String(b.id || '').startsWith('fallback-'));
        if (hasFallback) {
          logBanner('info', 'Cache sessionStorage contém fallback, limpando e ignorando');
          clearBannerCache();
        } else {
          logBanner('info', 'Cache sessionStorage HIT', { count: cachedSession.length });
          setBanners(cachedSession);
          // Atualiza last good
          if (cachedSession.length > 0) lastGoodRef.current = cachedSession;
          setLoading(false);
          return;
        }
      }
    }
    if (!skipCache && cacheRef.current && now - cacheRef.current.timestamp < 5 * 60 * 1000) {
      const inMemory = cacheRef.current.banners;
      if (Array.isArray(inMemory) && inMemory.length === 0) {
        logBanner('info', 'Cache in-memory vazio; ignorando');
      } else {
        const hasFallback = Array.isArray(inMemory) && inMemory.some((b) => String(b.id || '').startsWith('fallback-'));
        if (hasFallback) {
          logBanner('info', 'Cache in-memory contém fallback, ignorando');
        } else {
          logBanner('info', 'Cache in-memory HIT', { count: cacheRef.current.banners.length });
          setBanners(cacheRef.current.banners);
          if (cacheRef.current.banners.length > 0) lastGoodRef.current = cacheRef.current.banners;
          setLoading(false);
          return;
        }
      }
    }

    try {
      const bannersData = await fetchActiveBanners(supabasePublic);
      // Se a consulta retornar zero, manter os banners anteriores (não-fallback) para evitar sumir na UI
      if (!bannersData || bannersData.length === 0) {
        const prev = lastGoodRef.current || [];
        const hasPrev = prev.length > 0 && !prev.some((b) => String(b.id || '').startsWith('fallback-'));
        if (hasPrev && !allowEmpty) {
          logBanner('warn', 'Consulta de banners retornou 0; mantendo lastGood e agendando retry', { count: prev.length });
          setBanners(prev);
          // Recalcular URLs resolvidas com base no lastGood
          try {
            const desktopPairs = prev.map((b) => [b.id, b.imagem_url] as const);
            setResolvedDesktop(Object.fromEntries(desktopPairs));
            const mobilePairs = prev.map((b) => {
              if (!b.imagem_url_mobile) return [b.id, ''] as const;
              try {
                const renderUrl = toSupabaseRenderUrl(b.imagem_url_mobile, 1080);
                return [b.id, renderUrl] as const;
              } catch {
                return [b.id, ''] as const;
              }
            });
            setResolvedMobile(Object.fromEntries(mobilePairs));
          } catch (e) {
            logBanner('warn', 'Falha ao recalcular URLs resolvidas do cache', e);
          }
          setLoading(false);
          // Agendar tentativas de refetch (até 5)
          try {
            if (retryRef.current.attempts < 5) {
              const delay = 700;
              retryRef.current.attempts++;
              retryRef.current.id = setTimeout(() => {
                fetchBanners(true, allowEmpty);
              }, delay);
              logBanner('info', 'Retry de busca agendado', { attempt: retryRef.current.attempts });
            } else {
              logBanner('warn', 'Máximo de tentativas atingido, mantendo lastGood');
            }
          } catch {}
          return;
        }
      }

      setBanners(bannersData);
      logBanner('info', 'Banners carregados do banco', { count: bannersData.length });
      // Atualiza last good e limpa retries
      if (bannersData.length > 0) {
        lastGoodRef.current = bannersData;
        if (retryRef.current.id) {
          try { clearTimeout(retryRef.current.id); } catch {}
        }
        retryRef.current = { id: null, attempts: 0 };
      }

      // Atualizar caches apenas se houver conteúdo
      if (bannersData.length > 0) {
        cacheRef.current = { banners: bannersData, timestamp: now };
        setCachedBanners(bannersData);
      } else {
        cacheRef.current = { banners: [], timestamp: now };
      }
      // Usar URLs originais diretamente para evitar bloqueios CORB
      try {
        // URLs desktop - usar URL original sem transformações
        const desktopPairs = bannersData.map((b) => {
          return [b.id, b.imagem_url] as const;
        });
        const resolvedDesktopObj = Object.fromEntries(desktopPairs);
        setResolvedDesktop(resolvedDesktopObj);
        logBanner('debug', 'Desktop URLs resolvidas (originais)', resolvedDesktopObj);

        // URLs mobile - usar transformação específica de 1080x1080
        const mobilePairs = bannersData.map((b) => {
          if (!b.imagem_url_mobile) return [b.id, ''] as const;
          try {
            const renderUrl = toSupabaseRenderUrl(b.imagem_url_mobile, 1080);
            return [b.id, renderUrl] as const;
          } catch {
            return [b.id, ''] as const;
          }
        });
        const resolvedMobileObj = Object.fromEntries(mobilePairs);
        setResolvedMobile(resolvedMobileObj);
        logBanner('debug', 'Mobile URLs resolvidas (originais)', resolvedMobileObj);
      } catch (e) {
        logBanner('warn', 'Falha ao processar URLs dos banners', e);
      }
    } catch (error) {
      logBanner('error', 'Erro inesperado ao carregar banners', error);
      
      // Fallback com banners de exemplo quando o Supabase não está disponível
      const fallbackBanners: Banner[] = [
        {
          id: 'fallback-1',
          titulo: 'Bem-vindo à SempreBella',
          subtitulo: 'Descubra nossa coleção exclusiva',
          imagem_url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1920&h=600&fit=crop',
          link_destino: '/produtos',
          texto_botao: 'Ver Produtos',
          ordem_exibicao: 1,
          ativo: true
        },
        {
          id: 'fallback-2', 
          titulo: 'Promoções Especiais',
          subtitulo: 'Até 30% de desconto em itens selecionados',
          imagem_url: 'https://images.unsplash.com/photo-1556906781-2f0520405b71?w=1920&h=600&fit=crop',
          link_destino: '/promocoes',
          texto_botao: 'Conferir Ofertas',
          ordem_exibicao: 2,
          ativo: true
        },
        {
          id: 'fallback-3',
          titulo: 'Novidades Chegaram',
          subtitulo: 'Confira os lançamentos da temporada',
          imagem_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=600&fit=crop',
          link_destino: '/novidades',
          texto_botao: 'Ver Novidades',
          ordem_exibicao: 3,
          ativo: true
        }
      ];
      
      // Exibe fallback APENAS nesta renderização, sem persistir em cache
      setBanners(fallbackBanners);
      // Não atualizar cacheRef e nem sessionStorage para evitar bloquear banners reais depois
      
      // Processar URLs dos banners de fallback
      try {
        const desktopPairs = fallbackBanners.map((b) => [b.id, b.imagem_url] as const);
        const resolvedDesktopObj = Object.fromEntries(desktopPairs);
        setResolvedDesktop(resolvedDesktopObj);
        
        const mobilePairs = fallbackBanners.map((b) => [b.id, b.imagem_url] as const);
        const resolvedMobileObj = Object.fromEntries(mobilePairs);
        setResolvedMobile(resolvedMobileObj);
        
        logBanner('info', 'Usando banners de fallback', { count: fallbackBanners.length });
      } catch (e) {
        logBanner('warn', 'Falha ao processar URLs dos banners de fallback', e);
      }
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
            <picture>
              {resolvedMobile[banner.id] && (
                <source media="(max-width: 767px)" srcSet={resolvedMobile[banner.id]} />
              )}
              <img
                src={resolvedDesktop[banner.id] ?? '/placeholder-large.svg'}
                alt={banner.titulo || 'Banner'}
                className="w-full h-full object-cover object-top"
                style={{
                  opacity: 1,
                }}
                loading="lazy"
                onAbort={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.opacity = '1';
                  target.src = '/placeholder-large.svg';
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.opacity = '1';
                  target.src = '/placeholder-large.svg';
                }}
              />
            </picture>
            
            {/* Conteúdo do banner */}
            <div className="absolute inset-0 flex items-end justify-start p-12 md:p-24 pb-16 md:pb-24">
              <div className="max-w-lg">
                {banner.titulo && (
                  <h2 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4 text-white text-shadow">
                    {banner.titulo}
                  </h2>
                )}
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