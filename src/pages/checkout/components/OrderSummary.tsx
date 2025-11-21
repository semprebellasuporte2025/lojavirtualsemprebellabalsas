import { useMemo } from 'react';
import { useCart } from '@/hooks/useCart';

export default function OrderSummary() {
  const { items, paymentMethod } = useCart();

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const totalItems = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const pixDiscount = paymentMethod === 'pix' ? subtotal * 0.10 : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold mb-4">Resumo do Pedido</h3>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-gray-600">
          <span>Itens</span>
          <span>{totalItems}</span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span>Frete</span>
          <span>A calcular</span>
        </div>

        {pixDiscount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Desconto PIX (10%)</span>
            <span>- R$ {pixDiscount.toFixed(2).replace('.', ',')}</span>
          </div>
        )}

        <div className="flex justify-between text-gray-600">
          <span>Pagamento</span>
          <span>{paymentMethod === 'cartao' ? 'Cartão de Crédito' : 'PIX'}</span>
        </div>

        <hr className="border-gray-200" />

        <div className="flex justify-between text-lg font-semibold">
          <span>Total a Pagar</span>
          <span>R$ {(subtotal - pixDiscount).toFixed(2).replace('.', ',')}</span>
        </div>

        {/* Ações (mobile): posicionadas entre Total e garantias */}
        <div className="md:hidden flex flex-col-reverse gap-3 mt-4">
          <button
            type="button"
            onClick={() => typeof window !== 'undefined' && document.getElementById('back-step-btn')?.click()}
            className="w-full px-6 py-3 rounded-lg bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={() => typeof window !== 'undefined' && document.getElementById('confirm-order-btn')?.click()}
            className="w-full bg-pink-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-pink-700 transition-colors"
          >
            Confirmar Pedido
          </button>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <i className="ri-shield-check-line text-green-600"></i>
          <span>Compra 100% segura</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <i className="ri-truck-line text-blue-600"></i>
          <span>Entrega garantida</span>
        </div>
      </div>
    </div>
  );
}