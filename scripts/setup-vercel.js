import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Configurando deploy automático no Vercel...\n');

// Verificar se o Vercel CLI está instalado
try {
  execSync('vercel --version', { stdio: 'pipe' });
  console.log('✅ Vercel CLI encontrado');
} catch (error) {
  console.log('❌ Vercel CLI não encontrado. Instalando...');
  try {
    execSync('npm install -g vercel', { stdio: 'inherit' });
    console.log('✅ Vercel CLI instalado com sucesso');
  } catch (installError) {
    console.error('❌ Erro ao instalar Vercel CLI:', installError.message);
    process.exit(1);
  }
}

// Verificar se está logado no Vercel
try {
  execSync('vercel whoami', { stdio: 'pipe' });
  console.log('✅ Usuário logado no Vercel');
} catch (error) {
  console.log('❌ Não está logado no Vercel. Execute: vercel login');
  process.exit(1);
}

// Configurar projeto no Vercel
console.log('\n📦 Configurando projeto no Vercel...');

try {
  // Fazer deploy inicial
  const deployOutput = execSync('vercel --prod --yes', { 
    encoding: 'utf8',
    cwd: path.resolve(__dirname, '..')
  });
  
  console.log('✅ Deploy inicial realizado com sucesso!');
  
  // Extrair URL do deploy
  const urlMatch = deployOutput.match(/https:\/\/[^\s]+/);
  if (urlMatch) {
    const deployUrl = urlMatch[0];
    console.log(`🌐 URL do projeto: ${deployUrl}`);
    
    // Configurar variáveis de ambiente
    console.log('\n🔧 Configurando variáveis de ambiente...');
    
    const envVars = [
      'VITE_PUBLIC_SUPABASE_URL',
      'VITE_PUBLIC_SUPABASE_ANON_KEY', 
      'SUPABASE_SERVICE_ROLE_KEY',
      'VITE_ORDER_WEBHOOK_URL',
      'SITE_URL'
    ];
    
    // Ler arquivo .env.example para obter valores padrão
    const envExamplePath = path.resolve(__dirname, '..', '.env.example');
    if (existsSync(envExamplePath)) {
      const envExample = readFileSync(envExamplePath, 'utf8');
      console.log('📋 Variáveis de ambiente encontradas no .env.example:');
      
      envVars.forEach(varName => {
        const match = envExample.match(new RegExp(`${varName}=(.+)`));
        if (match) {
          const value = match[1].trim();
          console.log(`   ${varName}=${value}`);
        }
      });
    }
    
    console.log('\n⚠️  IMPORTANTE: Configure as variáveis de ambiente no painel do Vercel:');
    console.log(`   1. Acesse: https://vercel.com/dashboard`);
    console.log(`   2. Selecione seu projeto: semprebella-ecommerce`);
    console.log(`   3. Vá em Settings > Environment Variables`);
    console.log(`   4. Adicione as variáveis listadas acima com os valores corretos`);
    
    console.log('\n🎉 Configuração concluída!');
    console.log(`📱 Seu site está disponível em: ${deployUrl}`);
    
  } else {
    console.log('⚠️  Deploy realizado, mas não foi possível extrair a URL');
  }
  
} catch (error) {
  console.error('❌ Erro durante o deploy:', error.message);
  
  // Tentar configuração manual
  console.log('\n🔧 Tentando configuração manual...');
  try {
    execSync('vercel link', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
    console.log('✅ Projeto vinculado ao Vercel');
    
    console.log('\n📋 Para fazer o deploy, execute:');
    console.log('   vercel --prod');
    
  } catch (linkError) {
    console.error('❌ Erro na configuração manual:', linkError.message);
  }
}

console.log('\n📚 Próximos passos:');
console.log('1. Configure as variáveis de ambiente no painel do Vercel');
console.log('2. Verifique se o site está funcionando corretamente');
console.log('3. Configure um domínio personalizado (opcional)');
console.log('4. Configure GitHub Actions para CI/CD automático');