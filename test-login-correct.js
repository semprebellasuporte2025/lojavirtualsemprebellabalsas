// Script para testar login corretamente usando o método oficial do Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  console.error('   VITE_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.error('   VITE_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '***' + supabaseAnonKey.slice(-4) : 'undefined');
  process.exit(1);
}

console.log('🔑 Credenciais:');
console.log('  Supabase URL:', supabaseUrl);
console.log('  Anon Key:', supabaseAnonKey?.slice(0, 10) + '...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  try {
    console.log('\n🔐 Testando login com usuário de teste...');
    
    // Email e senha de teste
    const testEmail = 'everaldozs@gmail.com';
    const testPassword = 'teste123';
    
    console.log('📧 Email:', testEmail);
    
    // Fazer login usando o método oficial do Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (error) {
      console.error('❌ Erro no login:', error.message);
      console.error('   Status:', error.status);
      console.error('   Name:', error.name);
      return false;
    }
    
    console.log('✅ Login bem-sucedido!');
    console.log('   User ID:', data.user?.id);
    console.log('   Email:', data.user?.email);
    console.log('   Session expires at:', data.session?.expires_at);
    
    // Testar se podemos acessar a função pagar-mp com o token
    if (data.session?.access_token) {
      console.log('\n🔗 Testando acesso à função pagar-mp com token JWT...');
      
      const response = await fetch(`${supabaseUrl}/functions/v1/pagar-mp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tipo: 'pix',
          valor: 10.50,
          descricao: 'Teste de pagamento',
          pedido_id: 'test-' + Date.now()
        })
      });
      
      console.log('📋 Status da função:', response.status);
      console.log('📋 Status text:', response.statusText);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Resposta da função:', JSON.stringify(result, null, 2));
      } else {
        const errorText = await response.text();
        console.error('❌ Erro na função:', errorText);
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('💥 Erro geral no teste de login:', error.message);
    return false;
  }
}

// Executar o teste
async function main() {
  const success = await testLogin();
  console.log('\n' + (success ? '✅ Teste concluído com sucesso!' : '❌ Teste falhou.'));
  process.exit(success ? 0 : 1);
}

main().catch(console.error);