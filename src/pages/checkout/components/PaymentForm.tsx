import { useEffect } from 'react';
import type { PaymentData } from '../types.ts';
// Checkout Pro não precisa dos campos do cartão no site
// Mantemos imports mínimos sem validações locais de cartão

interface PaymentFormProps {
  data: PaymentData;
  onChange: (data: Partial<PaymentData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function PaymentForm({ data, onChange, onNext, onBack }: PaymentFormProps) {
  // Persistir método de pagamento escolhido
  useEffect(() => {
    try {
      if (data?.metodo) localStorage.setItem('last-payment-method', data.metodo);
    } catch {}
  }, [data?.metodo]);

  const handleMetodoChange = (metodo: PaymentData['metodo']) => {
    onChange({ metodo });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Sem validação de cartão: Checkout Pro lida com o pagamento
    onNext();
  };

  const isValid = () => true;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Forma de Pagamento</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-3">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="metodo"
                checked={data.metodo === 'pix'}
                onChange={() => handleMetodoChange('pix')}
              />
              <span>PIX</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="metodo"
                checked={data.metodo === 'cartao'}
                onChange={() => handleMetodoChange('cartao')}
              />
              <span>Cartão de Crédito</span>
            </label>
          </div>
        </div>
      </div>

      {data.metodo === 'cartao' ? (
        <div className="p-4 rounded-lg bg-gray-50 text-gray-700 border border-gray-200">
          <p className="text-sm">
            Pagamento via Mercado Pago (Checkout Pro). Serão exibidas apenas as opções Pix,
            Cartão de Crédito e pagamento pelo app.
          </p>
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-gray-50 text-gray-700 border border-gray-200">
          <p className="text-sm">
            Pagamento via PIX com 10% de desconto nos produtos. Após confirmar, seu pedido será criado e você poderá acompanhar em "Minha Conta".
          </p>
        </div>
      )}

      {/* Mensagem de modo demonstração removida conforme solicitado */}

      <div className="flex flex-col-reverse md:flex-row md:justify-between gap-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onBack}
          className="w-full md:w-auto px-6 py-3 rounded-lg bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200"
        >
          Voltar
        </button>
        <button
          type="submit"
          disabled={!isValid()}
          className="w-full md:w-auto bg-pink-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-pink-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Continuar
        </button>
      </div>
    </form>
  );
}