
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../base/Button';
import { generateSlug } from '../../utils/formatters';

const slides = [
  {
    id: 1,
    title: 'Blusas Elegantes',
    subtitle: 'Sofisticação e conforto',
    description: 'Descubra nossa coleção de blusas elegantes e versáteis. Peças perfeitas para qualquer ocasião, do casual ao formal.',
    cta: 'Ver Blusas',
    category: 'Blusas',
    image: 'https://readdy.ai/api/search-image?query=elegant%20sophisticated%20blouses%20collection%20fashion%20banner%20with%20beautiful%20woman%20wearing%20stylish%20feminine%20blouse%2C%20professional%20fashion%20photography%2C%20soft%20natural%20lighting%2C%20clean%20white%20and%20beige%20background%2C%20modern%20minimalist%20aesthetic%2C%20high-end%20retail%20promotional%20design&width=1200&height=600&seq=blouses2024&orientation=landscape',
    bgColor: 'bg-gradient-to-r from-rose-100 to-pink-100'
  },
  {
    id: 2,
    title: 'Vestidos Alfaiataria',
    subtitle: 'Elegância atemporal',
    description: 'Vestidos com corte alfaiataria impecável. Peças estruturadas que valorizam sua silhueta com sofisticação e estilo.',
    cta: 'Ver Vestidos',
    category: 'Vestidos',
    image: 'https://readdy.ai/api/search-image?query=tailored%20structured%20dresses%20fashion%20banner%20with%20elegant%20woman%20wearing%20sophisticated%20tailored%20dress%2C%20professional%20fashion%20photography%2C%20clean%20minimalist%20background%20in%20soft%20beige%20and%20white%20tones%2C%20modern%20luxury%20aesthetic%2C%20high-end%20retail%20promotional%20design%20with%20impeccable%20fit&width=1200&height=600&seq=tailored2024&orientation=landscape',
    bgColor: 'bg-gradient-to-r from-amber-50 to-rose-50'
  },
  {
    id: 3,
    title: 'Saias Modernas',
    subtitle: 'Versatilidade e estilo',
    description: 'Saias para todos os momentos. Do clássico ao contemporâneo, encontre a peça perfeita para compor seu look.',
    cta: 'Ver Saias',
    category: 'Saias',
    image: 'https://readdy.ai/api/search-image?query=modern%20elegant%20skirts%20collection%20fashion%20banner%20with%20beautiful%20woman%20wearing%20stylish%20skirt%2C%20professional%20fashion%20photography%2C%20soft%20natural%20lighting%2C%20clean%20white%20and%20pastel%20background%2C%20contemporary%20minimalist%20aesthetic%2C%20high-end%20retail%20promotional%20design&width=1200&height=600&seq=skirts2024&orientation=landscape',
    bgColor: 'bg-gradient-to-r from-pink-50 to-purple-50'
  },
  {
    id: 4,
    title: 'Acessórios Exclusivos',
    subtitle: 'Complete seu look',
    description: 'Bolsas, joias e acessórios únicos para deixar seu visual ainda mais especial. Detalhes que fazem toda a diferença.',
    cta: 'Ver Acessórios',
    category: 'Acessórios',
    image: 'https://readdy.ai/api/search-image?query=luxury%20fashion%20accessories%20banner%20with%20elegant%20handbags%20jewelry%20and%20accessories%20display%2C%20professional%20product%20photography%2C%20soft%20pink%20and%20beige%20background%2C%20minimalist%20design%2C%20high-end%20retail%20aesthetic%2C%20sophisticated%20styling%20with%20clean%20composition&width=1200&height=600&seq=accessories2024new&orientation=landscape',
    bgColor: 'bg-gradient-to-r from-rose-50 to-pink-100'
  }
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleCategoryClick = (category: string) => {
    const slug = generateSlug(category);
    navigate(`/categoria/${slug}`);
  };

  return (
    <div className="relative h-[600px] overflow-hidden bg-pink-50">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
            index === currentSlide ? 'translate-x-0' : 
            index < currentSlide ? '-translate-x-full' : 'translate-x-full'
          }`}
        >
          <div 
            className={`w-full h-full ${slide.bgColor} relative`}
            style={{
              backgroundImage: `url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="relative z-10 h-full flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-2xl text-white">
                  <h2 className="text-5xl font-bold mb-4">{slide.title}</h2>
                  <h3 className="text-2xl font-semibold mb-4 text-pink-200">{slide.subtitle}</h3>
                  <p className="text-lg mb-8 text-gray-100">{slide.description}</p>
                  <Button 
                    size="lg" 
                    className="bg-pink-600 hover:bg-pink-700"
                    onClick={() => handleCategoryClick(slide.category)}
                  >
                    {slide.cta}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-200 cursor-pointer ${
              index === currentSlide ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Navigation Arrows - Below Image */}
      <div className="absolute bottom-20 left-0 right-0 z-20">
        <div className="max-w-7xl mx-auto px-4 flex justify-between">
          <button
            onClick={prevSlide}
            className="bg-pink-600 hover:bg-pink-700 text-white p-3 rounded-full transition-all duration-200 cursor-pointer shadow-lg"
          >
            <i className="ri-arrow-left-line text-xl"></i>
          </button>
          <button
            onClick={nextSlide}
            className="bg-pink-600 hover:bg-pink-700 text-white p-3 rounded-full transition-all duration-200 cursor-pointer shadow-lg"
          >
            <i className="ri-arrow-right-line text-xl"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
