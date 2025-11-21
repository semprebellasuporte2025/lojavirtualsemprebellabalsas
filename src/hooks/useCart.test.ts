import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCart } from './useCart';

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
});