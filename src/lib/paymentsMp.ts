import { supabase } from './supabase';

type Payer = {
  email: string;
  first_name?: string;
  last_name?: string;
  identification?: { type: string; number: string };
};

type PixPayload = {
  method: 'pix';
  amount: number;
  description?: string;
  orderNumber?: string;
  payer: Payer;
  // Se fornecido, abre Checkout Pro com restrição somente PIX
  redirectUrl?: string;
};

type CardPayload = {
  method: 'card';
  amount: number;
  description?: string;
  orderNumber?: string;
  token?: string; // Token is now optional
  installments?: number;
  paymentMethodId?: string;
  issuerId?: string;
  payer: Payer;
  redirectUrl?: string;
};

function mapInvokeError(err: any): string {
  const msg = String(err?.message || err || '')
    .toLowerCase()
    .replace(/\s+/g, ' ');
  if (msg.includes('requested function was not found') || msg.includes('404')) {
    return 'Função pagar-mp não encontrada (deploy pendente).';
  }
  if (msg.includes('cors') || msg.includes('failed to fetch')) {
    return 'Falha de rede/CORS ao acessar pagar-mp. Tente novamente.';
  }
  if (msg.includes('unauthorized') || msg.includes('401') || msg.includes('403')) {
    return 'Acesso não autorizado à função pagar-mp.';
  }
  return err?.message || 'Falha ao processar pagamento';
}

async function callPagarMp<T extends PixPayload | CardPayload>(payload: T) {
  console.log('[Debug] Tentando obter sessão do usuário para pagamento...');
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('[Debug] Erro ao obter sessão:', sessionError);
    throw new Error('Erro ao verificar autenticação do usuário.');
  }

  console.log('[Debug] Objeto session:', session);

  if (!session) {
    console.error('[Debug] Falha: Sessão do usuário não encontrada.');
    throw new Error('Usuário não autenticado. Faça o login para continuar.');
  }

  console.log('[Debug] Access Token:', session.access_token ? 'Encontrado' : 'NÃO ENCONTRADO');

  const { data, error } = await supabase.functions.invoke('pagar-mp', {
    body: payload,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    throw new Error(mapInvokeError(error));
  }

  const ok = (data as any)?.success === true;
  if (!ok) {
    const errMsg = (data as any)?.error || 'Falha ao processar pagamento';
    const details = (data as any)?.details;
    let extra = '';
    try {
      if (details) {
        if (typeof details === 'string') {
          extra = details;
        } else if (typeof details === 'object') {
          extra = details.message || details.error || details.cause || details.raw || '';
        }
      }
    } catch {}
    throw new Error(extra ? `${errMsg}: ${extra}` : errMsg);
  }

  return (data as any).data as {
    id: string;
    status: string;
    status_detail?: string;
    payment_method_id?: string;
    transaction_amount: number;
    order?: string;
    pix?: {
      qr_code: string;
      qr_code_base64: string;
      ticket_url?: string;
      expires_at?: string | null;
    };
    init_point?: string;
  };
}

export async function payPix(args: Omit<PixPayload, 'method'>) {
  return callPagarMp({ ...args, method: 'pix' });
}

export async function payCard(args: Omit<CardPayload, 'method'>) {
  return callPagarMp({ ...args, method: 'card' });
}