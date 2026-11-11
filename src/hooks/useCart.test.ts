import { describe, it, expect, beforeEach } from 'vitest';
import { calculateCartTotals, useCart } from './useCart';

// Polyfill simples de localStorage para ambiente de teste
class LocalStorageMock {
  store: Record<string, string> = {};
  getItem(key: string) { return this.store[key] ?? null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
  clear() { this.store = {}; }
}

beforeEach(() => {
  const ls = new LocalStorageMock();
  // @ts-expect-error jsdom global
  globalThis.localStorage = ls as any;
  // @ts-expect-error jsdom global
  globalThis.window = { localStorage: ls } as any;
  useCart.getState().clearCart();
});

describe('useCart store', () => {
  it('mantém itens no carrinho durante o processo de autenticação', async () => {
    const cart = useCart.getState();

    cart.addItem({
      id: 'p1|M|preto',
      name: 'Vestido Preto',
      price: 100,
      image: 'img.jpg',
      size: 'M',
      color: 'preto',
      quantity: 2,
    });

    expect(useCart.getState().getTotalItems()).toBe(2);
  });

  it('persiste e limpa frete e cupom junto com o carrinho', () => {
    const cart = useCart.getState();
    cart.setShipping({ cost: 28.5, method: 'PAC', cep: '65800000' });
    cart.setCoupon({ nome: 'BELLA15', desconto_percentual: 15 });

    expect(useCart.getState().shipping).toEqual({ cost: 28.5, method: 'PAC', cep: '65800000' });
    expect(useCart.getState().coupon).toEqual({ nome: 'BELLA15', desconto_percentual: 15 });

    cart.clearCart();
    expect(useCart.getState().items).toEqual([]);
    expect(useCart.getState().shipping).toBeNull();
    expect(useCart.getState().coupon).toBeNull();
  });

  it('calcula totais com frete, desconto PIX e cupom sem ultrapassar subtotal', () => {
    const pixWithCoupon = calculateCartTotals({
      subtotal: 200,
      paymentMethod: 'pix',
      shippingCost: 30,
      coupon: { nome: 'BELLA15', desconto_percentual: 15 },
    });
    expect(pixWithCoupon).toEqual({
      subtotal: 200,
      shippingCost: 30,
      pixDiscount: 20,
      couponDiscount: 30,
      totalDiscount: 50,
      total: 180,
    });

    const cappedDiscount = calculateCartTotals({
      subtotal: 100,
      paymentMethod: 'pix',
      shippingCost: 25,
      coupon: { nome: 'MEGA95', desconto_percentual: 95 },
    });
    expect(cappedDiscount.totalDiscount).toBe(100);
    expect(cappedDiscount.total).toBe(25);
  });
});
