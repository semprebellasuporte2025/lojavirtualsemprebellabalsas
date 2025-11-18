/// <reference path="../ambient.d.ts" />
// Supabase Edge Function — Consulta status de pagamento no Mercado Pago
// Entrada: { payment_id: number | string }
// Saída: { id, status, status_detail, pix?: { qr_code, qr_code_base64, ticket_url } }

// Import via esm.sh para compatibilidade de tipos no TS/VSCode
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.2";

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

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN") ?? "";

  if (!MP_ACCESS_TOKEN) {
    return jsonResponse({ error: "MERCADOPAGO_ACCESS_TOKEN ausente" }, { status: 500 });
  }

  let input: any;
  try {
    input = await req.json();
  } catch (e) {
    return jsonResponse({ error: "JSON inválido" }, { status: 400 });
  }
  const paymentId = input?.payment_id || input?.id;
  if (!paymentId) {
    return jsonResponse({ error: "Informe payment_id" }, { status: 400 });
  }

  let mpData: any;
  try {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });
    const data = await res.json();
    if (!res.ok) {
      return jsonResponse({ error: "Mercado Pago error", status: res.status, details: data }, { status: 502 });
    }
    mpData = data;
  } catch (e) {
    return jsonResponse({ error: "Falha ao consultar pagamento", details: String(e) }, { status: 502 });
  }

  // Atualizar pedido (se metadata contiver pedido_id)
  if (SUPABASE_URL && SERVICE_ROLE_KEY) {
    try {
      const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
      const novoStatus = mapPaymentStatusToOrderStatus(String(mpData?.status || ""));
      const pedidoId = mpData?.metadata?.pedido_id;
      if (novoStatus && pedidoId) {
        await supabase.from("pedidos").update({ status: novoStatus }).eq("id", pedidoId);
      }
      // Registrar atualização em pagamentos_mercado_pago (opcional)
      try {
        await supabase.from("pagamentos_mercado_pago").insert({
          payment_id: mpData?.id,
          status: mpData?.status,
          status_detail: mpData?.status_detail ?? null,
          transaction_amount: mpData?.transaction_amount ?? null,
          payment_method_id: mpData?.payment_method_id ?? null,
          pedido_id: pedidoId ?? null,
          numero_pedido: mpData?.metadata?.numero_pedido ?? null,
          source: "mercado-pago-status",
          created_at: new Date().toISOString(),
        });
      } catch (_) {}
    } catch (_) {}
  }

  const td = mpData?.point_of_interaction?.transaction_data;
  return jsonResponse({
    id: mpData?.id,
    status: mpData?.status,
    status_detail: mpData?.status_detail ?? null,
    pix: td
      ? {
          qr_code: td.qr_code ?? null,
          qr_code_base64: td.qr_code_base64 ?? null,
          ticket_url: td.ticket_url ?? null,
        }
      : undefined,
  });
};