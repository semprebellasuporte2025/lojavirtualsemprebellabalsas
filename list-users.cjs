require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Supabase URL ou Service Role Key não estão configuradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function listUsers() {
  console.log('Buscando usuários...');
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      throw new Error(`Erro ao listar usuários: ${error.message}`);
    }

    if (users.length === 0) {
      console.log('Nenhum usuário encontrado.');
    } else {
      console.log('Usuários encontrados:');
      users.forEach(user => {
        console.log(`- ID: ${user.id}, Email: ${user.email}, Criado em: ${user.created_at}`);
      });
    }
  } catch (error) {
    console.error(error.message);
  }
}

listUsers();