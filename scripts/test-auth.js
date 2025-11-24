// Script para testar autenticação do usuário de teste
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUserAuthentication() {
  console.log('🔐 Testando autenticação do usuário de teste...');
  console.log('   Email: everaldozs@gmail.com');
  console.log('   Senha: 1234567');
  
  try {
    // Tentar fazer login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'everaldozs@gmail.com',
      password: '1234567'
    });
    
    if (error) {
      console.log('❌ Erro no login:', error.message);
      
      if (error.message.includes('Invalid login credentials')) {
        console.log('💡 O usuário pode não existir ou a senha está incorreta');
        console.log('   Verificando se o usuário existe...');
        
        // Verificar se o usuário existe na tabela auth.users via API admin
        const adminCheck = await checkUserExists('everaldozs@gmail.com');
        if (!adminCheck.exists) {
          console.log('❌ Usuário não encontrado na base de dados');
          console.log('💡 É necessário criar o usuário primeiro');
        } else {
          console.log('✅ Usuário encontrado, mas credenciais podem estar incorretas');
        }
      }
      return false;
    }
    
    console.log('✅ Login bem-sucedido!');
    console.log('   User ID:', data.user.id);
    console.log('   Email:', data.user.email);
    
    // Verificar se o usuário tem perfil de cliente
    const { data: clienteData, error: clienteError } = await supabase
      .from('clientes')
      .select('*')
      .eq('email', 'everaldozs@gmail.com')
      .single();
    
    if (clienteError) {
      console.log('⚠️ Usuário autenticado mas perfil de cliente não encontrado');
    } else {
      console.log('✅ Perfil de cliente encontrado:');
      console.log('   Nome:', clienteData.nome);
      console.log('   Cliente ID:', clienteData.id);
    }
    
    return true;
    
  } catch (error) {
    console.log('💥 Erro geral na autenticação:', error.message);
    return false;
  }
}

async function checkUserExists(email) {
  // Esta é uma verificação simplificada - na prática precisaria de permissões admin
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nome, email')
      .eq('email', email)
      .maybeSingle();
    
    return {
      exists: !!data,
      data: data
    };
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

async function main() {
  console.log('🔑 Testando credenciais de autenticação...');
  console.log('   Supabase URL:', supabaseUrl);
  
  const authSuccess = await testUserAuthentication();
  
  if (authSuccess) {
    console.log('\n✅ Autenticação testada com sucesso!');
  } else {
    console.log('\n❌ Falha na autenticação - usuário precisa ser criado');
    console.log('💡 Execute: npm run scripts/create-test-user.js');
  }
}

main().catch(console.error);