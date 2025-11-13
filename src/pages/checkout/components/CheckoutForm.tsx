import { useEffect, useState } from 'react';
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

interface CheckoutFormProps {
  cartItems: CartItemType[];
  subtotal: number;
  shippingData: { cost: number; method: string };
  total: number;
}

export default function CheckoutForm({ cartItems, subtotal, shippingData, total }: CheckoutFormProps) {
  const { user } = useAuth();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [clienteInfo, setClienteInfo] = useState<{ id?: string; nome?: string; cpf?: string; email?: string } | null>(null);
  const [cpfInput, setCpfInput] = useState('');
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    paymentMethod: 'pix'
  });

  // Calcular desconto de 10% para pagamento via PIX
  const hasPixDiscount = formData.paymentMethod === 'pix';
  const discountAmount = hasPixDiscount ? subtotal * 0.1 : 0;
  const finalTotal = hasPixDiscount ? total - discountAmount : total;

  // Helpers CPF
  const formatCPF = (value: string) => {
    const numbers = (value || '').replace(/\D/g, '').slice(0, 11);
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const validateCPF = (cpf: string) => {
    const numbers = (cpf || '').replace(/\D/g, '');
    if (!numbers || numbers.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(numbers)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(numbers.charAt(i)) * (10 - i);
    let check1 = 11 - (sum % 11);
    if (check1 >= 10) check1 = 0;
    if (check1 !== parseInt(numbers.charAt(9))) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(numbers.charAt(i)) * (11 - i);
    let check2 = 11 - (sum % 11);
    if (check2 >= 10) check2 = 0;
    return check2 === parseInt(numbers.charAt(10));
  };

  // Helpers CEP
  const formatCEP = (value: string) => {
    const digits = (value || '').replace(/\D/g, '').slice(0, 8);
    return digits.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
  };

  const fetchCepData = async (digits: string) => {
    const cleanCep = (digits || '').replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    setIsCepLoading(true);
    setCepError(null);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (data?.erro) {
        setCepError('CEP não encontrado. Verifique e tente novamente.');
        return;
      }
      setFormData(prev => ({
        ...prev,
        endereco: data.logradouro || prev.endereco,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: (data.uf || prev.estado || '').toUpperCase(),
      }));
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      setCepError('Erro ao consultar o CEP. Tente novamente.');
    } finally {
      setIsCepLoading(false);
    }
  };

  // Carregar dados do cliente para exibir nome e CPF
  useEffect(() => {
    const loadCliente = async () => {
      if (!user) return;
      const { data: cliente, error } = await supabase
        .from('clientes')
        .select('id, nome, email, cpf')
        .eq('email', (user.email as string) || '')
        .maybeSingle();
      if (!error && cliente) {
        setClienteInfo(cliente);
        setCpfInput(cliente.cpf || '');
      } else {
        // Caso não tenha cadastro, deixa para handleSubmit criar mínimo
        setClienteInfo({ nome: (user as any)?.user_metadata?.nome || 'Cliente', email: user.email || undefined });
      }
    };
    loadCliente();
  }, [user]);

  const handleCepChange = async (cep: string) => {
    const cleanCep = (cep || '').replace(/\D/g, '').slice(0, 8);
    setCepError(null);
    setFormData({ ...formData, cep: cleanCep });
    if (cleanCep.length === 8) {
      await fetchCepData(cleanCep);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('Você precisa estar logado para finalizar a compra');
      return;
    }

    setLoading(true);

    try {
      // Obter cliente (clientes.id) a partir do user_id (auth user id)
      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .select('id, nome, email, cpf')
        .eq('email', (user.email as string) || '')
        .maybeSingle();

      let cliente = clienteData;
      let clienteId = cliente?.id as string | undefined;
      if (clienteError || !clienteId) {
        // Se não existir, cria um cliente mínimo vinculado ao email
        const { data: novoCliente, error: novoClienteError } = await supabase
          .from('clientes')
          .insert([{ nome: (user as any)?.user_metadata?.nome || 'Cliente', email: (user.email as string) || '' }])
          .select()
          .single();
        if (novoClienteError) {
          console.error('Erro ao garantir cliente:', novoClienteError);
          throw new Error('Erro ao identificar cliente');
        }
        clienteId = novoCliente?.id as string | undefined;
      }

      // Atualizar CPF se não existir e o usuário informou
      const cpfDigits = (cpfInput || '').replace(/\D/g, '');
      if ((!cliente?.cpf || cliente?.cpf === '') && cpfDigits) {
        if (!validateCPF(cpfDigits)) {
          throw new Error('CPF inválido. Verifique e tente novamente.');
        }
        const { error: cpfUpdateErr } = await supabase
          .from('clientes')
          .update({ cpf: cpfDigits })
          .eq('id', clienteId!);
        if (cpfUpdateErr) {
          console.warn('Falha ao salvar CPF do cliente:', cpfUpdateErr.message);
        } else {
          cliente = { ...(cliente || {}), cpf: cpfDigits } as any;
          setClienteInfo(prev => ({ ...(prev || {}), cpf: cpfDigits }));
        }
      }

      // Converter número para inteiro para evitar erro de tipo
      const numeroInt = parseInt(String(formData.numero).replace(/\D/g, ''), 10) || 0;

      // Tentar inserir endereço usando clientes.id; se falhar por política/constraint, tentar com auth.uid()
      let usedAuthUid = false;
      let endereco: any | null = null;

      const nomeCliente = cliente?.nome || (user as any)?.user_metadata?.nome || 'Cliente';

      const payloadClienteId = {
        cliente_id: clienteId,
        nome: nomeCliente,
        cep: formData.cep,
        endereco: formData.endereco,
        numero: numeroInt,
        complemento: formData.complemento || null,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado
      };
      // Tentar reutilizar endereço existente (evita duplicação)
      let enderecoPrim: any | null = null;
      try {
        const { data: existente, error: existErr } = await supabase
          .from('enderecos')
          .select('id, cliente_id, cep, endereco, numero, complemento, bairro, cidade, estado')
          .eq('cliente_id', clienteId!)
          .eq('cep', formData.cep)
          .eq('endereco', formData.endereco)
          .eq('numero', numeroInt)
          .eq('bairro', formData.bairro)
          .eq('cidade', formData.cidade)
          .eq('estado', formData.estado)
          .limit(1);
        if (!existErr && existente && existente.length > 0) {
          enderecoPrim = existente[0];
        }
      } catch (err) {
        console.warn('Falha ao verificar endereço existente, prosseguindo com inserção:', err);
      }

      if (enderecoPrim) {
        endereco = enderecoPrim;
      } else {
        const { data: novoEndereco, error: enderecoPrimError } = await supabase
          .from('enderecos')
          .insert([payloadClienteId])
          .select()
          .single();

        if (enderecoPrimError) {
          console.error('Erro ao criar endereço (clientes.id):', {
            message: enderecoPrimError.message,
            details: (enderecoPrimError as any)?.details,
            code: (enderecoPrimError as any)?.code
          });
          // Fallback com auth.uid() e também tentar reutilizar
          const payloadAuthUid = { ...payloadClienteId, cliente_id: user.id };

          // Buscar existente com auth.uid
          try {
            const { data: existenteAuth, error: existAuthErr } = await supabase
              .from('enderecos')
              .select('id, cliente_id, cep, endereco, numero, complemento, bairro, cidade, estado')
              .eq('cliente_id', user.id)
              .eq('cep', formData.cep)
              .eq('endereco', formData.endereco)
              .eq('numero', numeroInt)
              .eq('bairro', formData.bairro)
              .eq('cidade', formData.cidade)
              .eq('estado', formData.estado)
              .limit(1);
            if (!existAuthErr && existenteAuth && existenteAuth.length > 0) {
              usedAuthUid = true;
              endereco = existenteAuth[0];
            }
          } catch (_) {}

        if (!endereco) {
          const { data: enderecoSec, error: enderecoSecError } = await supabase
            .from('enderecos')
            .insert(payloadAuthUid)
            .select()
            .single();

          if (enderecoSecError) {
            console.error('Erro ao criar endereço (auth.uid fallback):', {
              message: enderecoSecError.message,
              details: (enderecoSecError as any)?.details,
              code: (enderecoSecError as any)?.code
            });
            throw new Error(enderecoSecError.message || 'Erro ao salvar endereço');
          }
          usedAuthUid = true;
          endereco = enderecoSec;
        }
        } else {
          endereco = novoEndereco;
        }
      }

      const finalClienteId = usedAuthUid ? user.id : clienteId;

      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .insert([
          {
            numero_pedido: `2025${Math.floor(1000 + Math.random() * 9000)}`,
            cliente_id: finalClienteId,
            endereco_entrega: {
              id: endereco.id,
              nome: nomeCliente,
              cep: formData.cep,
              endereco: formData.endereco,
              numero: numeroInt,
              complemento: formData.complemento || null,
              bairro: formData.bairro,
              cidade: formData.cidade,
              estado: formData.estado
            },
            subtotal: subtotal,
            desconto: 0,
            frete: shippingData.cost,
            total: total,
            status: 'pendente',
            forma_pagamento: formData.paymentMethod
          }
        ])
        .select()
        .single();

      if (pedidoError) {
        console.error('Erro ao criar pedido:', pedidoError);
        throw new Error('Erro ao criar pedido');
      }

      // Inserir itens do pedido
      const itensParaInserir = cartItems.map(item => ({
        pedido_id: pedido.id,
        produto_id: item.id.toString(),
        nome: item.name,
        quantidade: item.quantity,
        preco_unitario: item.price,
        subtotal: item.price * item.quantity,
        tamanho: item.size || null,
        cor: item.color || null,
        material: item.material || null,
        imagem: item.image || null
      }));

      const { error: itensError } = await supabase
        .from('itens_pedido')
        .insert(itensParaInserir);

      if (itensError) {
        const msg = String((itensError as any)?.message || '');
        console.error('Erro ao inserir itens do pedido:', itensError);
        if (/column\s+.*material.*does not exist|material.*column/i.test(msg)) {
          const itensSemMaterial = itensParaInserir.map(({ material, ...rest }) => ({ ...rest }));
          const { error: itensFallbackError } = await supabase
            .from('itens_pedido')
            .insert(itensSemMaterial);
          if (itensFallbackError) {
            console.error('Erro ao inserir itens do pedido (fallback sem material):', itensFallbackError);
            throw new Error('Erro ao salvar itens do pedido');
          }
        } else {
          throw new Error('Erro ao salvar itens do pedido');
        }
      }

      // Disparar webhook via Edge Function (server-side, sem CORS).
      try {
        const { data: whData, error: whError } = await supabase.functions.invoke('dispatch-order-webhook', {
          body: { pedido_id: pedido.id, numero_pedido: pedido.numero_pedido },
        });
        if (whError) {
          console.error('Webhook (edge) erro:', whError);
        } else {
          console.log('Webhook (edge) ok:', whData);
        }
      } catch (whErr) {
        console.error('Erro ao invocar função de webhook:', whErr);
      }

      setOrderId(pedido.numero_pedido);
      setOrderComplete(true);
      localStorage.removeItem('cart');
      clearCart();
      
    } catch (error: any) {
      console.error('Erro ao finalizar pedido:', {
        message: error?.message,
        details: error?.details || (error as any)?.cause || null,
      });
      alert((error && error.message) ? `Erro: ${error.message}` : 'Erro ao finalizar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center bg-green-100 rounded-full">
          <i className="ri-check-line text-4xl text-green-600"></i>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Pedido Realizado com Sucesso!</h2>
        <p className="text-gray-600 mb-2">Número do pedido: <span className="font-semibold">#{orderId}</span></p>
        <p className="text-gray-600 mb-8">Você receberá uma notificação no WhatsApp com os detalhes do seu pedido.</p>
        
        <div className="space-y-4">
          <a
            href="/minha-conta"
            className="inline-flex items-center px-6 py-3 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-user-line mr-2"></i>
            Ir para Minha Conta
          </a>
          <br />
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-home-line mr-2"></i>
            Voltar ao Início
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados do Cliente */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <i className="ri-user-line mr-2"></i>
              Dados do Cliente
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={
                    clienteInfo?.nome || (user as any)?.user_metadata?.nome || ''
                  }
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  placeholder="Nome do cliente"
                />
              </div>

              <div>
                <label htmlFor="checkout-cpf" className="block text-sm font-medium text-gray-700 mb-1">CPF <span className="text-red-500">*</span></label>
                {clienteInfo?.cpf ? (
                  <input
                    type="text"
                    id="checkout-cpf"
                    name="cpf"
                    value={formatCPF(clienteInfo.cpf)}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                ) : (
                  <input
                    type="text"
                    id="checkout-cpf"
                    name="cpf"
                    value={formatCPF(cpfInput)}
                    onChange={(e) => setCpfInput(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                )}
                {!clienteInfo?.cpf && cpfInput && !validateCPF(cpfInput) && (
                  <p className="text-xs text-red-600 mt-1">CPF inválido</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <i className="ri-truck-line mr-2"></i>
              Endereço de Entrega
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="checkout-cep" className="block text-sm font-medium text-gray-700 mb-1">CEP <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type="text"
                    id="checkout-cep"
                    name="cep"
                    inputMode="numeric"
                    pattern="\d{5}-?\d{3}"
                    required
                    value={formatCEP(formData.cep)}
                    onChange={(e) => handleCepChange(e.target.value)}
                    onBlur={() => fetchCepData(formData.cep)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm pr-10"
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  {isCepLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
                {cepError && (
                  <p className="text-xs text-red-600 mt-1">{cepError}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="checkout-numero" className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                <input
                  type="text"
                  id="checkout-numero"
                  name="numero"
                  required
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                  placeholder="123"
                />
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="checkout-endereco" className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input
                  type="text"
                  id="checkout-endereco"
                  name="endereco"
                  required
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                  placeholder="Rua, Avenida..."
                />
              </div>
              
              <div>
                <label htmlFor="checkout-complemento" className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                <input
                  type="text"
                  id="checkout-complemento"
                  name="complemento"
                  value={formData.complemento}
                  onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                  placeholder="Apto, Bloco..."
                />
              </div>
              
              <div>
                <label htmlFor="checkout-bairro" className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                <input
                  type="text"
                  id="checkout-bairro"
                  name="bairro"
                  required
                  value={formData.bairro}
                  onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus-border-transparent text-sm"
                  placeholder="Bairro"
                />
              </div>
              
              <div>
                <label htmlFor="checkout-cidade" className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                <input
                  type="text"
                  id="checkout-cidade"
                  name="cidade"
                  required
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus-border-transparent text-sm"
                  placeholder="Cidade"
                />
              </div>
              
              <div>
                <label htmlFor="checkout-estado" className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <input
                  type="text"
                  id="checkout-estado"
                  name="estado"
                  required
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus-border-transparent textsm"
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>
          </div>



          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-pink-700 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Finalizando Pedido...
              </div>
            ) : (
              <>
                <i className="ri-secure-payment-line mr-2"></i>
                Finalizar Pedido
              </>
            )}
          </button>
        </form>
      </div>

      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Pedido</h3>
          
          <div className="space-y-3 mb-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center space-x-3">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-600">{item.size} • {item.color}</p>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">{item.quantity}x</span>
                  <span className="font-medium ml-1">R$ {item.price.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
          
          <hr className="my-4" />
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Frete ({shippingData.method})</span>
              <span>R$ {shippingData.cost.toFixed(2)}</span>
            </div>
            {hasPixDiscount && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Desconto PIX (10%)</span>
                <span className="text-green-600">-R$ {discountAmount.toFixed(2)}</span>
              </div>
            )}
            <hr className="my-2" />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span className="text-pink-600">R$ {finalTotal.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="mt-6 p-3 bg-green-50 rounded-lg">
            <div className="flex items-center text-green-700">
              <i className="ri-shield-check-line mr-2"></i>
              <span className="text-sm font-medium">Compra 100% Segura</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
