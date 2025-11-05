
import { useState } from 'react';

interface CartSummaryProps {
  subtotal: number;
  shipping: any;
  onFinalizePurchase: (paymentMethod: string) => void;
}

export default function CartSummary({ subtotal, shipping, onFinalizePurchase }: CartSummaryProps) {
  const [couponCode, setCouponCode] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('pix');

  const shippingCost = typeof shipping?.price === 'number' ? shipping.price : null;
  const shippingMethod = shipping?.name || '';

  const isShippingSelected = !!shippingMethod;

  const discount = selectedPaymentMethod === 'pix' ? subtotal * 0.1 : 0;
  const total = subtotal + (shippingCost ?? 0) - discount;

  const handleFinalize = () => {
    if (isShippingSelected) {
      onFinalizePurchase(selectedPaymentMethod);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold mb-4">Resumo do Pedido</h3>

      {/* Forma de Pagamento */}
      <div className="mb-6">
        <h4 className="text-md font-semibold mb-3">Forma de Pagamento</h4>
        
        <div className="space-y-3">
          {/* PIX primeiro */}
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="payment"
              value="pix"
              checked={selectedPaymentMethod === 'pix'}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="mr-3"
            />
            <i className="ri-qr-code-line text-xl mr-3 text-gray-600"></i>
            <div>
              <div className="font-medium">PIX</div>
              <div className="text-sm text-gray-600">10% de desconto - Aprovação imediata</div>
            </div>
          </label>

          {/* Cartão de Crédito */}
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="payment"
              value="credit"
              checked={selectedPaymentMethod === 'credit'}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="mr-3"
            />
            <i className="ri-bank-card-line text-xl mr-3 text-gray-600"></i>
            <div>
              <div className="font-medium">Cartão de Crédito</div>
              <div className="text-sm text-gray-600">Parcelamento em até 6x</div>
            </div>
          </label>

          {/* Dinheiro */}
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="payment"
              value="dinheiro"
              checked={selectedPaymentMethod === 'dinheiro'}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="mr-3"
            />
            <i className="ri-money-dollar-circle-line text-xl mr-3 text-gray-600"></i>
            <div>
              <div className="font-medium">Dinheiro</div>
              <div className="text-sm text-gray-600">Pagamento na entrega</div>
            </div>
          </label>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {/* Subtotal */}
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
        </div>

        {/* Frete */}
        <div className="flex justify-between text-gray-600">
          <span>Frete {shippingMethod && `(${shippingMethod})`}</span>
          <span>
            {isShippingSelected
              ? (shippingCost === 0 ? 'GRÁTIS' : `R$ ${shippingCost!.toFixed(2).replace('.', ',')}`)
              : 'A calcular'}
          </span>
        </div>

        {/* Desconto (se houver) */}
        <div className="flex justify-between text-green-600">
          <span>Desconto</span>
          <span>- R$ {discount.toFixed(2).replace('.', ',')}</span>
        </div>

        <hr className="border-gray-200" />

        {/* Total */}
        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>R$ {total.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>

      {/* Cupom de Desconto */}
      <div className="mb-6">
        <label className="block text_sm font-medium text-gray-700 mb-2">
          Cupom de Desconto
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Digite o código"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
          />
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap text-sm">
            Aplicar
          </button>
        </div>
      </div>

      {/* Botão Finalizar */}
      <button
        onClick={handleFinalize}
        disabled={!isShippingSelected}
        className={`w-full py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
          isShippingSelected
            ? 'bg-pink-600 text-white hover:bg-pink-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        Finalizar Compra
      </button>

      {!isShippingSelected && (
        <p className="text-sm text-gray-500 text-center mt-2">
          Calcule o frete para continuar
        </p>
      )}

      {/* Informações de Segurança */}
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
