
import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';

// Componente de loading
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Carregando...</p>
    </div>
  </div>
);

// Lazy loading dos componentes - corrigido
const HomePage = lazy(() => import('../pages/home/page'));
const ProductPage = lazy(() => import('../pages/product/page'));
const CategoriaPage = lazy(() => import('../pages/categoria/page'));
const MinhaContaPage = lazy(() => import('../pages/minha-conta/page'));
const NotFoundPage = lazy(() => import('../pages/NotFound'));
const CarrinhoPage = lazy(() => import('../pages/carrinho/page'));
const CheckoutPage = lazy(() => import('../pages/checkout/page'));
const AuthLoginPage = lazy(() => import('../pages/auth/login/page'));

// Páginas institucionais
const SobreNosPage = lazy(() => import('../pages/sobre-nos/page'));
const ContatoPage = lazy(() => import('../pages/contato/page'));
const FreteEntregaPage = lazy(() => import('../pages/frete-entrega/page'));
const FormasPagamentoPage = lazy(() => import('../pages/formas-pagamento/page'));
const PrivacidadePage = lazy(() => import('../pages/privacidade/page'));
const ObrigadoInscricaoPage = lazy(() => import('../pages/obrigado-inscricao'));

// Admin pages
const AdminDashboardPage = lazy(() => import('../pages/admin/dashboard/page'));
const AdminProdutosCadastrarPage = lazy(() => import('../pages/admin/produtos/cadastrar/page'));
const AdminProdutosListarPage = lazy(() => import('../pages/admin/produtos/listar/page'));
const AdminProdutosEditarPage = lazy(() => import('../pages/admin/produtos/editar/page'));
const AdminCategoriasCadastrarPage = lazy(() => import('../pages/admin/categorias/cadastrar/page'));
const AdminCategoriasListarPage = lazy(() => import('../pages/admin/categorias/listar/page'));
const AdminCategoriasEditarPage = lazy(() => import('../pages/admin/categorias/editar/page'));
const AdminClientesCadastrarPage = lazy(() => import('../pages/admin/clientes/cadastrar/page'));
const AdminClientesListarPage = lazy(() => import('../pages/admin/clientes/listar/page'));
const AdminFornecedoresCadastrarPage = lazy(() => import('../pages/admin/fornecedores/cadastrar/page'));
const AdminFornecedoresListarPage = lazy(() => import('../pages/admin/fornecedores/listar/page'));
const AdminEstoqueEntradaPage = lazy(() => import('../pages/admin/estoque/entrada/page'));
const AdminEstoqueListarPage = lazy(() => import('../pages/admin/estoque/listar/page'));
const AdminVendasListarPage = lazy(() => import('../pages/admin/vendas/listar/page'));
const AdminBannersCadastrarPage = lazy(() => import('../pages/admin/banners/cadastrar/page'));
const AdminBannersListarPage = lazy(() => import('../pages/admin/banners/listar/page'));
const AdminUsuariosCadastrarPage = lazy(() => import('../pages/admin/usuarios/cadastrar/page'));
const AdminUsuariosListarPage = lazy(() => import('../pages/admin/usuarios/listar/page'));
const AdminContaPage = lazy(() => import('../pages/admin/conta/page'));
const AdminConfiguracoesGeraisPage = lazy(() => import('../pages/admin/configuracoes/gerais/page'));
const AdminConfiguracoesIntegracaoPage = lazy(() => import('../pages/admin/configuracoes/integracao/page'));
const AdminConfiguracoesNotificacoesPage = lazy(() => import('../pages/admin/configuracoes/notificacoes/page'));
const AdminConfiguracoesSistemaPage = lazy(() => import('../pages/admin/configuracoes/sistema/page'));
const AdminAjudaPage = lazy(() => import('../pages/admin/ajuda/page'));
const AdminDebugUploadPage = lazy(() => import('../pages/admin/debug-upload'));
const AdminDebugColorVariationsPage = lazy(() => import('../pages/admin/debug-color-variations'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Suspense fallback={<LoadingFallback />}><HomePage /></Suspense>,
  },
  {
    path: '/carrinho',
    element: <Suspense fallback={<LoadingFallback />}><CarrinhoPage /></Suspense>,
  },
  {
    path: '/checkout',
    element: <Suspense fallback={<LoadingFallback />}><CheckoutPage /></Suspense>,
  },
  {
    path: '/categoria/:categoria',
    element: <Suspense fallback={<LoadingFallback />}><CategoriaPage /></Suspense>,
  },
  {
    path: '/categoria',
    element: <Suspense fallback={<LoadingFallback />}><CategoriaPage /></Suspense>,
  },
  {
    path: '/produto/:id',
    element: <Suspense fallback={<LoadingFallback />}><ProductPage /></Suspense>,
  },
  {
    path: '/product/:id',
    element: <Suspense fallback={<LoadingFallback />}><ProductPage /></Suspense>,
  },
  {
    path: '/minha-conta',
    element: <Suspense fallback={<LoadingFallback />}><MinhaContaPage /></Suspense>,
  },
  {
    path: '/auth/login',
    element: <Suspense fallback={<LoadingFallback />}><AuthLoginPage /></Suspense>,
  },
  // Páginas institucionais
  {
    path: '/sobre-nos',
    element: <Suspense fallback={<LoadingFallback />}><SobreNosPage /></Suspense>,
  },
  {
    path: '/contato',
    element: <Suspense fallback={<LoadingFallback />}><ContatoPage /></Suspense>,
  },
  {
    path: '/frete-entrega',
    element: <Suspense fallback={<LoadingFallback />}><FreteEntregaPage /></Suspense>,
  },
  {
    path: '/formas-pagamento',
    element: <Suspense fallback={<LoadingFallback />}><FormasPagamentoPage /></Suspense>,
  },
  {
    path: '/privacidade',
    element: <Suspense fallback={<LoadingFallback />}><PrivacidadePage /></Suspense>,
  },
  {
    path: '/obrigado-inscricao',
    element: <Suspense fallback={<LoadingFallback />}><ObrigadoInscricaoPage /></Suspense>,
  },
  // Admin routes
  {
    path: '/paineladmin',
    element: <Suspense fallback={<LoadingFallback />}><AdminDashboardPage /></Suspense>,
  },
  {
    path: '/paineladmin/dashboard',
    element: <Suspense fallback={<LoadingFallback />}><AdminDashboardPage /></Suspense>,
  },
  {
    path: '/paineladmin/produtos/cadastrar',
    element: <Suspense fallback={<LoadingFallback />}><AdminProdutosCadastrarPage /></Suspense>,
  },
  {
    path: '/paineladmin/produtos/listar',
    element: <Suspense fallback={<LoadingFallback />}><AdminProdutosListarPage /></Suspense>,
  },
  {
    path: '/paineladmin/produtos/editar/:id',
    element: <Suspense fallback={<LoadingFallback />}><AdminProdutosEditarPage /></Suspense>,
  },
  {
    path: '/paineladmin/categorias/cadastrar',
    element: <Suspense fallback={<LoadingFallback />}><AdminCategoriasCadastrarPage /></Suspense>,
  },
  {
    path: '/paineladmin/categorias/listar',
    element: <Suspense fallback={<LoadingFallback />}><AdminCategoriasListarPage /></Suspense>,
  },
  {
    path: '/paineladmin/categorias/editar/:id',
    element: <Suspense fallback={<LoadingFallback />}><AdminCategoriasEditarPage /></Suspense>,
  },
  {
    path: '/paineladmin/clientes/cadastrar',
    element: <Suspense fallback={<LoadingFallback />}><AdminClientesCadastrarPage /></Suspense>,
  },
  {
    path: '/paineladmin/clientes/listar',
    element: <Suspense fallback={<LoadingFallback />}><AdminClientesListarPage /></Suspense>,
  },
  {
    path: '/paineladmin/fornecedores/cadastrar',
    element: <Suspense fallback={<LoadingFallback />}><AdminFornecedoresCadastrarPage /></Suspense>,
  },
  {
    path: '/paineladmin/fornecedores/listar',
    element: <Suspense fallback={<LoadingFallback />}><AdminFornecedoresListarPage /></Suspense>,
  },
  {
    path: '/paineladmin/estoque/entrada',
    element: <Suspense fallback={<LoadingFallback />}><AdminEstoqueEntradaPage /></Suspense>,
  },
  {
    path: '/paineladmin/estoque/listar',
    element: <Suspense fallback={<LoadingFallback />}><AdminEstoqueListarPage /></Suspense>,
  },
  {
    path: '/paineladmin/vendas/listar',
    element: <Suspense fallback={<LoadingFallback />}><AdminVendasListarPage /></Suspense>,
  },
  {
    path: '/paineladmin/banners/cadastrar',
    element: <Suspense fallback={<LoadingFallback />}><AdminBannersCadastrarPage /></Suspense>,
  },
  {
    path: '/paineladmin/banners/listar',
    element: <Suspense fallback={<LoadingFallback />}><AdminBannersListarPage /></Suspense>,
  },
  {
    path: '/paineladmin/usuarios/cadastrar',
    element: <Suspense fallback={<LoadingFallback />}><AdminUsuariosCadastrarPage /></Suspense>,
  },
  {
    path: '/paineladmin/usuarios/listar',
    element: <Suspense fallback={<LoadingFallback />}><AdminUsuariosListarPage /></Suspense>,
  },

  {
    path: '/paineladmin/conta',
    element: <Suspense fallback={<LoadingFallback />}><AdminContaPage /></Suspense>,
  },
  {
    path: '/paineladmin/configuracoes/gerais',
    element: <Suspense fallback={<LoadingFallback />}><AdminConfiguracoesGeraisPage /></Suspense>,
  },
  {
    path: '/paineladmin/configuracoes/integracao',
    element: <Suspense fallback={<LoadingFallback />}><AdminConfiguracoesIntegracaoPage /></Suspense>,
  },
  {
    path: '/paineladmin/configuracoes/notificacoes',
    element: <Suspense fallback={<LoadingFallback />}><AdminConfiguracoesNotificacoesPage /></Suspense>,
  },
  {
    path: '/paineladmin/configuracoes/sistema',
    element: <Suspense fallback={<LoadingFallback />}><AdminConfiguracoesSistemaPage /></Suspense>,
  },
  {
    path: '/paineladmin/ajuda',
    element: <Suspense fallback={<LoadingFallback />}><AdminAjudaPage /></Suspense>,
  },
  {
    path: '/paineladmin/debug-upload',
    element: <Suspense fallback={<LoadingFallback />}><AdminDebugUploadPage /></Suspense>,
  },
  {
    path: '/paineladmin/debug-color-variations',
    element: <Suspense fallback={<LoadingFallback />}><AdminDebugColorVariationsPage /></Suspense>,
  },
  {
    path: '*',
    element: <Suspense fallback={<LoadingFallback />}><NotFoundPage /></Suspense>,
  },
];

export default routes;
