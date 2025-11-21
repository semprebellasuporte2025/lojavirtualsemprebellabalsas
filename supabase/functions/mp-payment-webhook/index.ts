// Edge Function: Webhook de pagamento do Mercado Pago
// Atualiza pedidos.status para 'pago' quando payment.status === 'approved'

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN') ?? '';
const MP_WEBHOOK_SECRET = Deno.env.get('MP_WEBHOOK_SECRET') ?? '';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Busca detalhes do pagamento no Mercado Pago
async function fetchPaymentDetails(paymentId: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    signal: controller.signal,
  }).catch((err) => {
    clearTimeout(timeout);
    throw err;
  });
  clearTimeout(timeout);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Falha ao buscar pagamento ${paymentId}: ${res.status} ${text}`);
  }
  return await res.json();
}

// Função para processar e registrar o pedido a partir dos metadados
async function registerOrderFromMetadata(payment: any) {
  const metadata = payment.metadata || {};
  
  // Extrair dados do metadata
  const { customer, items, shipping, total, numero_pedido } = metadata;
  
  if (!customer || !items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Metadados incompletos para registro do pedido');
  }

  // 1. Criar ou atualizar cliente
  const { data: cliente, error: clienteError } = await supabase
    .from('clientes')
    .upsert({
      nome: customer.nome,
      email: customer.email,
      telefone: customer.telefone,
      cpf: customer.cpf,
      endereco: customer.endereco,
      cidade: customer.cidade,
      estado: customer.estado,
      cep: customer.cep,
      user_id: customer.user_id || null
    }, { onConflict: 'email' })
    .select('id')
    .single();

  if (clienteError) throw clienteError;

  // 2. Criar pedido
  const { data: pedido, error: pedidoError } = await supabase
    .from('pedidos')
    .insert({
      cliente_id: cliente.id,
      numero_pedido: numero_pedido || `PED-${Date.now()}`,
      status: 'pago',
      total: total,
      forma_pagamento: 'Mercado Pago',
      endereco_entrega: shipping?.endereco || customer.endereco,
      cidade_entrega: shipping?.cidade || customer.cidade,
      estado_entrega: shipping?.estado || customer.estado,
      cep_entrega: shipping?.cep || customer.cep,
      frete: shipping?.frete || 0
    })
    .select('id')
    .single();

  if (pedidoError) throw pedidoError;

  // 3. Inserir itens do pedido
  for (const item of items) {
    const { error: itemError } = await supabase
      .from('itens_pedido')
      .insert({
        pedido_id: pedido.id,
        produto_id: item.produto_id,
        variante_id: item.variante_id || null, // Se houver variante
        quantidade: item.quantidade,
        preco_unitario: item.preco,
        subtotal: item.quantidade * item.preco
      });

    if (itemError) throw itemError;
  }

  return { pedidoId: pedido.id };
}

Deno.serve(async (req: Request) => {
  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!MP_ACCESS_TOKEN) {
      return new Response(JSON.stringify({ error: 'MP_ACCESS_TOKEN ausente' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const queryType = url.searchParams.get('type') || url.searchParams.get('topic');
    const queryId = url.searchParams.get('id');
    const resource = url.searchParams.get('resource');
    const bodyText = req.method === 'POST' ? await req.text() : '';
    let body: any = null;
    try {
      body = bodyText ? JSON.parse(bodyText) : null;
    } catch (e) {
      // Ignora parse error, pode ser x-www-form-urlencoded
    }

    console.log('[mp-payment-webhook] recebida:', { method: req.method, queryType, queryId, resource, body });

    // Extrai paymentId dos parâmetros/ corpo
    let paymentId: string | null = null;
    if (queryType === 'payment' && queryId) paymentId = queryId;
    else if (body?.type === 'payment' && body?.data?.id) paymentId = String(body.data.id);
    else if (body?.action?.startsWith('payment') && body?.data?.id) paymentId = String(body.data.id);
    if (!paymentId && resource) {
      const match = resource.match(/payments\/(\d+)/);
      if (match) paymentId = match[1];
    }

    // Validação de assinatura do webhook (MP_WEBHOOK_SECRET)
    if (MP_WEBHOOK_SECRET) {
      const sigHeader = req.headers.get('x-signature') || req.headers.get('X-Signature');
      const reqId = req.headers.get('x-request-id') || req.headers.get('X-Request-Id');
      if (!sigHeader || !reqId) {
        return new Response(JSON.stringify({ error: 'Assinatura ausente', code: 'missing_signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Formato esperado: "ts=<timestamp>,v1=<hmac_hex>"
      const parts = sigHeader.split(',').map((p) => p.trim());
      const sigMap: Record<string, string> = {};
      for (const part of parts) {
        const [k, v] = part.split('=');
        if (k && v) sigMap[k.trim()] = v.trim();
      }
      const ts = sigMap['ts'];
      const v1 = sigMap['v1'];
      if (!ts || !v1) {
        return new Response(JSON.stringify({ error: 'Assinatura inválida', code: 'invalid_signature_format' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!paymentId) {
        return new Response(JSON.stringify({ error: 'Nenhum paymentId para validar assinatura', code: 'missing_payment_id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const manifest = `id:${paymentId};request-id:${reqId};ts:${ts};`;
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(MP_WEBHOOK_SECRET),
        { name: 'HMAC', hash: { name: 'SHA-256' } },
        false,
        ['sign']
      );
      const signatureBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(manifest));
      const signatureHex = Array.from(new Uint8Array(signatureBuf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      if (signatureHex !== v1) {
        return new Response(JSON.stringify({ error: 'Assinatura não confere', code: 'signature_mismatch' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 1) Caminho simples para testes (sem assinatura): external_reference + status approved
    const directExternalRef = body?.external_reference || body?.data?.external_reference;
    const directStatus = body?.status || body?.payment_status || body?.data?.status;
    if (!MP_WEBHOOK_SECRET && directExternalRef && (directStatus === 'approved' || directStatus === 'payment_approved')) {
      const upd = await markOrderPaid(String(directExternalRef));
      return new Response(JSON.stringify({ ok: true, mode: 'direct', updated: upd.updatedCount }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!paymentId) {
      return new Response(JSON.stringify({ error: 'Nenhum paymentId encontrado' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payment = await fetchPaymentDetails(paymentId);
    const status = payment?.status;
    const externalRef = payment?.external_reference;

    if (!externalRef) {
      return new Response(JSON.stringify({ error: 'Pagamento sem external_reference' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (status === 'approved') {
      // Registrar o pedido a partir dos metadados
      const reg = await registerOrderFromMetadata(payment);
      
      return new Response(JSON.stringify({ ok: true, status, registered: reg.pedidoId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ ok: true, status, message: 'Pagamento não aprovado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (err) {
    console.error('[mp-payment-webhook] erro:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

export {};