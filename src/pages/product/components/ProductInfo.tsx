
import { useState, useRef, useEffect } from 'react';
import Button from '../../../components/base/Button';
import { useToast } from '../../../hooks/useToast';

interface ProductInfoProps {
  produto: any;
  onAddToCart?: (item: any) => void;
}

export default function ProductInfo({ produto, onAddToCart }: ProductInfoProps) {
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [cep, setCep] = useState('');
  const [freteResults, setFreteResults] = useState<any[]>([]);
  const [calculatingFrete, setCalculatingFrete] = useState(false);
  const [freteError, setFreteError] = useState('');
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [highlightSize, setHighlightSize] = useState(false);
  const sizeSectionRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Derivar cores e tamanhos a partir das variantes do produto
  const variantes: any[] = Array.isArray(produto?.variantes_produto) ? produto?.variantes_produto : [];
  const coresFromVariantes = (() => {
    const map = new Map<string, { name: string; hex: string }>();
    variantes.forEach(v => {
      const hex = (v?.cor_hex || '').toLowerCase();
      const name = v?.cor || '';
      if (hex) {
        const key = hex;
        if (!map.has(key)) {
          map.set(key, { name, hex });
        }
      }
    });
    return Array.from(map.values());
  })();

  const sizesFromVariantes = (() => {
    const set = new Set<string>();
    variantes.forEach(v => { if (v?.tamanho) set.add(String(v.tamanho)); });
    return Array.from(set.values());
  })();

  const selectedVariant = variantes.find(v => v.tamanho === selectedSize && v.cor === selectedColor);
  const stock = selectedVariant ? selectedVariant.estoque : produto?.estoque || 0;

  useEffect(() => {
    if (coresFromVariantes.length === 1) {
      setSelectedColor(coresFromVariantes[0].name);
    }
    if (sizesFromVariantes.length === 1) {
      setSelectedSize(sizesFromVariantes[0]);
    }
  }, [coresFromVariantes, sizesFromVariantes]);

  // Valores padrão somente quando não há dados
  const product = {
    id: produto?.id || '',
    name: produto?.nome || 'Produto',
    price: produto?.preco || 0,
    originalPrice: produto?.preco_original || produto?.preco || 0,
    discount: produto?.desconto || 0,
    rating: produto?.avaliacao || 4.5,
    reviews: produto?.total_avaliacoes || 0,
    stock: produto?.estoque || 0,
    colors: coresFromVariantes.length > 0 ? coresFromVariantes : [],
    sizes: sizesFromVariantes.length > 0 ? sizesFromVariantes : ['P', 'M', 'G', 'GG'],
    images: produto?.imagens || [produto?.imagem_url] || []
  };

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      setShowSelectionModal(true);
      return;
    }

    if (onAddToCart) {
      onAddToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        quantity,
        size: selectedSize,
        color: selectedColor,
        material: produto?.material || undefined
      });
      // Toast de sucesso ao adicionar ao carrinho
      showToast('Produto adicionado ao carrinho!', 'success');
    }
  };

  const calculateFrete = async () => {
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (!cepLimpo || cepLimpo.length !== 8) {
      setFreteError('Por favor, digite um CEP válido com 8 dígitos');
      return;
    }

    setCalculatingFrete(true);
    setFreteError('');
    setFreteResults([]);

    try {
      const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/calcular-frete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          cepDestino: cepLimpo,
          peso: 0.5, // Peso padrão de 500g para roupas
          comprimento: 20,
          altura: 5,
          largura: 15,
          valorTotal: product.price * quantity
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setFreteError(data.error || 'Erro ao calcular frete');
        setCalculatingFrete(false);
        return;
      }

      if (data.success && data.opcoesFrete) {
        const results = data.opcoesFrete.map((opcao: any) => ({
          name: opcao.nome,
          price: opcao.valor,
          days: opcao.descricao,
          icon: opcao.nome.includes('SEDEX')
            ? 'ri-flashlight-line'
            : opcao.nome.includes('Grátis')
            ? 'ri-gift-line'
            : 'ri-truck-line',
          isGratis: opcao.valor === 0
        }));
        
        setFreteResults(results);

        // Mostrar mensagem de frete grátis se aplicável
        if (data.freteGratis) {
          setFreteError('');
        }
      }
    } catch (error) {
      console.error('Erro ao calcular frete:', error);
      setFreteError('Erro ao calcular frete. Tente novamente.');
    } finally {
      setCalculatingFrete(false);
    }
  };

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) {
      return numbers;
    }
    return numbers.replace(/(\d{5})(\d{1,3})/, '$1-$2');
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setCep(formatted);
    if (freteResults.length > 0) {
      setFreteResults([]);
    }
    if (freteError) {
      setFreteError('');
    }
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Confira ${product.name} na Sempre Bella Balsas!`;

    const shareUrls: { [key: string]: string } = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(text)}`,
    };

    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('link copiado com sucesso', 'success');
    setShowShareMenu(false);
  };

  return (
    <div className="space-y-6">
      {/* Product Title & Rating */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <i
                key={i}
                className={`${
                  i < Math.floor(product.rating) ? 'ri-star-fill text-yellow-400' : 'ri-star-line text-gray-300'
                } text-lg`}
              ></i>
            ))}
            <span className="ml-2 text-gray-600 text-sm">
              {product.rating} ({product.reviews} avaliações)
            </span>
          </div>
          {stock > 0 ? (
            <span className="text-green-600 text-sm font-medium">
              <i className="ri-check-line"></i> Em estoque
            </span>
          ) : (
            <span className="text-red-600 text-sm font-medium">
              <i className="ri-close-line"></i> Fora de estoque
            </span>
          )}
        </div>
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setIsSizeGuideOpen(true)}
            className="flex items-center text-purple-700 hover:text-purple-800 font-medium cursor-pointer whitespace-nowrap"
          >
            <i className="ri-ruler-line mr-2"></i>
            Guia de tamanhos
          </button>
        </div>
      </div>

      {/* Price */}
      <div className="border-t border-b border-gray-200 py-4">
        <div className="flex items-baseline space-x-3">
          {product.discount > 0 && (
            <span className="text-2xl text-gray-400 line-through">R$ {product.originalPrice.toFixed(2)}</span>
          )}
          <span className="text-4xl font-bold text-pink-600">R$ {product.price.toFixed(2)}</span>
          {product.discount > 0 && (
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              -{product.discount}%
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-2">
          ou 6x de R$ {(product.price / 6).toFixed(2)} sem juros
        </p>
        {/* Aviso de seleção de variações */}
        <p className="text-sm text-gray-800 mt-3">
          Escolha o seu tamanho e a cor
        </p>
      </div>

      {/* Color Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Cor: {selectedColor && <span className="text-pink-600">{selectedColor}</span>}
        </label>
        <div className="flex flex-wrap gap-4 items-start">
          {product.colors.map((color: any) => {
            const hex = (color.hex || '').toLowerCase();
            const name = (color.name || '').toLowerCase();
            const isWhite = hex === '#ffffff' || hex === '#fff' || name === 'branco' || name === 'white';
            const selected = selectedColor === color.name;
            return (
              <div key={color.name} className="flex flex-col items-center w-16">
                <button
                  onClick={() => setSelectedColor(color.name)}
                  className={`relative w-12 h-12 rounded-full cursor-pointer transition-all ${
                    selected ? 'ring-2 ring-pink-600 ring-offset-2 scale-110' : 'hover:scale-105'
                  } ${isWhite ? 'border border-gray-300' : ''}`}
                  style={{ backgroundColor: color.hex }}
                  aria-label={color.name}
                >
                  {selected && (
                    <i className={`ri-check-line ${isWhite ? 'text-gray-800' : 'text-white'} text-xl absolute inset-0 flex items-center justify-center`}></i>
                  )}
                </button>
                <span
                  className={`w-full text-center text-xs font-medium mt-1 truncate ${selected ? 'text-pink-600' : 'text-gray-700'}`}
                  title={color.name}
                >
                  {color.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Size Selection */}
      <div ref={sizeSectionRef} className={highlightSize ? 'ring-2 ring-pink-500 ring-offset-2 rounded-lg p-2' : ''}>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Tamanho: {selectedSize && <span className="text-pink-600">{selectedSize}</span>}
        </label>
        <div className="flex flex-wrap gap-3">
          {product.sizes.map((size: string) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`px-6 py-3 border-2 rounded-lg font-medium cursor-pointer transition-all whitespace-nowrap ${
                selectedSize === size
                  ? 'border-pink-600 bg-pink-600 text-white'
                  : 'border-gray-300 text-gray-700 hover:border-pink-600'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">Quantidade</label>
        <div className="flex items-center space-x-4">
          <div className="flex items-center border-2 border-gray-300 rounded-lg">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-4 py-2 text-gray-600 hover:text-pink-600 cursor-pointer"
            >
              <i className="ri-subtract-line text-xl"></i>
            </button>
            <span className="px-6 py-2 font-semibold text-gray-900 border-x-2 border-gray-300">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="px-4 py-2 text-gray-600 hover:text-pink-600 cursor-pointer"
              disabled={quantity >= stock}
            >
              <i className="ri-add-line text-xl"></i>
            </button>
          </div>
          {stock > 0 && (
            <span className="text-sm text-gray-600">{stock} unidades disponíveis</span>
          )}
          {stock === 0 && (
            <span className="text-sm text-red-600">Produto esgotado</span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-4">
        <Button variant="primary" size="lg" className="w-full" onClick={handleAddToCart}>
          <i className="ri-shopping-cart-line mr-2 text-xl"></i>
          Adicionar ao Carrinho
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" size="md" className="w-full">
            <i className="ri-heart-line mr-2"></i>
            Favoritar
          </Button>

          <div className="relative">
            <Button variant="outline" size="md" className="w-full" onClick={() => setShowShareMenu(!showShareMenu)}>
              <i className="ri-share-line mr-2"></i>
              Compartilhar
            </Button>

            {showShareMenu && (
              <div className="absolute top-full mt-2 right-0 bg-white border-2 border-gray-200 rounded-lg shadow-xl p-4 z-10 w-64">
                <p className="text-sm font-semibold text-gray-900 mb-3">Compartilhar via:</p>
                <div className="space-y-2">
                  <button
                    onClick={() => handleShare('whatsapp')}
                    className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <i className="ri-whatsapp-fill text-green-500 text-xl"></i>
                    <span className="text-sm text-gray-700">WhatsApp</span>
                  </button>
                  <button
                    onClick={() => handleShare('facebook')}
                    className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <i className="ri-facebook-fill text-blue-600 text-xl"></i>
                    <span className="text-sm text-gray-700">Facebook</span>
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <i className="ri-twitter-fill text-blue-400 text-xl"></i>
                    <span className="text-sm text-gray-700">Twitter</span>
                  </button>
                  <button
                    onClick={() => handleShare('pinterest')}
                    className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <i className="ri-pinterest-fill text-red-600 text-xl"></i>
                    <span className="text-sm text-gray-700">Pinterest</span>
                  </button>
                  <button
                    onClick={copyLink}
                    className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border-t border-gray-200 mt-2 pt-3"
                  >
                    <i className="ri-link text-gray-600 text-xl"></i>
                    <span className="text-sm text-gray-700">Copiar link</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shipping Calculator */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mt-4">
        <label className="block text-sm font-semibold text-gray-900 mb-3">Calcular Frete e Prazo</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Digite seu CEP"
            value={cep}
            onChange={handleCepChange}
            className="flex-1 h-12 px-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-pink-600 text-sm"
            maxLength={9}
          />
          <button
            onClick={calculateFrete}
            disabled={calculatingFrete}
            className="sm:w-auto w-full h-12 px-6 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {calculatingFrete ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                Calculando...
              </>
            ) : (
              'Calcular'
            )}
          </button>
        </div>
        <p className="text-xs text-gray-700 mt-2">Toda loja com 10% de desconto no pagamento via Pix ou Dinheiro e Frete Grátis à partir de R$ 499,00</p>
        <a
          href="https://buscacepinter.correios.com.br/app/endereco/index.php"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-pink-600 hover:underline mt-2 inline-block cursor-pointer"
        >
          Não sei meu CEP
        </a>

        {/* Error Message */}
        {freteError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 flex items-center">
              <i className="ri-error-warning-line mr-2"></i>
              {freteError}
            </p>
          </div>
        )}

        {/* Shipping Results */}
        {freteResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {freteResults.map((option, index) => (
              <div
                key={index}
                className={`border rounded-lg p-3 transition-colors ${
                  option.isGratis ? 'bg-green-50 border-green-200 hover:border-green-300' : 'bg-white border-gray-200 hover:border-pink-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <i className={`${option.icon} ${option.isGratis ? 'text-green-600' : 'text-pink-600'} text-xl`}></i>
                    <div>
                      <p
                        className={`font-semibold text-sm ${option.isGratis ? 'text-green-700' : 'text-gray-900'}`}
                      >
                        {option.name}
                        {option.isGratis && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            GRÁTIS
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-600">
                        {option.isGratis
                          ? (option.days || '').replace(/^\s*\d+\s*dias?\s*úteis?\s*-\s*/i, '').replace(/^\s*1\s*dia\s*útil\s*-\s*/i, '').trim()
                          : `Entrega em ${option.days}`}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-semibold text-sm ${option.isGratis ? 'text-green-700' : 'text-gray-900'}`}
                  >
                    {option.isGratis ? 'GRÁTIS' : `R$ ${option.price.toFixed(2)}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Features */}
      <div className="border-t border-gray-200 pt-6 space-y-3">
        <div className="flex items-center space-x-3 text-gray-700">
          <i className="ri-truck-line text-pink-600 text-xl"></i>
          <span className="text-sm">Toda loja com 10% de desconto no pagamento via Pix ou Dinheiro e Frete Grátis à partir de R$ 499,00</span>
        </div>
        <div className="flex items-center space-x-3 text-gray-700">
          <i className="ri-arrow-left-right-line text-pink-600 text-xl"></i>
          <span className="text-sm">Troca grátis em até 30 dias</span>
        </div>
        <div className="flex items-center space-x-3 text-gray-700">
          <i className="ri-shield-check-line text-pink-600 text-xl"></i>
          <span className="text-sm">Compra 100% segura</span>
        </div>
      </div>

      {isSizeGuideOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsSizeGuideOpen(false)}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">Guia de tamanhos</h2>
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(false)}
                className="text-gray-500 hover:text-gray-700 cursor-pointer p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Fechar guia de tamanhos"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="w-full">
                <img
                  src="https://cproxdqrraiujnewbsvp.supabase.co/storage/v1/object/sign/semprebellaimg/Captura%20de%20tela%202025-10-26%20082436.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9kNWU3YWZhNC1kYmRlLTQ3YWQtOTE4NS0xZWNkY2RjZmI2OTciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzZW1wcmViZWxsYWltZy9DYXB0dXJhIGRlIHRlbGEgMjAyNS0xMC0yNiAwODI0MzYucG5nIiwiaWF0IjoxNzYxNDgxNzAyLCJleHAiOjMxNzA4OTk0NTcwMn0.QpBvRrUrDbQc9uGv7nTyVK4JgMH5t_-dXXwHaWTk59Q"
                  alt="Guia de tamanhos"
                  className="w-full h-auto object-contain"
                  loading="lazy"
                />
              </div>
              
              {/* Informações adicionais para mobile */}
              <div className="mt-6 sm:hidden">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Dicas importantes:</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start">
                      <i className="ri-checkbox-circle-line text-pink-600 mr-2 mt-0.5 flex-shrink-0"></i>
                      Meça sempre com o corpo relaxado
                    </li>
                    <li className="flex items-start">
                      <i className="ri-checkbox-circle-line text-pink-600 mr-2 mt-0.5 flex-shrink-0"></i>
                      Use uma fita métrica flexível
                    </li>
                    <li className="flex items-start">
                      <i className="ri-checkbox-circle-line text-pink-600 mr-2 mt-0.5 flex-shrink-0"></i>
                      Em caso de dúvida, escolha o tamanho maior
                    </li>
                    <li className="flex items-start">
                      <i className="ri-checkbox-circle-line text-pink-600 mr-2 mt-0.5 flex-shrink-0"></i>
                      Entre em contato conosco para mais informações
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
