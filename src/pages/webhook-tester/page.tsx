import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function WebhookTesterPage() {
  const [numeroPedido, setNumeroPedido] = useState('');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testLatestOrder = async () => {
    setLoading(true);
    setOutput(null);
    setError(null);
    try {
      const { data, error: rpcErr } = await supabase.rpc('get_pedidos_recentes', { limite: 1 });
      if (rpcErr) throw rpcErr;
      const latest = Array.isArray(data) ? data[0] : null;
      if (!latest?.numero_pedido) {
        throw new Error('Nenhum pedido recente encontrado');
      }
      const numero = String(latest.numero_pedido);
      const { data: invokeData, error: invokeError } = await supabase.functions.invoke('dispatch-order-webhook', {
        body: { numero_pedido: numero },
      });
      if (invokeError) {
        setError(JSON.stringify(invokeError));
      } else {
        setOutput(JSON.stringify(invokeData));
      }
    } catch (e: any) {
      setError(e?.message || 'Falha ao executar teste');
    } finally {
      setLoading(false);
    }
  };

  const testByNumeroPedido = async () => {
    if (!numeroPedido.trim()) {
      setError('Informe o número do pedido');
      return;
    }
    setLoading(true);
    setOutput(null);
    setError(null);
    try {
      const { data: invokeData, error: invokeError } = await supabase.functions.invoke('dispatch-order-webhook', {
        body: { numero_pedido: numeroPedido.trim() },
      });
      if (invokeError) {
        setError(JSON.stringify(invokeError));
      } else {
        setOutput(JSON.stringify(invokeData));
      }
    } catch (e: any) {
      setError(e?.message || 'Erro ao invocar webhook');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Teste de Webhook do Pedido</h1>
          <p className="text-sm text-gray-600 mb-6">
            Este teste invoca a função <code>dispatch-order-webhook</code> e mostra o resultado.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Número do Pedido</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={numeroPedido}
                  onChange={(e) => setNumeroPedido(e.target.value)}
                  placeholder="Ex.: 20251234"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={testByNumeroPedido}
                  disabled={loading}
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors cursor-pointer whitespace-nowrap disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                >
                  Testar por número
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <button
                onClick={testLatestOrder}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap text-sm"
              >
                Testar último pedido
              </button>
              {loading && <i className="ri-loader-4-line ml-3 text-pink-600 animate-spin"></i>}
            </div>

            {output && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 font-semibold mb-2">Resultado</p>
                <pre className="text-xs text-gray-800 whitespace-pre-wrap break-words">{output}</pre>
              </div>
            )}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-semibold mb-2">Erro</p>
                <pre className="text-xs text-gray-800 whitespace-pre-wrap break-words">{error}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}