import type { CheckoutData, CheckoutStep } from '../types.ts';

interface ReviewStepProps {
  checkoutData: CheckoutData;
  onBack: () => void;
  onConfirm: () => void;
  isProcessing?: boolean;
  onEditStep?: (step: CheckoutStep) => void;
}

export default function ReviewStep({ checkoutData, onBack, onConfirm, isProcessing, onEditStep }: ReviewStepProps) {
  const { customer, shipping, payment } = checkoutData;
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Revisão do Pedido</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Dados do Cliente</h3>
            {onEditStep && (
              <button type="button" onClick={() => onEditStep('customer')} className="text-sm text-pink-600 hover:text-pink-700">Editar</button>
            )}
          </div>
          <p><span className="text-gray-600">Nome:</span> {customer.nome}</p>
          <p><span className="text-gray-600">CPF:</span> {customer.cpf}</p>
          <p><span className="text-gray-600">E-mail:</span> {customer.email}</p>
          <p><span className="text-gray-600">WhatsApp:</span> {customer.telefone}</p>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Entrega</h3>
            {onEditStep && (
              <button type="button" onClick={() => onEditStep('shipping')} className="text-sm text-pink-600 hover:text-pink-700">Editar</button>
            )}
          </div>
          <p><span className="text-gray-600">CEP:</span> {shipping.cep}</p>
          <p><span className="text-gray-600">Endereço:</span> {shipping.logradouro}, {shipping.numero}</p>
          {shipping.complemento && (
            <p><span className="text-gray-600">Complemento:</span> {shipping.complemento}</p>
          )}
          <p><span className="text-gray-600">Bairro:</span> {shipping.bairro}</p>
          <p><span className="text-gray-600">Cidade/UF:</span> {shipping.cidade}/{shipping.estado}</p>
        </div>

        <div className="border rounded-lg p-4 md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Pagamento</h3>
            {onEditStep && (
              <button type="button" onClick={() => onEditStep('payment')} className="text-sm text-pink-600 hover:text-pink-700">Editar</button>
            )}
          </div>
          {payment.metodo === 'cartao' ? (
            <>
              <p><span className="text-gray-600">Cartão:</span> **** **** **** {payment.numeroCartao?.slice(-4)}</p>
              <p><span className="text-gray-600">Titular:</span> {payment.nomeTitular}</p>
              <p><span className="text-gray-600">Validade:</span> {payment.validade}</p>
            </>
          ) : (
            <p><span className="text-gray-600">Método:</span> {payment.metodo.toUpperCase()}</p>
          )}
        </div>
      </div>

      {/* Mensagem de modo demonstração removida conforme solicitado */}

      {/* Ações principais: visíveis apenas em telas médias+ (mobile usa ações no resumo) */}
      <div className="hidden md:flex md:flex-row md:justify-between gap-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onBack}
          id="back-step-btn"
          className="w-full md:w-auto px-6 py-3 rounded-lg bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isProcessing}
          id="confirm-order-btn"
          className={`w-full md:w-auto px-8 py-3 rounded-lg font-medium transition-colors ${isProcessing ? 'bg-gray-400 text-gray-100 cursor-not-allowed' : 'bg-pink-600 text-white hover:bg-pink-700'}`}
        >
          {isProcessing ? 'Processando...' : 'Confirmar Pedido'}
        </button>
      </div>
    </div>
  );
}