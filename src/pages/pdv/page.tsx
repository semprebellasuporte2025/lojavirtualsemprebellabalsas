import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { createOrder, type OrderItem } from '@/lib/orders';

type PaymentMethod = 'dinheiro' | 'cartao' | 'pix';

interface ProdutoBasic {
  id: string;
  nome: string;
  preco: number;
  preco_promocional?: number | null;
  ativo?: boolean;
  imagens?: string[];
  referencia?: string | null;
}

interface VarianteBasic {
  id: string;
  produto_id: string;
  tamanho?: string | null;
  cor?: string | null;
  estoque: number;
  sku?: string | null;
}

interface CartItem extends OrderItem {
  variantId?: string | null;
}

interface SaleHistoryItem {
  id: string;
  numero_pedido: string;
  total: number;
  forma_pagamento: PaymentMethod;
  created_at: string;
  itens: OrderItem[];
  operador?: string | null;
}

const HISTORY_KEY = 'pdv-sales-history';

function currency(value: number) {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

async function buscarVariantePorSku(sku: string): Promise<{ produto: ProdutoBasic; variante: VarianteBasic } | null> {
  const { data: variantes, error } = await supabase
    .from('variantes_produto')
    .select('id, produto_id, tamanho, cor, estoque, sku, produtos(id, nome, preco, preco_promocional, ativo, imagens, referencia)')
    .eq('sku', sku)
    .limit(1);

  if (error) {
    console.error('Erro ao buscar SKU:', error);
    return null;
  }
  const v = Array.isArray(variantes) ? variantes[0] : null;
  if (!v || !v.produtos) return null;
  return {
    produto: {
      id: v.produtos.id,
      nome: v.produtos.nome,
      preco: Number(v.produtos.preco ?? 0),
      preco_promocional: v.produtos.preco_promocional,
      ativo: v.produtos.ativo,
      imagens: v.produtos.imagens,
      referencia: v.produtos.referencia,
    },
    variante: {
      id: v.id,
      produto_id: v.produto_id,
      tamanho: v.tamanho,
      cor: v.cor,
      estoque: Number(v.estoque ?? 0),
      sku: v.sku,
    }
  };
}

async function buscarProdutoPorCodigoOuNome(code: string): Promise<ProdutoBasic[]> {
  const termo = code.trim();

  // Sem termo: retornar últimos produtos ativos como sugestão
  if (!termo) {
    const { data, error } = await supabase
      .from('produtos')
      .select('id, nome, preco, preco_promocional, ativo, imagens, referencia')
      .eq('ativo', true)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) {
      console.error('Erro ao buscar produtos (vazio):', error);
      alert(`Erro ao buscar produtos: ${error.message}`);
      return [];
    }
    return Array.isArray(data) ? data : [];
  }

  // 1) Buscar por nome
  const { data: byNome, error: errNome } = await supabase
    .from('produtos')
    .select('id, nome, preco, preco_promocional, ativo, imagens, referencia')
    .ilike('nome', `%${termo}%`)
    .eq('ativo', true)
    .limit(20);

  // 2) Se necessário, buscar por referência
  const { data: byRef, error: errRef } = await supabase
    .from('produtos')
    .select('id, nome, preco, preco_promocional, ativo, imagens, referencia')
    .ilike('referencia', `%${termo}%`)
    .eq('ativo', true)
    .limit(20);

  if (errNome || errRef) {
    console.error('Erro ao buscar produtos:', errNome || errRef);
    alert('Erro ao buscar produtos. Tente novamente.');
  }

  const arrNome = Array.isArray(byNome) ? byNome : [];
  const arrRef = Array.isArray(byRef) ? byRef : [];
  // Unificar resultados por id
  const map = new Map<string, ProdutoBasic>();
  [...arrNome, ...arrRef].forEach((p: any) => {
    if (p && p.id) map.set(String(p.id), p);
  });
  return Array.from(map.values()).slice(0, 20);
}

