// Utilitário para integração com Mercado Pago Checkout Pro
// Em produção, a criação de preferência acontece via Edge Function segura.

import { supabase } from './supabase';

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  size?: string;
  color?: string;
};

type ClienteInfo = {
  nome: string;
  email: string;
};

type BackUrls = {
  success: string;
  pending: string;
  failure: string;
};

export type PreferenceResponse = {
  id: string;
  init_point?: string;
  sandbox_init_point?: string;
};

export async function createPreference(params: {
  items: CartItem[];
  externalReference: string;
  cliente: ClienteInfo;
  backUrls: BackUrls;
  notificationUrl?: string;
  preferredPaymentMethodId?: string; // Adicionado para suportar preferência de método
}): Promise<PreferenceResponse> {
  const { data, error } = await supabase.functions.invoke('create-mp-preference', {
    body: {
      items: params.items,
      externalReference: params.externalReference,
      cliente: params.cliente,
      backUrls: params.backUrls,
      notificationUrl: params.notificationUrl,
      preferredPaymentMethodId: params.preferredPaymentMethodId, // Passando para a Edge Function
    },
  });

  if (error) {
    throw new Error(error.message || 'Falha ao criar preferência Mercado Pago via Edge Function');
  }

  return {
    id: (data as any)?.id,
    init_point: (data as any)?.init_point,
    sandbox_init_point: (data as any)?.sandbox_init_point,
  };
}

export async function openCheckout(preferenceId: string) {
  if (typeof window === 'undefined') return;

  const publicKey = (import.meta.env.VITE_MP_PUBLIC_KEY as string | undefined) ||
    'APP_USR-c4000768-63f5-4d4b-b0de-dc3e02ffd4d7'; // Sandbox fallback

  const scriptId = 'mp-sdk';

  // Garante que o script foi carregado
  if (!document.getElementById(scriptId)) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Falha ao carregar SDK Mercado Pago'));
      document.body.appendChild(script);
    });
  }

  // @ts-ignore
  const mp = new window.MercadoPago(publicKey, {
    locale: 'pt-BR'
  });

  // @ts-ignore
  const checkout = mp.checkout({
    preference: { id: preferenceId }
  });

  checkout.open();
}