import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { nome, email, senha, tipo, departamento, cargo } = await req.json()

    // Verificar se o usuário já existe
    const { data: existingUser } = await supabaseClient
      .from('usuarios_admin')
      .select('id')
      .eq('email', email)
      .single()

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
        tipo: 'admin'
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

    // Inserir dados na tabela usuarios_admin
    const { data: adminUser, error: dbError } = await supabaseClient
      .from('usuarios_admin')
      .insert({
        id: authUser.user.id,
        nome: nome,
        email: email,
        tipo: tipo || 'admin',
        departamento: departamento || 'Administração',
        cargo: cargo || 'Administrador',
        data_admissao: new Date().toISOString().split('T')[0],
        ativo: true
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
    return new Response(
      JSON.stringify({ error: 'Erro interno: ' + error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})