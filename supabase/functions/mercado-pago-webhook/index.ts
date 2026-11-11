import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../shared/cors.ts';
import { constantTimeEqual } from '../shared/auth.ts';

const MP_PAYMENTS_API = 'https://api.mercadopago.com/v1/payments';

function parseSignatureHeader(headerValue: string | null): { ts?: string; v1?: string } {
  if (!headerValue) return {};
  const parts = headerValue.split(',').map((p) => p.trim());
  const result: { ts?: string; v1?: string } = {};
  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 'ts' && value) result.ts = value.trim();
    if (key === 'v1' && value) result.v1 = value.trim();
  }
  return result;
}

async function computeHmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyMpSignature(
  req: Request,
  secret: string,
  dataId: string,
): Promise<boolean> {
  const { ts, v1 } = parseSignatureHeader(req.headers.get('x-signature'));
  const requestId = req.headers.get('x-request-id') || '';
  if (!ts || !v1) {
    return false;
  }

  let manifest = '';
  if (dataId) manifest += `id:${dataId.toLowerCase()};`;
  if (requestId) manifest += `request-id:${requestId};`;
  manifest += `ts:${ts};`;

  const expected = await computeHmacSha256Hex(secret, manifest);
  return constantTimeEqual(expected.toLowerCase(), v1.toLowerCase());
}

function mapMpStatusToOrderStatus(mpStatus: string): 'pago' | 'cancelado' | 'pendente' {
  const normalized = mpStatus.trim().toLowerCase();
  if (normalized === 'approved' || normalized === 'authorized') {
    return 'pago';
  }
  if (
    normalized === 'cancelled' ||
    normalized === 'rejected' ||
    normalized === 'refunded' ||
    normalized === 'charged_back'
  ) {
    return 'cancelado';
  }
  return 'pendente';
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN') || '';
  const mpWebhookSecret = Deno.env.get('MP_WEBHOOK_SECRET') || '';

  if (!supabaseUrl || !serviceRoleKey || !mpAccessToken) {
    return new Response(JSON.stringify({ error: 'Configuração de ambiente incompleta' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));

    const topic = String(
      body?.type || body?.topic || url.searchParams.get('type') || url.searchParams.get('topic') || ''
    ).toLowerCase();

    const rawId =
      url.searchParams.get('data.id') ||
      url.searchParams.get('id') ||
      body?.data?.id ||
      body?.id ||
      '';
    const paymentId = String(rawId).trim();

    if (mpWebhookSecret) {
      const validSig = await verifyMpSignature(req, mpWebhookSecret, paymentId);
      if (!validSig) {
        return new Response(JSON.stringify({ error: 'Assinatura inválida' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (topic && topic !== 'payment') {
      return new Response(JSON.stringify({ received: true, ignored: true, topic }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!paymentId) {
      return new Response(JSON.stringify({ received: true, ignored: true, reason: 'missing payment id' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sempre consulta a API oficial do Mercado Pago para validar autenticidade e status real
    const mpResp = await fetch(`${MP_PAYMENTS_API}/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${mpAccessToken}` },
    });

    if (!mpResp.ok) {
      const errText = await mpResp.text();
      console.error('Erro ao consultar pagamento no Mercado Pago:', mpResp.status, errText);
      return new Response(JSON.stringify({ error: 'Falha ao consultar pagamento no Mercado Pago' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payment = await mpResp.json();
    const mpStatus = String(payment?.status || '');
    const externalReference = String(payment?.external_reference || '').trim();

    if (!externalReference) {
      return new Response(JSON.stringify({ received: true, ignored: true, reason: 'missing external_reference' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const mappedStatus = mapMpStatusToOrderStatus(mpStatus);
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: pedido, error: pedidoErr } = await supabase
      .from('pedidos')
      .select('id, numero_pedido, status, total')
      .eq('numero_pedido', externalReference)
      .maybeSingle();

    if (pedidoErr) throw pedidoErr;

    if (!pedido) {
      return new Response(JSON.stringify({ received: true, ignored: true, reason: 'order not found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const currentStatus = String(pedido.status || '').toLowerCase();

    // Idempotência e proteção de transição de estados
    if (currentStatus === mappedStatus) {
      return new Response(
        JSON.stringify({ received: true, idempotent: true, numero_pedido: externalReference, status: mappedStatus }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const finalizedStatuses = new Set(['pago', 'enviado', 'entregue']);
    if (mappedStatus === 'pendente' && finalizedStatuses.has(currentStatus)) {
      return new Response(
        JSON.stringify({ received: true, ignored: true, reason: 'already paid/fulfilled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error: updateErr } = await supabase
      .from('pedidos')
      .update({
        status: mappedStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pedido.id);

    if (updateErr) throw updateErr;

    return new Response(
      JSON.stringify({
        received: true,
        updated: true,
        numero_pedido: externalReference,
        mp_status: mpStatus,
        status: mappedStatus,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Erro no webhook Mercado Pago:', err);
    return new Response(
      JSON.stringify({ error: (err as Error)?.message || 'Erro interno no webhook' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
