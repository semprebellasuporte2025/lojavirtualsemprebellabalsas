// Teste para verificar problemas específicos do ambiente do navegador
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase (mesmas variáveis do frontend)
const supabaseUrl = "https://cproxdqrraiujnewbsvp.supabase.co";
const supabaseKey = "sb_publishable_rTW_XToE2y-HAx4duwsTtw_lrKt_qhM";

// Testar diferentes configurações do cliente Supabase
console.log('🧪 Testando diferentes configurações do cliente Supabase...\n');

// Configuração 1: Cliente padrão (igual ao frontend)
const supabase1 = createClient(supabaseUrl, supabaseKey);

// Configuração 2: Cliente com headers personalizados (pode ajudar com CORS)
const supabase2 = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  }
});

// Configuração 3: Cliente com timeout reduzido para detectar problemas de rede
const supabase3 = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: (url, options) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
      
      return fetch(url, {
        ...options,
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));
    }
  }
});

async function testAllConfigurations() {
  const testData = {
    nome: "Teste Browser Env",
    email: "teste.browser@email.com", 
    senha: "123456",
    tipo: "admin",
    departamento: "TI",
    cargo: "Desenvolvedor"
  };
  
  console.log('📋 Dados de teste:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('');
  
  // Testar cada configuração
  const configurations = [
    { name: 'Configuração Padrão', client: supabase1 },
    { name: 'Com Headers Personalizados', client: supabase2 },
    { name: 'Com Timeout Reduzido', client: supabase3 }
  ];
  
  for (const config of configurations) {
    console.log(`🔧 Testando: ${config.name}`);
    
    try {
      const { data, error } = await config.client.functions.invoke('cadastrar-admin', {
        body: testData
      });
      
      if (error) {
        console.log(`❌ ERRO em ${config.name}:`);
        console.log('Mensagem:', error.message);
        console.log('Detalhes:', JSON.stringify(error, null, 2));
      } else if (data?.success) {
        console.log(`✅ SUCESSO em ${config.name}: Usuário criado com ID ${data.user?.id}`);
      } else {
        console.log(`⚠️  Resposta inesperada em ${config.name}:`, JSON.stringify(data, null, 2));
      }
      
    } catch (error) {
      console.log(`❌ EXCEÇÃO em ${config.name}:`);
      console.log('Mensagem:', error.message);
      if (error.name === 'AbortError') {
        console.log('⏰ TIMEOUT: A requisição demorou muito (possível problema de rede/CORS)');
      }
    }
    
    console.log('---');
  }
}

// Testar também problemas de CORS simulando o ambiente do navegador
async function testCorsIssues() {
  console.log('🌐 Testando possíveis problemas de CORS...\n');
  
  try {
    // Testar uma requisição fetch direta para ver se há problemas de CORS
    const response = await fetch(`${supabaseUrl}/functions/v1/cadastrar-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        nome: "Teste CORS",
        email: "teste.cors@email.com", 
        senha: "123456",
        tipo: "admin"
      })
    });
    
    console.log('📊 Resposta da requisição fetch direta:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ CORS parece estar funcionando:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Possível problema de CORS - Status não OK');
      console.log('Headers:', JSON.stringify([...response.headers.entries()], null, 2));
    }
    
  } catch (error) {
    console.log('❌ ERRO na requisição fetch (possível CORS):');
    console.log('Mensagem:', error.message);
    console.log('Tipo:', error.name);
  }
}

// Executar testes
async function main() {
  await testAllConfigurations();
  console.log('\n' + '='.repeat(50) + '\n');
  await testCorsIssues();
}

main().catch(console.error);