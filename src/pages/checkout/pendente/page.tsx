import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase, ensureSession } from '../../../lib/supabase';

export default function CheckoutPendentePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const status = params.get('status') || params.get('collection_status') || 'pending';
  const paymentId = params.get('payment_id') || params.get('collection_id') || '';
  const preferenceId = params.get('preference_id') || '';

  const [pixInfo, setPixInfo] = useState<{ qr_code?: string | null; qr_code_base64?: string | null; ticket_url?: string | null } | null>(null);
  const [copyMsg, setCopyMsg] = useState<string>('');

  const resolvedPaymentId = useMemo(() => {
    if (paymentId) return paymentId;
    try {
      const raw = localStorage.getItem('last_pix_payment');
      if (!raw) return '';
      const obj = JSON.parse(raw);
      return String(obj?.id || '');
    } catch (_) { return ''; }
  }, [paymentId]);

  useEffect(() => {
    const persistStatus = async () => {
      const numeroPedido = localStorage.getItem('last_order_numero_pedido');
      if (!numeroPedido) return;

      try {
        await ensureSession();

        const note = `[MercadoPago] status=${status}; payment_id=${paymentId}; preference_id=${preferenceId}; at=${new Date().toISOString()}`;

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
          .update({ status: 'pendente', observacoes: newObs })
          .eq('numero_pedido', numeroPedido);
      } catch (_) {
      } finally {
        try { localStorage.removeItem('last_order_numero_pedido'); } catch (_) {}
      }
    };

    void persistStatus();
  }, [status, paymentId, preferenceId]);

  // Carregar dados Pix salvos no localStorage para exibição (QR e link)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('last_pix_payment');
      if (!raw) return;
      const obj = JSON.parse(raw);
      if (obj?.pix) setPixInfo(obj.pix);
    } catch (_) {}
  }, []);

  // Polling de status do pagamento para redirecionar automaticamente quando aprovado
  useEffect(() => {
    let stop = false;
    let interval: any;
    const poll = async () => {
      if (!resolvedPaymentId) return;
      try {
        const { data, error } = await supabase.functions.invoke('mercado-pago-status', {
          body: { payment_id: resolvedPaymentId },
        });
        if (error) return;
        const res = data as any;
        if (res?.status === 'approved') {
          stop = true;
          try { localStorage.removeItem('last_pix_payment'); } catch (_) {}
          navigate('/minha-conta');
        }
      } catch (_) {}
    };
    interval = setInterval(() => { if (!stop) void poll(); }, 5000);
    return () => { stop = true; try { clearInterval(interval); } catch (_) {} };
  }, [resolvedPaymentId, navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <i className="ri-time-line text-2xl text-yellow-600 mr-2" aria-hidden="true"></i>
            <h1 className="text-2xl font-semibold text-gray-900">Pagamento pendente</h1>
          </div>
          <p className="text-gray-700 mb-6">Estamos aguardando a confirmação do seu pagamento.</p>

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
          </div>

          {/* Bloco Pix: QR code e link de pagamento */}
          {pixInfo && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Pague via Pix</h2>
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* QR code */}
                <div>
                  {pixInfo.qr_code_base64 ? (
                    <img
                      src={`data:image/png;base64,${pixInfo.qr_code_base64}`}
                      alt="QR Code Pix"
                      width={220}
                      height={220}
                      className="border rounded"
                    />
                  ) : (
                    <p className="text-sm text-gray-600">QR code indisponível. Use o link abaixo.</p>
                  )}
                </div>
                {/* Ações: copiar chave e abrir link */}
                <div className="flex-1">
                  {pixInfo.qr_code && (
                    <div className="mb-3">
                      <span className="block text-sm font-medium text-gray-800 mb-1">Chave Pix (copia e cola)</span>
                      <div className="p-3 border rounded break-all text-sm text-gray-700 bg-gray-50">{pixInfo.qr_code}</div>
                      <button
                        onClick={async () => { try { await navigator.clipboard.writeText(pixInfo.qr_code!); setCopyMsg('Chave Pix copiada!'); setTimeout(() => setCopyMsg(''), 2500); } catch (_) {} }}
                        className="mt-2 px-3 py-1.5 bg-pink-600 text-white rounded hover:bg-pink-700"
                      >Copiar chave Pix</button>
                      {copyMsg && <div className="mt-2 text-xs text-green-700">{copyMsg}</div>}
                    </div>
                  )}
                  {pixInfo.ticket_url && (
                    <a
                      href={pixInfo.ticket_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >Abrir link de pagamento</a>
                  )}
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-500">Após o pagamento ser confirmado, você será redirecionado automaticamente para "Minha Conta".</p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/pedidos')}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
            >
              Ver meus pedidos
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