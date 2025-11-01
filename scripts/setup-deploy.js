#!/usr/bin/env node

/**
 * Script para configurar deploy automático no Vercel via GitHub
 * Execute: node scripts/setup-deploy.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Configurando deploy automático SempreBella...\n');

// Verificar se os arquivos necessários existem
const requiredFiles = [
  '.github/workflows/deploy.yml',
  'vercel.json',
  '.vercelignore',
  'deploy-config.json'
];

console.log('✅ Verificando arquivos de configuração:');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  console.log(`   ${exists ? '✓' : '✗'} ${file}`);
});

console.log('\n📋 Próximos passos para deploy:');
console.log('');
console.log('1. 🐙 GitHub:');
console.log('   - Crie um repositório no GitHub');
console.log('   - git remote add origin https://github.com/SEU_USUARIO/semprebella-ecommerce.git');
console.log('   - git push -u origin main');
console.log('');
console.log('2. ⚡ Vercel:');
console.log('   - Acesse vercel.com e importe o repositório');
console.log('   - Configure as variáveis de ambiente:');
console.log('     * VITE_PUBLIC_SUPABASE_URL');
console.log('     * VITE_PUBLIC_SUPABASE_ANON_KEY');
console.log('     * SITE_URL');
console.log('');
console.log('3. 🔐 GitHub Secrets (para CI/CD):');
console.log('   - Vá em: Repositório > Settings > Secrets and variables > Actions');
console.log('   - Adicione os secrets:');
console.log('     * VERCEL_TOKEN (https://vercel.com/account/tokens)');
console.log('     * VERCEL_ORG_ID (Vercel Dashboard > Settings)');
console.log('     * VERCEL_PROJECT_ID (Vercel Project > Settings)');
console.log('     * VITE_PUBLIC_SUPABASE_URL');
console.log('     * VITE_PUBLIC_SUPABASE_ANON_KEY');
console.log('     * SITE_URL');
console.log('');
console.log('4. 🎯 Deploy automático:');
console.log('   - Cada push na branch main fará deploy automático');
console.log('   - Pull requests criarão deploys de preview');
console.log('');
console.log('📖 Consulte deploy-config.json para mais detalhes');
console.log('');
console.log('🎉 Configuração concluída! Pronto para deploy.');