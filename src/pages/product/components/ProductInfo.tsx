
import { useState, useRef, useEffect } from 'react';
import Button from '../../../components/base/Button';
import { useToast } from '../../../hooks/useToast';
import { supabase } from '../../../lib/supabase';

interface ProductInfoProps {
  produto: any;
  onAddToCart?: (item: any) => void;
}

export default function ProductInfo({ produto, onAddToCart }: ProductInfoProps) {
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [combinations, setCombinations] = useState<{ size: string; color: string }[]>([]);
  const [validationMsg, setValidationMsg] = useState<string>('');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [cep, setCep] = useState('');
  const [freteResults, setFreteResults] = useState<any[]>([]);
  const [calculatingFrete, setCalculatingFrete] = useState(false);
  const [freteError, setFreteError] = useState('');
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [highlightSize, setHighlightSize] = useState(false);
  const sizeSectionRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Estado para estoque real do Supabase
  const [variantesState, setVariantesState] = useState<any[]>(Array.isArray(produto?.variantes_produto) ? produto?.variantes_produto : []);
  const [productStock, setProductStock] = useState<number>(Number(produto?.estoque ?? 0));
  const [loadingStock, setLoadingStock] = useState<boolean>(false);
  const [stockError, setStockError] = useState<string>('');

  // Busca inicial e assinatura em tempo real do estoque
  useEffect(() => {
    if (!produto?.id) return;

    const refreshStock = async () => {
      try {
        setLoadingStock(true);
        setStockError('');

        const { data: variantsData, error: vError } = await supabase
          .from('variantes_produto')
          .select('id, tamanho, cor, cor_hex, estoque, ativo')
          .eq('produto_id', produto.id);

        if (vError) throw vError;
        setVariantesState(Array.isArray(variantsData) ? variantsData : []);

        const { data: productData, error: pError } = await supabase
          .from('produtos')
          .select('estoque')
          .eq('id', produto.id)
          .maybeSingle();

        if (pError) throw pError;
        setProductStock(Number(productData?.estoque ?? 0));
      } catch (err: any) {
        console.error('Erro ao consultar estoque no Supabase:', err);
        setStockError('Falha ao consultar estoque');
      } finally {
        setLoadingStock(false);
      }
    };

    // Consulta inicial
    refreshStock();

    // Assinaturas em tempo real (variantes e produto)
    const channel = supabase
      .channel(`realtime:produto_estoque:${produto.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'variantes_produto', filter: `produto_id=eq.${produto.id}` },
        (payload: any) => {
          try {
            setVariantesState((prev: any[]) => {
              const list = Array.isArray(prev) ? [...prev] : [];
              if (payload.eventType === 'INSERT') {
                return [...list, payload.new];
              }
              if (payload.eventType === 'UPDATE') {
                return list.map((v) => (v.id === payload.new.id ? payload.new : v));
              }
              if (payload.eventType === 'DELETE') {
                return list.filter((v) => v.id !== payload.old.id);
              }
              return list;
            });
          } catch (e) {
            console.error('Erro ao aplicar atualização de variante:', e);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'produtos', filter: `id=eq.${produto.id}` },
        (payload: any) => {
          setProductStock(Number(payload.new?.estoque ?? 0));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [produto?.id]);

  // Derivar cores e tamanhos a partir das variantes do produto (estado em tempo real)
  const variantes: any[] = Array.isArray(variantesState) ? variantesState : [];
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

  // Estoque por combinação (tamanho|cor)
  const variantStockMap: Record<string, number> = (() => {
    const map: Record<string, number> = {};
    variantes.forEach(v => {
      const key = `${String(v.tamanho)}|${String(v.cor).toLowerCase()}`;
      map[key] = Number(v?.estoque ?? 0);
    });
    return map;
  })();

  // Corrigir comparação de cores - normalizar para evitar problemas de case sensitivity
  const selectedVariant = variantes.find(v => 
    v.tamanho === selectedSize && 
    v.cor?.toLowerCase() === selectedColor?.toLowerCase()
  );
  // Calcular estoque disponível
  const aggregatedStock = variantes.reduce((acc, v) => acc + Number(v?.estoque ?? 0), 0);
  const fallbackStock = (typeof productStock === 'number' && productStock > 0) ? productStock : aggregatedStock;
  const stock = selectedVariant ? Number(selectedVariant?.estoque ?? 0) : fallbackStock;
  // Estoque máximo permitido para compra (agregado quando em modo múltiplo)
  const maxPurchaseStock = fallbackStock;
  const stockForQuantityControl = (quantity > 1) ? maxPurchaseStock : stock;

  useEffect(() => {
    if (coresFromVariantes.length === 1) {
      setSelectedColor(coresFromVariantes[0].name);
    }
    if (sizesFromVariantes.length === 1) {
      setSelectedSize(sizesFromVariantes[0]);
    }
  }, [coresFromVariantes, sizesFromVariantes]);

  // Garantir que o número de combinações não ultrapasse a quantidade
  useEffect(() => {
    if (combinations.length > quantity) {
      setCombinations(prev => prev.slice(0, quantity));
    }
  }, [quantity]);

  // Validação em tempo real das regras de seleção
  useEffect(() => {
    const isMultiple = quantity > 1;
    if (!isMultiple) {
      if (!selectedSize || !selectedColor) {
        setValidationMsg('Selecione cor e tamanho antes de adicionar ao carrinho.');
        setHighlightSize(true);
      } else {
        setValidationMsg('');
        setHighlightSize(false);
      }
      return;
    }

    // Em modo múltiplo, não bloquear quando faltarem combinações:
    // completaremos com a última seleção no momento de adicionar ao carrinho.

    const counts: Record<string, number> = {};
    combinations.forEach(c => {
      const key = `${c.size}|${c.color.toLowerCase()}`;
      counts[key] = (counts[key] ?? 0) + 1;
    });
    // Bloqueia se alguma combinação exceder seu estoque específico
    const overStock = Object.entries(counts).find(([key, qty]) => {
      const available = variantStockMap[key];
      return typeof available === 'number' ? qty > available : true; // true quando combinação inexiste
    });
    if (overStock) {
      setValidationMsg('Quantidade excede o estoque disponível (ou combinação indisponível).');
      return;
    }

    setValidationMsg('');
  }, [selectedSize, selectedColor, combinations, quantity, stock]);

  // Limpar destaque ao escolher cor e tamanho
  useEffect(() => {
    if (selectedSize && selectedColor) {
      setHighlightSize(false);
    }
  }, [selectedSize, selectedColor]);

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
    const isMultiple = quantity > 1;
    if (!isMultiple) {
      if (!selectedSize || !selectedColor) {
        setValidationMsg('Selecione cor e tamanho antes de adicionar ao carrinho.');
        setHighlightSize(true);
        return;
      }
      if (onAddToCart) {
        const itemId = `${product.id}|${selectedSize}|${String(selectedColor).toLowerCase()}`;
        onAddToCart({
          id: itemId,
          name: product.name,
          price: product.price,
          image: product.images[0],
          quantity,
          size: selectedSize,
          color: selectedColor,
          material: produto?.material || undefined
        });
        showToast('Produto adicionado ao carrinho!', 'success');
      }
      return;
    }

    // Múltiplas combinações: completar automaticamente com a última seleção quando necessário
    let combosToUse: { size: string; color: string }[] = [...combinations];
    if (combosToUse.length < quantity) {
      const fallbackBase = (selectedSize && selectedColor)
        ? { size: selectedSize, color: selectedColor }
        : (combosToUse.length > 0 ? combosToUse[combosToUse.length - 1] : null);

      if (!fallbackBase) {
        setValidationMsg('Selecione cor e tamanho para completar a quantidade.');
        setHighlightSize(true);
        return;
      }

      const baseKey = `${fallbackBase.size}|${String(fallbackBase.color).toLowerCase()}`;
      const baseAvailable = variantStockMap[baseKey];
      if (baseAvailable === undefined) {
        setValidationMsg('Combinação indisponível para este produto.');
        return;
      }

      const currentCount = combosToUse.filter(c => `${c.size}|${c.color.toLowerCase()}` === baseKey).length;
      const remainingSlots = quantity - combosToUse.length;
      const canDuplicate = Math.max(0, Math.min(remainingSlots, baseAvailable - currentCount));
      for (let i = 0; i < canDuplicate; i++) {
        combosToUse.push({ size: fallbackBase.size, color: fallbackBase.color });
      }

      if (combosToUse.length < quantity) {
        setValidationMsg('Estoque insuficiente para completar a quantidade desejada.');
        return;
      }
    }

    if (onAddToCart) {
      const aggregated: Record<string, { size: string; color: string; qty: number }> = {};
      combosToUse.forEach(c => {
        const key = `${c.size}|${c.color.toLowerCase()}`;
        if (!aggregated[key]) aggregated[key] = { size: c.size, color: c.color, qty: 0 };
        aggregated[key].qty += 1;
      });

      Object.values(aggregated).forEach(({ size, color, qty }) => {
        const itemId = `${product.id}|${size}|${color.toLowerCase()}`;
        onAddToCart({
          id: itemId,
          name: product.name,
          price: product.price,
          image: product.images[0],
          quantity: qty,
          size,
          color,
          material: produto?.material || undefined
        });
      });

      showToast('Itens adicionados ao carrinho!', 'success');
    }
  };

  // handleAddCombination removido: agora o fluxo de seleção e preenchimento
  // acontece automaticamente em tryAutoAddCombination e na finalização em handleAddToCart.

  // Adiciona automaticamente a combinação ao selecionar cor/tamanho quando quantidade > 1
  const tryAutoAddCombination = (nextSize?: string, nextColor?: string) => {
    if (quantity <= 1) return;
    const size = nextSize ?? selectedSize;
    const color = (nextColor ?? selectedColor);
    if (!size && !color) return;

    if (combinations.length >= quantity) {
      setValidationMsg('Você já adicionou todas as combinações necessárias.');
      return;
    }

    const key = `${size}|${String(color).toLowerCase()}`;
    const currentCount = combinations.filter(c => `${c.size}|${c.color.toLowerCase()}` === key).length;
    const available = variantStockMap[key];
    if (available === undefined) {
      setValidationMsg('Combinação indisponível para este produto.');
      return;
    }
    if (currentCount + 1 > available) {
      setValidationMsg('Estoque insuficiente para esta combinação.');
      return;
    }

    setCombinations(prev => [...prev, { size, color }]);
    setValidationMsg('');
  };

  const handleSelectSize = (size: string) => {
    setSelectedSize(size);
    tryAutoAddCombination(size, undefined);
  };

  const handleSelectColor = (colorName: string) => {
    setSelectedColor(colorName);
    // Ao selecionar a cor, se já houver tamanho selecionado e quantidade > 1,
    // adiciona automaticamente a combinação respeitando estoque e quantidade.
    tryAutoAddCombination(undefined, colorName);
  };

  // handleRemoveCombination removido: não há UI para remoção manual de combinações.

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
          {loadingStock && (
            <span className="text-gray-600 text-sm flex items-center gap-1" title="Atualizando estoque">
              <i className="ri-loader-4-line animate-spin"></i> atualizando
            </span>
          )}
          {!loadingStock && stockError && (
            <span className="text-red-600 text-sm flex items-center gap-1" title="Erro ao verificar estoque">
              <i className="ri-alert-line"></i> erro de conexão
            </span>
          )}
          {!loadingStock && !stockError && (
            <span className="text-gray-500 text-sm flex items-center gap-1" title="Estoque em tempo real">
              <i className="ri-database-2-line"></i> realtime
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
                  onClick={() => handleSelectColor(color.name)}
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
              onClick={() => handleSelectSize(size)}
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
        {quantity > 2 && (
          <p className="mt-3 text-xs text-gray-600">
            Quantidade maior que 2: selecione até {quantity} combinações (Cor + Tamanho).
            Se selecionar menos, completaremos com a sua última escolha ao adicionar ao carrinho.
          </p>
        )}
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
                disabled={quantity >= stockForQuantityControl || stockForQuantityControl === 1}
              >
                <i className="ri-add-line text-xl"></i>
              </button>
            </div>
            {(quantity > 1 ? maxPurchaseStock : stock) > 1 && (
              <span className="text-sm text-gray-600">{quantity > 1 ? maxPurchaseStock : stock} unidades disponíveis</span>
            )}
            {(quantity > 1 ? maxPurchaseStock : stock) === 1 && (
              <span className="text-sm text-orange-600 font-medium">Última unidade disponível</span>
            )}
            {(quantity > 1 ? maxPurchaseStock : stock) === 0 && (
              <span className="text-sm text-red-600">Produto esgotado</span>
            )}
          </div>
      </div>

      {/* Combinações selecionadas (visualização apenas) */}
      {quantity > 1 && combinations.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-gray-900">
              Combinações selecionadas ({combinations.length}/{quantity})
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {combinations.map((combo, index) => (
              <div
                key={index}
                className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700"
              >
                {combo.size} - {combo.color}
              </div>
            ))}
          </div>
          {combinations.length < quantity && (
            <p className="text-xs text-gray-600 mt-2">
              {quantity - combinations.length} combinação(ões) serão completadas automaticamente com sua última escolha ao adicionar ao carrinho.
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3 pt-4">
        <Button variant="primary" size="lg" className="w-full" onClick={handleAddToCart} disabled={Boolean(validationMsg)}>
          <i className="ri-shopping-cart-line mr-2 text-xl"></i>
          Adicionar ao Carrinho
        </Button>

        {validationMsg && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            <i className="ri-information-line mr-1"></i>
            {validationMsg}
          </div>
        )}

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
            className="flex-1 h-[280px] sm:h-14 px-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-pink-600 text-lg"
            maxLength={9}
          />
          <button
            onClick={calculateFrete}
            disabled={calculatingFrete}
            className="sm:w-auto w-full h-14 px-6 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
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
                  src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&h=600&fit=crop"
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
