// Script para configurar secrets do Mercado Pago para Edge Functions
// Execute: node scripts/setup-mp-secrets.js

import { execSync } from 'child_process';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config({ path: '.env' });

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || 'APP_USR-1813088681194040-112016-32e4a17681babbbc73d4072ad0506bc3-2987679653';
const SUPABASE_URL = process.env.VITE_PUBLIC_SUPABASE_URL || 'https://cproxdqrraiujnewbsvp.supabase.co';
const MP_NOTIFICATION_URL = `${SUPABASE_URL}/functions/v1/mp-payment-webhook`;

function setupMPSecrets() {
  try {
    console.log('🔐 Configurando secrets do Mercado Pago para Edge Functions...');
    
    // Configurar o token de acesso do Mercado Pago
    execSync(`supabase functions secrets set MP_ACCESS_TOKEN="${MP_ACCESS_TOKEN}"`, { 
      stdio: 'inherit' 
    });
    
    // Configurar a URL de notificação
    execSync(`supabase functions secrets set MP_NOTIFICATION_URL="${MP_NOTIFICATION_URL}"`, { 
      stdio: 'inherit' 
    });
    
    console.log('✅ Secrets do Mercado Pago configuradas:');
    console.log(`   MP_ACCESS_TOKEN=${MP_ACCESS_TOKEN}`);
    console.log(`   MP_NOTIFICATION_URL=${MP_NOTIFICATION_URL}`);
    console.log('\n📋 Próximos passos:');
    console.log('1. Reimplante a função create-mp-preference:');
    console.log('   supabase functions deploy create-mp-preference');
    console.log('2. Teste a função com:');
    console.log('   supabase functions invoke create-mp-preference');
    
  } catch (error) {
    console.error('❌ Erro ao configurar secrets:', error.message);
    console.log('\n💡 Configure manualmente com:');
    console.log(`supabase functions secrets set MP_ACCESS_TOKEN="${MP_ACCESS_TOKEN}"`);
    console.log(`supabase functions secrets set MP_NOTIFICATION_URL="${MP_NOTIFICATION_URL}"`);
    console.log('\n📝 Certifique-se de ter o CLI do Supabase instalado:');
    console.log('npm install -g supabase');
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  setupMPSecrets();
}

export { setupMPSecrets };