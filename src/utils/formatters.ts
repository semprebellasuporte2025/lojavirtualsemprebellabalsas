export const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

export const getFormaPagamentoNome = (forma: string) => {
  switch (forma) {
    case 'credito':
      return 'Cartão de Crédito';
    case 'debito':
      return 'Cartão de Débito';
    case 'pix':
      return 'PIX';
    case 'boleto':
      return 'Boleto';
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