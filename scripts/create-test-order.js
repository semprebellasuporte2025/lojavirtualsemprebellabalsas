import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

dotenv.config();

const ADMIN_EMAIL = 'semprebellasuporte2025@gmail.com';
const ADMIN_PASSWORD = '123456';

const SUPABASE_URL = process.env.VITE_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Variáveis do Supabase não configuradas no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
  global: { headers: {} },
});

function numeroPedido() {
  const ts = Date.now().toString().slice(-6);
  return `SB-TEST-${ts}`;
}

async function main() {
  console.log('Criando pedido de teste com item...');

  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (loginError) {
    console.error('Falha no login admin:', loginError.message);
    process.exit(1);
  }
  console.log('Login admin OK:', loginData.user?.email);

  const { data: produto, error: prodErr } = await supabase
    .from('produtos')
    .select('id, nome, preco')
    .eq('ativo', true)
    .eq('nome', 'teste')
    .limit(1)
    .maybeSingle();

  // Fallback: se não encontrar o produto "teste", pegar o mais recente ativo
  let produtoSelecionado = produto;
  if (!produtoSelecionado || prodErr) {
    const { data: fallbackProduto, error: fallbackErr } = await supabase
      .from('produtos')
      .select('id, nome, preco')
      .eq('ativo', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fallbackErr) {
      console.error('Erro ao buscar produto ativo:', fallbackErr.message);
      process.exit(1);
    }
    produtoSelecionado = fallbackProduto;
  }

  if (!produtoSelecionado) {
    console.error('Nenhum produto ativo encontrado.');
    process.exit(1);
  }

  const unit = Number(produtoSelecionado.preco || 50);
  const qtd = 1;
  const subtotal = unit * qtd;
  const frete = 0;
  const total = subtotal + frete;
  const num = numeroPedido();

  const { data: pedido, error: pedErr } = await supabase
    .from('pedidos')
    .insert({
      cliente_id: null,
      numero_pedido: num,
      subtotal,
      frete,
      total,
      forma_pagamento: 'pix',
      status: 'pendente',
      endereco_entrega: {
        endereco: 'Rua Teste',
        numero: '123',
        complemento: 'Sala 1',
        bairro: 'Centro',
        cidade: 'Balsas',
        estado: 'MA',
        cep: '65800-000',
      },
    })
    .select('id, numero_pedido')
    .single();

  if (pedErr) {
    console.error('Erro ao inserir pedido:', pedErr.message);
    process.exit(1);
  }

  const { error: itensErr } = await supabase
    .from('itens_pedido')
    .insert({
      pedido_id: pedido.id,
      produto_id: produtoSelecionado.id,
      nome: produtoSelecionado.nome,
      quantidade: qtd,
      preco_unitario: unit,
      subtotal,
      tamanho: null,
      cor: null,
      imagem: null,
    });

  if (itensErr) {
    console.error('Erro ao inserir item do pedido:', itensErr.message);
    // Tentar limpar pedido
    await supabase.from('pedidos').delete().eq('id', pedido.id);
    process.exit(1);
  }

  console.log('Pedido criado:', pedido.numero_pedido, 'ID:', pedido.id);

  // Persistir dados do último pedido para uso em outros scripts
  try {
    const outPath = path.join('scripts', '.last-order.json');
    fs.writeFileSync(outPath, JSON.stringify({ id: pedido.id, numero_pedido: pedido.numero_pedido }, null, 2));
    console.log('Dados do último pedido gravados em', outPath);
  } catch (e) {
    console.warn('Falha ao gravar last-order:', e.message);
  }
}

main().catch(err => {
  console.error('Erro inesperado:', err);
  process.exit(1);
});