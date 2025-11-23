import { useEffect, useMemo, useState, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import CustomerDataForm from './CustomerDataForm';
import ShippingForm from './ShippingForm';
import PaymentForm from './PaymentForm';
import ReviewStep from './ReviewStep';
import type { CheckoutData, CheckoutStep } from '../types.ts';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import { maskCEP, maskCPF, maskPhone, validateCEP, validateCPF, validateEmail, validatePhone } from '@/utils/validation';
import { useCart } from '@/hooks/useCart';
import { createOrder } from '@/lib/orders';

interface CheckoutFormProps {
  user: User;
  onSuccess: () => void;
  onError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

export default function CheckoutForm({
  user,
  onSuccess,
  onError,
  isProcessing,
  setIsProcessing
}: CheckoutFormProps) {
  const { items, paymentMethod: cartPaymentMethod, setPaymentMethod } = useCart();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('customer');
  const [lastCartCep, setLastCartCep] = useState('');
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    customer: {
      nome: '',
      cpf: '',
      email: user.email || '',
      telefone: ''
    },
    shipping: {
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      tipo: 'entrega'
    },
    payment: {
      metodo: 'pix'
    }
  });

  // Carregar dados do localStorage apenas no client-side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cep = localStorage.getItem('last-cart-cep') || '';
      setLastCartCep(cep);
      
      const lastPaymentMethodRaw = localStorage.getItem('last-payment-method');
      const method = (cartPaymentMethod || (lastPaymentMethodRaw === 'cartao' ? 'cartao' : 'pix')) as 'pix' | 'cartao';
      
      setCheckoutData(prev => ({
        ...prev,
        payment: {
          ...prev.payment,
          metodo: method
        }
      }));
    }
  }, [cartPaymentMethod]);

  // Quando lastCartCep carregar, injetar no estado
  useEffect(() => {
    if (!lastCartCep) return;
    setCheckoutData(prev => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        cep: lastCartCep
      }
    }));
  }, [lastCartCep]);
  const [prefillInfo, setPrefillInfo] = useState<{ customer: boolean; shipping: boolean }>({ customer: false, shipping: false });
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [pixPaymentData, setPixPaymentData] = useState<any | null>(null);
  const pixDisplayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('PIX Payment Data mudou:', pixPaymentData);
    if (pixPaymentData && pixDisplayRef.current) {
      setTimeout(() => {
        pixDisplayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100); // Pequeno delay para garantir a renderização
    }
  }, [pixPaymentData]);

  // Reidratar estado do checkout salvo
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('checkout-state');
      const savedPaymentMethod = localStorage.getItem('last-payment-method');

      if (savedPaymentMethod) {
        // setFormaPagamento(savedPaymentMethod); // Removido
      }

      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed?.data) setCheckoutData(parsed.data as CheckoutData);
        if (parsed?.step) setCurrentStep(parsed.step as CheckoutStep);
      }
    } catch {
      // ignora erros de parse
    }
  }, []);

  const steps: CheckoutStep[] = ['customer', 'shipping', 'payment', 'review'];
  const currentStepIndex = steps.indexOf(currentStep);

  const goToNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1]);
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1]);
    }
  };

  const updateCheckoutData = <T extends keyof CheckoutData>(step: T, data: Partial<CheckoutData[T]>) => {
    setCheckoutData((prev: CheckoutData) => ({
      ...prev,
      [step]: { ...prev[step], ...data }
    }));
  };

  // Helpers de validação rápida para auto-avançar
  const isCustomerValid = useMemo(() => {
    const c = checkoutData.customer;
    return (
      (c.nome || '').trim().length >= 3 &&
      validateCPF(c.cpf || '') &&
      validateEmail(c.email || '') &&
      validatePhone(c.telefone || '')
    );
  }, [checkoutData.customer]);

  const isShippingValid = useMemo(() => {
    const s = checkoutData.shipping;
    return (
      validateCEP(s.cep || '') &&
      !!(s.logradouro || '').trim() &&
      !!(s.numero || '').trim() &&
      !!(s.bairro || '').trim() &&
      !!(s.cidade || '').trim() &&
      !!(s.estado || '').trim()
    );
  }, [checkoutData.shipping]);

  // Pré-preenchimento: dados do cliente e endereço salvos
  useEffect(() => {
    const prefill = async () => {
      try {
        let clienteIdForAddress: string | null = null;

        // 1) Buscar dados do cliente por user_id
        const { data: clienteByUserId } = await supabase
          .from('clientes')
          .select('id, nome, telefone, cpf')
          .eq('user_id', user.id)
          .maybeSingle();

        // Fallback: por email
        let clienteRecord = clienteByUserId as any;
        if (!clienteRecord) {
          const { data: clienteByEmail } = await supabase
            .from('clientes')
            .select('id, nome, telefone, cpf')
            .eq('email', user.email || '')
            .maybeSingle();
          clienteRecord = clienteByEmail;
        }

        if (clienteRecord) {
          clienteIdForAddress = clienteRecord.id || null;
          setClienteId(clienteIdForAddress);
          setCheckoutData(prev => ({
            ...prev,
            customer: {
              nome: clienteRecord.nome ? String(clienteRecord.nome) : '',
              cpf: clienteRecord.cpf ? maskCPF(String(clienteRecord.cpf)) : '',
              email: user.email || prev.customer.email,
              telefone: clienteRecord.telefone ? maskPhone(String(clienteRecord.telefone)) : ''
            }
          }));
          setPrefillInfo(p => ({ ...p, customer: true }));
        }

        // 2) Buscar endereço mais recente
        const ids = [user.id, clienteIdForAddress].filter(Boolean) as string[];
        if (ids.length > 0) {
          let enderecosQuery = supabase
            .from('enderecos')
            .select('cep, endereco, numero, complemento, bairro, cidade, estado, created_at')
            .order('created_at', { ascending: false });
          enderecosQuery = ids.length > 1 ? enderecosQuery.in('cliente_id', ids) : enderecosQuery.eq('cliente_id', ids[0]);
          const { data: enderecosData } = await enderecosQuery;
          const addr = (enderecosData || [])[0];
          if (addr) {
            setCheckoutData(prev => ({
              ...prev,
              shipping: {
                ...prev.shipping,
                cep: addr.cep ? maskCEP(String(addr.cep)) : prev.shipping.cep,
                logradouro: addr.endereco ? String(addr.endereco) : '',
                numero: addr.numero ? String(addr.numero) : '',
                complemento: addr.complemento ? String(addr.complemento) : '',
                bairro: addr.bairro ? String(addr.bairro) : '',
                cidade: addr.cidade ? String(addr.cidade) : '',
                estado: addr.estado ? String(addr.estado) : '',
              }
            }));
            setPrefillInfo(p => ({ ...p, shipping: true }));
          }
        }

      } catch (err) {
        // Silencioso: não bloquear checkout se falhar
        console.warn('Falha ao pré-preencher checkout:', err);
      }
    };

    prefill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  // Auto-avançar quando dados pré-preenchidos estiverem válidos
  useEffect(() => {
    // Evita avançar retroativamente se usuário estiver editando
    if (currentStep === 'customer' && isCustomerValid) {
      setCurrentStep('shipping');
      if (prefillInfo.customer) showToast('Dados do cliente pré-preenchidos', 'success');
    }
    // Se já estamos em shipping e endereço está completo, avançar
    if (currentStep === 'shipping' && isShippingValid) {
      // Se o método de pagamento é PIX (não requer campos), ir direto à revisão
      const metodo = checkoutData.payment.metodo;
      if (metodo === 'pix') {
        setCurrentStep('review');
      } else {
        setCurrentStep('payment');
      }
      if (prefillInfo.shipping) showToast('Endereço de entrega pré-preenchido', 'success');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCustomerValid, isShippingValid]);

  // Persistir estado do checkout
  useEffect(() => {
    try {
      const payload = JSON.stringify({ data: checkoutData, step: currentStep });
      localStorage.setItem('checkout-state', payload);
    } catch {
      // ignore
    }
  }, [checkoutData, currentStep]);

  // Manter store do carrinho sincronizado com o método de pagamento do checkout
  useEffect(() => {
    if (checkoutData?.payment?.metodo) {
      setPaymentMethod(checkoutData.payment.metodo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutData.payment.metodo]);

  const handleSubmitOrder = async () => {
    setIsProcessing(true);
    try {
      // Validar carrinho
      if (!items || items.length === 0) {
        throw new Error('Seu carrinho está vazio.');
      }

      // Gerar número do pedido: AAAA + 4 dígitos
      const year = String(new Date().getFullYear());
      const randomDigits = String(Math.floor(1000 + Math.random() * 9000));
      const numeroPedido = `${year}${randomDigits}`;

      // Calcular totais
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const formaPagamento = checkoutData.payment.metodo;
      const desconto = formaPagamento === 'pix' ? subtotal * 0.10 : 0; // 10% apenas sobre produtos
      const frete = 0; // Frete a calcular em fluxo futuro (sem desconto)
      const total = subtotal + frete - desconto;

      // String para salvar em pedidos.endereco_entrega (DB espera string)
      const enderecoEntregaStr = [
        checkoutData.shipping.logradouro,
        checkoutData.shipping.numero,
        checkoutData.shipping.complemento || ''
      ]
        .filter(Boolean)
        .join(', ')
        .concat(
          checkoutData.shipping.bairro ? ` - ${checkoutData.shipping.bairro}` : ''
        );

      // Cliente
      const clienteIdToUse = clienteId || user.id;

      // Preparar itens payload
      const itensPayload = items.map((item) => {
        const produtoId = item.id.split('|')[0];
        return {
          pedido_id: '', // Será preenchido no webhook
          produto_id: produtoId,
          nome: item.name,
          quantidade: item.quantity,
          preco_unitario: item.price,
          subtotal: item.price * item.quantity,
          tamanho: item.size,
          cor: item.color,
          imagem: item.image,
        };
      });

      // Criar pedido no banco de dados
      try {
        const pedidoId = await createOrder({
          cliente_id: clienteIdToUse,
          numero_pedido: numeroPedido,
          subtotal: subtotal,
          desconto: desconto,
          frete: frete,
          total: total,
          forma_pagamento: formaPagamento,
          status: 'pendente', // Status inicial será atualizado pelo webhook
          endereco_entrega: enderecoEntregaStr,
          cidade_entrega: checkoutData.shipping.cidade,
          estado_entrega: checkoutData.shipping.estado,
          cep_entrega: checkoutData.shipping.cep,
          itens: itensPayload.map(item => ({
            produto_id: item.produto_id,
            nome: item.nome,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
            subtotal: item.subtotal,
            tamanho: item.tamanho,
            cor: item.cor,
            imagem: item.imagem
          }))
        });
        
        console.log('✅ Pedido criado com sucesso:', pedidoId);
        
        // Persistir dados essenciais do pedido para continuidade do fluxo
        try {
          localStorage.setItem('last-order-number', String(numeroPedido));
          localStorage.setItem('last-order-id', pedidoId);
        } catch {}
        
      } catch (orderError) {
        console.error('❌ Erro ao criar pedido:', orderError);
        throw new Error('Falha ao criar pedido. Tente novamente.');
      }

      // Processar pagamento via Mercado Pago
      try {
        const { payPix, payCard } = await import('@/lib/paymentsMp');
        const payer = {
          email: checkoutData.customer.email,
          first_name: (checkoutData.customer.nome || '').split(' ')[0] || undefined,
          last_name: (checkoutData.customer.nome || '').split(' ').slice(1).join(' ') || undefined,
          identification: checkoutData.customer.cpf
            ? { type: 'CPF', number: String(checkoutData.customer.cpf).replace(/\D/g, '') }
            : undefined,
        };

        const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
        const safeRedirect = isHttps ? `${window.location.origin}/minha-conta/pedidos` : undefined;

        if (formaPagamento === 'pix') {
          try {
            console.log('Chamando payPix (Checkout Pro só PIX) com:', {
              amount: Number(total.toFixed(2)),
              description: `Pedido ${numeroPedido}`,
              orderNumber: numeroPedido,
              payer,
              // Não enviar redirectUrl para garantir Checkout Transparente (QR Code) mesmo em produção
            });
            const pixResult = await payPix({
              amount: Number(total.toFixed(2)),
              description: `Pedido ${numeroPedido}`,
              orderNumber: numeroPedido,
              payer,
              // Sem redirectUrl: força uso da API de pagamentos (PIX transparente)
            });
            console.log('Resultado do payPix:', pixResult);
            // Se veio link de Checkout Pro, redirecionar. Caso contrário, exibir QR local.
            if (pixResult.init_point) {
              window.location.href = pixResult.init_point;
            } else {
              setPixPaymentData(pixResult);
            }
          } catch (pixError) {
            console.error('Erro ao chamar payPix:', pixError);
            onError(pixError instanceof Error ? pixError.message : 'Erro no pagamento PIX');
          }
        } else if (formaPagamento === 'cartao') {
          const cardResult = await payCard({
            amount: total,
            description: `Pedido #${numeroPedido}`,
            orderNumber: numeroPedido, // Corrigido de orderId para numeroPedido
            payer: {
              email: checkoutData.customer.email,
              first_name: checkoutData.customer.nome.split(' ')[0],
            },
            redirectUrl: safeRedirect,
          });
          if (cardResult.init_point) {
            window.location.href = cardResult.init_point;
          } else {
            throw new Error('Não foi possível obter o link de pagamento.');
          }
        }
      } catch (payError) {
        console.error('❌ Erro ao processar pagamento:', payError);
        throw new Error(payError instanceof Error ? payError.message : 'Falha ao processar pagamento');
      }

      // Concluir fluxo local e navegar - REMOVIDO PARA PIX
      if (checkoutData.payment.metodo !== 'pix') {
        try {
          localStorage.removeItem('checkout-state');
        } catch {}
        onSuccess();
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Erro ao processar pedido');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'customer':
        return (
          <CustomerDataForm
            data={checkoutData.customer}
            onChange={(data) => updateCheckoutData('customer', data)}
            onNext={goToNextStep}
          />
        );
      case 'shipping':
        return (
          <ShippingForm
            data={checkoutData.shipping}
            onChange={(data) => updateCheckoutData('shipping', data)}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case 'payment':
        return (
          <PaymentForm
            data={checkoutData.payment}
            onChange={(data) => updateCheckoutData('payment', data)}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case 'review':
        return (
          <ReviewStep
            checkoutData={checkoutData}
            onConfirm={handleSubmitOrder}
            onBack={goToPreviousStep}
            isProcessing={isProcessing}
            onEditStep={(step) => setCurrentStep(step)}
            // Sem estado de PIX
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Feedback de pré-preenchimento */}
      {(prefillInfo.customer || prefillInfo.shipping) && (
        <div className="mb-4 p-3 rounded-md bg-green-50 text-green-700 border border-green-200">
          <i className="ri-check-line mr-2"></i>
          Alguns campos foram pré-preenchidos com seus dados salvos. Você pode revisar e editar antes de confirmar.
        </div>
      )}

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4 gap-1 sm:gap-0">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                  index < currentStepIndex
                    ? 'bg-green-600 text-white'
                    : index === currentStepIndex
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-10 sm:w-16 h-1 mx-1 sm:mx-2 ${
                    index < currentStepIndex ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        
        <div className="flex justify-between text-xs text-gray-600">
          <span className="text-center w-16 sm:w-20">Dados</span>
          <span className="text-center w-16 sm:w-20">Entrega</span>
          <span className="text-center w-16 sm:w-20">Pagamento</span>
          <span className="text-center w-16 sm:w-20">Revisão</span>
        </div>
      </div>

      {/* Step Content */}
      {renderStep()}

      {/* Exibição do PIX após geração */}
      {pixPaymentData && (
        <div ref={pixDisplayRef} className="mt-8 p-6 bg-gray-100 rounded-lg text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Pague com PIX para confirmar seu pedido</h2>
          <p className="text-gray-600 mb-4">Escaneie o QR Code abaixo com o app do seu banco:</p>
          <div className="flex justify-center mb-4">
            {pixPaymentData.pix?.qr_code_base64 && (
              <img
                src={`data:image/png;base64,${pixPaymentData.pix.qr_code_base64}`}
                alt="PIX QR Code"
                className="w-64 h-64 border-4 border-gray-300 rounded-lg"
              />
            )}
          </div>
          <p className="text-gray-600 mb-2">Ou use o código PIX Copia e Cola:</p>
          <div className="relative bg-white p-3 rounded-lg border">
            <input
              readOnly
              value={pixPaymentData.pix?.qr_code || ''}
              className="w-full bg-transparent text-gray-700 text-sm break-all pr-10"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(pixPaymentData.pix?.qr_code || '');
                showToast('Código PIX copiado!', 'success');
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-pink-600"
              aria-label="Copiar código PIX"
            >
              <i className="ri-file-copy-line text-xl"></i>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-4">O QR Code expira em alguns minutos. Após o pagamento, seu pedido será confirmado.</p>
        </div>
      )}
    </div>
  );
}