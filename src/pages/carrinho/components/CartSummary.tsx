
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';

interface CartSummaryProps {
  subtotal: number;
  shipping: any;
  onFinalizePurchase: (paymentMethod: string, appliedCoupon?: { nome: string; desconto_percentual: number }) => void;
}

export default function CartSummary({ subtotal, shipping, onFinalizePurchase }: CartSummaryProps) {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, clearCart } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('pix');
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);
  const [couponValid, setCouponValid] = useState(false);
  const [couponData, setCouponData] = useState<{ nome: string; desconto_percentual: number } | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{ nome: string; desconto_percentual: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [, setErrorMsg] = useState<string | null>(null);

  const shippingCost = typeof shipping?.price === 'number' ? shipping.price : null;
  const shippingMethod = shipping?.name || '';

  const isShippingSelected = !!shippingMethod;

  const pixDiscount = selectedPaymentMethod === 'pix' ? subtotal * 0.1 : 0;
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const pct = Number(appliedCoupon.desconto_percentual) || 0;
    return subtotal * (pct / 100);
  }, [subtotal, appliedCoupon]);
  const discount = pixDiscount + couponDiscount;
  const total = subtotal + (shippingCost ?? 0) - discount;

  // validação de cupom com debounce
  useEffect(() => {
    const code = couponCode.trim();
    if (!code) {
      // Ao apagar o código, interrompe qualquer estado de verificação e reseta tudo
      setIsCheckingCoupon(false);
      setCouponValid(false);
      setCouponData(null);
      setAppliedCoupon(null);
      return;
    }
    setIsCheckingCoupon(true);
    const handle = setTimeout(async () => {
      try {
        const codeUpper = code.toUpperCase();
        const { data, error } = await supabase
          .from('cupons')
          .select('id, nome, desconto_percentual, inicio_em, fim_em, status')
          .eq('nome', codeUpper)
          .limit(1);
        if (error) {
          console.error('Erro ao validar cupom:', error);
          setCouponValid(false);
          setCouponData(null);
        } else if (data && data.length > 0) {
          const c = data[0] as any;
          const now = new Date();
          const startsOk = !c.inicio_em || new Date(c.inicio_em) <= now;
          const endsOk = !c.fim_em || new Date(c.fim_em) >= now;
          const isActive = c.status === 'ativo';
          const valid = startsOk && endsOk && isActive;
          setCouponValid(valid);
          setCouponData(valid ? { nome: c.nome, desconto_percentual: Number(c.desconto_percentual) } : null);
        } else {
          setCouponValid(false);
          setCouponData(null);
        }
      } catch (e) {
        console.error('Erro inesperado ao validar cupom:', e);
        setCouponValid(false);
        setCouponData(null);
      } finally {
        setIsCheckingCoupon(false);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [couponCode]);

  const handleFinalize = () => {
    if (!isShippingSelected) return;
    // Pagamentos não-MP seguem o fluxo anterior
    if (!['pix', 'credit'].includes(selectedPaymentMethod)) {
      onFinalizePurchase(selectedPaymentMethod, appliedCoupon || undefined);
      return;
    }
    void handleCheckoutProDirect();
  };

  async function handleCheckoutProDirect() {
    try {
      setErrorMsg(null);
      setLoading(true);

      if (!user) {
        showToast('Faça login para pagar.', 'error');
        navigate('/auth/login');
        setLoading(false);
        return;
      }

      const userEmail = (user.email || '').trim();
      if (!userEmail) {
        showToast('Sua conta não possui email. Atualize seu cadastro.', 'error');
        setLoading(false);
        return;
      }

      // Resolver cliente_id (por id ou email) e criar se necessário
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
          const meta: any = (user as any)?.user_metadata || {};
          const rawNome = (meta.nome || meta.name || meta.full_name || '').toString().trim();
          const fallbackNome = (userEmail.split('@')[0] || 'Cliente');
          const nome = rawNome || fallbackNome;
          const { data: novoCliente, error: novoClienteErr } = await supabase
            .from('clientes')
            .insert([{ id: user.id, nome, email: userEmail }])
            .select('id')
            .single();
          if (novoClienteErr) {
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
        showToast('Erro ao identificar cliente. Tente novamente.', 'error');
        setLoading(false);
        return;
      }

      let pedidoId: string | null = null;
      let numeroPedido: string | null = null;

      // Calcular descontos
      const pixDiscountAmount = selectedPaymentMethod === 'pix' ? subtotal * 0.1 : 0;
      const couponPct = appliedCoupon ? Number(appliedCoupon.desconto_percentual) || 0 : 0;
      const couponDiscountAmount = appliedCoupon ? subtotal * (couponPct / 100) : 0;

      // Criar pedido
      try {
        const { data: pedidoData, error: pedidoError } = await supabase
          .from('pedidos')
          .insert([
            {
              numero_pedido: `2025${Math.floor(1000 + Math.random() * 9000)}`,
              cliente_id: resolvedClienteId,
              endereco_entrega: {},
              subtotal: subtotal,
              desconto: pixDiscountAmount + couponDiscountAmount,
              frete: shippingCost || 0,
              total: total,
              status: 'pendente',
              forma_pagamento: selectedPaymentMethod || 'mercado_pago_checkout_pro',
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
        try { localStorage.setItem('last_order_numero_pedido', String(numeroPedido)); } catch (_) {}

        const itensParaInserir = items.map((item: any) => ({
          pedido_id: pedidoId,
          produto_id: String(item.id || '').split('|')[0],
          nome: item.name,
          quantidade: item.quantity,
          preco_unitario: item.price,
          subtotal: item.price * item.quantity,
          tamanho: item.size || null,
          cor: item.color || null,
          imagem: item.image || null,
        }));

        const { error: itensError } = await supabase.from('itens_pedido').insert(itensParaInserir);
        if (itensError) {
          console.error('Erro ao inserir itens do pedido:', itensError);
          throw new Error('Erro ao salvar itens do pedido');
        }
      } catch (err) {
        console.error('Erro no processo de pedido:', err);
        showToast('Erro ao processar pedido. Tente novamente.', 'error');
        setLoading(false);
        return;
      }

      // Preferência MP (Checkout Pro)
      const mpItems = [
        { title: `Pedido ${numeroPedido}`, quantity: 1, unit_price: Number(total.toFixed(2)), currency_id: 'BRL' },
      ];
      const backUrls = {
        success: `${window.location.origin}/checkout/sucesso`,
        failure: `${window.location.origin}/checkout/erro`,
        pending: `${window.location.origin}/checkout/pendente`,
      };
      const metadata = { pedido_id: pedidoId, numero_pedido: numeroPedido, source: 'checkout_pro' };
      const origin = window.location.origin || '';
      const originIsHttps = /^https:/i.test(origin);
      const originIsLocal = /^http:\/\/(localhost|127\.0\.0\.1)/i.test(origin);

      const payload: any = { items: mpItems, auto_return: 'approved', metadata };
      if (originIsHttps && !originIsLocal) { payload.back_urls = backUrls; }
      if (user.email) { payload.payer = { email: user.email }; }

      const { data, error } = await supabase.functions.invoke('mercado-pago-checkout-pro', { body: payload });
      if (error) {
        const ctx = (error as any)?.context;
        console.error('Erro criar preferência:', error?.message || error, ctx);
        try { if (ctx?.body) console.error('Detalhes MP:', JSON.parse(ctx.body)); } catch (_) {}
        showToast('Falha ao iniciar Checkout Pro. Verifique configuração.', 'error');
        setLoading(false);
        return;
      }

      const pref: any = data;
      const isDev = (import.meta as any)?.env?.DEV ?? false;
      const preferSandbox = !originIsHttps || originIsLocal || isDev;
      console.log('Mercado Pago preferência criada (CartSummary):', {
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
        showToast('URL de checkout não retornada.', 'error');
        setLoading(false);
        return;
      }

      try { localStorage.removeItem('cart'); } catch (_) {}
      clearCart();
      setLoading(false);
      try { window.open(url, '_blank'); } catch (_) { window.location.href = url; }
    } catch (e) {
      console.error('Erro no Checkout Pro:', e);
      setErrorMsg('Erro inesperado ao iniciar o pagamento.');
      setLoading(false);
    }
  }

  const handleApplyCoupon = async () => {
    if (!couponValid || !couponData) return;
    setAppliedCoupon({ ...couponData });
    showToast(`Cupom ${couponData.nome} aplicado (-${couponData.desconto_percentual}%).`, 'success');
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
            onChange={(e) => { setCouponCode(e.target.value); setAppliedCoupon(null); }}
            placeholder="Digite o código"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
          />
          <button
            onClick={handleApplyCoupon}
            disabled={!couponValid || isCheckingCoupon || !!appliedCoupon}
            className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap text-sm ${
              !couponValid || isCheckingCoupon || !!appliedCoupon
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-pink-600 text-white hover:bg-pink-700 cursor-pointer'
            }`}
          >
            {isCheckingCoupon ? 'Verificando...' : appliedCoupon ? 'Aplicado' : 'Aplicar'}
          </button>
        </div>
        {couponCode && (
          <p className={`mt-2 text-sm ${couponValid ? 'text-green-600' : 'text-red-600'}`}>
            {isCheckingCoupon
              ? 'Validando cupom...'
              : couponValid && couponData
                ? `Cupom válido: ${couponData.desconto_percentual}% de desconto`
                : 'Cupom inválido, expirado ou inativo'}
          </p>
        )}
      </div>

      {/* Botão Finalizar Compra: inicia Checkout Pro direto (PIX/Crédito) ou segue fluxo padrão */}
      <button
        onClick={handleFinalize}
        disabled={!isShippingSelected || loading}
        className={`w-full inline-flex items-center justify-center py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
          isShippingSelected && !loading
            ? 'bg-pink-600 text-white hover:bg-pink-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        <i className="ri-external-link-line mr-2"></i>
        {loading ? 'Redirecionando...' : 'Finalizar Compra'}
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
