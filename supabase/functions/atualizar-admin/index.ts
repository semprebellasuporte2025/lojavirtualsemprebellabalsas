import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../shared/cors.ts';
import { authenticateUser, isActiveAdmin } from '../shared/auth.ts';

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método não permitido" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Configuração inválida do Supabase (URL/Anon/Service Role)" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const auth = await authenticateUser(req, SUPABASE_URL, SUPABASE_ANON_KEY);
    if (!auth) {
      return new Response(
        JSON.stringify({ error: "Não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const callerIsAdmin = await isActiveAdmin(supabase, auth.user);
    if (!callerIsAdmin) {
      return new Response(
        JSON.stringify({ error: "Acesso negado: apenas administradores ativos podem atualizar credenciais" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    const novaSenha = String(body?.senha || body?.nova_senha || "").trim();

    if (!email || novaSenha.length < 6) {
      return new Response(
        JSON.stringify({ error: "Informe 'email' e 'senha' (mínimo 6 caracteres)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Localizar usuário pelo email via Admin API (paginando)
    const PAGE_SIZE = 200;
    let page = 1;
    let foundUser: any = null;
    for (let attempts = 0; attempts < 50; attempts++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
      if (error) throw error;
      const users = (data as any)?.users || [];
      foundUser = users.find((u: any) => String(u?.email || "").toLowerCase() === email);
      if (foundUser) break;
      if (users.length < PAGE_SIZE) break; // sem mais páginas
      page += 1;
    }

    if (!foundUser?.id) {
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado pelo email informado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Atualizar senha
    const { error: updateErr } = await supabase.auth.admin.updateUserById(foundUser.id, {
      password: novaSenha,
    });
    if (updateErr) {
      return new Response(
        JSON.stringify({ error: `Falha ao atualizar senha: ${updateErr.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Garantir registro em usuarios_admin com user_id e ativo=true
    const nomeMeta = ((foundUser as any)?.user_metadata?.nome as string) || "Administrador";

    // Tentar localizar admin por user_id
    const { data: adminByUserId } = await supabase
      .from("usuarios_admin")
      .select("id, user_id, email, ativo")
      .eq("user_id", foundUser.id)
      .maybeSingle();

    if (adminByUserId) {
      await supabase
        .from("usuarios_admin")
        .update({ ativo: true, tipo: "admin" })
        .eq("user_id", foundUser.id);
    } else {
      // Se não existe por user_id, verificar por email e atualizar
      const { data: adminByEmail } = await supabase
        .from("usuarios_admin")
        .select("id, user_id, email, ativo")
        .eq("email", email)
        .maybeSingle();

      if (adminByEmail) {
        await supabase
          .from("usuarios_admin")
          .update({ user_id: foundUser.id, ativo: true, tipo: "admin" })
          .eq("email", email);
      } else {
        // Inserir novo registro admin (sem definir data_admissao para compatibilidade se removida)
        const insertPayload: Record<string, any> = {
          id: foundUser.id, // Mantém compatibilidade com função antiga
          user_id: foundUser.id,
          nome: nomeMeta,
          email: email,
          tipo: "admin",
          departamento: "Administração",
          cargo: "Administrador",
          ativo: true,
        };

        const { error: insertErr } = await supabase
          .from("usuarios_admin")
          .insert(insertPayload);
        if (insertErr) {
          return new Response(
            JSON.stringify({ error: `Falha ao salvar dados de admin: ${insertErr.message}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Senha atualizada e usuário marcado como administrador",
        user: { id: foundUser.id, email },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Erro interno: ${(err as Error)?.message || err}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});