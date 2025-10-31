export const products = [
  {
    id: 1,
    name: 'Vestido Floral Primavera',
    category: 'Vestidos',
    price: 159.90,
    originalPrice: 199.90,
    discount: 20,
    rating: 4.8,
    reviews: 127,
    stock: 45,
    description: 'Vestido floral elegante perfeito para a primavera e verão. Tecido leve e confortável com estampa exclusiva.',
    material: '95% Algodão, 5% Elastano',
    images: [
      'https://readdy.ai/api/search-image?query=elegant%20floral%20spring%20dress%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing%20full%20length%20view%20high%20quality%20ecommerce%20style&width=800&height=800&seq=1&orientation=squarish',
      'https://readdy.ai/api/search-image?query=elegant%20floral%20spring%20dress%20detail%20close%20up%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing%20fabric%20texture&width=800&height=800&seq=2&orientation=squarish',
      'https://readdy.ai/api/search-image?query=elegant%20floral%20spring%20dress%20back%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing&width=800&height=800&seq=3&orientation=squarish',
      'https://readdy.ai/api/search-image?query=elegant%20floral%20spring%20dress%20side%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing&width=800&height=800&seq=4&orientation=squarish'
    ],
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
    colors: [
      { name: 'Rosa', hex: '#FFB6C1' },
      { name: 'Azul', hex: '#87CEEB' },
      { name: 'Verde', hex: '#90EE90' },
      { name: 'Amarelo', hex: '#FFD700' }
    ]
  },
  {
    id: 2,
    name: 'Blusa Manga Longa Elegante',
    category: 'Blusas',
    price: 89.90,
    originalPrice: 129.90,
    discount: 30,
    rating: 4.6,
    reviews: 89,
    stock: 67,
    description: 'Blusa elegante de manga longa, perfeita para o trabalho ou ocasiões especiais. Tecido de alta qualidade.',
    material: '100% Poliéster',
    images: [
      'https://readdy.ai/api/search-image?query=elegant%20long%20sleeve%20blouse%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing%20business%20casual%20style&width=800&height=800&seq=5&orientation=squarish',
      'https://readdy.ai/api/search-image?query=elegant%20long%20sleeve%20blouse%20detail%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing%20fabric%20close%20up&width=800&height=800&seq=6&orientation=squarish',
      'https://readdy.ai/api/search-image?query=elegant%20long%20sleeve%20blouse%20back%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing&width=800&height=800&seq=7&orientation=squarish',
      'https://readdy.ai/api/search-image?query=elegant%20long%20sleeve%20blouse%20side%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing&width=800&height=800&seq=8&orientation=squarish'
    ],
    sizes: ['P', 'M', 'G', 'GG'],
    colors: [
      { name: 'Branco', hex: '#FFFFFF' },
      { name: 'Preto', hex: '#000000' },
      { name: 'Bege', hex: '#F5F5DC' },
      { name: 'Azul Marinho', hex: '#000080' }
    ]
  },
  {
    id: 3,
    name: 'Calça Jeans Skinny',
    category: 'Calças',
    price: 139.90,
    originalPrice: 189.90,
    discount: 26,
    rating: 4.9,
    reviews: 203,
    stock: 52,
    description: 'Calça jeans skinny com modelagem que valoriza o corpo. Tecido com elastano para maior conforto.',
    material: '98% Algodão, 2% Elastano',
    images: [
      'https://readdy.ai/api/search-image?query=skinny%20jeans%20pants%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing%20denim%20full%20length&width=800&height=800&seq=9&orientation=squarish',
      'https://readdy.ai/api/search-image?query=skinny%20jeans%20pants%20detail%20close%20up%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20denim%20texture%20fabric&width=800&height=800&seq=10&orientation=squarish',
      'https://readdy.ai/api/search-image?query=skinny%20jeans%20pants%20back%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing&width=800&height=800&seq=11&orientation=squarish',
      'https://readdy.ai/api/search-image?query=skinny%20jeans%20pants%20side%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing&width=800&height=800&seq=12&orientation=squarish'
    ],
    sizes: ['36', '38', '40', '42', '44'],
    colors: [
      { name: 'Azul Claro', hex: '#ADD8E6' },
      { name: 'Azul Escuro', hex: '#00008B' },
      { name: 'Preto', hex: '#000000' }
    ]
  },
  {
    id: 4,
    name: 'Conjunto Fitness Premium',
    category: 'Fitness',
    price: 179.90,
    originalPrice: 249.90,
    discount: 28,
    rating: 4.7,
    reviews: 156,
    stock: 38,
    description: 'Conjunto fitness de alta performance com tecido respirável e secagem rápida. Ideal para treinos intensos.',
    material: '88% Poliamida, 12% Elastano',
    images: [
      'https://readdy.ai/api/search-image?query=premium%20fitness%20workout%20set%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20athletic%20wear%20sportswear%20activewear&width=800&height=800&seq=13&orientation=squarish',
      'https://readdy.ai/api/search-image?query=premium%20fitness%20workout%20set%20detail%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20athletic%20wear%20fabric%20texture&width=800&height=800&seq=14&orientation=squarish',
      'https://readdy.ai/api/search-image?query=premium%20fitness%20workout%20set%20back%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20athletic%20wear%20sportswear&width=800&height=800&seq=15&orientation=squarish',
      'https://readdy.ai/api/search-image?query=premium%20fitness%20workout%20set%20side%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20athletic%20wear%20sportswear&width=800&height=800&seq=16&orientation=squarish'
    ],
    sizes: ['PP', 'P', 'M', 'G'],
    colors: [
      { name: 'Preto', hex: '#000000' },
      { name: 'Rosa', hex: '#FF69B4' },
      { name: 'Roxo', hex: '#9370DB' },
      { name: 'Verde', hex: '#32CD32' }
    ]
  },
  {
    id: 5,
    name: 'Bolsa Transversal Couro',
    category: 'Acessórios',
    price: 199.90,
    originalPrice: 299.90,
    discount: 33,
    rating: 4.9,
    reviews: 178,
    stock: 29,
    description: 'Bolsa transversal em couro sintético de alta qualidade. Design moderno e prático para o dia a dia.',
    material: 'Couro Sintético Premium',
    images: [
      'https://readdy.ai/api/search-image?query=crossbody%20leather%20bag%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20fashion%20accessory%20handbag%20purse&width=800&height=800&seq=17&orientation=squarish',
      'https://readdy.ai/api/search-image?query=crossbody%20leather%20bag%20detail%20close%20up%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20fashion%20accessory%20texture&width=800&height=800&seq=18&orientation=squarish',
      'https://readdy.ai/api/search-image?query=crossbody%20leather%20bag%20open%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20fashion%20accessory%20interior&width=800&height=800&seq=19&orientation=squarish',
      'https://readdy.ai/api/search-image?query=crossbody%20leather%20bag%20side%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20fashion%20accessory&width=800&height=800&seq=20&orientation=squarish'
    ],
    sizes: ['Único'],
    colors: [
      { name: 'Preto', hex: '#000000' },
      { name: 'Marrom', hex: '#8B4513' },
      { name: 'Caramelo', hex: '#D2691E' },
      { name: 'Vermelho', hex: '#DC143C' }
    ]
  },
  {
    id: 6,
    name: 'Saia Midi Plissada',
    category: 'Saias',
    price: 119.90,
    originalPrice: 169.90,
    discount: 29,
    rating: 4.5,
    reviews: 94,
    stock: 41,
    description: 'Saia midi plissada elegante e versátil. Perfeita para criar looks sofisticados.',
    material: '100% Poliéster',
    images: [
      'https://readdy.ai/api/search-image?query=pleated%20midi%20skirt%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing%20elegant%20style&width=800&height=800&seq=21&orientation=squarish',
      'https://readdy.ai/api/search-image?query=pleated%20midi%20skirt%20detail%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing%20fabric%20texture&width=800&height=800&seq=22&orientation=squarish',
      'https://readdy.ai/api/search-image?query=pleated%20midi%20skirt%20back%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing&width=800&height=800&seq=23&orientation=squarish',
      'https://readdy.ai/api/search-image?query=pleated%20midi%20skirt%20side%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing&width=800&height=800&seq=24&orientation=squarish'
    ],
    sizes: ['P', 'M', 'G', 'GG'],
    colors: [
      { name: 'Preto', hex: '#000000' },
      { name: 'Nude', hex: '#E3BC9A' },
      { name: 'Vinho', hex: '#722F37' },
      { name: 'Azul Marinho', hex: '#000080' }
    ]
  },
  {
    id: 7,
    name: 'Colar Dourado Delicado',
    category: 'Acessórios',
    price: 79.90,
    originalPrice: 119.90,
    discount: 33,
    rating: 4.8,
    reviews: 142,
    stock: 58,
    description: 'Colar dourado delicado e elegante. Perfeito para complementar qualquer look com sofisticação.',
    material: 'Banho de Ouro 18k',
    images: [
      'https://readdy.ai/api/search-image?query=delicate%20gold%20necklace%20jewelry%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20elegant%20accessory%20feminine%20style%20luxury&width=800&height=800&seq=25&orientation=squarish',
      'https://readdy.ai/api/search-image?query=delicate%20gold%20necklace%20jewelry%20detail%20close%20up%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20elegant%20accessory&width=800&height=800&seq=26&orientation=squarish',
      'https://readdy.ai/api/search-image?query=delicate%20gold%20necklace%20jewelry%20pendant%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20elegant%20accessory&width=800&height=800&seq=27&orientation=squarish',
      'https://readdy.ai/api/search-image?query=delicate%20gold%20necklace%20jewelry%20chain%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20elegant%20accessory&width=800&height=800&seq=28&orientation=squarish'
    ],
    sizes: ['Único'],
    colors: [
      { name: 'Dourado', hex: '#FFD700' },
      { name: 'Prata', hex: '#C0C0C0' },
      { name: 'Rosé', hex: '#B76E79' }
    ]
  },
  {
    id: 8,
    name: 'Óculos de Sol Clássico',
    category: 'Acessórios',
    price: 149.90,
    originalPrice: 229.90,
    discount: 35,
    rating: 4.7,
    reviews: 167,
    stock: 44,
    description: 'Óculos de sol com design clássico e proteção UV400. Estilo atemporal e sofisticado.',
    material: 'Acetato Premium com Lentes UV400',
    images: [
      'https://readdy.ai/api/search-image?query=classic%20sunglasses%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20fashion%20accessory%20eyewear%20elegant%20style&width=800&height=800&seq=29&orientation=squarish',
      'https://readdy.ai/api/search-image?query=classic%20sunglasses%20side%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20fashion%20accessory%20eyewear&width=800&height=800&seq=30&orientation=squarish',
      'https://readdy.ai/api/search-image?query=classic%20sunglasses%20detail%20close%20up%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20fashion%20accessory&width=800&height=800&seq=31&orientation=squarish',
      'https://readdy.ai/api/search-image?query=classic%20sunglasses%20folded%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20fashion%20accessory%20eyewear&width=800&height=800&seq=32&orientation=squarish'
    ],
    sizes: ['Único'],
    colors: [
      { name: 'Preto', hex: '#000000' },
      { name: 'Tartaruga', hex: '#8B4513' },
      { name: 'Azul', hex: '#4169E1' },
      { name: 'Vermelho', hex: '#DC143C' }
    ]
  },
  {
    id: 9,
    name: 'Vestido Longo Festa',
    category: 'Vestidos',
    price: 289.90,
    originalPrice: 399.90,
    discount: 27,
    rating: 4.9,
    reviews: 215,
    stock: 32,
    description: 'Vestido longo elegante ideal para festas e eventos especiais. Tecido fluido e caimento perfeito.',
    material: '100% Poliéster',
    images: [
      'https://readdy.ai/api/search-image?query=elegant%20long%20evening%20dress%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing%20formal%20party%20gown%20full%20length&width=800&height=800&seq=33&orientation=squarish',
      'https://readdy.ai/api/search-image?query=elegant%20long%20evening%20dress%20detail%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing%20fabric%20texture&width=800&height=800&seq=34&orientation=squarish',
      'https://readdy.ai/api/search-image?query=elegant%20long%20evening%20dress%20back%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing&width=800&height=800&seq=35&orientation=squarish',
      'https://readdy.ai/api/search-image?query=elegant%20long%20evening%20dress%20side%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing&width=800&height=800&seq=36&orientation=squarish'
    ],
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
    colors: [
      { name: 'Preto', hex: '#000000' },
      { name: 'Vermelho', hex: '#DC143C' },
      { name: 'Azul Royal', hex: '#4169E1' },
      { name: 'Verde Esmeralda', hex: '#50C878' }
    ]
  },
  {
    id: 10,
    name: 'Vestido Midi Casual',
    category: 'Vestidos',
    price: 129.90,
    originalPrice: 179.90,
    discount: 28,
    rating: 4.7,
    reviews: 156,
    stock: 58,
    description: 'Vestido midi casual e confortável para o dia a dia. Perfeito para diversas ocasiões.',
    material: '92% Viscose, 8% Elastano',
    images: [
      'https://readdy.ai/api/search-image?query=casual%20midi%20dress%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing%20everyday%20style%20comfortable&width=800&height=800&seq=37&orientation=squarish',
      'https://readdy.ai/api/search-image?query=casual%20midi%20dress%20detail%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing%20fabric&width=800&height=800&seq=38&orientation=squarish',
      'https://readdy.ai/api/search-image?query=casual%20midi%20dress%20back%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing&width=800&height=800&seq=39&orientation=squarish',
      'https://readdy.ai/api/search-image?query=casual%20midi%20dress%20side%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing&width=800&height=800&seq=40&orientation=squarish'
    ],
    sizes: ['P', 'M', 'G', 'GG'],
    colors: [
      { name: 'Bege', hex: '#F5F5DC' },
      { name: 'Terracota', hex: '#E2725B' },
      { name: 'Verde Oliva', hex: '#808000' },
      { name: 'Marrom', hex: '#8B4513' }
    ]
  },
  {
    id: 11,
    name: 'Vestido Curto Estampado',
    category: 'Vestidos',
    price: 109.90,
    originalPrice: 149.90,
    discount: 27,
    rating: 4.6,
    reviews: 134,
    stock: 62,
    description: 'Vestido curto com estampa vibrante e moderna. Ideal para looks descontraídos e cheios de estilo.',
    material: '100% Viscose',
    images: [
      'https://readdy.ai/api/search-image?query=short%20printed%20dress%20colorful%20pattern%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing%20casual%20style&width=800&height=800&seq=41&orientation=squarish',
      'https://readdy.ai/api/search-image?query=short%20printed%20dress%20detail%20pattern%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing&width=800&height=800&seq=42&orientation=squarish',
      'https://readdy.ai/api/search-image?query=short%20printed%20dress%20back%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing&width=800&height=800&seq=43&orientation=squarish',
      'https://readdy.ai/api/search-image?query=short%20printed%20dress%20side%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing&width=800&height=800&seq=44&orientation=squarish'
    ],
    sizes: ['PP', 'P', 'M', 'G'],
    colors: [
      { name: 'Multicolor 1', hex: '#FF6B9D' },
      { name: 'Multicolor 2', hex: '#C44569' },
      { name: 'Multicolor 3', hex: '#FFA07A' }
    ]
  },
  {
    id: 12,
    name: 'Blusa Cropped Básica',
    category: 'Blusas',
    price: 59.90,
    originalPrice: 89.90,
    discount: 33,
    rating: 4.8,
    reviews: 198,
    stock: 85,
    description: 'Blusa cropped básica e versátil. Essencial para compor diversos looks modernos.',
    material: '95% Algodão, 5% Elastano',
    images: [
      'https://readdy.ai/api/search-image?query=basic%20cropped%20top%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing%20casual%20style%20modern&width=800&height=800&seq=45&orientation=squarish',
      'https://readdy.ai/api/search-image?query=basic%20cropped%20top%20detail%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing%20fabric&width=800&height=800&seq=46&orientation=squarish',
      'https://readdy.ai/api/search-image?query=basic%20cropped%20top%20back%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing&width=800&height=800&seq=47&orientation=squarish',
      'https://readdy.ai/api/search-image?query=basic%20cropped%20top%20side%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing&width=800&height=800&seq=48&orientation=squarish'
    ],
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
    colors: [
      { name: 'Branco', hex: '#FFFFFF' },
      { name: 'Preto', hex: '#000000' },
      { name: 'Rosa', hex: '#FFB6C1' },
      { name: 'Cinza', hex: '#808080' }
    ]
  },
  {
    id: 13,
    name: 'Blusa Regata Estampada',
    category: 'Blusas',
    price: 69.90,
    originalPrice: 99.90,
    discount: 30,
    rating: 4.5,
    reviews: 112,
    stock: 73,
    description: 'Blusa regata com estampa exclusiva. Leve e confortável para os dias quentes.',
    material: '100% Viscose',
    images: [
      'https://readdy.ai/api/search-image?query=printed%20tank%20top%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing%20summer%20style%20casual&width=800&height=800&seq=49&orientation=squarish',
      'https://readdy.ai/api/search-image?query=printed%20tank%20top%20detail%20pattern%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing&width=800&height=800&seq=50&orientation=squarish',
      'https://readdy.ai/api/search-image?query=printed%20tank%20top%20back%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing&width=800&height=800&seq=51&orientation=squarish',
      'https://readdy.ai/api/search-image?query=printed%20tank%20top%20side%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing&width=800&height=800&seq=52&orientation=squarish'
    ],
    sizes: ['P', 'M', 'G', 'GG'],
    colors: [
      { name: 'Floral Rosa', hex: '#FF69B4' },
      { name: 'Floral Azul', hex: '#4682B4' },
      { name: 'Floral Verde', hex: '#3CB371' }
    ]
  },
  {
    id: 14,
    name: 'Blusa Ombro a Ombro',
    category: 'Blusas',
    price: 79.90,
    originalPrice: 119.90,
    discount: 33,
    rating: 4.7,
    reviews: 145,
    stock: 56,
    description: 'Blusa ombro a ombro elegante e feminina. Perfeita para looks românticos e sofisticados.',
    material: '100% Algodão',
    images: [
      'https://readdy.ai/api/search-image?query=off%20shoulder%20blouse%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing%20romantic%20style%20elegant&width=800&height=800&seq=53&orientation=squarish',
      'https://readdy.ai/api/search-image?query=off%20shoulder%20blouse%20detail%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing%20fabric&width=800&height=800&seq=54&orientation=squarish',
      'https://readdy.ai/api/search-image?query=off%20shoulder%20blouse%20back%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing&width=800&height=800&seq=55&orientation=squarish',
      'https://readdy.ai/api/search-image?query=off%20shoulder%20blouse%20side%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing&width=800&height=800&seq=56&orientation=squarish'
    ],
    sizes: ['P', 'M', 'G', 'GG'],
    colors: [
      { name: 'Branco', hex: '#FFFFFF' },
      { name: 'Rosa Claro', hex: '#FFB6C1' },
      { name: 'Azul Claro', hex: '#87CEEB' },
      { name: 'Amarelo', hex: '#FFD700' }
    ]
  },
  {
    id: 15,
    name: 'Calça Alfaiataria',
    category: 'Calças',
    price: 169.90,
    originalPrice: 229.90,
    discount: 26,
    rating: 4.8,
    reviews: 187,
    stock: 48,
    description: 'Calça alfaiataria elegante e sofisticada. Ideal para ambientes corporativos e eventos formais.',
    material: '97% Poliéster, 3% Elastano',
    images: [
      'https://readdy.ai/api/search-image?query=tailored%20pants%20trousers%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing%20business%20formal%20elegant&width=800&height=800&seq=57&orientation=squarish',
      'https://readdy.ai/api/search-image?query=tailored%20pants%20detail%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing%20fabric%20texture&width=800&height=800&seq=58&orientation=squarish',
      'https://readdy.ai/api/search-image?query=tailored%20pants%20back%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing&width=800&height=800&seq=59&orientation=squarish',
      'https://readdy.ai/api/search-image?query=tailored%20pants%20side%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing&width=800&height=800&seq=60&orientation=squarish'
    ],
    sizes: ['36', '38', '40', '42', '44', '46'],
    colors: [
      { name: 'Preto', hex: '#000000' },
      { name: 'Azul Marinho', hex: '#000080' },
      { name: 'Cinza', hex: '#808080' },
      { name: 'Bege', hex: '#F5F5DC' }
    ]
  },
  {
    id: 16,
    name: 'Calça Pantalona',
    category: 'Calças',
    price: 149.90,
    originalPrice: 199.90,
    discount: 25,
    rating: 4.6,
    reviews: 163,
    stock: 54,
    description: 'Calça pantalona com modelagem ampla e confortável. Estilo moderno e elegante.',
    material: '95% Poliéster, 5% Elastano',
    images: [
      'https://readdy.ai/api/search-image?query=wide%20leg%20pants%20palazzo%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing%20modern%20elegant%20style&width=800&height=800&seq=61&orientation=squarish',
      'https://readdy.ai/api/search-image?query=wide%20leg%20pants%20detail%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing%20fabric&width=800&height=800&seq=62&orientation=squarish',
      'https://readdy.ai/api/search-image?query=wide%20leg%20pants%20back%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing&width=800&height=800&seq=63&orientation=squarish',
      'https://readdy.ai/api/search-image?query=wide%20leg%20pants%20side%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing&width=800&height=800&seq=64&orientation=squarish'
    ],
    sizes: ['36', '38', '40', '42', '44'],
    colors: [
      { name: 'Preto', hex: '#000000' },
      { name: 'Branco', hex: '#FFFFFF' },
      { name: 'Caramelo', hex: '#D2691E' },
      { name: 'Verde', hex: '#228B22' }
    ]
  },
  {
    id: 17,
    name: 'Calça Jogger',
    category: 'Calças',
    price: 119.90,
    originalPrice: 159.90,
    discount: 25,
    rating: 4.7,
    reviews: 176,
    stock: 67,
    description: 'Calça jogger confortável e estilosa. Perfeita para looks casuais e descontraídos.',
    material: '80% Algodão, 20% Poliéster',
    images: [
      'https://readdy.ai/api/search-image?query=jogger%20pants%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing%20casual%20comfortable%20style&width=800&height=800&seq=65&orientation=squarish',
      'https://readdy.ai/api/search-image?query=jogger%20pants%20detail%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing%20fabric%20texture&width=800&height=800&seq=66&orientation=squarish',
      'https://readdy.ai/api/search-image?query=jogger%20pants%20back%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing&width=800&height=800&seq=67&orientation=squarish',
      'https://readdy.ai/api/search-image?query=jogger%20pants%20side%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20feminine%20fashion%20clothing&width=800&height=800&seq=68&orientation=squarish'
    ],
    sizes: ['P', 'M', 'G', 'GG'],
    colors: [
      { name: 'Preto', hex: '#000000' },
      { name: 'Cinza', hex: '#808080' },
      { name: 'Verde Militar', hex: '#4B5320' },
      { name: 'Azul Marinho', hex: '#000080' }
    ]
  },
  {
    id: 18,
    name: 'Brinco Argola Dourado',
    category: 'Acessórios',
    price: 69.90,
    originalPrice: 99.90,
    discount: 30,
    rating: 4.9,
    reviews: 234,
    stock: 92,
    description: 'Brinco argola dourado elegante e versátil. Complemento perfeito para qualquer look.',
    material: 'Banho de Ouro 18k',
    images: [
      'https://readdy.ai/api/search-image?query=gold%20hoop%20earrings%20jewelry%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20elegant%20accessory%20feminine%20style%20luxury&width=800&height=800&seq=69&orientation=squarish',
      'https://readdy.ai/api/search-image?query=gold%20hoop%20earrings%20detail%20close%20up%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20elegant%20accessory%20jewelry&width=800&height=800&seq=70&orientation=squarish',
      'https://readdy.ai/api/search-image?query=gold%20hoop%20earrings%20pair%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20elegant%20accessory%20jewelry&width=800&height=800&seq=71&orientation=squarish',
      'https://readdy.ai/api/search-image?query=gold%20hoop%20earrings%20side%20view%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20elegant%20accessory%20jewelry&width=800&height=800&seq=72&orientation=squarish'
    ],
    sizes: ['Único'],
    colors: [
      { name: 'Dourado', hex: '#FFD700' },
      { name: 'Prata', hex: '#C0C0C0' },
      { name: 'Rosé', hex: '#B76E79' }
    ]
  },
  {
    id: 19,
    name: 'Pulseira Delicada',
    category: 'Acessórios',
    price: 59.90,
    originalPrice: 89.90,
    discount: 33,
    rating: 4.8,
    reviews: 189,
    stock: 78,
    description: 'Pulseira delicada e elegante. Perfeita para usar sozinha ou em composição.',
    material: 'Banho de Ouro 18k',
    images: [
      'https://readdy.ai/api/search-image?query=delicate%20bracelet%20jewelry%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20elegant%20accessory%20feminine%20style%20luxury&width=800&height=800&seq=73&orientation=squarish',
      'https://readdy.ai/api/search-image?query=delicate%20bracelet%20detail%20close%20up%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20elegant%20accessory%20jewelry&width=800&height=800&seq=74&orientation=squarish',
      'https://readdy.ai/api/search-image?query=delicate%20bracelet%20chain%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20elegant%20accessory%20jewelry&width=800&height=800&seq=75&orientation=squarish',
      'https://readdy.ai/api/search-image?query=delicate%20bracelet%20clasp%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20elegant%20accessory%20jewelry&width=800&height=800&seq=76&orientation=squarish'
    ],
    sizes: ['Único'],
    colors: [
      { name: 'Dourado', hex: '#FFD700' },
      { name: 'Prata', hex: '#C0C0C0' },
      { name: 'Rosé', hex: '#B76E79' }
    ]
  },
  {
    id: 20,
    name: 'Lenço de Seda',
    category: 'Acessórios',
    price: 89.90,
    originalPrice: 129.90,
    discount: 31,
    rating: 4.6,
    reviews: 156,
    stock: 64,
    description: 'Lenço de seda com estampa exclusiva. Versátil e elegante para diversos usos.',
    material: '100% Seda',
    images: [
      'https://readdy.ai/api/search-image?query=silk%20scarf%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20fashion%20accessory%20elegant%20style%20luxury%20pattern&width=800&height=800&seq=77&orientation=squarish',
      'https://readdy.ai/api/search-image?query=silk%20scarf%20detail%20pattern%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20fashion%20accessory%20texture&width=800&height=800&seq=78&orientation=squarish',
      'https://readdy.ai/api/search-image?query=silk%20scarf%20folded%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20fashion%20accessory%20elegant&width=800&height=800&seq=79&orientation=squarish',
      'https://readdy.ai/api/search-image?query=silk%20scarf%20corner%20detail%20on%20white%20simple%20clean%20background%20professional%20product%20photography%20soft%20natural%20lighting%20fashion%20accessory&width=800&height=800&seq=80&orientation=squarish'
    ],
    sizes: ['Único'],
    colors: [
      { name: 'Floral Rosa', hex: '#FF69B4' },
      { name: 'Floral Azul', hex: '#4682B4' },
      { name: 'Animal Print', hex: '#D2691E' },
      { name: 'Geométrico', hex: '#4B0082' }
    ]
  }
];
