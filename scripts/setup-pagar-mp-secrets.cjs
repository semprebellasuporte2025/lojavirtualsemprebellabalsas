#!/usr/bin/env node

// Script para configurar as variáveis de ambiente da Edge Function pagar-mp
// Execute: node scripts/setup-pagar-mp-secrets.js

const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

function setupPagarMpSecrets() {
  console.log('🚀 Configurando variáveis de ambiente para a Edge Function pagar-mp...\n');

  // Verificar se as variáveis necessárias existem
  const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const mpAccessToken = process.env.MP_ACCESS_TOKEN;

  if (!supabaseUrl) {
    console.error('❌ VITE_PUBLIC_SUPABASE_URL não encontrado no .env');
    process.exit(1);
  }

  if (!serviceRoleKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrado no .env');
    process.exit(1);
  }

  console.log('✅ Variáveis encontradas:');
  console.log(`   SUPABASE_URL: ${supabaseUrl}`);
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey.substring(0, 20)}...`);
  console.log(`   MP_ACCESS_TOKEN: ${mpAccessToken ? mpAccessToken.substring(0, 12) + '...' : '❌ não definido'}`);

  if (!mpAccessToken) {
    console.error('❌ MP_ACCESS_TOKEN não encontrado no .env/.env.local');
    console.error('   Defina MP_ACCESS_TOKEN com o token de PRODUÇÃO do Mercado Pago.');
    process.exit(1);
  }

  try {
    console.log('\n📦 Configurando SUPABASE_URL...');
    execSync(`supabase functions secrets set SUPABASE_URL="${supabaseUrl}"`, {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    });

    console.log('\n📦 Configurando SUPABASE_SERVICE_ROLE_KEY...');
    execSync(`supabase functions secrets set SUPABASE_SERVICE_ROLE_KEY="${serviceRoleKey}"`, {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    });

    console.log('\n📦 Configurando MP_ACCESS_TOKEN...');
    execSync(`supabase functions secrets set MP_ACCESS_TOKEN="${mpAccessToken}"`, {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    });

    console.log('\n✅ Variáveis de ambiente configuradas com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Redeployar a Edge Function: supabase functions deploy pagar-mp');
    console.log('   2. Testar o pagamento novamente');

  } catch (error) {
    console.error('\n❌ Erro ao configurar variáveis de ambiente:');
    console.error(error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupPagarMpSecrets();
}

module.exports = { setupPagarMpSecrets };