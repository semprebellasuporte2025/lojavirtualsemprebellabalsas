import { corsHeaders } from '../shared/cors.ts';
import { createClient, type User } from 'https://esm.sh/@supabase/supabase-js@2';
import { authenticateUser, getActiveStaffRole, userOwnsOrder } from '../shared/auth.ts';

type PixRequest = {
  method: 'pix';
  amount: number;
  description?: string;
  orderNumber?: string;
  payer: {
    email: string;
    first_name?: string;
    last_name?: string;
    identification?: { type: string; number: string };
  };
  // Se fornecido, usa Checkout Pro e restringe a apenas PIX
  redirectUrl?: string;
};

type CardRequest = {
  method: 'card';
  amount: number;
  description?: string;
  orderNumber?: string;
  token?: string; // Opcional
  installments?: number;
  paymentMethodId?: string;
  issuerId?: string;
  payer: {
    email: string;
    first_name?: string;
    last_name?: string;
    identification?: { type: string; number: string };
  };
  redirectUrl?: string; // Adicionado para checkout pro
};

type PayRequest = PixRequest | CardRequest;

const MP_PAYMENTS_API = 'https://api.mercadopago.com/v1/payments';
const MP_PREFERENCES_API = 'https://api.mercadopago.com/checkout/preferences';

