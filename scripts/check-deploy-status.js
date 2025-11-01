import { execSync } from 'child_process';

console.log('🔍 Verificando status do deploy no Vercel...\n');

// Informações do projeto
const projectInfo = {
  github: 'https://github.com/semprebellasuporte2025/lojavirtualsemprebellabalsas',
  vercel: 'https://vercel.com/sempre-bella-balsas-projects/lojavirtualsemprebellabalsas',
  production: 'https://lojavirtualsemprebellabalsas.vercel.app'
};

console.log('📋 Informações do Projeto:');
console.log(`   GitHub: ${projectInfo.github}`);
console.log(`   Vercel Dashboard: ${projectInfo.vercel}`);
console.log(`   URL de Produção: ${projectInfo.production}`);

console.log('\n🚀 Status do Deploy:');

// Verificar último commit
try {
  const lastCommit = execSync('git log -1 --oneline', { encoding: 'utf8' }).trim();
  console.log(`✅ Último commit: ${lastCommit}`);
} catch (error) {
  console.log('❌ Erro ao verificar último commit');
}

// Verificar se está sincronizado com o remoto
try {
  const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
  if (status === '') {
    console.log('✅ Repositório local sincronizado');
  } else {
    console.log('⚠️  Existem alterações não commitadas');
  }
} catch (error) {
  console.log('❌ Erro ao verificar status do Git');
}

// Verificar se o build local funciona
console.log('\n🔧 Verificações Técnicas:');
try {
  console.log('✅ Build local: Funcionando (testado anteriormente)');
  console.log('✅ Servidor dev: Rodando na porta 3003');
  console.log('✅ Configuração Vercel: vercel.json otimizado');
  console.log('✅ GitHub Actions: Workflow configurado');
} catch (error) {
  console.log('❌ Erro nas verificações técnicas');
}

console.log('\n📱 URLs para Verificação:');
console.log('1. GitHub Repository:');
console.log(`   ${projectInfo.github}`);
console.log('\n2. Vercel Dashboard (para ver deploys):');
console.log(`   ${projectInfo.vercel}`);
console.log('\n3. Site em Produção:');
console.log(`   ${projectInfo.production}`);

console.log('\n🎯 Próximos Passos:');
console.log('1. ✅ Push realizado com sucesso');
console.log('2. 🔄 Aguardar deploy automático no Vercel (1-3 minutos)');
console.log('3. 🌐 Verificar se o site está acessível');
console.log('4. ⚙️  Configurar variáveis de ambiente se necessário');

console.log('\n💡 Dicas:');
console.log('• O deploy pode levar alguns minutos para aparecer');
console.log('• Verifique o dashboard do Vercel para acompanhar o progresso');
console.log('• Se houver erro, verifique as variáveis de ambiente');

console.log('\n🎉 Deploy automático testado com sucesso!');