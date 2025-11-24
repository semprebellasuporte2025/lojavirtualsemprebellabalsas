// Testa o disparo do webhook de pedido via Edge Function
// Uso: node scripts/test-order-webhook.js --pedidoId <ID> --numero <NUMERO>

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Configure VITE_PUBLIC_SUPABASE_URL e VITE_PUBLIC_SUPABASE_ANON_KEY no .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--pedidoId') out.pedidoId = args[++i];
    else if (a === '--numero') out.numeroPedido = args[++i];
  }
  return out;
}

async function main() {
  const { pedidoId, numeroPedido } = parseArgs();
  if (!pedidoId && !numeroPedido) {
    console.error('❌ Informe --pedidoId ou --numero');
    process.exit(1);
  }

  console.log('🚀 Invocando dispatch-order-webhook...', { pedidoId, numeroPedido });
  const { data, error } = await supabase.functions.invoke('dispatch-order-webhook', {
    body: { pedidoId, numeroPedido },
  });

  if (error) {
    console.error('❌ Erro na Edge Function:', error.message || String(error));
    process.exit(1);
  }

  console.log('✅ Resposta:', data);
  console.log('ℹ️ Verifique seu n8n para confirmar o recebimento.');
}

main().catch((err) => {
  console.error('💥 Falha ao testar webhook:', err);
  process.exit(1);
});