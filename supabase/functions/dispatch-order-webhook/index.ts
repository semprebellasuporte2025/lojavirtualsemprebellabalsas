import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Segredos lidos do ambiente (configurados via `supabase functions secrets set`)
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
// Aceita dois nomes para compatibilidade: ORDER_WEBHOOK_URL ou WEBHOOK_URL
const WEBHOOK_URL = Deno.env.get('ORDER_WEBHOOK_URL') ?? Deno.env.get('WEBHOOK_URL') ?? '';

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type InvokeBody = {
  pedido_id?: string;
  numero_pedido?: string;
  pedidoId?: string; // alias aceito
  numeroPedido?: string; // alias aceito
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validação mínima de configuração
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!WEBHOOK_URL) {
      return new Response(JSON.stringify({ error: "ORDER_WEBHOOK_URL/WEBHOOK_URL não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const body: InvokeBody = await req.json();
    const pedidoId = body.pedido_id || body.pedidoId;
    const numeroPedido = body.numero_pedido || body.numeroPedido;

    if (!pedidoId && !numeroPedido) {
      return new Response(JSON.stringify({ error: "Informe pedido_id ou numero_pedido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Buscar pedido
    let pedidoQuery = supabase
      .from("pedidos")
      .select(
        "id, numero_pedido, cliente_id, endereco_entrega, subtotal, desconto, frete, total, status, forma_pagamento, created_at"
      )
      .limit(1);

    if (pedidoId) pedidoQuery = pedidoQuery.eq("id", pedidoId);
    if (numeroPedido) pedidoQuery = pedidoQuery.eq("numero_pedido", numeroPedido);

    const { data: pedidos, error: pedidoErr } = await pedidoQuery;
    if (pedidoErr) throw pedidoErr;
    const pedido = pedidos?.[0];
    if (!pedido) {
      return new Response(JSON.stringify({ error: "Pedido não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Buscar itens do pedido
    const { data: itens, error: itensErr } = await supabase
      .from("itens_pedido")
      .select("produto_id, nome, quantidade, preco_unitario, subtotal, tamanho, cor, imagem")
      .eq("pedido_id", pedido.id);
    if (itensErr) throw itensErr;

    // Buscar cliente
    let clienteNome = "Cliente";
    let clienteEmail: string | null = null;
    let clienteId: string | undefined = pedido.cliente_id || undefined;

    if (pedido.cliente_id) {
      const { data: cliente, error: clienteErr } = await supabase
        .from("clientes")
        .select("id, nome, email")
        .eq("id", pedido.cliente_id)
        .maybeSingle();

      if (!clienteErr && cliente) {
        clienteNome = cliente.nome || clienteNome;
        clienteEmail = cliente.email || clienteEmail;
        clienteId = cliente.id || clienteId;
      } else {
        // fallback: tentar auth admin
        try {
          const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
          const userRes = await admin.auth.admin.getUserById(pedido.cliente_id);
          const user = userRes?.data?.user;
          if (user) {
            clienteNome = (user.user_metadata as any)?.nome || clienteNome;
            clienteEmail = user.email || clienteEmail;
          }
        } catch (_) {
          // ignora fallback
        }
      }
    }

    const payload = {
      numero_pedido: pedido.numero_pedido,
      pedido_id: String(pedido.id),
      criado_em: pedido.created_at || null,
      status: pedido.status,
      forma_pagamento: pedido.forma_pagamento,
      subtotal: pedido.subtotal,
      desconto: pedido.desconto || 0,
      frete: pedido.frete || 0,
      total: pedido.total,
      frete_metodo: null as string | null,
      cliente: {
        id: clienteId,
        nome: clienteNome,
        email: clienteEmail,
      },
      endereco_entrega: pedido.endereco_entrega || null,
      itens: (itens || []).map((i) => ({
        produto_id: i.produto_id,
        nome: i.nome,
        quantidade: i.quantidade,
        preco_unitario: i.preco_unitario,
        subtotal: i.subtotal,
        tamanho: (i as any).tamanho ?? null,
        cor: (i as any).cor ?? null,
        imagem: (i as any).imagem ?? null,
      })),
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      // Adiciona headers de CORS também na resposta de erro
      return new Response(
        JSON.stringify({ error: "Falha no webhook", status: res.status, body: text }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Adiciona headers de CORS na resposta de sucesso
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[dispatch-order-webhook] erro:", err);
    // Adiciona headers de CORS na resposta de erro geral
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});