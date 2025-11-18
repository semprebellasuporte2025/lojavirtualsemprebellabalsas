
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
const CheckoutPageV3 = lazy(() => import('../pages/checkout/pageV3'));
const CheckoutSucessoPage = lazy(() => import('../pages/checkout/sucesso/page'));
const CheckoutErroPage = lazy(() => import('../pages/checkout/erro/page'));
const CheckoutPendentePage = lazy(() => import('../pages/checkout/pendente/page'));
const AuthLoginPage = lazy(() => import('../pages/auth/login/page'));
const AuthRegisterPage = lazy(() => import('../pages/auth/register/page'));
const WebhookTesterPage = lazy(() => import('../pages/webhook-tester/page'));
const LinkPage = lazy(() => import('../pages/link/page'));

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
const AdminClientesEditarPage = lazy(() => import('../pages/admin/clientes/editar/page'));
const AdminEstoqueEntradaPage = lazy(() => import('../pages/admin/estoque/entrada/page'));
const AdminEstoqueListarPage = lazy(() => import('../pages/admin/estoque/listar/page'));
const AdminVendasListarPage = lazy(() => import('../pages/admin/vendas/listar/page'));
const AdminCuponsCadastrarPage = lazy(() => import('../pages/admin/cupons/cadastrar/page'));
const AdminCuponsListarPage = lazy(() => import('../pages/admin/cupons/listar/page'));
const AdminCuponsEditarPage = lazy(() => import('../pages/admin/cupons/editar/page'));
const AdminLinkInstagramCadastrarPage = lazy(() => import('../pages/admin/link-instagram/cadastrar/page'));
const AdminLinkInstagramListarPage = lazy(() => import('../pages/admin/link-instagram/listar/page'));
const AdminLinkInstagramEditarPage = lazy(() => import('../pages/admin/link-instagram/editar/page'));
const AdminLinkInstagramImagemTopoCadastrarPage = lazy(() => import('../pages/admin/link-instagram/imagem-topo/page'));
const AdminBannersCadastrarPage = lazy(() => import('../pages/admin/banners/cadastrar/page'));
const AdminBannersListarPage = lazy(() => import('../pages/admin/banners/listar/page'));
const AdminBannersEditarPage = lazy(() => import('../pages/admin/banners/editar/page'));
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

