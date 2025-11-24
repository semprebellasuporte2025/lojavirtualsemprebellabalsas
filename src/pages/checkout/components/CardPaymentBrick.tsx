import { useEffect, useRef, useState } from 'react';

interface CardPaymentBrickProps {
  amount: number;
  onToken: (args: { token: string; paymentMethodId?: string; issuerId?: string; installments?: number }) => void;
}

declare global {
  interface Window {
    MercadoPago: any;
  }
}

export default function CardPaymentBrick({ amount, onToken }: CardPaymentBrickProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const instanceRef = useRef<any>(null);

  useEffect(() => {
    try {
      const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY;
      if (!publicKey) {
        setError('Chave pública do Mercado Pago ausente. Configure VITE_MP_PUBLIC_KEY.');
        return;
      }

      if (!window.MercadoPago) {
        setError('SDK do Mercado Pago não carregado.');
        return;
      }

      const mp = new window.MercadoPago(publicKey, { locale: 'pt-BR' });
      const bricksBuilder = mp.bricks();

      bricksBuilder
        .create('cardPayment', containerRef.current!, {
          initialization: { amount },
          callbacks: {
            onReady: () => {},
            onError: (err: any) => {
              console.error('Erro CardPayment Brick:', err);
              setError(err?.message || 'Erro ao inicializar o formulário de cartão');
            },
            onSubmit: async ({ formData }: any) => {
              try {
                const token: string | undefined = formData?.token;
                const paymentMethodId: string | undefined = formData?.paymentMethodId;
                const issuerId: string | undefined = formData?.issuerId;
                const installments: number | undefined = formData?.installments;
                if (!token) {
                  throw new Error('Não foi possível gerar o token do cartão');
                }
                onToken({ token, paymentMethodId, issuerId, installments });
              } catch (e) {
                console.error('Erro ao obter token do cartão:', e);
                setError(e instanceof Error ? e.message : 'Erro ao obter token do cartão');
              }
            },
          },
        })
        .then((instance: any) => {
          instanceRef.current = instance;
        })
        .catch((err: any) => {
          console.error('Falha ao criar brick:', err);
          setError(err?.message || 'Falha ao criar formulário de cartão');
        });

      return () => {
        try {
          if (instanceRef.current) instanceRef.current.unmount();
        } catch {}
      };
    } catch (e) {
      console.error('CardPaymentBrick fatal error:', e);
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    }
  }, [amount]);

  return (
    <div className="space-y-2">
      <div ref={containerRef} id="cardPaymentBrick_container" />
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}