// Configuração do Supabase para validação JWT e consulta segura de pedidos
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const configuredWebhookUrl = Deno.env.get('MP_WEBHOOK_URL') || '';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
  if (!accessToken) {
    // Retornar 200 com erro estruturado para que o cliente receba detalhes
    return new Response(JSON.stringify({ success: false, error: 'MP_ACCESS_TOKEN não configurado' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(
      JSON.stringify({ success: false, error: 'Configuração do Supabase ausente (URL/ANON_KEY)' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let authenticatedUser: User;
  try {
    const auth = await authenticateUser(req, supabaseUrl, supabaseAnonKey);
    if (!auth) {
      return new Response(JSON.stringify({ success: false, error: 'Token inválido ou usuário não autenticado' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    authenticatedUser = auth.user;
  } catch (authError) {
    console.error('Erro ao validar token:', authError);
    return new Response(JSON.stringify({ success: false, error: 'Erro ao validar autenticação' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body: PayRequest = await req.json();
    const clientAmount = Number(body.amount);
    if (!clientAmount || clientAmount <= 0 || !Number.isFinite(clientAmount)) {
      return new Response(JSON.stringify({ success: false, error: 'Valor inválido' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let finalAmount = Number(clientAmount.toFixed(2));
    const orderNumber = typeof body.orderNumber === 'string' ? body.orderNumber.trim() : '';

    if (orderNumber && supabaseServiceRoleKey) {
      const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);
      const { data: pedido, error: pedidoErr } = await serviceClient
        .from('pedidos')
        .select('id, numero_pedido, cliente_id, total, status')
        .eq('numero_pedido', orderNumber)
        .maybeSingle();

      if (pedidoErr || !pedido) {
        return new Response(JSON.stringify({ success: false, error: 'Pedido não encontrado para pagamento' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const staffRole = await getActiveStaffRole(serviceClient, authenticatedUser);
      const isOwner = staffRole ? true : await userOwnsOrder(serviceClient, authenticatedUser, pedido.cliente_id);
      if (!isOwner) {
        return new Response(JSON.stringify({ success: false, error: 'Acesso negado para pagar este pedido' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const orderStatus = String(pedido.status || '').toLowerCase();
      if (orderStatus === 'pago' || orderStatus === 'cancelado') {
        return new Response(
          JSON.stringify({ success: false, error: `Pedido já está com status '${pedido.status}'` }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const serverTotal = Number(pedido.total);
      if (!Number.isFinite(serverTotal) || serverTotal <= 0) {
        return new Response(JSON.stringify({ success: false, error: 'Total do pedido inválido no servidor' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (Math.abs(serverTotal - clientAmount) > 0.05) {
        return new Response(
          JSON.stringify({ success: false, error: 'Valor informado diverge do total registrado no pedido' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      finalAmount = Number(serverTotal.toFixed(2));
    }

    const notificationUrl = configuredWebhookUrl || `${supabaseUrl.replace(/\/$/, '')}/functions/v1/mercado-pago-webhook`;
    const description = body.description || `Pedido ${orderNumber}`.trim();

    const commonPayer = {
      email: body.payer?.email,
      first_name: body.payer?.first_name,
      last_name: body.payer?.last_name,
      identification: body.payer?.identification,
    };

    let apiUrl: string;
    let payload: Record<string, unknown>;

    if (body.method === 'pix') {
      // Se redirectUrl foi fornecido, utilizar Checkout Pro com restrição somente PIX
      if (body.redirectUrl) {
        apiUrl = MP_PREFERENCES_API;
        payload = {
          items: [
            {
              title: description,
              quantity: 1,
              unit_price: finalAmount,
            },
          ],
          payer: commonPayer,
          back_urls: {
            success: body.redirectUrl,
            failure: body.redirectUrl,
            pending: body.redirectUrl,
          },
          external_reference: orderNumber || undefined,
          notification_url: notificationUrl,
          payment_methods: {
            // Define PIX como padrão e exclui tipos não-PIX (não é permitido excluir account_money)
            default_payment_method_id: 'pix',
            excluded_payment_types: [
              { id: 'credit_card' },
              { id: 'debit_card' },
              { id: 'ticket' },
              { id: 'atm' },
            ],
          },
        } as Record<string, unknown>;
      } else {
        // Checkout Transparente com geração de QR Code dentro do app
        apiUrl = MP_PAYMENTS_API;
        payload = {
          transaction_amount: finalAmount,
          description,
          payer: commonPayer,
          payment_method_id: 'pix',
          external_reference: orderNumber || undefined,
          notification_url: notificationUrl,
        };
      }
    } else if (body.method === 'card') {
      if (body.token) {
        // Checkout Transparente com token
        apiUrl = MP_PAYMENTS_API;
        payload = {
          transaction_amount: finalAmount,
          description,
          payer: commonPayer,
          binary_mode: true,
          token: body.token,
          installments: body.installments || 1,
          payment_method_id: body.paymentMethodId,
          issuer_id: body.issuerId,
          capture: true,
          external_reference: orderNumber || undefined,
          notification_url: notificationUrl,
        };
      } else if (body.redirectUrl) {
        // Checkout Pro com redirecionamento
        apiUrl = MP_PREFERENCES_API;
        payload = {
          items: [
            {
              title: description,
              quantity: 1,
              unit_price: finalAmount,
            },
          ],
          payer: commonPayer,
          back_urls: {
            success: body.redirectUrl,
            failure: body.redirectUrl,
            pending: body.redirectUrl,
          },
          auto_return: 'approved',
          external_reference: orderNumber || undefined,
          notification_url: notificationUrl,
          // Excluir PIX no fluxo de cartão conforme docs de Checkout Pro
          // Referência: payment_methods.excluded_payment_methods / excluded_payment_types
          payment_methods: {
            // Definir crédito como tipo padrão
            default_payment_type_id: 'credit_card',
            // Exclui explicitamente o método PIX
            excluded_payment_methods: [{ id: 'pix' }],
            // Exclui tipos que não são cartão no fluxo de cartão
            excluded_payment_types: [
              { id: 'bank_transfer' }, // cobre PIX
              { id: 'ticket' },        // boleto
              { id: 'atm' },           // pagamento em lotérica/caixa eletrônico
              { id: 'debit_card' },    // remove Cartão de Débito (inclui Virtual CAIXA)
            ],
          },
        };
      } else {
        return new Response(
          JSON.stringify({ success: false, error: "Para pagamento com cartão, forneça um 'token' ou uma 'redirectUrl'" }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    } else {
      return new Response(JSON.stringify({ success: false, error: 'Método inválido' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const mpResp = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify(payload),
    });

    const text = await mpResp.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!mpResp.ok) {
      const errMsg = data?.message || data?.error || 'Erro ao criar pagamento';
      // Retornar 200 com detalhes do erro para que o cliente possa exibir mensagem útil
      return new Response(JSON.stringify({ success: false, error: errMsg, details: data }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalizar dados úteis para o cliente
    const normalized = {
      id: data.id,
      status: data.status,
      status_detail: data.status_detail,
      payment_method_id: data.payment_method?.id || data.payment_method_id,
      transaction_amount: data.transaction_amount,
      order: body.orderNumber || data.external_reference,
      pix: data.point_of_interaction?.transaction_data
        ? {
            qr_code: data.point_of_interaction.transaction_data.qr_code,
            qr_code_base64: data.point_of_interaction.transaction_data.qr_code_base64,
            ticket_url: data.point_of_interaction.transaction_data.ticket_url,
            expires_at: data.date_of_expiration || null,
          }
        : undefined,
      init_point: data.init_point, // Retornar init_point para o cliente
    };

    return new Response(JSON.stringify({ success: true, data: normalized }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Falha em pagar-mp:', err);
    return new Response(JSON.stringify({ success: false, error: 'Erro interno' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Marcar como módulo
export {};