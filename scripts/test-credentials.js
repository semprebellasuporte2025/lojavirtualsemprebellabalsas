// Verificação das credenciais e testes de conectividade
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const env = {
  SUPABASE_URL: process.env.VITE_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON: process.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
  MP_PUBLIC_KEY: process.env.VITE_MP_PUBLIC_KEY,
};

function mask(str) {
  if (!str) return 'não definido';
  if (str.length <= 8) return `${str.slice(0, 3)}***`;
  return `${str.slice(0, 6)}…${str.slice(-6)}`;
}

async function testSupabaseConnection(url, anon) {
  console.log('\n🔗 Testando conexão com Supabase (select produtos)...');
  const client = createClient(url, anon);
  const { data, error } = await client.from('produtos').select('id').limit(1);
  if (error) {
    console.log('❌ Erro na consulta:', error.message || error);
  } else {
    console.log('✅ Consulta OK:', Array.isArray(data) ? `${data.length} registro(s)` : data);
  }
}

async function testRpcExists(url, anon) {
  console.log('\n🧪 Testando existência da RPC criar_pedido (chamada com payload vazio)...');
  try {
    const client = createClient(url, anon);
    const { error } = await client.rpc('criar_pedido', {});
    if (!error) {
      console.log('✅ Função encontrada (resposta sem erro).');
    } else {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('not found') || msg.includes('could not find')) {
        console.log('❌ Função NÃO encontrada (404).');
      } else if (msg.includes('missing required input') || msg.includes('required')) {
        console.log('✅ Função encontrada, mas faltam parâmetros (esperado).');
      } else {
        console.log('⚠️ Função respondeu com erro:', error.message);
      }
    }
  } catch (e) {
    console.log('💥 Erro geral ao verificar RPC:', e.message || e);
  }
}

async function testEdgeFunction(url, anon) {
  console.log('\n🌐 Testando Edge Function pagar-mp (OPTIONS e POST)...');
  const endpoint = `${url}/functions/v1/pagar-mp`;

  try {
    const preflight = await fetch(endpoint, { method: 'OPTIONS' });
    console.log('➡️ Preflight:', preflight.status, preflight.statusText);
  } catch (e) {
    console.log('❌ Falha no preflight OPTIONS:', e.message || e);
  }

  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anon}`,
      },
      body: JSON.stringify({ method: 'pix', amount: 1, payer: { email: 'dev@example.com' } }),
    });
    const text = await resp.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    console.log('➡️ POST pagar-mp:', resp.status, resp.statusText);
    console.log('📦 Resposta:', JSON.stringify(json, null, 2));
    if (resp.status === 404) {
      console.log('❗ A função parece NÃO estar deployada.');
    } else if (resp.status === 500 && json?.error?.includes('MP_ACCESS_TOKEN')) {
      console.log('❗ MP_ACCESS_TOKEN não configurado no ambiente das Functions.');
    }
  } catch (e) {
    console.log('❌ Falha no POST:', e.message || e);
  }
}

async function main() {
  console.log('🔑 Credenciais:');
  console.log('  VITE_PUBLIC_SUPABASE_URL:', env.SUPABASE_URL || 'não definido');
  console.log('  VITE_PUBLIC_SUPABASE_ANON_KEY:', mask(env.SUPABASE_ANON));
  console.log('  VITE_MP_PUBLIC_KEY:', mask(env.MP_PUBLIC_KEY));

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON) {
    console.log('\n❌ Supabase URL/Anon não definidos nas variáveis de ambiente (.env).');
    console.log('   Configure VITE_PUBLIC_SUPABASE_URL e VITE_PUBLIC_SUPABASE_ANON_KEY.');
    return;
  }

  await testSupabaseConnection(env.SUPABASE_URL, env.SUPABASE_ANON);
  await testRpcExists(env.SUPABASE_URL, env.SUPABASE_ANON);
  await testEdgeFunction(env.SUPABASE_URL, env.SUPABASE_ANON);

  console.log('\n✅ Testes de credenciais concluídos.');
}

main().catch((e) => {
  console.error('💥 Erro geral:', e.message || e);
});