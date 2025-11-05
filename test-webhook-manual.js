// Script para testar manualmente o webhook
import { createClient } from '@supabase/supabase-js';

// Carrega as variáveis do .env
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY; // Pode precisar da service role
const WEBHOOK_URL = process.env.VITE_ORDER_WEBHOOK_URL;

console.log('Configurações carregadas:');
console.log('- SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
console.log('- SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '✓' : '✗');
console.log('- WEBHOOK_URL:', WEBHOOK_URL);

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !WEBHOOK_URL) {
  console.error('❌ Variáveis de ambiente ausentes!');
  process.exit(1);
}

// Testa a função manualmente
async function testWebhook() {
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    
    // Busca o último pedido
    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select('id, numero_pedido')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao buscar pedidos:', error);
      return;
    }
    
    // Testa com o número do pedido fornecido pelo usuário
    const numeroPedidoTeste = "20257091";
    console.log('🔍 Testando com número do pedido:', numeroPedidoTeste);
    
    // Busca o pedido específico
    const { data: pedidoEspecifico, error: erroEspecifico } = await supabase
      .from('pedidos')
      .select('id, numero_pedido')
      .eq('numero_pedido', numeroPedidoTeste)
      .single();
    
    if (erroEspecifico) {
      console.log('ℹ️ Pedido específico não encontrado, tentando qualquer pedido...');
      if (!pedidos || pedidos.length === 0) {
        console.log('ℹ️ Nenhum pedido encontrado para testar');
        return;
      }
    }
    
    const pedido = pedidoEspecifico || pedidos[0];
    console.log('📦 Pedido encontrado:', pedido);
    
    // Simula a chamada da função
    const payload = {
      numero_pedido: pedido.numero_pedido
    };
    
    console.log('🚀 Enviando para webhook:', WEBHOOK_URL);
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    console.log('📤 Resposta do webhook:');
    console.log('- Status:', response.status);
    console.log('- Status Text:', response.statusText);
    
    if (response.ok) {
      console.log('✅ Webhook disparado com sucesso!');
    } else {
      const errorText = await response.text();
      console.log('❌ Erro no webhook:', errorText);
    }
    
  } catch (err) {
    console.error('💥 Erro inesperado:', err);
  }
}

testWebhook();