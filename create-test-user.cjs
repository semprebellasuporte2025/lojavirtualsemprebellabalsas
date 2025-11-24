require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Supabase URL ou Service Role Key não configuradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TEST_USER = {
  email: 'testuser@example.com',
  password: 'testpassword123',
};

async function main() {
  try {
    // 1. Deletar usuário existente para garantir um estado limpo
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw new Error(`Erro ao listar usuários: ${listError.message}`);

    const existingUser = users.find(u => u.email === TEST_USER.email);
    if (existingUser) {
      console.log(`Usuário ${TEST_USER.email} já existe. Deletando para recriar...`);
      const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id);
      if (deleteError) throw new Error(`Falha ao deletar usuário existente: ${deleteError.message}`);
      console.log('Usuário antigo deletado com sucesso.');
    }

    // 2. Criar o novo usuário
    console.log(`Criando usuário de teste: ${TEST_USER.email}`);
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      email_confirm: true, // Já marca o email como confirmado
    });

    if (signUpError) throw new Error(`Erro ao criar usuário: ${signUpError.message}`);
    if (!signUpData.user) throw new Error('Criação do usuário não retornou os dados esperados.');

    console.log('✅ Usuário de teste criado com sucesso:');
    console.log(`   ID: ${signUpData.user.id}`);
    console.log(`   Email: ${signUpData.user.email}`);

    // 3. Tentar fazer login para verificar
    console.log('\nFazendo login com o novo usuário...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });

    if (signInError) throw new Error(`Erro ao fazer login após criação: ${signInError.message}`);
    if (!signInData.session) throw new Error('Login não retornou uma sessão.');

    console.log('✅ Login bem-sucedido!');
    console.log('   🔑 Token de acesso (parcial): ', signInData.session.access_token.substring(0, 30) + '...');

    console.log('\n-> Agora você pode usar as credenciais abaixo para testar o login no frontend:');
    console.log(`   Email: ${TEST_USER.email}`);
    console.log(`   Senha: ${TEST_USER.password}`);

  } catch (error) {
    console.error('❌ Falha no script de criação de usuário:', error.message);
    process.exit(1);
  }
}

main();