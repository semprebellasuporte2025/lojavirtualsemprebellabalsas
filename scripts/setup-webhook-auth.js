// Script para configurar autenticação no webhook
// Execute: node scripts/setup-webhook-auth.js

import { execSync } from 'child_process';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

// Carregar variáveis de ambiente
config({ path: '.env' });

const WEBHOOK_AUTH_TOKEN = process.env.WEBHOOK_AUTH_TOKEN || generateRandomToken();

function generateRandomToken() {
  return 'wh_' + require('crypto').randomBytes(32).toString('hex');
}

function setupWebhookAuth() {
  try {
    console.log('🔐 Configurando autenticação para webhook...');
    
    // Configurar o token secreto na função do Supabase
    execSync(`supabase functions secrets set WEBHOOK_AUTH_TOKEN="${WEBHOOK_AUTH_TOKEN}"`, { 
      stdio: 'inherit' 
    });
    
    console.log('✅ Token de autenticação configurado:');
    console.log(`   WEBHOOK_AUTH_TOKEN=${WEBHOOK_AUTH_TOKEN}`);
    console.log('\n📋 Próximos passos:');
    console.log('1. Adicione esta variável ao seu .env:');
    console.log(`   WEBHOOK_AUTH_TOKEN="${WEBHOOK_AUTH_TOKEN}"`);
    console.log('2. Reimplante a função:');
    console.log('   supabase functions deploy dispatch-order-webhook');
    console.log('3. Atualize qualquer script que chame o webhook para incluir o header:');
    console.log('   Authorization: Bearer ' + WEBHOOK_AUTH_TOKEN);
    
  } catch (error) {
    console.error('❌ Erro ao configurar autenticação:', error.message);
    console.log('\n💡 Configure manualmente com:');
    console.log('supabase functions secrets set WEBHOOK_AUTH_TOKEN="seu_token_secreto"');
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  setupWebhookAuth();
}

export { setupWebhookAuth, generateRandomToken };