// Teste local/preview: cria preferência via Edge Function e imprime links
// Execute: node scripts/test-mercado-pago-checkout-pro.js

import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://YOUR-PROJECT.supabase.co';
const SITE_URL = process.env.SITE_URL || 'https://example.com';
const endpoint = `${SUPABASE_URL}/functions/v1/mercado-pago-checkout-pro`;

async function main() {
  try {
    const payload = {
      items: [
        { title: 'Pedido teste', quantity: 1, unit_price: 1, currency_id: 'BRL' }
      ],
      back_urls: {
        success: `${SITE_URL}/checkout/sucesso`,
        failure: `${SITE_URL}/checkout/erro`,
        pending: `${SITE_URL}/checkout/pendente`,
      },
      auto_return: 'approved'
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('❌ Erro:', data);
      process.exit(1);
    }

    console.log('✅ Preferência criada:');
    console.log('ID:', data.id);
    console.log('Sandbox:', data.sandbox_init_point);
    console.log('Prod:', data.init_point);
    console.log('\nAbra o link Sandbox em seu navegador para testar.');
  } catch (err) {
    console.error('❌ Falha no teste:', err?.message || err);
    process.exit(1);
  }
}

main();