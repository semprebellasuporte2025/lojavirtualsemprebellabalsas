
import SEOHead from '../../components/feature/SEOHead';
import { useState, useMemo } from 'react';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import CartItem from './components/CartItem';
import ShippingCalculator from './components/ShippingCalculator';
import CartSummary from './components/CartSummary';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useProductStock } from '../../hooks/useProductStock';

export default function CarrinhoPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem } = useCart();
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingMethod, setShippingMethod] = useState('');
  
  // Extrair IDs dos produtos para buscar estoque (usando useMemo para evitar loops)
  const productIds = useMemo(() => {
    return items.map(item => {
      // O ID do item no carrinho é composto por: produto|tamanho|cor
      // Precisamos extrair apenas o ID do produto
      const parts = item.id.split('|');
      return parts[0]; // Primeira parte é o ID do produto
    });
  }, [items]);
  
  const { stockInfo } = useProductStock(productIds);
  
  // Criar mapa de estoque por produto ID
  const stockMap = new Map<string, number>();
  stockInfo.forEach(info => {
    stockMap.set(info.productId, info.stock);
  });

  const handleQuantityChange = (id: string, newQuantity: number) => {
    // Extrair ID do produto para verificar estoque
    const productId = id.split('|')[0];
    const maxStock = stockMap.get(productId);
    
    console.log(`handleQuantityChange - ID: ${id}, Produto: ${productId}, Nova Qtd: ${newQuantity}, MaxStock: ${maxStock}`);
    
    // Validar se a nova quantidade não excede o estoque disponível
    if (maxStock !== undefined && newQuantity > maxStock) {
      console.log(`Tentativa de aumentar além do estoque. Definindo como ${maxStock}`);
      // Se tentar aumentar além do estoque, definir como estoque máximo
      updateQuantity(id, maxStock);
    } else if (newQuantity < 1) {
      console.log(`Tentativa de diminuir abaixo de 1. Definindo como 1`);
      // Não permitir quantidade menor que 1
      updateQuantity(id, 1);
    } else {
      console.log(`Quantidade válida. Atualizando para ${newQuantity}`);
      updateQuantity(id, newQuantity);
    }
  };

  const handleRemove = (id: string) => {
    removeItem(id);
  };

  const handleShippingCalculated = (cost: number, method: string) => {
    setShippingCost(cost);
    setShippingMethod(method);
  };

  const handleFinalizePurchase = (paymentMethod: string, appliedCoupon?: { nome: string; desconto_percentual: number }) => {
    if (shippingMethod) {
      navigate('/checkout', { state: { shippingCost, shippingMethod, paymentMethod, coupon: appliedCoupon } });
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>
      <SEOHead
        title="Carrinho de Compras - Sempre Bella Balsas"
        description="Finalize sua compra na Sempre Bella Balsas. Moda feminina com qualidade e estilo."
        noIndex={true}
      />
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold mb-2">Carrinho de Compras</h1>
            <p className="text-gray-600 mb-8">{items.length} itens no seu carrinho</p>

            {items.length === 0 ? (
              <div className="text-center py-16">
                <i className="ri-shopping-cart-line text-6xl text-gray-300 mb-4"></i>
                <p className="text-xl text-gray-600 mb-4">Seu carrinho está vazio</p>
                <button
                  onClick={() => navigate('/')}
                  className="bg-pink-600 text-white px-8 py-3 rounded-lg hover:bg-pink-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Continuar Comprando
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                  {items.map((item) => {
                    // Extrair ID do produto do item do carrinho
                    const productId = item.id.split('|')[0];
                    const maxStock = stockMap.get(productId);
                    
                    return (
                      <CartItem
                        key={item.id}
                        item={item}
                        onQuantityChange={handleQuantityChange}
                        onRemove={handleRemove}
                        maxStock={maxStock}
                      />
                    );
                  })}

                  <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-arrow-left-line"></i>
                    Continuar Comprando
                  </button>
                </div>

                {/* Summary */}
                <div className="space-y-6">
                  <ShippingCalculator 
                    onShippingCalculated={handleShippingCalculated} 
                    subtotal={subtotal}
                  />
                  {/* Botão Mercado Pago removido aqui; agora aparece dentro do CartSummary no lugar de "Finalizar Compra" */}
                  <CartSummary
                    subtotal={subtotal}
                    shipping={{ price: shippingCost, name: shippingMethod }}
                    onFinalizePurchase={handleFinalizePurchase}
                  />
                </div>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
