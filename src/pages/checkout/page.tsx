
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/useToast';
import Header from '@/components/feature/Header';
import Footer from '@/components/feature/Footer';
import SEOHead from '@/components/feature/SEOHead';
import CheckoutForm from './components/CheckoutForm';
import OrderSummary from './components/OrderSummary';
import LoadingSpinner from '@/components/base/LoadingSpinner';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { items, clearCart } = useCart();
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);

  // Redirecionar se não estiver logado
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('[Checkout] Usuário não autenticado. Enviando para login com from=/checkout', {
        cartItems: items.length,
        currentPath: window.location.pathname,
      });
      showToast('Você precisa estar logado para finalizar a compra', 'info');
      navigate('/auth/login', { state: { from: '/checkout' } });
    }
  }, [user, authLoading, navigate, showToast]);

  // Redirecionar se o carrinho estiver vazio
  useEffect(() => {
    if (!authLoading && user && items.length === 0 && !orderCompleted) {
      navigate('/carrinho');
    }
  }, [items, user, authLoading, navigate, showToast, orderCompleted]);

  const handleOrderSuccess = () => {
    setIsProcessing(false);
    setOrderCompleted(true);
    clearCart();
    // Limpar dados auxiliares após pedido
    try {
      localStorage.removeItem('checkout-state');
      localStorage.removeItem('last-cart-cep');
    } catch {}
    showToast('Pedido realizado com sucesso!', 'success');
    navigate('/minha-conta');
  };

  const handleOrderError = (error: string) => {
    setIsProcessing(false);
    showToast(error, 'error');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || items.length === 0) {
    return null;
  }

  return (
    <>
      <SEOHead
        title="Finalizar Compra - Sempre Bella Balsas"
        description="Finalize sua compra na Sempre Bella Balsas. Moda feminina com qualidade e estilo."
        noIndex={true}
      />
      
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">
                Finalizar Compra
              </h1>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulário de Dados */}
                <div className="lg:col-span-2">
                  <CheckoutForm
                    user={user}
                    onSuccess={handleOrderSuccess}
                    onError={handleOrderError}
                    isProcessing={isProcessing}
                    setIsProcessing={setIsProcessing}
                  />
                </div>
                
                {/* Resumo do Pedido */}
                <div className="lg:col-span-1">
                  <OrderSummary />
                </div>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
}
