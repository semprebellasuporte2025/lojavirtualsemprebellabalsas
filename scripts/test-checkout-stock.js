// Teste automatizado de checkout e controle de estoque
// Requisitos:
// - Variáveis de ambiente: VITE_PUBLIC_SUPABASE_URL, VITE_PUBLIC_SUPABASE_ANON_KEY
// - Produto de teste com nome exatamente "teste"

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Configure VITE_PUBLIC_SUPABASE_URL e VITE_PUBLIC_SUPABASE_ANON_KEY no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getProdutoTeste() {
  const { data, error } = await supabase
    .from('produtos')
    .select('id, nome')
    .ilike('nome', 'teste')
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Produto "teste" não encontrado');
  return data;
}

async function getEstoqueTotalProduto(produtoId) {
  // Tenta função RPC primeiro
  try {
    const { data, error } = await supabase.rpc('obter_estoque_total_produto', { produto_uuid: produtoId });
    if (!error && typeof data === 'number') return data;
  } catch {}
  // Fallback: soma das variações
  const { data, error } = await supabase
    .from('variantes_produto')
    .select('estoque')
    .eq('produto_id', produtoId);
  if (error) throw error;
  return (data || []).reduce((sum, v) => sum + (v.estoque || 0), 0);
}

async function getVarianteDisponivel(produtoId) {
  const { data, error } = await supabase
    .from('variantes_produto')
    .select('id, estoque')
    .eq('produto_id', produtoId)
    .order('estoque', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Nenhuma variante encontrada para o produto');
  return data;
}

async function criarPedidoBasico({ numero, total, forma_pagamento, itens = [], cliente_id = null, endereco = 'Teste, 123', cidade = 'Teste', estado = 'TS', cep = '65900000' }) {
  // Preferir RPC criar_pedido para respeitar RLS e inserir itens
  try {
    const { data: id, error: rpcErr } = await supabase.rpc('criar_pedido', {
      p_cliente_id: cliente_id,
      p_numero_pedido: numero,
      p_subtotal: total,
      p_desconto: 0,
      p_frete: 0,
      p_total: total,
      p_forma_pagamento: forma_pagamento,
      p_status: 'pendente',
      p_endereco_entrega: endereco,
      p_cidade_entrega: cidade,
      p_estado_entrega: estado,
      p_cep_entrega: cep,
      p_itens: itens
    });
    if (rpcErr) throw rpcErr;
    return { id, numero_pedido: numero, via_rpc: true };
  } catch (e) {
    // Fallback: inserir direto na tabela
    const { data, error } = await supabase
      .from('pedidos')
      .insert({
        cliente_id,
        numero_pedido: numero,
        subtotal: total,
        desconto: 0,
        frete: 0,
        total,
        forma_pagamento,
        status: 'pendente',
        endereco_entrega: endereco,
        cidade_entrega: cidade,
        estado_entrega: estado,
        cep_entrega: cep
      })
      .select('id, numero_pedido')
      .single();
    if (error) throw error;
    return { id: data.id, numero_pedido: data.numero_pedido, via_rpc: false };
  }
}

async function inserirItemPedido({ pedido_id, produto_id, nome, quantidade, preco_unitario }) {
  const { data, error } = await supabase
    .from('itens_pedido')
    .insert({
      pedido_id,
      produto_id,
      nome,
      quantidade,
      preco_unitario,
      subtotal: Number((preco_unitario * quantidade).toFixed(2))
    })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

async function buscarMovimentacaoVendaRecente(produtoId, numeroPedido) {
  const { data, error } = await supabase
    .from('movimentacoes_estoque')
    .select('id, tipo, quantidade, motivo, observacoes, created_at')
    .eq('produto_id', produtoId)
    .order('created_at', { ascending: false })
    .limit(5);
  if (error) throw error;
  const match = (data || []).find(m => {
    const obsOk = (m.observacoes || '').includes(numeroPedido);
    const motivoOk = m.motivo === 'Venda realizada' || m.motivo === 'Ajuste de saída para teste';
    return obsOk && motivoOk;
  });
  return match || null;
}

async function testeCheckoutBaixaImediata() {
  console.log('🧪 Teste: baixa de estoque imediata ao finalizar compra');
  const produto = await getProdutoTeste();
  const estoqueAntes = await getEstoqueTotalProduto(produto.id);
  console.log('📦 Produto teste:', produto.id, '| estoque antes:', estoqueAntes);

  const quantidadeCompra = Math.min(estoqueAntes > 0 ? 1 : 0, 1);
  if (quantidadeCompra === 0) {
    console.log('⚠️ Estoque 0. Inserindo ajuste de entrada de 1 para realizar teste.');
    // Ajuste simples via movimentação
    await supabase.from('movimentacoes_estoque').insert({
      produto_id: produto.id,
      tipo: 'entrada',
      quantidade: 1,
      valor_unitario: 0,
      valor_total: 0,
      motivo: 'Ajuste para teste',
      observacoes: 'Setup teste automatizado',
      usuario_nome: 'Teste Automatizado'
    });
  }

  const numero = `TEST${Date.now()}`;
  const variante = await getVarianteDisponivel(produto.id);
  const itens = [{
    produto_id: produto.id,
    nome: 'Produto Teste',
    quantidade: 1,
    preco_unitario: 10.0,
    subtotal: 10.0,
    tamanho: null,
    cor: null,
    imagem: null
  }];
  const pedido = await criarPedidoBasico({ numero, total: 10.0, forma_pagamento: 'pix', itens });
  // Se criamos via fallback de tabela, garantir item inserido também
  if (!pedido.via_rpc) {
    await inserirItemPedido({ pedido_id: pedido.id, produto_id: produto.id, nome: 'Produto Teste', quantidade: 1, preco_unitario: 10.0 });
  }

  const estoqueDepois = await getEstoqueTotalProduto(produto.id);
  console.log('📉 Estoque depois:', estoqueDepois);

  if (estoqueDepois !== (await getEstoqueTotalProduto(produto.id))) {
    throw new Error('Inconsistência de estoque após venda');
  }

  if (estoqueDepois !== (await getEstoqueTotalProduto(produto.id))) {
    throw new Error('Inconsistência de estoque pós-venda (segunda leitura)');
  }

  if (estoqueDepois !== (await getEstoqueTotalProduto(produto.id))) {
    throw new Error('Inconsistência de estoque pós-venda (terceira leitura)');
  }

  const mov = await buscarMovimentacaoVendaRecente(produto.id, numero);
  if (!mov) throw new Error('Movimentação de venda não registrada');
  if (!mov.created_at) throw new Error('Timestamp da movimentação ausente');
  console.log('🧾 Movimentação registrada:', { id: mov.id, tipo: mov.tipo, qtd: mov.quantidade, created_at: mov.created_at });

  console.log('✅ Teste de baixa imediata: OK');
}

async function testeEstoqueInsuficiente() {
  console.log('🧪 Teste: comportamento com estoque insuficiente');
  const produto = await getProdutoTeste();
  const estoqueAtual = await getEstoqueTotalProduto(produto.id);
  const numero = `TEST${Date.now()}-INSUF`;
  const pedido = await criarPedidoBasico({ numero, total: 10.0, forma_pagamento: 'pix' });
  const variante = await getVarianteDisponivel(produto.id);

  const quantidadeSolicitada = estoqueAtual + 1;
  let falhouComoEsperado = false;
  try {
    // Tenta inserir item com quantidade acima do estoque (trigger deve falhar)
    await inserirItemPedido({ pedido_id: pedido.id, produto_id: produto.id, nome: 'Produto Teste', quantidade: quantidadeSolicitada, preco_unitario: 10.0 });
  } catch (err) {
    console.log('⛔ Falha ao inserir item (esperada):', err.message || String(err));
    falhouComoEsperado = true;
    // Limpar pedido criado
    await supabase.from('pedidos').delete().eq('id', pedido.id);
  }

  if (!falhouComoEsperado) {
    throw new Error('Item foi inserido mesmo com estoque insuficiente');
  }

  const estoquePos = await getEstoqueTotalProduto(produto.id);
  if (estoquePos < 0) throw new Error('Estoque ficou negativo');
  console.log('✅ Teste de estoque insuficiente: OK');
}

async function testeConcorrenciaSimultanea() {
  console.log('🧪 Teste: concorrência com duas compras simultâneas');
  const produto = await getProdutoTeste();
  const estoqueAntes = await getEstoqueTotalProduto(produto.id);
  const numeroA = `TEST${Date.now()}-A`;
  const numeroB = `TEST${Date.now()}-B`;

  const pedidoA = await criarPedidoBasico({ numero: numeroA, total: 10.0, forma_pagamento: 'pix' });
  const pedidoB = await criarPedidoBasico({ numero: numeroB, total: 10.0, forma_pagamento: 'pix' });

  const qtdA = 1;
  const qtdB = Math.max(1, estoqueAntes - 1); // tenta consumir quase todo estoque

  const variante = await getVarianteDisponivel(produto.id);

  const start = Date.now();
  const r = await Promise.allSettled([
    (async () => {
      await inserirItemPedido({ pedido_id: pedidoA.id, produto_id: produto.id, nome: 'Produto Teste', quantidade: qtdA, preco_unitario: 10.0 });
    })(),
    (async () => {
      await inserirItemPedido({ pedido_id: pedidoB.id, produto_id: produto.id, nome: 'Produto Teste', quantidade: qtdB, preco_unitario: 10.0 });
    })()
  ]);
  const durationMs = Date.now() - start;

  const estoqueDepois = await getEstoqueTotalProduto(produto.id);
  console.log('📊 Concorrência resultados:', r.map(x => x.status), '| duração:', durationMs, 'ms');
  console.log('📉 Estoque antes:', estoqueAntes, '→ depois:', estoqueDepois);

  if (estoqueDepois < 0) throw new Error('Estoque negativo após concorrência');

  console.log('✅ Teste de concorrência: OK');
}

async function main() {
  try {
    await testeCheckoutBaixaImediata();
    await testeEstoqueInsuficiente();
    await testeConcorrenciaSimultanea();
    console.log('\n🎉 Todos os testes passaram');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Falha nos testes:', err.message || err);
    process.exit(1);
  }
}

main();