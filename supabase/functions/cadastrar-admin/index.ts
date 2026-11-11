import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../shared/cors.ts';
import { authenticateUser, isActiveAdmin } from '../shared/auth.ts';

const ALLOWED_ROLES = new Set(['admin', 'atendente']);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Método não permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Configuração inválida do Supabase' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const auth = await authenticateUser(req, supabaseUrl, anonKey);
    if (!auth) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    const callerIsAdmin = await isActiveAdmin(supabaseClient, auth.user);
    if (!callerIsAdmin) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado: apenas administradores ativos podem cadastrar usuários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const nome = String(body?.nome || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const senha = String(body?.senha || '');
    const rawTipo = String(body?.tipo || 'admin').trim().toLowerCase();
    const tipo = ALLOWED_ROLES.has(rawTipo) ? rawTipo : 'admin';
    const departamento = String(body?.departamento || 'Administração').trim();
    const cargo = String(body?.cargo || 'Administrador').trim();

    if (!nome || !email || senha.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Informe nome, email válido e senha com ao menos 6 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o usuário já existe
    const { data: existingUser } = await supabaseClient
      .from('usuarios_admin')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'Usuário já existe com este email' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Criar usuário no Supabase Auth
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email: email,
      password: senha,
      email_confirm: true,
      user_metadata: {
        nome: nome,
        tipo: tipo
      }
    })

    if (authError) {
      return new Response(
        JSON.stringify({ error: 'Erro ao criar usuário: ' + authError.message }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Inserir dados na tabela usuarios_admin usando chave primária 'id'.
    // Não definir 'data_admissao' explicitamente para evitar erro se a coluna tiver sido removida;
    // quando existir, o DEFAULT cuidará disso.
    const { data: adminUser, error: dbError } = await supabaseClient
      .from('usuarios_admin')
      .insert({
        id: authUser.user.id,
        nome: nome,
        email: email,
        tipo,
        departamento,
        cargo,
        ativo: true,
      })
      .select()
      .single()

    if (dbError) {
      // Se falhar ao inserir na tabela, deletar o usuário do Auth
      await supabaseClient.auth.admin.deleteUser(authUser.user.id)
      
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar dados do administrador: ' + dbError.message }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Administrador cadastrado com sucesso!',
        user: adminUser
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: 'Erro interno: ' + errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})