import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Configuração inválida do Supabase (URL/Service Role)" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    const novaSenha = String(body?.senha || body?.nova_senha || "").trim();

    if (!email || !novaSenha) {
      return new Response(
        JSON.stringify({ error: "Informe 'email' e 'senha' (nova_senha)" }),
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
        // Inserir novo registro admin
        const insertPayload: Record<string, any> = {
          id: foundUser.id, // Mantém compatibilidade com função antiga
          user_id: foundUser.id,
          nome: nomeMeta,
          email: email,
          tipo: "admin",
          departamento: "Administração",
          cargo: "Administrador",
          data_admissao: new Date().toISOString().split("T")[0],
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