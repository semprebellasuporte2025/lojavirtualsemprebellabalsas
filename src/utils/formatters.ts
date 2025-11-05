export const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

export const getFormaPagamentoNome = (forma: string) => {
  switch (forma) {
    case 'credit':
      return 'Cartão de Crédito';
    case 'credito':
      return 'Cartão de Crédito';
    case 'debito':
      return 'Cartão de Débito';
    case 'pix':
      return 'PIX';
    case 'boleto':
      return 'Boleto';
    case 'dinheiro':
    case 'cash':
      return 'Dinheiro';
    default:
      return forma;
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'Pendente':
      return 'bg-yellow-100 text-yellow-800';
    case 'Processando':
      return 'bg-blue-100 text-blue-800';
    case 'Enviado':
      return 'bg-green-100 text-green-800';
    case 'Entregue':
      return 'bg-green-200 text-green-900';
    case 'Cancelado':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Gera um slug a partir de um texto
 * Converte para minúsculas, remove acentos, substitui espaços por hífens
 * e remove caracteres especiais
 */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD') // Normaliza para decompor acentos
    .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais, mantém hífens
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove múltiplos hífens consecutivos
    .trim() // Remove espaços no início e fim
    .replace(/^-+|-+$/g, ''); // Remove hífens no início e fim
};