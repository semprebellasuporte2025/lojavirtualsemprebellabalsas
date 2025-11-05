import { useState, useEffect } from 'react';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Zoom apenas no desktop (telas >= 640px)
    if (!isZoomed || window.innerWidth < 640) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setZoomPosition({ x, y });
  };

  const openModal = (index: number) => {
    setModalImageIndex(index);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden'; // Previne scroll do body
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = 'unset'; // Restaura scroll do body
  };

  const nextImage = () => {
    setModalImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setModalImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Fechar modal com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);

  // Cleanup ao desmontar componente
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Main Image with Zoom */}
      <div 
        className={`relative bg-gray-50 rounded-2xl overflow-hidden aspect-square ${
          window.innerWidth >= 640 ? 'cursor-zoom-in' : 'cursor-pointer'
        }`}
        onMouseEnter={() => window.innerWidth >= 640 && setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
        onClick={() => openModal(selectedImage)}
      >
        <img
          src={images[selectedImage]}
          alt={productName}
          className="w-full h-full object-cover object-top transition-transform duration-200"
          style={isZoomed && window.innerWidth >= 640 ? {
            transform: 'scale(2)',
            transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
          } : {}}
        />
        
        {/* Zoom Indicator - apenas desktop */}
        {window.innerWidth >= 640 && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-medium">
            {isZoomed ? (
              <>
                <i className="ri-zoom-in-line mr-1"></i>
                Zoom ativo
              </>
            ) : (
              <>
                <i className="ri-zoom-in-line mr-1"></i>
                Clique para ampliar
              </>
            )}
          </div>
        )}

        {/* Click to expand indicator for mobile */}
        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg text-white text-xs font-medium sm:hidden">
          <i className="ri-fullscreen-line mr-1"></i>
          Toque para ampliar
        </div>
      </div>

      {/* Thumbnail Gallery */}
      <div className="grid grid-cols-4 gap-3">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => {
              setSelectedImage(index);
              // No mobile, abrir modal ao clicar na miniatura
              if (window.innerWidth < 640) {
                openModal(index);
              }
            }}
            className={`relative bg-gray-50 rounded-lg overflow-hidden aspect-square cursor-pointer transition-all ${
              selectedImage === index 
                ? 'ring-2 ring-pink-600 ring-offset-2' 
                : 'hover:ring-2 hover:ring-gray-300'
            }`}
          >
            <img
              src={image}
              alt={`${productName} - ${index + 1}`}
              className="w-full h-full object-cover object-top"
            />
          </button>
        ))}
      </div>

      {/* Modal de Visualização de Imagens */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={closeModal}
        >
          <div className="relative w-full h-full max-w-4xl max-h-full flex items-center justify-center">
            {/* Botão Fechar */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              aria-label="Fechar visualização"
            >
              <i className="ri-close-line text-xl sm:text-2xl"></i>
            </button>

            {/* Contador de Imagens */}
            <div className="absolute top-4 left-4 z-10 bg-black/50 text-white px-3 py-2 rounded-lg text-sm font-medium">
              {modalImageIndex + 1} / {images.length}
            </div>

            {/* Botão Anterior */}
            {images.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                aria-label="Imagem anterior"
              >
                <i className="ri-arrow-left-line text-xl"></i>
              </button>
            )}

            {/* Botão Próximo */}
            {images.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                aria-label="Próxima imagem"
              >
                <i className="ri-arrow-right-line text-xl"></i>
              </button>
            )}

            {/* Imagem Principal */}
            <div
              className="w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={images[modalImageIndex]}
                alt={`${productName} - ${modalImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
                loading="lazy"
              />
            </div>

            {/* Miniaturas no Modal (apenas desktop) */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden sm:flex gap-2 bg-black/50 p-2 rounded-lg max-w-full overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalImageIndex(index);
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden transition-all ${
                      modalImageIndex === index 
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-black/50' 
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${productName} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Indicadores de Swipe para Mobile */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 sm:hidden">
                <div className="flex gap-2">
                  {images.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all ${
                        modalImageIndex === index ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
