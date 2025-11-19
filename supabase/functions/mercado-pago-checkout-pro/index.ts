/// <reference path="../ambient.d.ts" />
// Supabase Edge Function (Deno) — Mercado Pago Checkout Pro (Sandbox/Prod)
// Cria uma preferência e retorna os links de pagamento (init_point e sandbox_init_point).

// Migrado para Deno.serve para evitar dependência remota do std/http

function corsHeaders(req: Request, extra: Record<string, string> = {}) {
  const origin = req.headers.get("Origin") ?? "*";
  // Se o navegador informar os headers solicitados, ecoamos para garantir aprovação do preflight
  const acrh = req.headers.get("Access-Control-Request-Headers");
  const baseAllowHeaders = "authorization, Authorization, x-client-info, X-Client-Info, apikey, content-type, Content-Type";
  const allowHeaders = acrh && acrh.length > 0 ? acrh : baseAllowHeaders;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": allowHeaders,
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    ...extra,
  };
}

Deno.serve(async (req: Request) => {
  const method = req.method.toUpperCase();
  if (method === "OPTIONS") {
    // Responder sem corpo e com headers de CORS dinâmicos para aprovar o preflight
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }
  if (method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders(req, { "Content-Type": "application/json" }),
    });
  }

  const ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
  if (!ACCESS_TOKEN) {
    return new Response(JSON.stringify({ error: "Missing MERCADOPAGO_ACCESS_TOKEN secret" }), {
      status: 500,
      headers: corsHeaders(req, { "Content-Type": "application/json" }),
    });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // usa defaults abaixo
  }

  // Descobrir domínio preferencial para back_urls
  const originHdr = req.headers.get('Origin') || '';
  const httpsOrigin = originHdr.replace(/^http:/, 'https:');
  const siteUrlEnv = Deno.env.get("SITE_URL") || "";
  const secureSiteUrlEnv = siteUrlEnv.replace(/^http:/, 'https:');
  // Fallback padrão para produção caso nenhum env esteja definido
  const defaultProdUrl = 'https://lojavirtualsemprebellabalsas.vercel.app';
  // Se Origin vier por HTTPS, usar como base; senão usar SITE_URL; por último, domínio padrão
  const baseUrl = (httpsOrigin && /^https:\/\//i.test(httpsOrigin))
    ? httpsOrigin
    : (secureSiteUrlEnv && /^https:\/\//i.test(secureSiteUrlEnv))
      ? secureSiteUrlEnv
      : defaultProdUrl;

  // Garantir que a URL base seja HTTPS (Mercado Pago exige HTTPS para back_urls)
  const DEFAULT_BACK_URLS = {
    success: `${baseUrl.replace(/\/$/, '')}/checkout/sucesso`,
    failure: `${baseUrl.replace(/\/$/, '')}/checkout/erro`,
    pending: `${baseUrl.replace(/\/$/, '')}/checkout/pendente`,
  };
  // Sanitizadores de URL (garantir https e evitar localhost em produção)
  const sanitizeToHttps = (url?: string) => {
    if (!url || typeof url !== 'string') return undefined;
    return url.replace(/^http:/, 'https:');
  };
  const sanitizeBackUrls = (urls: any) => {
    if (!urls || typeof urls !== 'object') return DEFAULT_BACK_URLS;
    const s = {
      success: sanitizeToHttps(urls.success),
      failure: sanitizeToHttps(urls.failure),
      pending: sanitizeToHttps(urls.pending),
    };
    return (s.success && s.failure && s.pending) ? s : DEFAULT_BACK_URLS;
  };

  const isLocalOrigin = /^http:\/\/(localhost|127\.0\.0\.1)/.test(originHdr);

  // Preferir URL de Functions do Supabase como fallback do webhook
  const supabaseUrlEnv = Deno.env.get("SUPABASE_URL");
  const fallbackWebhook = supabaseUrlEnv
    ? `${supabaseUrlEnv.replace(/\/$/, "")}/functions/v1/mercado-pago-webhook`
    : undefined;
  const notificationUrl = body?.notification_url || Deno.env.get("MERCADOPAGO_NOTIFICATION_URL") || fallbackWebhook;
  const autoReturn = body?.auto_return || "approved";

  const items = Array.isArray(body?.items) && body.items.length > 0
    ? body.items
    : [
        {
          title: "Pedido de teste",
          quantity: 1,
          unit_price: 1,
          currency_id: "BRL",
        },
      ];

  // Se origem for localhost/127.0.0.1, ignorar back_urls vindas do cliente e usar env/default
  const backUrls = (!isLocalOrigin && body?.back_urls) ? sanitizeBackUrls(body.back_urls) : DEFAULT_BACK_URLS;
  const payer = (body?.payer && body?.payer?.email) ? body.payer : undefined;
  const statementDescriptor = (body?.statement_descriptor || "SEMPRE BELLA").toString().slice(0, 22);

  // Determinar métodos de pagamento com base na forma escolhida
  let paymentMethodsConfig: any = {};
  
  if (body?.metadata?.payment_method) {
    const rawMethod = String(body.metadata.payment_method || '').toLowerCase();
    const isPix = rawMethod.includes('pix');
    const isCredit = rawMethod.includes('credit') || rawMethod.includes('card') || rawMethod.includes('cart');
    
    if (isPix) {
      // Para PIX: excluir todos os outros métodos e priorizar PIX
      paymentMethodsConfig = {
        default_payment_method_id: 'pix',
        excluded_payment_types: [
          { id: 'credit_card' },
          { id: 'debit_card' },
          { id: 'ticket' },
          { id: 'atm' },
        ],
      };
    } else if (isCredit) {
      paymentMethodsConfig = {
        default_payment_method_id: 'visa',
        excluded_payment_methods: [
          { id: 'pix' },
        ],
        excluded_payment_types: [
          { id: 'bank_transfer' },
          { id: 'ticket' },
          { id: 'atm' },
        ],
      };
    }
    // Se for outro método ou não especificado, deixar todas as opções disponíveis
  } else {
    paymentMethodsConfig = {
      default_payment_method_id: null,
      excluded_payment_types: [],
    };
  }

  const preferencePayload = {
    items,
    back_urls: backUrls,
    auto_return: autoReturn,
    notification_url: sanitizeToHttps(notificationUrl),
    payer,
    statement_descriptor: statementDescriptor,
    payment_methods: paymentMethodsConfig,
    metadata: body?.metadata || {},
  };

  try {
    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preferencePayload),
    });

    const data = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Mercado Pago error", status: res.status, details: data }), {
        status: res.status,
        headers: corsHeaders(req, { "Content-Type": "application/json" }),
      });
    }

    // data contém: id, init_point, sandbox_init_point, etc.
    return new Response(JSON.stringify({
      id: data?.id,
      init_point: data?.init_point,
      sandbox_init_point: data?.sandbox_init_point,
      back_urls: preferencePayload.back_urls,
    }), {
      status: 200,
      headers: corsHeaders(req, { "Content-Type": "application/json" }),
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Request failed", details: (err as Error)?.message || String(err) }), {
      status: 500,
      headers: corsHeaders(req, { "Content-Type": "application/json" }),
    });
  }
});

// Marcar como módulo para evitar colisão de variáveis globais no workspace TS
export {};