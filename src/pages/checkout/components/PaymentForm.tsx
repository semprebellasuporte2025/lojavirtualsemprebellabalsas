import { useEffect } from 'react';
import type { PaymentData } from '../types.ts';

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
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Forma de Pagamento</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-3">
          <div className="flex items-center gap-4">
            {data.metodo !== 'cartao' && (
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="metodo"
                  checked={data.metodo === 'pix'}
                  onChange={() => handleMetodoChange('pix')}
                />
                <span>PIX</span>
              </label>
            )}
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

      {data.metodo === 'cartao' && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gray-50 text-gray-700 border border-gray-200">
            <p className="text-sm">
              Você selecionou pagamento com cartão. Os dados do cartão serão preenchidos na página segura do Mercado Pago após confirmar seu pedido.
            </p>
          </div>
        </div>
      )}

      <div className="p-4 rounded-lg bg-gray-50 text-gray-700 border border-gray-200">
        <p className="text-sm">
          Após confirmar, seu pedido será criado. Você poderá acompanhar em "Minha Conta". Pagamentos serão processados pelo método selecionado assim que configurarmos o provedor.
        </p>
      </div>

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
          className="w-full md:w-auto bg-pink-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-pink-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={false}
        >
          Continuar
        </button>
      </div>
    </form>
  );
}