async function obterVariantesProduto(produtoId: string): Promise<VarianteBasic[]> {
  const { data, error } = await supabase
    .from('variantes_produto')
    .select('id, produto_id, tamanho, cor, estoque, sku')
    .eq('produto_id', produtoId)
    .eq('ativo', true)
    .order('estoque', { ascending: false });

  if (error) {
    console.error('Erro ao buscar variantes:', error);
    return [];
  }
  return Array.isArray(data) ? data.map(v => ({
    id: v.id,
    produto_id: v.produto_id as string,
    tamanho: v.tamanho,
    cor: v.cor,
    estoque: Number(v.estoque ?? 0),
    sku: v.sku,
  })) : [];
}

export default function PDVPage() {
  const navigate = useNavigate();
  const { user, isAdmin, isAtendente, loading } = useAuth();

  const [scanInput, setScanInput] = useState('');
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [resultadosBusca, setResultadosBusca] = useState<ProdutoBasic[]>([]);
  const [carregandoBusca, setCarregandoBusca] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [descontoValor, setDescontoValor] = useState(0);
  const [acrescimoValor, setAcrescimoValor] = useState(0);
  const [payment, setPayment] = useState<PaymentMethod>('dinheiro');
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [clienteCpf, setClienteCpf] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [salvandoCliente, setSalvandoCliente] = useState(false);
  const [history, setHistory] = useState<SaleHistoryItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Carregar histórico local
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const arr = JSON.parse(raw) as SaleHistoryItem[];
        setHistory(arr);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [buscaAberta]);

  // Busca incremental: sugere produtos enquanto digita
  useEffect(() => {
    const termo = scanInput.trim();
    const timer = setTimeout(async () => {
      if (termo.length >= 2) {
        setCarregandoBusca(true);
        try {
          const produtos = await buscarProdutoPorCodigoOuNome(termo);
          setResultadosBusca(produtos);
          setShowSuggestions(produtos.length > 0);
        } catch {
          setResultadosBusca([]);
          setShowSuggestions(false);
        } finally {
          setCarregandoBusca(false);
        }
      } else {
        setResultadosBusca([]);
        setShowSuggestions(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [scanInput]);

  const subtotal = useMemo(() => cart.reduce((sum, it) => sum + it.subtotal, 0), [cart]);
  const total = useMemo(() => Math.max(0, subtotal - Math.max(0, descontoValor) + Math.max(0, acrescimoValor)), [subtotal, descontoValor, acrescimoValor]);

  useEffect(() => {
    if (!loading && !user) {
      // Usuário não autenticado: pedir login
      navigate('/auth/login');
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"><p>Carregando...</p></div>
    );
  }

  if (!(isAdmin || isAtendente)) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Acesso restrito</h1>
        <p className="text-gray-600">Somente Admin e Atendente podem acessar o PDV.</p>
      </div>
    );
  }

  const precoFinal = (p: ProdutoBasic) => Number(p.preco_promocional ?? p.preco ?? 0);

  const adicionarItem = (produto: ProdutoBasic, variante?: VarianteBasic, quantidade = 1) => {
    const preco = precoFinal(produto);
    const nome = produto.nome;
    // Valida estoque (para variante quando fornecida, senão agregada via RPC)
    const add = async () => {
      let estoqueDisponivel = 0;
      if (variante) {
        estoqueDisponivel = Number(variante.estoque ?? 0);
      } else {
        const { data: ok } = await supabase.rpc('verificar_estoque_suficiente', { produto_uuid: produto.id, quantidade_requerida: quantidade });
        estoqueDisponivel = ok ? quantidade : 0;
      }
      if (estoqueDisponivel <= 0) {
        alert('Estoque insuficiente para este item.');
        return;
      }
      const imagem = Array.isArray(produto.imagens) && produto.imagens.length > 0 ? produto.imagens[0] : null;
      const item: CartItem = {
        produto_id: produto.id,
        nome,
        quantidade,
        preco_unitario: preco,
        subtotal: preco * quantidade,
        tamanho: variante?.tamanho || null,
        cor: variante?.cor || null,
        imagem,
        variantId: variante?.id || null,
      };
      setCart(prev => {
        const idx = prev.findIndex(i => i.produto_id === item.produto_id && i.tamanho === item.tamanho && i.cor === item.cor);
        if (idx >= 0) {
          const copy = [...prev];
          const newQty = copy[idx].quantidade + quantidade;
          copy[idx] = { ...copy[idx], quantidade: newQty, subtotal: newQty * copy[idx].preco_unitario };
          return copy;
        }
        return [...prev, item];
      });
    };
    add();
  };

  const removerItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const atualizarQuantidade = (index: number, quantidade: number) => {
    setCart(prev => prev.map((it, i) => i === index ? { ...it, quantidade, subtotal: quantidade * it.preco_unitario } : it));
  };

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = scanInput.trim();
    if (!code) return;
    // 1) tenta SKU de variação
    const matchVar = await buscarVariantePorSku(code);
    if (matchVar && matchVar.produto.ativo !== false) {
      adicionarItem(matchVar.produto, matchVar.variante, 1);
      setScanInput('');
      inputRef.current?.focus();
      return;
    }
    // 2) Se não for SKU, usa primeira sugestão disponível
    if (resultadosBusca.length > 0) {
      await escolherProduto(resultadosBusca[0]);
      setShowSuggestions(false);
      return;
    }
    // 3) Fallback: consultar e adicionar primeiro resultado
    setCarregandoBusca(true);
    const produtos = await buscarProdutoPorCodigoOuNome(code);
    setResultadosBusca(produtos);
    setCarregandoBusca(false);
    if (produtos.length > 0) {
      await escolherProduto(produtos[0]);
      setShowSuggestions(false);
      return;
    }
    alert('Nenhum produto encontrado para o termo informado.');
  };

  const abrirBuscaRapida = async () => {
    setCarregandoBusca(true);
    const produtos = await buscarProdutoPorCodigoOuNome(scanInput);
    setResultadosBusca(produtos);
    setBuscaAberta(true);
    setCarregandoBusca(false);
  };

  const escolherProduto = async (produto: ProdutoBasic) => {
    const variantes = await obterVariantesProduto(produto.id);
    if (variantes.length <= 1) {
      adicionarItem(produto, variantes[0]);
      setBuscaAberta(false);
      setScanInput('');
      inputRef.current?.focus();
      return;
    }
    // Quando há múltiplas variantes, escolher a de maior estoque por padrão
    const varMaisEstoque = variantes.sort((a, b) => b.estoque - a.estoque)[0];
    adicionarItem(produto, varMaisEstoque);
    setBuscaAberta(false);
    setScanInput('');
    inputRef.current?.focus();
  };

  const salvarClienteRapido = async () => {
    if (!clienteNome.trim()) {
      alert('Informe ao menos o nome do cliente.');
      return;
    }
    try {
      setSalvandoCliente(true);
      const payload: any = {
        nome: clienteNome.trim(),
        telefone: clienteTelefone.trim() || null,
        cpf: clienteCpf.trim() || null,
        email: clienteEmail.trim() || null,
        ativo: true,
      };
      const { data, error } = await supabase
        .from('clientes')
        .insert(payload)
        .select('id')
        .single();
      if (error) throw error;
      setClienteId(String((data as any)?.id));
      alert('Cliente cadastrado com sucesso!');
    } catch (err: any) {
      alert(`Erro ao cadastrar cliente: ${err.message}`);
    } finally {
      setSalvandoCliente(false);
    }
  };

  const gerarNumeroPedido = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `PDV-${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
  };

  const imprimirRecibo = (numero_pedido: string, itens: OrderItem[], totalPago: number, forma: PaymentMethod) => {
    const w = window.open('', '_blank');
    if (!w) return;
    const linhas = itens.map(it => `<tr><td>${it.nome}</td><td>${it.quantidade}</td><td style="text-align:right">${currency(it.preco_unitario)}</td><td style="text-align:right">${currency(it.subtotal)}</td></tr>`).join('');
    w.document.write(`
      <html><head><title>Recibo ${numero_pedido}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 16px; }
        h1 { font-size: 16px; }
        table { width: 100%; border-collapse: collapse; }
        td, th { border-bottom: 1px solid #eee; padding: 6px; font-size: 12px; }
        .totais { margin-top: 12px; text-align: right; font-size: 14px; }
      </style>
      </head>
      <body>
        <h1>Comprovante de Venda - ${numero_pedido}</h1>
        <p>Operador: ${user?.email || user?.user_metadata?.name || 'PDV'}</p>
        <table><thead><tr><th>Item</th><th>Qtd</th><th>Preço</th><th>Subtotal</th></tr></thead>
        <tbody>${linhas}</tbody></table>
        <div class="totais">
          <div><strong>Total pago:</strong> ${currency(totalPago)}</div>
          <div><strong>Pagamento:</strong> ${forma}</div>
          <div>${new Date().toLocaleString('pt-BR')}</div>
        </div>
      </body></html>
    `);
    w.document.close();
    w.focus();
    w.print();
  };

  const finalizarVenda = async () => {
    if (cart.length === 0) {
      alert('Adicione ao menos um item.');
      return;
    }
    try {
      const numero = gerarNumeroPedido();
      const pedidoId = await createOrder({
        cliente_id: clienteId || null,
        numero_pedido: numero,
        subtotal,
        desconto: Math.max(0, descontoValor),
        frete: 0,
        total,
        forma_pagamento: payment,
        status: 'pago',
        endereco_entrega: null,
        itens: cart.map(it => ({
          produto_id: it.produto_id,
          nome: it.nome,
          quantidade: it.quantidade,
          preco_unitario: it.preco_unitario,
          subtotal: it.subtotal,
          tamanho: it.tamanho || null,
          cor: it.cor || null,
          imagem: it.imagem || null,
        }))
      });

      // Atualiza histórico local
      const nova: SaleHistoryItem = {
        id: pedidoId,
        numero_pedido: numero,
        total,
        forma_pagamento: payment,
        created_at: new Date().toISOString(),
        itens: cart,
        operador: user?.email || null,
      };
      const novoHistorico = [nova, ...history].slice(0, 50);
      setHistory(novoHistorico);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(novoHistorico));

      imprimirRecibo(numero, cart, total, payment);
      // Resetar carrinho
      setCart([]);
      setDescontoValor(0);
      setAcrescimoValor(0);
      setPayment('dinheiro');
      setScanInput('');
      inputRef.current?.focus();
    } catch (err: any) {
      alert(`Falha ao finalizar venda: ${err.message}`);
    }
  };

  const reimprimir = (h: SaleHistoryItem) => {
    imprimirRecibo(h.numero_pedido, h.itens, h.total, h.forma_pagamento);
  };

  const cancelarVenda = async (h: SaleHistoryItem) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: 'cancelado' })
        .eq('id', h.id);
      if (error) throw error;
      alert('Venda cancelada. Estoque será revertido automaticamente.');
      // Marca historico local
      setHistory(prev => prev.map(x => x.id === h.id ? { ...x, numero_pedido: `${x.numero_pedido} (cancelado)` } : x));
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (err: any) {
      alert(`Erro ao cancelar venda: ${err.message}`);
    }
  };

  const fecharCaixaHoje = async () => {
    try {
      const inicio = new Date();
      inicio.setHours(0,0,0,0);
      const fim = new Date();
      fim.setHours(23,59,59,999);
      const { data, error } = await supabase
        .from('pedidos')
        .select('id, numero_pedido, forma_pagamento, total, status, created_at')
        .ilike('numero_pedido', 'PDV-%')
        .gte('created_at', inicio.toISOString())
        .lte('created_at', fim.toISOString())
        .neq('status', 'cancelado');
      if (error) throw error;
      const lista = Array.isArray(data) ? data : [];
      const totalGeral = lista.reduce((s, p: any) => s + Number(p.total ?? 0), 0);
      const byMethod: Record<PaymentMethod, number> = { dinheiro: 0, cartao: 0, pix: 0 } as any;
      lista.forEach((p: any) => {
        const m = String(p.forma_pagamento || '').toLowerCase() as PaymentMethod;
        if (m in byMethod) byMethod[m] += Number(p.total ?? 0);
      });
      const w = window.open('', '_blank');
      if (!w) return;
      w.document.write(`
        <html><head><title>Fechamento de Caixa</title>
        <style>body{font-family:Arial;padding:16px} h1{font-size:18px} .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}</style>
        </head><body>
        <h1>Fechamento de Caixa - ${new Date().toLocaleDateString('pt-BR')}</h1>
        <div class="grid">
          <div><strong>Dinheiro:</strong> ${currency(byMethod.dinheiro)}</div>
          <div><strong>Cartão:</strong> ${currency(byMethod.cartao)}</div>
          <div><strong>PIX:</strong> ${currency(byMethod.pix)}</div>
          <div><strong>Total Geral:</strong> ${currency(totalGeral)}</div>
        </div>
        </body></html>
      `);
      w.document.close();
      w.focus();
      w.print();
    } catch (err: any) {
      alert(`Erro ao fechar caixa: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">PDV - Vendas no Balcão</h1>
          <p className="text-sm text-gray-600">Operador: {user?.email || user?.user_metadata?.name || '—'}</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 bg-indigo-600 text-white rounded" onClick={fecharCaixaHoje}>Fechamento de Caixa</button>
        </div>
      </div>

      {/* Entrada por código/sku */}
      <form onSubmit={handleScanSubmit} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            value={scanInput}
            onChange={e => setScanInput(e.target.value)}
            placeholder="Digite para buscar por Nome/Referência ou informe um SKU"
            className="w-full border rounded px-3 py-2"
            autoComplete="off"
          />
          {showSuggestions && (
            <div className="absolute z-50 top-full left-0 right-0 bg-white border rounded shadow mt-1 max-h-64 overflow-auto">
              {carregandoBusca ? (
                <div className="p-3 text-sm text-gray-600">Carregando...</div>
              ) : resultadosBusca.length === 0 ? (
                <div className="p-3 text-sm text-gray-500">Nenhum produto encontrado.</div>
              ) : (
                resultadosBusca.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full text-left p-3 hover:bg-gray-50"
                    onClick={async () => {
                      await escolherProduto(p);
                      setShowSuggestions(false);
                      setScanInput('');
                      inputRef.current?.focus();
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{p.nome}</div>
                        <div className="text-xs text-gray-500">Ref.: {p.referencia || '—'}</div>
                      </div>
                      <div className="text-sm">{currency(precoFinal(p))}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <button type="submit" className="px-3 py-2 bg-pink-600 text-white rounded">Adicionar</button>
        <button type="button" className="px-3 py-2 border rounded" onClick={abrirBuscaRapida}>Buscar</button>
      </form>

      {/* Área principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Itens do carrinho */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Itens</h2>
          {cart.length === 0 ? (
            <p className="text-gray-500">Nenhum item adicionado.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="py-2">Produto</th>
                  <th>Var.</th>
                  <th style={{width:80}}>Qtd</th>
                  <th style={{width:100}} className="text-right">Preço</th>
                  <th style={{width:120}} className="text-right">Subtotal</th>
                  <th style={{width:80}}></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((it, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="py-2">{it.nome}</td>
                    <td>{[it.tamanho, it.cor].filter(Boolean).join(' / ') || '-'}</td>
                    <td>
                      <input type="number" min={1} value={it.quantidade}
                        onChange={e => atualizarQuantidade(idx, Math.max(1, Number(e.target.value) || 1))}
                        className="w-20 border rounded px-2 py-1" />
                    </td>
                    <td className="text-right">{currency(it.preco_unitario)}</td>
                    <td className="text-right">{currency(it.subtotal)}</td>
                    <td>
                      <button className="text-red-600" onClick={() => removerItem(idx)}>Cancelar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Totais e pagamento */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Totais</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{currency(subtotal)}</span></div>
            <div className="flex items-center justify-between">
              <label className="mr-2">Desconto</label>
              <input type="number" min={0} value={descontoValor} onChange={e => setDescontoValor(Math.max(0, Number(e.target.value) || 0))} className="w-32 border rounded px-2 py-1 text-right" />
            </div>
            <div className="flex items-center justify-between">
              <label className="mr-2">Acréscimo</label>
              <input type="number" min={0} value={acrescimoValor} onChange={e => setAcrescimoValor(Math.max(0, Number(e.target.value) || 0))} className="w-32 border rounded px-2 py-1 text-right" />
            </div>
            <div className="flex justify-between font-semibold text-base"><span>Total</span><span>{currency(total)}</span></div>
          </div>

          <h3 className="text-md font-semibold mt-4 mb-2">Forma de pagamento</h3>
          <div className="flex gap-4 text-sm">
            {(['dinheiro','cartao','pix'] as PaymentMethod[]).map(m => (
              <label key={m} className="flex items-center gap-2">
                <input type="radio" name="payment" checked={payment === m} onChange={() => setPayment(m)} /> {m}
              </label>
            ))}
          </div>

          <button className="w-full mt-4 px-3 py-2 bg-green-600 text-white rounded" onClick={finalizarVenda}>Finalizar e emitir recibo</button>

          {/* Cadastro rápido de cliente (opcional) */}
          <div className="mt-6 border-t pt-4">
            <h3 className="text-md font-semibold mb-2">Cadastro rápido de cliente (opcional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input className="border rounded px-2 py-1" placeholder="Nome" value={clienteNome} onChange={e => setClienteNome(e.target.value)} />
              <input className="border rounded px-2 py-1" placeholder="Telefone" value={clienteTelefone} onChange={e => setClienteTelefone(e.target.value)} />
              <input className="border rounded px-2 py-1" placeholder="CPF" value={clienteCpf} onChange={e => setClienteCpf(e.target.value)} />
              <input className="border rounded px-2 py-1" placeholder="E-mail" value={clienteEmail} onChange={e => setClienteEmail(e.target.value)} />
            </div>
            <div className="flex gap-2 mt-2">
              <button className="px-3 py-2 border rounded" onClick={salvarClienteRapido} disabled={salvandoCliente}>{salvandoCliente ? 'Salvando...' : 'Salvar cliente'}</button>
              {clienteId && <span className="text-green-600 text-sm">Cliente vinculado</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Histórico local */}
      <div className="bg-white rounded shadow p-4 mt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Histórico de vendas (local)</h2>
          <button className="px-3 py-2 border rounded" onClick={() => { localStorage.removeItem(HISTORY_KEY); setHistory([]); }}>Limpar histórico</button>
        </div>
        {history.length === 0 ? (
          <p className="text-gray-500 text-sm">Sem vendas registradas localmente.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th>Pedido</th>
                <th>Data</th>
                <th>Pagamento</th>
                <th className="text-right">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id} className="border-t">
                  <td className="py-2">{h.numero_pedido}</td>
                  <td>{new Date(h.created_at).toLocaleString('pt-BR')}</td>
                  <td>{h.forma_pagamento}</td>
                  <td className="text-right">{currency(h.total)}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button className="px-2 py-1 border rounded" onClick={() => reimprimir(h)}>Reimprimir</button>
                      <button className="px-2 py-1 border rounded text-red-600" onClick={() => cancelarVenda(h)}>Cancelar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de busca rápida */}
      {buscaAberta && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded shadow-lg w-full max-w-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Busca de produtos</h3>
              <button className="px-2 py-1 border rounded" onClick={() => setBuscaAberta(false)}>Fechar</button>
            </div>
            <div className="mb-3">
              <input className="w-full border rounded px-3 py-2" placeholder="Digite parte do nome ou referência" value={scanInput} onChange={e => setScanInput(e.target.value)} />
            </div>
            {carregandoBusca ? (
              <p className="text-sm text-gray-600">Carregando...</p>
            ) : resultadosBusca.length === 0 ? (
              <p className="text-sm text-gray-600">Nenhum produto encontrado.</p>
            ) : (
              <div className="max-h-80 overflow-auto divide-y">
                {resultadosBusca.map(p => (
                  <button key={p.id} className="w-full text-left p-3 hover:bg-gray-50" onClick={() => escolherProduto(p)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{p.nome}</div>
                        <div className="text-xs text-gray-500">Ref.: {p.referencia || '—'}</div>
                      </div>
                      <div className="text-sm">{currency(precoFinal(p))}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
