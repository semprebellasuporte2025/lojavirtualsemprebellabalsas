import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase, ensureSession } from '../../../lib/supabase';

export default function CheckoutErroPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const message = params.get('message') || '';
  const status = params.get('status') || params.get('collection_status') || 'rejected';
  const paymentId = params.get('payment_id') || params.get('collection_id') || '';
  const preferenceId = params.get('preference_id') || '';

  // Persistir status cancelado no pedido
  useEffect(() => {
    const persistStatus = async () => {
      const numeroPedido = localStorage.getItem('last_order_numero_pedido');
      if (!numeroPedido) return;

      try {
        await ensureSession();

        const note = `[MercadoPago] status=${status}; payment_id=${paymentId}; preference_id=${preferenceId}; message=${message}; at=${new Date().toISOString()}`;

        const { data: pedido, error: fetchErr } = await supabase
          .from('pedidos')
          .select('id, observacoes')
          .eq('numero_pedido', numeroPedido)
          .maybeSingle();

        if (fetchErr) return;

        const existingObs = (pedido?.observacoes || '').toString();
        const newObs = existingObs ? `${existingObs}\n${note}` : note;

        await supabase
          .from('pedidos')
          .update({ status: 'cancelado', observacoes: newObs })
          .eq('numero_pedido', numeroPedido);
      } catch (_) {
      } finally {
        try { localStorage.removeItem('last_order_numero_pedido'); } catch (_) {}
      }
    };

    void persistStatus();
  }, [message, status, paymentId, preferenceId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <i className="ri-alert-line text-2xl text-red-600 mr-2" aria-hidden="true"></i>
            <h1 className="text-2xl font-semibold text-gray-900">Pagamento não concluído</h1>
          </div>
          <p className="text-gray-700 mb-6">Seu pagamento não foi aprovado ou ocorreu um erro.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
            {paymentId && (
              <div>
                <span className="font-medium text-gray-800">ID do pagamento:</span>
                <div className="mt-1">{paymentId}</div>
              </div>
            )}
            {status && (
              <div>
                <span className="font-medium text-gray-800">Status:</span>
                <div className="mt-1 capitalize">{status}</div>
              </div>
            )}
            {preferenceId && (
              <div>
                <span className="font-medium text-gray-800">Preferência:</span>
                <div className="mt-1">{preferenceId}</div>
              </div>
            )}
            {message && (
              <div className="sm:col-span-2">
                <span className="font-medium text-gray-800">Mensagem:</span>
                <div className="mt-1">{message}</div>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/checkout')}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
            >
              Tentar novamente
            </button>
            <button
              onClick={() => navigate('/home')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Voltar à Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}