import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string; // chave única do item no carrinho: produto|tamanho|cor
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  size: string;
  color: string;
  material?: string;
  quantity: number;
}

export interface CartShipping {
  cost: number;
  method: string;
  cep?: string;
}

export interface CartCoupon {
  nome: string;
  desconto_percentual: number;
}

export interface CartTotals {
  subtotal: number;
  shippingCost: number;
  pixDiscount: number;
  couponDiscount: number;
  totalDiscount: number;
  total: number;
}

export function calculateCartTotals(params: {
  subtotal: number;
  paymentMethod: 'pix' | 'cartao';
  shippingCost?: number | null;
  coupon?: CartCoupon | null;
}): CartTotals {
  const subtotal = Math.max(0, Number(params.subtotal) || 0);
  const shippingCost = Math.max(0, Number(params.shippingCost) || 0);
  const pixDiscount = params.paymentMethod === 'pix' ? subtotal * 0.10 : 0;
  const couponPct = params.coupon
    ? Math.max(0, Math.min(100, Number(params.coupon.desconto_percentual) || 0))
    : 0;
  const couponDiscount = subtotal * (couponPct / 100);
  const totalDiscount = Math.min(subtotal, pixDiscount + couponDiscount);
  const total = Math.max(0, Number((subtotal + shippingCost - totalDiscount).toFixed(2)));

  return {
    subtotal: Number(subtotal.toFixed(2)),
    shippingCost: Number(shippingCost.toFixed(2)),
    pixDiscount: Number(pixDiscount.toFixed(2)),
    couponDiscount: Number(couponDiscount.toFixed(2)),
    totalDiscount: Number(totalDiscount.toFixed(2)),
    total,
  };
}

interface CartStore {
  items: CartItem[];
  paymentMethod: 'pix' | 'cartao';
  shipping: CartShipping | null;
  coupon: CartCoupon | null;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  setPaymentMethod: (metodo: 'pix' | 'cartao') => void;
  setShipping: (shipping: CartShipping | null) => void;
  setCoupon: (coupon: CartCoupon | null) => void;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      paymentMethod:
        typeof window !== 'undefined'
          ? (localStorage.getItem('last-payment-method') === 'cartao' ? 'cartao' : 'pix')
          : 'pix',
      shipping: null,
      coupon: null,
      addItem: (item) => set((state) => {
        const existingItem = state.items.find(i => i.id === item.id);
        if (existingItem) {
          return {
            items: state.items.map(i =>
              i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
            )
          };
        }
        return { items: [...state.items, item] };
      }),
      removeItem: (id) => set((state) => ({
        items: state.items.filter(item => item.id !== id)
      })),
      updateQuantity: (id, quantity) => set((state) => {
        if (quantity === 0) {
          return { items: state.items.filter(item => item.id !== id) };
        }
        return {
          items: state.items.map(item =>
            item.id === id ? { ...item, quantity } : item
          )
        };
      }),
      clearCart: () => set({ items: [], shipping: null, coupon: null }),
      getTotalItems: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.quantity, 0);
      },
      setPaymentMethod: (metodo) => set(() => {
        try {
          localStorage.setItem('last-payment-method', metodo);
        } catch {}
        return { paymentMethod: metodo };
      }),
      setShipping: (shipping) => set({ shipping }),
      setCoupon: (coupon) => set({ coupon }),
    }),
    {
      name: 'cart-storage'
    }
  )
);
