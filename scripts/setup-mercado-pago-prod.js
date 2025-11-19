// Configura secrets de produção para Mercado Pago nas Edge Functions (Supabase)
// Execute: node scripts/setup-mercado-pago-prod.js

import { execSync } from 'child_process';
import { config } from 'dotenv';

// Carrega variáveis do .env local (não comitar)
config({ path: '.env' });

const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const SITE_URL = process.env.SITE_URL;
const NOTIFICATION_URL = process.env.MERCADOPAGO_NOTIFICATION_URL; // opcional

function ensureSupabaseCli() {
  try {
    execSync('supabase --version', { stdio: 'pipe' });
    return true;
  } catch {
    console.error('❌ Supabase CLI não encontrado. Instale antes de continuar.');
    console.error('   Docs: https://supabase.com/docs/reference/cli/installation');
    return false;
  }
}

function setSecret(key, value) {
  if (!value) return;
  execSync(`supabase functions secrets set ${key}="${value}"`, { stdio: 'inherit' });
}

function main() {
  console.log('🔧 Configurando secrets de PRODUÇÃO para Mercado Pago...');

  if (!ensureSupabaseCli()) {
    process.exit(1);
  }

  if (!ACCESS_TOKEN) {
    console.error('❌ MERCADOPAGO_ACCESS_TOKEN não definido no ambiente (.env).');
    console.error('   Adicione ao seu .env local (não comitar):');
    console.error('   MERCADOPAGO_ACCESS_TOKEN="APP_USR-..."');
    process.exit(1);
  }

  // Secrets principais
  setSecret('MERCADOPAGO_ACCESS_TOKEN', ACCESS_TOKEN);
  if (SITE_URL) {
    setSecret('SITE_URL', SITE_URL);
  }
  if (NOTIFICATION_URL) {
    setSecret('MERCADOPAGO_NOTIFICATION_URL', NOTIFICATION_URL);
  }

  console.log('\n✅ Secrets configurados. Recomendações:');
  console.log('   1) Deploy das funções:');
  console.log('      supabase functions deploy mercado-pago-checkout-pro');
  console.log('      supabase functions deploy mercado-pago-payments');
  console.log('      supabase functions deploy mercado-pago-status');
  console.log('   2) Verificar secrets: supabase secrets list');
  console.log('   3) Definir SITE_URL no Vercel: Settings > Environment Variables');
  console.log('\n🎉 Pronto! Em produção (HTTPS), o checkout usará init_point automaticamente.');
}

// Executa quando chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };