/// <reference path="../ambient.d.ts" />
// Edge Function: cria preferência do Mercado Pago com token seguro
// Ambiente: Deno (Supabase Edge Functions)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req)=>{ 
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Método não permitido'
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN');
    const MP_NOTIFICATION_URL = Deno.env.get('MP_NOTIFICATION_URL');

    if (!MP_ACCESS_TOKEN) {
      return new Response(JSON.stringify({
        error: 'MP_ACCESS_TOKEN não configurado nas secrets'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const body = await req.json();

    // Validações básicas
    if (!body || !Array.isArray(body.items) || body.items.length === 0) {
      return new Response(JSON.stringify({
        error: 'Itens do carrinho são obrigatórios'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (!body.externalReference || typeof body.externalReference !== 'string') {
      return new Response(JSON.stringify({
        error: 'externalReference é obrigatório'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (!body.cliente || !body.cliente.email || !body.cliente.nome) {
      return new Response(JSON.stringify({
        error: 'Dados do cliente (nome, email) são obrigatórios'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (!body.backUrls || !body.backUrls.success || !body.backUrls.pending || !body.backUrls.failure) {
      return new Response(JSON.stringify({
        error: 'backUrls (success, pending, failure) são obrigatórios'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Monta payload da preferência
    const preferred = (body.preferredPaymentMethodId || '').toLowerCase();
    const payload = {
      items: body.items.map((i: any)=>({ 
          title: i.name,
          quantity: i.quantity,
          unit_price: Number(Number(i.price).toFixed(2)),
          currency_id: 'BRL',
          picture_url: i.image || undefined
        })),
      external_reference: body.externalReference,
      payer: {
        name: body.cliente.nome,
        email: body.cliente.email,
        identification: body.cliente.cpf ? {
          type: 'CPF',
          number: String(body.cliente.cpf).replace(/\D/g, '')
        } : undefined
      },
      back_urls: body.backUrls,
      auto_return: 'approved',
      // Preferir a URL de webhook configurada no ambiente; se ausente, usa do corpo (fallback)
      // Para desenvolvimento local, usar URL HTTPS válida do Supabase
      notification_url: MP_NOTIFICATION_URL || body.notificationUrl || 'https://cproxdqrraiujnewbsvp.supabase.co/functions/v1/mp-payment-webhook',
      metadata: {
        order_number: body.externalReference
      },
      payment_methods: {
        installments: 12
      }
    };

    // Chama API do Mercado Pago
    const controller = new AbortController();
    const timeout = setTimeout(()=>controller.abort(), 15000);

    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    }).catch((err)=>{ 
      clearTimeout(timeout);
      throw err;
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text().catch(()=>'');
      return new Response(JSON.stringify({
        error: 'Falha ao criar preferência',
        status: res.status,
        body: text
      }), {
        status: 502,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const data = await res.json();

    return new Response(JSON.stringify({
      id: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error('[create-mp-preference] erro:', err);
    return new Response(JSON.stringify({
      error: String(err)
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});