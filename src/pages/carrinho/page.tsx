
import SEOHead from '../../components/feature/SEOHead';
import { useState } from 'react';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import CartItem from './components/CartItem';
import ShippingCalculator from './components/ShippingCalculator';
import CartSummary from './components/CartSummary';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';

export default function CarrinhoPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem } = useCart();
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingMethod, setShippingMethod] = useState('');

  const handleQuantityChange = (id: number, newQuantity: number) => {
    updateQuantity(id, newQuantity);
  };

  const handleRemove = (id: number) => {
    removeItem(id);
  };

  const handleShippingCalculated = (cost: number, method: string) => {
    setShippingCost(cost);
    setShippingMethod(method);
  };

  const handleFinalizePurchase = () => {
    if (shippingMethod) {
      navigate('/checkout', { state: { shippingCost, shippingMethod } });
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
                  {items.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemove}
                    />
                  ))}

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
