/// <reference path="../ambient.d.ts" />
// Supabase Edge Function (Deno) — Pagamentos Mercado Pago (Checkout Transparente)
// Recebe dados do Bricks (token do cartão, método, parcelas, payer) e cria o pagamento
// Atualiza status do pedido (se houver) e registra em pagamentos_mercado_pago

// Importação para Deno Edge Functions
// Import via esm.sh para compatibilidade de tipos no TS/VSCode
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.2";

interface PayerIdentification {
  type?: string;
  number?: string;
}

interface Payer {
  email: string;
  identification?: PayerIdentification;
}

interface PaymentRequestBody {
  transaction_amount: number;
  token: string; // Card token criado no Bricks
  payment_method_id: string; // ex: visa, master
  issuer_id?: string; // emissor do cartão
  installments: number; // número de parcelas
  payer: Payer;
  metadata?: Record<string, any> & {
    pedido_id?: string;
    numero_pedido?: string;
    source?: string;
  };
}

interface MercadoPagoPaymentResponse {
  id: number;
  status: string; // approved | pending | in_process | rejected | cancelled | refunded | charged_back
  status_detail?: string;
  description?: string;
  external_reference?: string;
  payment_method_id?: string;
  payment_type_id?: string;
  transaction_amount?: number;
  date_approved?: string | null;
  date_created?: string;
  date_last_updated?: string;
  metadata?: Record<string, any>;
  payer?: any;
  additional_info?: any;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

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

function jsonResponse(body: any, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "Content-Type": "application/json", ...corsHeaders, ...(init?.headers ?? {}) },
  });
}

function validatePayload(p: any): asserts p is PaymentRequestBody {
  const isPix = String(p?.payment_method_id || '').toLowerCase() === 'pix';
  const commonRequired = ["transaction_amount", "payment_method_id", "payer"];
  const missingCommon = commonRequired.filter((k) => !(k in p));
  if (missingCommon.length) {
    throw new Error(`Campos obrigatórios ausentes: ${missingCommon.join(", ")}`);
  }
  if (!isPix) {
    const cardRequired = ["token", "installments"];
    const missingCard = cardRequired.filter((k) => !(k in p));
    if (missingCard.length) {
      throw new Error(`Campos obrigatórios (cartão) ausentes: ${missingCard.join(", ")}`);
    }
  }
  if (typeof p.transaction_amount !== "number" || p.transaction_amount <= 0) {
    throw new Error("transaction_amount inválido");
  }
  if (!p.payer?.email) {
    throw new Error("payer.email é obrigatório");
  }
}

async function logPayment(
  supabase: ReturnType<typeof createClient>,
  payment: MercadoPagoPaymentResponse,
  metadata?: PaymentRequestBody["metadata"]
) {
  try {
    const payload = {
      payment_id: payment.id,
      status: payment.status,
      status_detail: payment.status_detail ?? null,
      transaction_amount: payment.transaction_amount ?? null,
      payment_method_id: payment.payment_method_id ?? null,
      pedido_id: metadata?.pedido_id ?? null,
      numero_pedido: metadata?.numero_pedido ?? null,
      source: metadata?.source ?? "mercado-pago-payments",
      created_at: new Date().toISOString(),
    };
    await supabase.from("pagamentos_mercado_pago").insert(payload);
  } catch (e) {
    // Não bloquear o fluxo se a tabela não existir ou ocorrer erro de log
    console.warn("Falha ao registrar pagamento em pagamentos_mercado_pago:", e);
  }
}

export default async (req: Request) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN") ?? "";

  if (!MP_ACCESS_TOKEN) {
    return jsonResponse({ error: "MERCADOPAGO_ACCESS_TOKEN ausente" }, { status: 500 });
  }

  let body: PaymentRequestBody;
  try {
    body = await req.json();
    validatePayload(body);
  } catch (e) {
    return jsonResponse({ error: "Payload inválido", details: String(e) }, { status: 400 });
  }

  // Monta payload para a API de pagamentos
  const isPix = String(body.payment_method_id || '').toLowerCase() === 'pix';
  const mpPayload = isPix
    ? {
        transaction_amount: body.transaction_amount,
        description: body.metadata?.description ?? "Compra - Sempre Bella",
        payment_method_id: 'pix',
        payer: {
          email: body.payer.email,
          identification: body.payer?.identification ?? undefined,
        },
        metadata: body.metadata ?? {},
      }
    : {
        transaction_amount: body.transaction_amount,
        token: body.token,
        description: body.metadata?.description ?? "Compra - Sempre Bella",
        payment_method_id: body.payment_method_id,
        issuer_id: body.issuer_id,
        installments: body.installments,
        payer: {
          email: body.payer.email,
          identification: body.payer.identification ?? undefined,
        },
        metadata: body.metadata ?? {},
      };

  let mpData: MercadoPagoPaymentResponse | null = null;
  try {
    const res = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mpPayload),
    });

    const data = await res.json();
    if (!res.ok) {
      return jsonResponse({ error: "Mercado Pago error", status: res.status, details: data }, { status: 502 });
    }
    mpData = data as MercadoPagoPaymentResponse;
  } catch (e) {
    return jsonResponse({ error: "Falha ao criar pagamento no Mercado Pago", details: String(e) }, { status: 502 });
  }

  // Integração com Supabase (opcional)
  if (SUPABASE_URL && SERVICE_ROLE_KEY) {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Registrar pagamento
    await logPayment(supabase, mpData!, body.metadata);

    // Atualizar status do pedido, se existir
    const novoStatus = mapPaymentStatusToOrderStatus(mpData!.status);
    if (novoStatus && body.metadata?.pedido_id) {
      try {
        await supabase
          .from("pedidos")
          .update({ status: novoStatus })
          .eq("id", body.metadata.pedido_id);
      } catch (e) {
        console.warn("Falha ao atualizar pedido:", e);
      }
    }
  }

  // Retorna dados essenciais para o cliente
  const td = (mpData as any)?.point_of_interaction?.transaction_data;
  return jsonResponse({
    id: mpData!.id,
    status: mpData!.status,
    status_detail: mpData!.status_detail ?? null,
    pix: td
      ? {
          qr_code: td.qr_code ?? null,
          qr_code_base64: td.qr_code_base64 ?? null,
          ticket_url: td.ticket_url ?? null,
        }
      : undefined,
  });
}