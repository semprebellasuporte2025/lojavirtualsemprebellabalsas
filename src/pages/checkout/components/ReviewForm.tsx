import type { CheckoutData } from '../types.ts';

interface ReviewFormProps {
  data: CheckoutData;
  onBack: () => void;
  onConfirm: () => void;
  processing?: boolean;
}

export default function ReviewForm({ data, onBack, onConfirm, processing }: ReviewFormProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Revisão do Pedido</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Dados do Cliente</h3>
          <p><span className="text-gray-600">Nome:</span> {data.customer.nome}</p>
          <p><span className="text-gray-600">CPF:</span> {data.customer.cpf}</p>
          <p><span className="text-gray-600">E-mail:</span> {data.customer.email}</p>
          <p><span className="text-gray-600">WhatsApp:</span> {data.customer.telefone}</p>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Entrega</h3>
          <p><span className="text-gray-600">CEP:</span> {data.shipping.cep}</p>
          <p><span className="text-gray-600">Endereço:</span> {data.shipping.logradouro}, {data.shipping.numero}</p>
          {data.shipping.complemento && (
            <p><span className="text-gray-600">Complemento:</span> {data.shipping.complemento}</p>
          )}
          <p><span className="text-gray-600">Bairro:</span> {data.shipping.bairro}</p>
          <p><span className="text-gray-600">Cidade/UF:</span> {data.shipping.cidade}/{data.shipping.estado}</p>
        </div>

        <div className="border rounded-lg p-4 md:col-span-2">
          <h3 className="font-semibold mb-2">Pagamento</h3>
          {data.payment.metodo === 'cartao' ? (
            <>
              <p><span className="text-gray-600">Cartão:</span> **** **** **** {data.payment.numeroCartao?.slice(-4)}</p>
              <p><span className="text-gray-600">Titular:</span> {data.payment.nomeTitular}</p>
              <p><span className="text-gray-600">Validade:</span> {data.payment.validade}</p>
            </>
          ) : (
            <p><span className="text-gray-600">Método:</span> {data.payment.metodo.toUpperCase()}</p>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-500">Modo demonstração. Nenhum pagamento real será processado.</p>

      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={processing}
          className={`px-8 py-3 rounded-lg font-medium transition-colors ${processing ? 'bg-gray-400 text-gray-100 cursor-not-allowed' : 'bg-pink-600 text-white hover:bg-pink-700'}`}
        >
          {processing ? 'Processando...' : 'Confirmar Pedido'}
        </button>
      </div>
    </div>
  );
}