/// <reference path="../ambient.d.ts" />
// Supabase Edge Function — Webhook/IPN do Mercado Pago
// Recebe notificações de pagamento/merchant_order e atualiza status do pedido.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function jsonResponse(body: any, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "Content-Type": "application/json", ...corsHeaders, ...(init?.headers ?? {}) },
  });
}

function mapPaymentStatusToOrderStatus(status: string): string | null {
  const map: Record<string, string> = {
    approved: "pago",
    pending: "pendente",
    in_process: "pendente",
    rejected: "recusado",
    cancelled: "cancelado",
    refunded: "reembolsado",
    charged_back: "contestacao",
  };
  return map[status] ?? null;
}

async function fetchPayment(mpToken: string, paymentId: string | number) {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${mpToken}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Mercado Pago error (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

async function updateFromPayment(
  supabaseUrl: string,
  serviceRoleKey: string,
  payment: any
) {
  if (!supabaseUrl || !serviceRoleKey) return;
  const novoStatus = mapPaymentStatusToOrderStatus(String(payment?.status || ""));
  const pedidoId = payment?.metadata?.pedido_id;
  const numeroPedido = payment?.metadata?.numero_pedido ?? null;

  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  } as Record<string, string>;

  try {
    if (novoStatus && pedidoId) {
      await fetch(`${supabaseUrl}/rest/v1/pedidos?id=eq.${pedidoId}`, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({ status: novoStatus }),
      });
    }
  } catch (e) {
    console.warn("Falha ao atualizar pedido via REST:", e);
  }

  try {
    await fetch(`${supabaseUrl}/rest/v1/pagamentos_mercado_pago`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        payment_id: payment?.id,
        status: payment?.status,
        status_detail: payment?.status_detail ?? null,
        transaction_amount: payment?.transaction_amount ?? null,
        payment_method_id: payment?.payment_method_id ?? null,
        pedido_id: pedidoId ?? null,
        numero_pedido: numeroPedido,
        source: "mercado-pago-webhook",
        created_at: new Date().toISOString(),
      }),
    });
  } catch (e) {
    console.warn("Falha ao registrar pagamento via REST:", e);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    // Preflight CORS: responder sem corpo com 204
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Healthcheck rápido para diagnosticar disponibilidade
  const pingCheck = (() => {
    try {
      const u = new URL(req.url);
      return u.searchParams.get("ping") === "1";
    } catch (_) {
      return false;
    }
  })();
  if (pingCheck) {
    return jsonResponse({ ok: true, pong: 1 });
  }

  const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN") ?? "";
  if (!MP_ACCESS_TOKEN) {
    return jsonResponse({ error: "MERCADOPAGO_ACCESS_TOKEN ausente" }, { status: 500 });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  const url = new URL(req.url);
  const qpTopic = url.searchParams.get("topic") || url.searchParams.get("type");
  const qpId = url.searchParams.get("id") || url.searchParams.get("data.id");

  let body: any = null;
  if (req.method === "POST") {
    try {
      body = await req.json();
    } catch (_) {
      body = null;
    }
  }

  const bodyTopic = body?.topic || body?.type || body?.action;
  const bodyId = body?.id || body?.data?.id || body?.resource?.id;

  const topic = String(qpTopic || bodyTopic || "payment").toLowerCase();
  const id = qpId || bodyId;
  if (!id) {
    return jsonResponse({ error: "ID não informado", topic }, { status: 400 });
  }

  try {
    if (topic === "merchant_order") {
      // Buscar merchant order e, para cada pagamento, consultar /v1/payments para obter metadata
      const moRes = await fetch(`https://api.mercadopago.com/merchant_orders/${id}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
      });
      const moData = await moRes.json();
      if (!moRes.ok) {
        return jsonResponse({ error: "Erro ao consultar merchant_order", status: moRes.status, details: moData }, { status: 502 });
      }

      const payments: Array<{ id: number }> = Array.isArray(moData?.payments) ? moData.payments : [];
      const handled: any[] = [];
      for (const p of payments) {
        try {
          const pay = await fetchPayment(MP_ACCESS_TOKEN, p.id);
          await updateFromPayment(SUPABASE_URL, SERVICE_ROLE_KEY, pay);
          handled.push({ id: pay?.id, status: pay?.status });
        } catch (e) {
          console.error("Falha ao processar pagamento em merchant_order:", e);
        }
      }
      return jsonResponse({ ok: true, topic: "merchant_order", merchant_order_id: id, handled });
    }

    // Default: topic payment
    const payment = await fetchPayment(MP_ACCESS_TOKEN, id);
    await updateFromPayment(SUPABASE_URL, SERVICE_ROLE_KEY, payment);

    // Para IPN, responder rápido com 200 OK
    return jsonResponse({ ok: true, topic: "payment", id: payment?.id, status: payment?.status });
  } catch (e) {
    console.error("Falha no webhook:", e);
    return jsonResponse({ error: "Falha no processamento", details: String(e) }, { status: 502 });
  }
});

// Marcar como módulo
export {};