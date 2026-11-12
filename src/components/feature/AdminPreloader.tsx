import React from 'react';

interface PreloaderProps {
  message?: string;
  pageName?: string;
}

function formatSlug(slug: string): string {
  try {
    const decoded = decodeURIComponent(slug).replace(/[-_]+/g, ' ').trim();
    return decoded
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  } catch {
    return slug;
  }
}

export function getDynamicLoadingMessage(pathname: string): string {
  const cleanPath = (pathname || '').toLowerCase().split('?')[0].split('#')[0];

  // Produto (ex: /produto/vestido-midi-alfaiataria)
  if (cleanPath.startsWith('/produto/') || cleanPath.startsWith('/product/')) {
    const parts = cleanPath.split('/').filter(Boolean);
    const slug = parts[1];
    if (slug) {
      return `Carregando ${formatSlug(slug)}...`;
    }
    return 'Carregando produto...';
  }

  // Categoria (ex: /categoria/vestidos)
  if (cleanPath.startsWith('/categoria/') || cleanPath.startsWith('/categorias/')) {
    const parts = cleanPath.split('/').filter(Boolean);
    const slug = parts[1];
    if (slug) {
      return `Carregando categoria ${formatSlug(slug)}...`;
    }
    return 'Carregando categoria...';
  }
  if (cleanPath === '/categoria' || cleanPath === '/categorias') {
    return 'Carregando categorias...';
  }

  // Admin / Painel Administrativo
  if (cleanPath.startsWith('/paineladmin') || cleanPath.startsWith('/admin')) {
    if (cleanPath.includes('/produtos/cadastrar')) return 'Carregando cadastro de produto...';
    if (cleanPath.includes('/produtos/editar')) return 'Carregando edição de produto...';
    if (cleanPath.includes('/produtos')) return 'Carregando catálogo de produtos...';

    if (cleanPath.includes('/categorias/cadastrar')) return 'Carregando cadastro de categoria...';
    if (cleanPath.includes('/categorias/editar')) return 'Carregando edição de categoria...';
    if (cleanPath.includes('/categorias')) return 'Carregando categorias...';

    if (cleanPath.includes('/clientes/cadastrar')) return 'Carregando cadastro de cliente...';
    if (cleanPath.includes('/clientes/editar')) return 'Carregando edição de cliente...';
    if (cleanPath.includes('/clientes')) return 'Carregando clientes...';

    if (cleanPath.includes('/estoque/entrada')) return 'Carregando entrada de estoque...';
    if (cleanPath.includes('/estoque')) return 'Carregando estoque...';

    if (cleanPath.includes('/vendas')) return 'Carregando vendas e pedidos...';
    if (cleanPath.includes('/cupons')) return 'Carregando cupons...';
    if (cleanPath.includes('/banners')) return 'Carregando banners...';
    if (cleanPath.includes('/link-instagram')) return 'Carregando links do Instagram...';
    if (cleanPath.includes('/usuarios')) return 'Carregando usuários e permissões...';
    if (cleanPath.includes('/configuracoes')) return 'Carregando configurações...';
    if (cleanPath.includes('/conta')) return 'Carregando dados da conta...';
    if (cleanPath.includes('/dashboard')) return 'Carregando painel administrativo...';

    return 'Carregando painel administrativo...';
  }

  // PDV
  if (cleanPath.startsWith('/pdv')) {
    return 'Carregando PDV (Ponto de Venda)...';
  }

  // Carrinho e Checkout
  if (cleanPath.startsWith('/carrinho')) {
    return 'Carregando carrinho...';
  }
  if (cleanPath.startsWith('/checkout')) {
    return 'Carregando finalização do pedido...';
  }

  // Minha Conta & Auth
  if (cleanPath.startsWith('/minha-conta')) {
    return 'Carregando minha conta...';
  }
  if (cleanPath.startsWith('/auth/login')) {
    return 'Carregando login...';
  }
  if (cleanPath.startsWith('/auth/register')) {
    return 'Carregando cadastro...';
  }

  // Páginas Institucionais
  if (cleanPath.startsWith('/sobre-nos')) return 'Carregando sobre nós...';
  if (cleanPath.startsWith('/contato')) return 'Carregando contato...';
  if (cleanPath.startsWith('/frete-entrega')) return 'Carregando frete e entrega...';
  if (cleanPath.startsWith('/formas-pagamento')) return 'Carregando formas de pagamento...';
  if (cleanPath.startsWith('/privacidade')) return 'Carregando política de privacidade...';
  if (cleanPath.startsWith('/link')) return 'Carregando links...';

  if (cleanPath === '/' || cleanPath === '') {
    return 'Carregando loja virtual...';
  }

  return 'Carregando...';
}

export default function AdminPreloader({ message, pageName }: PreloaderProps) {
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const displayText =
    message ||
    (pageName ? `Carregando ${pageName}...` : getDynamicLoadingMessage(currentPath));

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white px-4">
      {/* Nome do Site: Conforme Anexo 2 (Sempre Bella Balsas na fonte cursiva rosa Pacifico) */}
      <h1
        className="text-3xl md:text-4xl text-pink-600 font-bold tracking-normal select-none mb-8 text-center"
        style={{ fontFamily: '"Pacifico", cursive, serif' }}
      >
        Sempre Bella Balsas
      </h1>

      {/* Spinner Circular Limpo: Conforme Anexo 1 */}
      <div className="w-10 h-10 mb-6 relative">
        <div className="w-10 h-10 rounded-full border-[3px] border-pink-100 border-t-pink-600 animate-spin" />
      </div>

      {/* Texto Dinâmico de Carregamento: Conforme Anexo 1 */}
      <p className="text-gray-600 text-sm md:text-base font-normal tracking-wide text-center">
        {displayText}
      </p>
    </div>
  );
}
