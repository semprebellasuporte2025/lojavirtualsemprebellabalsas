import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Credenciais do admin fornecidas
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

async function pickOrder() {
  // Primeiro tenta usar o último pedido gravado
  try {
    const outPath = path.join('scripts', '.last-order.json');
    if (fs.existsSync(outPath)) {
      const raw = fs.readFileSync(outPath, 'utf-8');
      const last = JSON.parse(raw);
      if (last?.id) {
        const { data, error } = await supabase
          .from('pedidos')
          .select('*')
          .eq('id', last.id)
          .single();
        if (!error && data) return data;
      }
    }
  } catch {}

  const { data: pedidos, error } = await supabase
    .from('pedidos')
    .select('*')
    .like('numero_pedido', 'SB-TEST-%')
    .neq('status', 'cancelado')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw error;
  if (!pedidos || pedidos.length === 0) return null;
  return pedidos[0];
}

async function main() {
  console.log('Iniciando teste de cancelamento de pedido...');

  // 1) Login
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (loginError) {
    console.error('Falha no login admin:', loginError.message);
    process.exit(1);
  }
  console.log('Login admin OK:', loginData.user?.email);

  // 2) Escolher pedido com itens
  const pedido = await pickOrder();
  if (!pedido) {
    console.warn('Nenhum pedido elegível encontrado para cancelar.');
    process.exit(0);
  }
  console.log('Pedido alvo:', pedido.numero_pedido, pedido.id, 'status atual:', pedido.status);

  // 3) Cancelar o pedido
  const { data: updated, error: updError } = await supabase
    .from('pedidos')
    .update({ status: 'cancelado' })
    .eq('id', pedido.id)
    .select('*');
  if (updError) {
    console.error('Falha ao atualizar status para cancelado:', updError.message);
    process.exit(1);
  }
  console.log('Status atualizado para cancelado.');

  // 4) Espera breve para triggers e inserções
  await new Promise(r => setTimeout(r, 1200));

  // 5) Inserir movimentações de entrada (mimetiza o comportamento do app)
  const { data: itensPedido, error: itensErr } = await supabase
    .from('itens_pedido')
    .select('produto_id, quantidade, preco_unitario, subtotal')
    .eq('pedido_id', pedido.id);
  if (itensErr) {
    console.error('Falha ao buscar itens do pedido:', itensErr.message);
    process.exit(1);
  }

  if (itensPedido && itensPedido.length > 0) {
    const movimentos = itensPedido.map(item => ({
      produto_id: item.produto_id,
      tipo: 'entrada',
      quantidade: item.quantidade,
      valor_unitario: item.preco_unitario ?? 0,
      valor_total: item.subtotal ?? 0,
      motivo: 'Cancelamento de pedido',
      observacoes: `Cancelamento - Pedido: ${pedido.numero_pedido}`,
      usuario_nome: 'Sistema - Cancelamento via Script',
    }));

    const { error: movInsErr } = await supabase
      .from('movimentacoes_estoque')
      .insert(movimentos);
    if (movInsErr) {
      console.error('Falha ao inserir movimentações de entrada:', movInsErr.message);
      process.exit(1);
    }
    console.log('Movimentações de entrada inseridas para cancelamento.');
  } else {
    console.warn('Pedido sem itens; nenhuma movimentação de entrada a registrar.');
  }

  // 6) Verificar movimentações de cancelamento
  const { data: movs, error: movErr } = await supabase
    .from('movimentacoes_estoque')
    .select('id, tipo, quantidade, motivo, observacoes')
    .eq('motivo', 'Cancelamento de pedido')
    .ilike('observacoes', `%Pedido: ${pedido.numero_pedido}%`);
  if (movErr) {
    console.error('Falha ao consultar movimentações de cancelamento:', movErr.message);
    process.exit(1);
  }

  if (!movs || movs.length === 0) {
    console.warn('Nenhuma movimentação de cancelamento encontrada para o pedido.');
  } else {
    const resumo = movs.map(m => `${m.id} [${m.tipo}] q=${m.quantidade}`).join(', ');
    console.log(`Movimentações de cancelamento encontradas (${movs.length}):`, resumo);
  }

  console.log('Teste concluído.');
}

main().catch(err => {
  console.error('Erro inesperado no teste:', err);
  process.exit(1);
});