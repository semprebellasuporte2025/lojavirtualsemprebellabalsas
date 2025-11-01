// Tipos de domínio para vendas
// Este arquivo contém os tipos relacionados a vendas, separados das páginas
// para evitar acoplamento e ciclos de dependência

export interface ItemPedido {
  id: string;
  produto_id: string;
  nome: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  tamanho?: string;
  cor?: string;
  imagem?: string;
}

export interface EnderecoEntrega {
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export interface Venda {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  cliente_email: string;
  total: number;
  status: string;
  forma_pagamento: string;
  created_at: string;
  itens_count: number;
  numero_rastreio: string | null;
  itens_pedido: ItemPedido[];
  endereco_entrega: EnderecoEntrega | any; // any para compatibilidade com dados existentes
}