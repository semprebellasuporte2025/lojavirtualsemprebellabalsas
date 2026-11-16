
import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import AdminPreloader from '../components/feature/AdminPreloader';

// Componente de loading
const LoadingFallback = () => (
  <AdminPreloader />
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
const AuthRegisterPage = lazy(() => import('../pages/auth/register/page'));
const WebhookTesterPage = lazy(() => import('../pages/webhook-tester/page'));
const LinkPage = lazy(() => import('../pages/link/page'));
const PDVPage = lazy(() => import('../pages/pdv/page'));

// Páginas institucionais
const SobreNosPage = lazy(() => import('../pages/sobre-nos/page'));
const ContatoPage = lazy(() => import('../pages/contato/page'));
const FreteEntregaPage = lazy(() => import('../pages/frete-entrega/page'));
const FormasPagamentoPage = lazy(() => import('../pages/formas-pagamento/page'));
const PrivacidadePage = lazy(() => import('../pages/privacidade/page'));
const ObrigadoInscricaoPage = lazy(() => import('../pages/obrigado-inscricao'));

// Admin pages (importados diretamente para transições 100% instantâneas entre menus)
import AdminDashboardPage from '../pages/admin/dashboard/page';
import AdminProdutosCadastrarPage from '../pages/admin/produtos/cadastrar/page';
import AdminProdutosListarPage from '../pages/admin/produtos/listar/page';
import AdminProdutosEditarPage from '../pages/admin/produtos/editar/page';
import AdminCategoriasCadastrarPage from '../pages/admin/categorias/cadastrar/page';
import AdminCategoriasListarPage from '../pages/admin/categorias/listar/page';
import AdminCategoriasEditarPage from '../pages/admin/categorias/editar/page';
import AdminClientesCadastrarPage from '../pages/admin/clientes/cadastrar/page';
import AdminClientesListarPage from '../pages/admin/clientes/listar/page';
import AdminClientesEditarPage from '../pages/admin/clientes/editar/page';
import AdminEstoqueEntradaPage from '../pages/admin/estoque/entrada/page';
import AdminEstoqueListarPage from '../pages/admin/estoque/listar/page';
import AdminVendasListarPage from '../pages/admin/vendas/listar/page';
import AdminCuponsCadastrarPage from '../pages/admin/cupons/cadastrar/page';
import AdminCuponsListarPage from '../pages/admin/cupons/listar/page';
import AdminCuponsEditarPage from '../pages/admin/cupons/editar/page';
import AdminLinkInstagramCadastrarPage from '../pages/admin/link-instagram/cadastrar/page';
import AdminLinkInstagramListarPage from '../pages/admin/link-instagram/listar/page';
import AdminLinkInstagramEditarPage from '../pages/admin/link-instagram/editar/page';
import AdminLinkInstagramImagemTopoCadastrarPage from '../pages/admin/link-instagram/imagem-topo/page';
import AdminBannersCadastrarPage from '../pages/admin/banners/cadastrar/page';
import AdminBannersListarPage from '../pages/admin/banners/listar/page';
import AdminBannersEditarPage from '../pages/admin/banners/editar/page';
import AdminUsuariosCadastrarPage from '../pages/admin/usuarios/cadastrar/page';
import AdminUsuariosListarPage from '../pages/admin/usuarios/listar/page';
import AdminContaPage from '../pages/admin/conta/page';
import AdminConfiguracoesGeraisPage from '../pages/admin/configuracoes/gerais/page';
import AdminConfiguracoesIntegracaoPage from '../pages/admin/configuracoes/integracao/page';
import AdminDebugUploadPage from '../pages/admin/debug-upload';
import AdminDebugColorVariationsPage from '../pages/admin/debug-color-variations';

import ProtectedRoute from './ProtectedRoute';
import AdminOnlyRoute from './AdminOnlyRoute';
import AdminAliasRedirect from './AdminAliasRedirect';
import MaintenanceGuard from './MaintenanceGuard';

const routes: RouteObject[] = [
  // Rotas públicas protegidas pelo Modo de Manutenção (se ativo, apenas admin navega)
  {
    element: <MaintenanceGuard />,
    children: [
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
        path: '/pdv',
        element: <Suspense fallback={<LoadingFallback />}><PDVPage /></Suspense>,
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
    ]
  },
  // Rota de login livre (para que o administrador consiga logar mesmo com o site em manutenção)
  {
    path: '/auth/login',
    element: <Suspense fallback={<LoadingFallback />}><AuthLoginPage /></Suspense>,
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
        element: <AdminDashboardPage />,
      },
      {
        path: 'dashboard',
        element: <AdminDashboardPage />,
      },
      {
        path: 'produtos/cadastrar',
        element: <AdminProdutosCadastrarPage />,
      },
      {
        path: 'produtos/listar',
        element: <AdminProdutosListarPage />,
      },
      {
        path: 'produtos/editar/:id',
        element: <AdminProdutosEditarPage />,
      },
      {
        path: 'categorias/cadastrar',
        element: <AdminCategoriasCadastrarPage />,
      },
      {
        path: 'categorias/listar',
        element: <AdminCategoriasListarPage />,
      },
      {
        path: 'categorias/editar/:id',
        element: <AdminCategoriasEditarPage />,
      },
      {
        path: 'clientes/cadastrar',
        element: <AdminClientesCadastrarPage />,
      },
      {
        path: 'clientes/listar',
        element: <AdminClientesListarPage />,
      },
      {
        path: 'clientes/editar/:id',
        element: <AdminClientesEditarPage />,
      },
      {
        path: 'estoque/entrada',
        element: <AdminEstoqueEntradaPage />,
      },
      {
        path: 'estoque/listar',
        element: <AdminEstoqueListarPage />,
      },
      {
        path: 'vendas/listar',
        element: <AdminVendasListarPage />,
      },
      {
        path: 'cupons/cadastrar',
        element: <AdminCuponsCadastrarPage />,
      },
      {
        path: 'cupons/listar',
        element: <AdminCuponsListarPage />,
      },
      {
        path: 'cupons/editar/:id',
        element: <AdminCuponsEditarPage />,
      },
      {
        path: 'link-instagram/cadastrar',
        element: <AdminLinkInstagramCadastrarPage />,
      },
      {
        path: 'link-instagram/listar',
        element: <AdminLinkInstagramListarPage />,
      },
      {
        path: 'link-instagram/editar/:id',
        element: <AdminLinkInstagramEditarPage />,
      },
      {
        path: 'link-instagram/imagem-topo',
        element: <AdminLinkInstagramImagemTopoCadastrarPage />,
      },
      {
        path: 'banners/cadastrar',
        element: <AdminBannersCadastrarPage />,
      },
      {
        path: 'banners/listar',
        element: <AdminBannersListarPage />,
      },
      {
        path: 'banners/editar/:id',
        element: <AdminBannersEditarPage />,
      },
      // Admin-only group: Usuários e Configurações (gerais)
      {
        element: <AdminOnlyRoute />,
        children: [
          {
            path: 'usuarios/cadastrar',
            element: <AdminUsuariosCadastrarPage />,
          },
          {
            path: 'usuarios/listar',
            element: <AdminUsuariosListarPage />,
          },
          {
            path: 'configuracoes/gerais',
            element: <AdminConfiguracoesGeraisPage />,
          },
        ]
      },
      {
        path: 'conta',
        element: <AdminContaPage />,
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
        element: <AdminConfiguracoesIntegracaoPage />,
      },
    ]
  },
  // Removida rota: /paineladmin/ajuda
  {
    path: '/paineladmin/debug-upload',
    element: <AdminDebugUploadPage />,
  },
  {
    path: '/paineladmin/debug-color-variations',
    element: <AdminDebugColorVariationsPage />,
  },
  {
    path: '*',
    element: <Suspense fallback={<LoadingFallback />}><NotFoundPage /></Suspense>,
  },
];

export default routes;
