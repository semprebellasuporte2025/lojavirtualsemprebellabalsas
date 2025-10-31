import { useState } from 'react';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setZoomPosition({ x, y });
  };

  return (
    <div className="space-y-4">
      {/* Main Image with Zoom */}
      <div 
        className="relative bg-gray-50 rounded-2xl overflow-hidden aspect-square cursor-zoom-in"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <img
          src={images[selectedImage]}
          alt={productName}
          className="w-full h-full object-cover object-top transition-transform duration-200"
          style={isZoomed ? {
            transform: 'scale(2)',
            transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
          } : {}}
        />
        
        {/* Zoom Indicator */}
        {isZoomed && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-medium">
            <i className="ri-zoom-in-line mr-1"></i>
            Zoom ativo
          </div>
        )}
      </div>

      {/* Thumbnail Gallery */}
      <div className="grid grid-cols-4 gap-3">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(index)}
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
    </div>
  );
}
