import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { useCart } from '../../../hooks/useCart';

interface CartItemType {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  size: string;
  color: string;
  material?: string;
  quantity: number;
}

interface CheckoutFormV3Props {
  cartItems: CartItemType[];
  subtotal: number;
  shippingData: { cost: number; method: string };
  total: number;
  paymentMethod?: string;
  coupon?: { nome: string; desconto_percentual: number };
  autoStart?: boolean;
}

export default function CheckoutFormV3({ cartItems, subtotal, shippingData, total, paymentMethod, coupon, autoStart }: CheckoutFormV3Props) {
  const { user } = useAuth();
  const { clearCart } = useCart();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  // Checkout Pro não usa SDK v2 (Bricks) na página
  const startedRef = useRef(false);

  // Preferência criada via função Edge Mercado Pago Checkout Pro

  async function handleCheckoutPro() {
    try {
      setErrorMsg(null);
      setLoading(true);
      if (!user) {
        setErrorMsg('Faça login para pagar.');
        setLoading(false);
        return;
      }

      // Validar email do usuário (necessário para criar cliente)
      const userEmail = (user.email || '').trim();
      if (!userEmail) {
        setErrorMsg('Sua conta não possui email. Atualize seu cadastro.');
        setLoading(false);
        return;
      }

      // Resolver cliente_id: buscar em clientes por id ou email; se não existir, criar
      let resolvedClienteId: string | null = null;
      try {
        const orConditions = [`id.eq.${user.id}`];
        if (userEmail) orConditions.push(`email.eq.${userEmail.toLowerCase()}`);
        const { data: clienteMatch, error: clienteSearchErr } = await supabase
          .from('clientes')
          .select('id, nome, email')
          .or(orConditions.join(','))
          .limit(1);
        if (!clienteSearchErr && clienteMatch && clienteMatch.length > 0) {
          resolvedClienteId = clienteMatch[0].id;
        } else {
          // Criar cliente mínimo, preferindo vincular id ao auth.uid para consistência de políticas
          const meta = (user as any)?.user_metadata || {};
          const rawNome = (meta.nome || meta.name || meta.full_name || '').toString().trim();
          const fallbackNome = (userEmail.split('@')[0] || 'Cliente');
          const nome = rawNome || fallbackNome;
          const { data: novoCliente, error: novoClienteErr } = await supabase
            .from('clientes')
            .insert([{ id: user.id, nome, email: userEmail }])
            .select('id')
            .single();
          if (novoClienteErr) {
            // Em caso de conflito de email com outro id, tentar inserir sem forçar id
            const { data: novo2, error: novo2Err } = await supabase
              .from('clientes')
              .insert([{ nome, email: userEmail }])
              .select('id')
              .single();
            if (novo2Err) {
              console.error('Erro ao garantir cliente:', { novoClienteErr, novo2Err });
              throw new Error('Erro ao identificar cliente');
            }
            resolvedClienteId = novo2.id;
          } else {
            resolvedClienteId = novoCliente.id;
          }
        }
      } catch (e) {
        console.error('Falha ao resolver cliente_id:', e);
        setErrorMsg('Erro ao identificar cliente. Tente novamente.');
        setLoading(false);
        return;
      }

      let pedidoId: string | null = null;
      let numeroPedido: string | null = null;

      // Criar pedido
      try {
        // Calcular descontos (PIX 10% e cupom)
        const pixDiscountAmount = paymentMethod === 'pix' ? subtotal * 0.1 : 0;
        const couponPct = coupon ? Number(coupon.desconto_percentual) || 0 : 0;
        const couponDiscountAmount = coupon ? subtotal * (couponPct / 100) : 0;

        const { data: pedidoData, error: pedidoError } = await supabase
          .from('pedidos')
          .insert([
            {
              numero_pedido: `2025${Math.floor(1000 + Math.random() * 9000)}`,
              cliente_id: resolvedClienteId,
              endereco_entrega: {},
              subtotal: subtotal,
              desconto: pixDiscountAmount + couponDiscountAmount,
              frete: shippingData?.cost || 0,
              total: total,
              status: 'pendente',
              forma_pagamento: paymentMethod || 'mercado_pago_checkout_pro',
            },
          ])
          .select('id, numero_pedido')
          .single();

        if (pedidoError) {
          console.error('Erro ao criar pedido:', pedidoError);
          throw new Error('Erro ao criar pedido');
        }

        pedidoId = pedidoData.id;
        numeroPedido = pedidoData.numero_pedido;
        try {
          localStorage.setItem('last_order_numero_pedido', String(numeroPedido));
        } catch (_) {}

        const itensParaInserir = cartItems.map((item) => ({
          pedido_id: pedidoId,
          produto_id: item.id.split('|')[0],
          nome: item.name,
          quantidade: item.quantity,
          preco_unitario: item.price,
          subtotal: item.price * item.quantity,
          tamanho: item.size || null,
          cor: item.color || null,
          imagem: item.image || null,
        }));

        const { error: itensError } = await supabase
          .from('itens_pedido')
          .insert(itensParaInserir);

        if (itensError) {
          console.error('Erro ao inserir itens do pedido:', itensError);
          throw new Error('Erro ao salvar itens do pedido');
        }
      } catch (err) {
        console.error('Erro no processo de pedido:', err);
        setErrorMsg('Erro ao processar pedido. Tente novamente.');
        setLoading(false);
        return;
      }

      // Itens para preferência do Mercado Pago: usar total final como um único item
      const mpItems = [
        {
          title: `Pedido ${numeroPedido}`,
          quantity: 1,
          unit_price: Number(total.toFixed(2)),
          currency_id: 'BRL',
        },
      ];

      const backUrls = {
        success: `${window.location.origin}/checkout/sucesso`,
        failure: `${window.location.origin}/checkout/erro`,
        pending: `${window.location.origin}/checkout/pendente`,
      };

      const metadata = {
        pedido_id: pedidoId,
        numero_pedido: numeroPedido,
        source: 'checkout_pro',
      };

      // Evitar enviar back_urls quando em origem http/localhost para não causar 400 no MP
      const origin = window.location.origin || '';
      const originIsHttps = /^https:/i.test(origin);
      const originIsLocal = /^http:\/\/(localhost|127\.0\.0\.1)/i.test(origin);

      const payload: any = {
        items: mpItems,
        auto_return: 'approved',
        metadata,
      };
      if (originIsHttps && !originIsLocal) {
        payload.back_urls = backUrls;
      }
      if (user.email) {
        payload.payer = { email: user.email };
      }

      const { data, error } = await supabase.functions.invoke('mercado-pago-checkout-pro', {
        body: payload,
      });

      if (error) {
        // Melhorar logging para inspecionar causa (400) do MP
        const ctx = (error as any)?.context;
        console.error('Erro criar preferência:', error?.message || error, ctx);
        try {
          if (ctx?.body) {
            const parsed = JSON.parse(ctx.body);
            console.error('Detalhes MP:', parsed);
          }
        } catch (_) {
          // ignore parse errors
        }
        setErrorMsg('Falha ao iniciar Checkout Pro. Verifique configuração de domínio (HTTPS) e token.');
        setLoading(false);
        return;
      }

      const pref = data as any;
      const isDev = (import.meta as any)?.env?.DEV ?? false;
      const preferSandbox = !originIsHttps || originIsLocal || isDev;
      console.log('Mercado Pago preferência criada (V3):', {
        id: pref?.id,
        sandbox_init_point: pref?.sandbox_init_point,
        init_point: pref?.init_point,
        envDev: isDev,
        originIsHttps,
        originIsLocal,
        preferSandbox,
      });
      const url = preferSandbox ? (pref?.sandbox_init_point || pref?.init_point) : (pref?.init_point || pref?.sandbox_init_point);
      if (!url) {
        setErrorMsg('URL de checkout não retornada.');
        setLoading(false);
        return;
      }

      try {
        localStorage.removeItem('cart');
      } catch (_) {}
      clearCart();
      setLoading(false);
      try {
        window.open(url, '_blank');
      } catch (_) {
        window.location.href = url;
      }
    } catch (e) {
      console.error('Erro no Checkout Pro:', e);
      setErrorMsg('Erro inesperado ao iniciar o pagamento.');
      setLoading(false);
    }
  }

  // Iniciar automaticamente o fluxo de pagamento ao montar quando solicitado
  useEffect(() => {
    if (autoStart && !startedRef.current) {
      startedRef.current = true;
      // Disparar checkout imediatamente
      handleCheckoutPro();
    }
  }, [autoStart]);

  // Quando autoStart está ativo, mostrar apenas estado de redirecionamento (sem resumo local)
  if (autoStart) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Redirecionando para o pagamento...</h3>
        <p className="text-sm text-gray-600 mb-4">Você será direcionado ao Mercado Pago.</p>
        {errorMsg && (
          <p className="text-sm text-red-600 mb-4">{errorMsg}</p>
        )}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={handleCheckoutPro}
            disabled={loading}
            className="inline-flex items-center justify-center px-4 py-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Redirecionando...' : 'Tentar novamente'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <i className="ri-shopping-cart-line mr-2"></i>
            Itens do Carrinho
          </h3>

          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                  <img src={item.image} alt={item.name} className="w-12 h-12 rounded object_cover" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      Tamanho: {item.size} • Cor: {item.color} • Qtd: {item.quantity}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-900">R$ {(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-gray-700">Frete ({shippingData.method || 'A definir'})</span>
              <span className="text-sm text-gray-900">R$ {Number(shippingData.cost || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <i className="ri-cash-line mr-2"></i>
            Resumo do Pedido
          </h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700">Subtotal</span>
              <span className="text-gray-900">R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Frete</span>
              <span className="text-gray-900">R$ {Number(shippingData.cost || 0).toFixed(2)}</span>
            </div>
            {coupon && (
              <div className="flex justify-between">
                <span className="text-green-600">Desconto Cupom ({Number(coupon.desconto_percentual)}%)</span>
                <span className="text-green-600">-R$ {(subtotal * ((Number(coupon.desconto_percentual) || 0)/100)).toFixed(2)}</span>
              </div>
            )}
            {paymentMethod === 'pix' && (
              <div className="flex justify-between">
                <span className="text-green-600">Desconto PIX (10%)</span>
                <span className="text-green-600">-R$ {(subtotal * 0.1).toFixed(2)}</span>
              </div>
            )}
            <div className="border-t my-2"></div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
          </div>

          {errorMsg && (
            <p className="mt-4 text-sm text-red-600">{errorMsg}</p>
          )}

          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Pagamento</h4>
            <button
              type="button"
              onClick={handleCheckoutPro}
              disabled={loading}
              className="w-full inline-flex items-center justify-center px-4 py-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? 'Redirecionando...' : 'Pagar com Mercado Pago (Checkout Pro)'}
            </button>
            <p className="text-xs text-gray-500 mt-2">Você será direcionado para o ambiente do Mercado Pago.</p>
          </div>
        </div>
      </div>
    </div>
  );
}