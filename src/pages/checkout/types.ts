export interface CustomerData {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
}

export interface ShippingData {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  tipo: 'entrega' | 'retirada';
}

export interface PaymentData {
  metodo: 'pix' | 'cartao';
  numeroCartao?: string;
  nomeTitular?: string;
  validade?: string;
  cvv?: string;
  parcelas?: number;
}

export interface CheckoutData {
  customer: CustomerData;
  shipping: ShippingData;
  payment: PaymentData;
}

export type CheckoutStep = 'customer' | 'shipping' | 'payment' | 'review';

export interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}