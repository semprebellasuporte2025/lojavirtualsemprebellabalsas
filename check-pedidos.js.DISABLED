// Verificar se há pedidos no banco
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

async function checkPedidos() {
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    
    console.log('🔍 Verificando pedidos no banco...');
    
    // Buscar todos os pedidos
    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select('id, numero_pedido, created_at, status')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Erro ao buscar pedidos:', error);
      return;
    }
    
    if (!pedidos || pedidos.length === 0) {
      console.log('ℹ️ Nenhum pedido encontrado no banco');
      return;
    }
    
    console.log('📦 Pedidos encontrados:');
    pedidos.forEach(pedido => {
      console.log(`- #${pedido.numero_pedido} (${pedido.status}) - ${pedido.created_at}`);
    });
    
    // Testar com o primeiro pedido
    const pedidoTeste = pedidos[0];
    console.log('\n🚀 Testando webhook com pedido:', pedidoTeste.numero_pedido);
    
    const result = await supabase.functions.invoke('dispatch-order-webhook', {
      body: { 
        numero_pedido: pedidoTeste.numero_pedido
      }
    });
    
    console.log('📤 Resposta:');
    console.log('- Status:', result.status);
    console.log('- Dados:', result.data);
    console.log('- Erro:', result.error);
    
  } catch (error) {
    console.error('💥 Erro:', error.message);
  }
}

checkPedidos();