import ProtectedRoute from './ProtectedRoute';
import AdminOnlyRoute from './AdminOnlyRoute';
import AdminAliasRedirect from './AdminAliasRedirect';

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
    path: '/checkoutv3',
    element: <Suspense fallback={<LoadingFallback />}><CheckoutPageV3 /></Suspense>,
  },
  {
    path: '/checkout/sucesso',
    element: <Suspense fallback={<LoadingFallback />}><CheckoutSucessoPage /></Suspense>,
  },
  {
    path: '/checkout/erro',
    element: <Suspense fallback={<LoadingFallback />}><CheckoutErroPage /></Suspense>,
  },
  {
    path: '/checkout/pendente',
    element: <Suspense fallback={<LoadingFallback />}><CheckoutPendentePage /></Suspense>,
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
    path: '/produto/:slug',
    element: <Suspense fallback={<LoadingFallback />}><ProductPage /></Suspense>,
  },
  {
    path: '/product/:slug',
    element: <Suspense fallback={<LoadingFallback />}><ProductPage /></Suspense>,
  },
  {
    path: '/webhook-tester',
    element: <Suspense fallback={<LoadingFallback />}><WebhookTesterPage /></Suspense>,
  },
  {
    path: '/link',
    element: <Suspense fallback={<LoadingFallback />}><LinkPage /></Suspense>,
  },
  {
    path: '/minha-conta',
    element: <Suspense fallback={<LoadingFallback />}><MinhaContaPage /></Suspense>,
  },
  {
    path: '/auth/login',
    element: <Suspense fallback={<LoadingFallback />}><AuthLoginPage /></Suspense>,
  },
  {
    path: '/auth/register',
    element: <Suspense fallback={<LoadingFallback />}><AuthRegisterPage /></Suspense>,
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
    path: '/admin/*',
    element: <Suspense fallback={<LoadingFallback />}><AdminAliasRedirect /></Suspense>,
  },
  {
    path: '/paineladmin',
    element: <ProtectedRoute />,
    children: [
      {
        path: '',
        element: <Suspense fallback={<LoadingFallback />}><AdminDashboardPage /></Suspense>,
      },
      {
        path: 'dashboard',
        element: <Suspense fallback={<LoadingFallback />}><AdminDashboardPage /></Suspense>,
      },
      {
        path: 'produtos/cadastrar',
        element: <Suspense fallback={<LoadingFallback />}><AdminProdutosCadastrarPage /></Suspense>,
      },
      {
        path: 'produtos/listar',
        element: <Suspense fallback={<LoadingFallback />}><AdminProdutosListarPage /></Suspense>,
      },
      {
        path: 'produtos/editar/:id',
        element: <Suspense fallback={<LoadingFallback />}><AdminProdutosEditarPage /></Suspense>,
      },
      {
        path: 'categorias/cadastrar',
        element: <Suspense fallback={<LoadingFallback />}><AdminCategoriasCadastrarPage /></Suspense>,
      },
      {
        path: 'categorias/listar',
        element: <Suspense fallback={<LoadingFallback />}><AdminCategoriasListarPage /></Suspense>,
      },
      {
        path: 'categorias/editar/:id',
        element: <Suspense fallback={<LoadingFallback />}><AdminCategoriasEditarPage /></Suspense>,
      },
      {
        path: 'clientes/cadastrar',
        element: <Suspense fallback={<LoadingFallback />}><AdminClientesCadastrarPage /></Suspense>,
      },
      {
        path: 'clientes/listar',
        element: <Suspense fallback={<LoadingFallback />}><AdminClientesListarPage /></Suspense>,
      },
      {
        path: 'clientes/editar/:id',
        element: <Suspense fallback={<LoadingFallback />}><AdminClientesEditarPage /></Suspense>,
      },
      {
        path: 'estoque/entrada',
        element: <Suspense fallback={<LoadingFallback />}><AdminEstoqueEntradaPage /></Suspense>,
      },
      {
        path: 'estoque/listar',
        element: <Suspense fallback={<LoadingFallback />}><AdminEstoqueListarPage /></Suspense>,
      },
      {
        path: 'vendas/listar',
        element: <Suspense fallback={<LoadingFallback />}><AdminVendasListarPage /></Suspense>,
      },
      {
        path: 'cupons/cadastrar',
        element: <Suspense fallback={<LoadingFallback />}><AdminCuponsCadastrarPage /></Suspense>,
      },
      {
        path: 'cupons/listar',
        element: <Suspense fallback={<LoadingFallback />}><AdminCuponsListarPage /></Suspense>,
      },
      {
        path: 'cupons/editar/:id',
        element: <Suspense fallback={<LoadingFallback />}><AdminCuponsEditarPage /></Suspense>,
      },
      {
        path: 'link-instagram/cadastrar',
        element: <Suspense fallback={<LoadingFallback />}><AdminLinkInstagramCadastrarPage /></Suspense>,
      },
      {
        path: 'link-instagram/listar',
        element: <Suspense fallback={<LoadingFallback />}><AdminLinkInstagramListarPage /></Suspense>,
      },
      {
        path: 'link-instagram/editar/:id',
        element: <Suspense fallback={<LoadingFallback />}><AdminLinkInstagramEditarPage /></Suspense>,
      },
      {
        path: 'link-instagram/imagem-topo',
        element: <Suspense fallback={<LoadingFallback />}><AdminLinkInstagramImagemTopoCadastrarPage /></Suspense>,
      },
      {
        path: 'banners/cadastrar',
        element: <Suspense fallback={<LoadingFallback />}><AdminBannersCadastrarPage /></Suspense>,
      },
      {
        path: 'banners/listar',
        element: <Suspense fallback={<LoadingFallback />}><AdminBannersListarPage /></Suspense>,
      },
      {
        path: 'banners/editar/:id',
        element: <Suspense fallback={<LoadingFallback />}><AdminBannersEditarPage /></Suspense>,
      },
      // Admin-only group: Usuários e Configurações (gerais)
      {
        element: <AdminOnlyRoute />,
        children: [
          {
            path: 'usuarios/cadastrar',
            element: <Suspense fallback={<LoadingFallback />}><AdminUsuariosCadastrarPage /></Suspense>,
          },
          {
            path: 'usuarios/listar',
            element: <Suspense fallback={<LoadingFallback />}><AdminUsuariosListarPage /></Suspense>,
          },
          {
            path: 'configuracoes/gerais',
            element: <Suspense fallback={<LoadingFallback />}><AdminConfiguracoesGeraisPage /></Suspense>,
          },
        ]
      },
      {
        path: 'conta',
        element: <Suspense fallback={<LoadingFallback />}><AdminContaPage /></Suspense>,
      },
    ]
  },
  // Admin-only group para Configurações fora do agrupamento principal
  {
    path: '/paineladmin/configuracoes',
    element: <AdminOnlyRoute />,
    children: [
      {
        path: 'integracao',
        element: <Suspense fallback={<LoadingFallback />}><AdminConfiguracoesIntegracaoPage /></Suspense>,
      },
      {
        path: 'notificacoes',
        element: <Suspense fallback={<LoadingFallback />}><AdminConfiguracoesNotificacoesPage /></Suspense>,
      },
      {
        path: 'sistema',
        element: <Suspense fallback={<LoadingFallback />}><AdminConfiguracoesSistemaPage /></Suspense>,
      },
    ]
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
