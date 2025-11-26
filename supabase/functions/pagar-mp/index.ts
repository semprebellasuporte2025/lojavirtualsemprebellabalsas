import { corsHeaders } from '../shared/cors.ts';

// Adicionar importação do Supabase para validação JWT
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

// Configuração do Supabase para validação JWT (usar ANON_KEY)
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

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

  // Validar autenticação do usuário
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ success: false, error: 'Token de autenticação não fornecido' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const userToken = authHeader.replace('Bearer ', '');
  
  // Verificar configuração básica
  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(
      JSON.stringify({ success: false, error: 'Configuração do Supabase ausente (URL/ANON_KEY)' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Criar cliente Supabase com ANON_KEY
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Verificar se o token é válido pegando o usuário com header de autorização personalizado
    const { data: { user }, error: authError } = await supabase.auth.getUser(userToken);
    
    if (authError || !user) {
      console.error('Erro na autenticação:', authError);
      return new Response(JSON.stringify({ success: false, error: 'Token inválido ou usuário não autenticado' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Usuário autenticado com sucesso:', user.email);
  } catch (authError) {
    console.error('Erro ao validar token:', authError);
    return new Response(JSON.stringify({ success: false, error: 'Erro ao validar autenticação' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body: PayRequest = await req.json();
    const amount = Number(body.amount);
    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ success: false, error: 'Valor inválido' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const description = body.description || `Pedido ${body.orderNumber ?? ''}`.trim();

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
              unit_price: amount,
            },
          ],
          payer: commonPayer,
          back_urls: {
            success: body.redirectUrl,
            failure: body.redirectUrl,
            pending: body.redirectUrl,
          },
          external_reference: body.orderNumber,
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
          transaction_amount: amount,
          description,
          payer: commonPayer,
          payment_method_id: 'pix',
        };
      }
    } else if (body.method === 'card') {
      if (body.token) {
        // Checkout Transparente com token
        apiUrl = MP_PAYMENTS_API;
        payload = {
          transaction_amount: amount,
          description,
          payer: commonPayer,
          binary_mode: true,
          token: body.token,
          installments: body.installments || 1,
          payment_method_id: body.paymentMethodId,
          issuer_id: body.issuerId,
          capture: true,
        };
      } else if (body.redirectUrl) {
        // Checkout Pro com redirecionamento
        apiUrl = MP_PREFERENCES_API;
        payload = {
          items: [
            {
              title: description,
              quantity: 1,
              unit_price: amount,
            },
          ],
          payer: commonPayer,
          back_urls: {
            success: body.redirectUrl,
            failure: body.redirectUrl,
            pending: body.redirectUrl,
          },
          auto_return: 'approved',
          external_reference: body.orderNumber,
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