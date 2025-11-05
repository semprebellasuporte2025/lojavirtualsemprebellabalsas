
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function LGPDNotification() {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const lgpdAccepted = localStorage.getItem('lgpd-accepted');
    const path = location.pathname;
    const isHome = path === '/';

    // Páginas onde o modal NÃO deve aparecer
    const excludedPaths = [
      '/admin',
      '/minha-conta', 
      '/carrinho',
      '/checkout'
    ];
    
    const isExcludedPath = excludedPaths.some(excludedPath => 
      path.startsWith(excludedPath)
    );

    const navEntries = typeof performance !== 'undefined' && 'getEntriesByType' in performance
      ? performance.getEntriesByType('navigation')
      : [];
    const isReloadModern = navEntries && navEntries.length > 0 && (navEntries[0] as any).type === 'reload';
    const isReloadLegacy = (performance as any)?.navigation?.type === 1;
    const isReload = isReloadModern || isReloadLegacy;

    if ((isHome && isReload && !isExcludedPath) || (!lgpdAccepted && !isExcludedPath)) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [location.pathname]);

  const handleAccept = () => {
    localStorage.setItem('lgpd-accepted', 'true');
    setIsVisible(false);
  };

  const handleViewPolicy = () => {
    window.open('/privacidade', '_blank');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:right-auto z-50">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-[calc(100vw-2rem)] sm:max-w-sm sm:w-[420px] md:w-[480px] animate-slide-up">
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3">

            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">Privacidade e Cookies</h3>
              <p className="text-gray-600 text-sm mb-3 leading-relaxed break-words">
                Usamos cookies e tecnologias semelhantes para melhorar sua experiência, personalizar conteúdo e analisar o tráfego. Ao continuar, você concorda com nossa Política de Privacidade e com o uso de cookies conforme a LGPD.
              </p>

              <div className="flex flex-row flex-wrap gap-2">
                <button
                  onClick={handleAccept}
                  className="flex-1 min-w-[140px] bg-pink-600 text-white py-2 px-3 sm:px-4 rounded-lg font-semibold hover:bg-pink-700 transition-colors text-sm text-center"
                >
                  <i className="ri-check-line mr-1"></i>
                  Aceitar
                </button>
                <button
                  onClick={handleViewPolicy}
                  className="flex-1 min-w-[140px] border border-gray-300 text-gray-700 py-2 px-3 sm:px-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm text-center"
                >
                  <i className="ri-file-text-line mr-1"></i>
                  Ver Política de Privacidade
                </button>
              </div>

              <p className="text-[11px] text-gray-500 mt-3">
                Este aviso pode aparecer novamente ao recarregar a página inicial. Você pode revisar suas preferências na página de Privacidade.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
