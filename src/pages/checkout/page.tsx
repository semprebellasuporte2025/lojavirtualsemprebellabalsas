
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import LoginModal from './components/LoginModal';
import CheckoutForm from './components/CheckoutForm';
import SEOHead from '../../components/feature/SEOHead';
import { useLocation } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';

interface CartItemType {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  size: string;
  color: string;
  material?: string;
  quantity: number;
}

export default function CheckoutPage() {
  const location = useLocation();
  const { user, loading } = useAuth();
  const { items } = useCart();
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Itens do carrinho vindos da store
  const cartItems: CartItemType[] = items as CartItemType[];
  // Frete vindo da navegação (fallbacks: custo 0 e método "A definir")
  const navState = location.state as { shippingCost?: number; shippingMethod?: string; coupon?: { nome: string; desconto_percentual: number } } | undefined;
  const shippingData = {
    cost: navState?.shippingCost ?? 0,
    method: navState?.shippingMethod ?? 'A definir'
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const couponDiscount = navState?.coupon ? subtotal * ((Number(navState.coupon.desconto_percentual) || 0) / 100) : 0;
  const total = subtotal + shippingData.cost - couponDiscount;

  // Submissão e toasts são tratados dentro de CheckoutForm

  if (loading) {
    return (
      <>
        <SEOHead
          title="Finalizar Compra - Sempre Bella Balsas"
          description="Complete seu pedido na Sempre Bella Balsas de forma segura e rápida."
          noIndex={true}
        />
        <div className="min-h-screen bg_white flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead
        title="Finalizar Compra - Sempre Bella Balsas"
        description="Complete seu pedido na Sempre Bella Balsas de forma segura e rápida."
        noIndex={true}
      />
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
            <a href="/" className="hover:text-pink-600 cursor-pointer">Início</a>
            <i className="ri-arrow-right-s-line"></i>
            <a href="/carrinho" className="hover:text-pink-600 cursor-pointer">Carrinho</a>
            <i className="ri-arrow-right-s-line"></i>
            <span className="text-gray-900 font-medium">Finalizar Compra</span>
          </nav>

          {user ? (
            <CheckoutForm 
              cartItems={cartItems}
              subtotal={subtotal}
              shippingData={shippingData}
              total={total}
              coupon={navState?.coupon}
            />
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 flex items-center justify_center bg-pink-100 rounded-full">
                <i className="ri-user-line text-4xl text-pink-600"></i>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Faça login para continuar</h2>
              <p className="text-gray-600 mb-8">Você precisa estar logado para finalizar sua compra</p>
              <button
                onClick={() => setShowLoginModal(true)}
                className="inline-flex items-center px-6 py-3 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 transition-colors whitespace-nowrap cursor-pointer"
              >
                <i className="ri-login-box-line mr-2"></i>
                Fazer Login
              </button>
            </div>
          )}
        </div>

        {showLoginModal && (
          <LoginModal 
            onClose={() => setShowLoginModal(false)}
          />
        )}

        <Footer />
      </div>
    </>
  );
}
