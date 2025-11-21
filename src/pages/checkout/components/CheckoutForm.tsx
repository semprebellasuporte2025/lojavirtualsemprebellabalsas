import { useEffect, useMemo, useState } from 'react';
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
import { createPreference } from '@/lib/mercadoPago';

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
  // Reidratar estado do checkout salvo
  useEffect(() => {
    try {
      const raw = localStorage.getItem('checkout-state');
      if (raw) {
        const parsed = JSON.parse(raw);
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

      // Endereço de entrega
      const enderecoEntrega = {
        nome: checkoutData.customer.nome,
        endereco: checkoutData.shipping.logradouro,
        numero: checkoutData.shipping.numero,
        complemento: checkoutData.shipping.complemento,
        bairro: checkoutData.shipping.bairro,
        cidade: checkoutData.shipping.cidade,
        estado: checkoutData.shipping.estado,
        cep: checkoutData.shipping.cep,
      };

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

      // Persistir dados essenciais do pedido para continuidade do fluxo (caso precise)
      try {
        localStorage.setItem('last-order-number', String(numeroPedido));
      } catch {}

      // Se método for cartão OU PIX, iniciar fluxo do Mercado Pago Checkout Pro
      if (formaPagamento === 'cartao' || formaPagamento === 'pix') {
        try {
          // TEMPORÁRIO: Usar URL de produção para backUrls durante testes locais, pois MP rejeita localhost
          const backBase = 'https://semprebellabalsas.com.br';
          
          // DEBUG: Log dos dados que serão enviados
          console.log('🔍 [DEBUG] Dados sendo enviados para createPreference:');
          console.log('checkoutData.customer:', checkoutData.customer);
          console.log('items:', items);
          console.log('numeroPedido:', numeroPedido);
          
          const preferenceData = {
            items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image, size: i.size, color: i.color })),
            externalReference: numeroPedido,
            cliente: { nome: checkoutData.customer.nome, email: checkoutData.customer.email },
            backUrls: {
              success: `${backBase}/minha-conta?pedido=${numeroPedido}`,
              pending: `${backBase}/minha-conta?pedido=${numeroPedido}`,
              failure: `https://semprebellabalsas.com.br`,
            },
            notificationUrl: 'https://portaln8n.semprebellabalsas.com.br/webhook/notifica_pedido_cliente_e_proprietario',
            // Removido preferredPaymentMethodId pois a API do Mercado Pago não suporta default_payment_method_id para PIX
            metadata: {
              numero_pedido: numeroPedido,
              cliente_id: clienteIdToUse,
              subtotal: subtotal,
              desconto: desconto,
              frete: frete,
              total: total,
              status: 'confirmado', // Inicial, será atualizado no webhook
              forma_pagamento: formaPagamento,
              endereco_entrega: enderecoEntrega,
              cliente_details: {
                id: clienteIdToUse,
                nome: checkoutData.customer.nome,
                cpf: checkoutData.customer.cpf,
                email: checkoutData.customer.email,
                telefone: checkoutData.customer.telefone,
              },
              itens: itensPayload,
              origem: 'checkout-web',
              timestamp: new Date().toISOString(),
            }
          };
          
          console.log('📦 [DEBUG] Request body completo:');
          console.log(JSON.stringify(preferenceData, null, 2));
          
          const pref = await createPreference(preferenceData);
          // Redirecionar para o checkout na mesma aba
          window.location.href = pref.init_point ?? '';
          setIsProcessing(false);
          return; // não chamar onSuccess aqui; retorno será via back_urls
        } catch (mpErr: any) {
          console.error('Erro ao iniciar Checkout Pro:', mpErr);
      
          // Tenta extrair a mensagem de erro detalhada da Edge Function
          if (mpErr && mpErr.message) {
            try {
              // A Edge Function retorna erro como string JSON, então tentamos parsear diretamente
              const errorData = JSON.parse(mpErr.message);
              console.error('Detalhes do erro do Mercado Pago:', errorData);
            } catch (e) {
              // Se não for JSON válido, pode ser que a mensagem contenha JSON dentro
              try {
                const jsonMatch = mpErr.message.match(/\{[^}]*\}/);
                if (jsonMatch) {
                  const errorData = JSON.parse(jsonMatch[0]);
                  console.error('Detalhes do erro do Mercado Pago:', errorData);
                } else {
                  console.error('Mensagem de erro:', mpErr.message);
                }
              } catch (parseError) {
                // A mensagem de erro não contém JSON válido
                console.error('Mensagem de erro original:', mpErr.message);
              }
            }
          }
      
          throw new Error('Falha ao iniciar pagamento. Verifique o console para mais detalhes.');
        }
      }
      
      // Qualquer outro método (não esperado): concluir fluxo local e navegar
      try {
        localStorage.removeItem('checkout-state');
      } catch {}
      onSuccess();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Erro ao processar pedido');
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
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
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
                  className={`w-16 h-1 mx-2 ${
                    index < currentStepIndex ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        
        <div className="flex justify-between text-xs text-gray-600">
          <span className="text-center w-20">Dados</span>
          <span className="text-center w-20">Entrega</span>
          <span className="text-center w-20">Pagamento</span>
          <span className="text-center w-20">Revisão</span>
        </div>
      </div>

      {/* Step Content */}
      {renderStep()}
    </div>
  );
}