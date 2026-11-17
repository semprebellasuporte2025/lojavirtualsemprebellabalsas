import { createContext, useContext, useState, useEffect } from 'react';
import { Link, useLocation, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AdminPreloader from './AdminPreloader';

export const AdminLayoutContext = createContext<boolean>(false);

interface AdminLayoutProps {
  children?: React.ReactNode;
}

/**
 * AdminLayout inteligente:
 * Se invocado como casca principal da rota (Root Shell), monta a Sidebar e o Header uma única vez.
 * Se invocado por componentes filhos que já estão dentro do layout, renderiza apenas seus children,
 * garantindo que a Sidebar NUNCA seja desmontada ou recarregada ao navegar pelos menus.
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  const isInsideLayout = useContext(AdminLayoutContext);

  if (isInsideLayout) {
    return <>{children}</>;
  }

  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}

function AdminLayoutShell({ children }: AdminLayoutProps) {
  const location = useLocation();
  const { user, isAdmin, isAtendente, loading, signOut, adminName } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Atualizar data/hora a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const menuItems = [
    {
      title: 'Dashboard',
      icon: 'ri-dashboard-line',
      path: '/paineladmin/dashboard',
    },
    {
      title: 'PDV',
      icon: 'ri-store-2-line',
      path: '/pdv',
    },
    {
      title: 'Produtos',
      icon: 'ri-shopping-bag-line',
      path: '/paineladmin/produtos/listar',
    },
    {
      title: 'Categorias',
      icon: 'ri-folder-line',
      path: '/paineladmin/categorias/listar',
    },
    {
      title: 'Clientes',
      icon: 'ri-user-line',
      path: '/paineladmin/clientes/listar',
    },
    {
      title: 'Estoque',
      icon: 'ri-archive-line',
      path: '/paineladmin/estoque/listar',
    },
    {
      title: 'Vendas',
      icon: 'ri-money-dollar-circle-line',
      path: '/paineladmin/vendas/listar',
    },
    {
      title: 'Cupons',
      icon: 'ri-ticket-line',
      path: '/paineladmin/cupons/listar',
    },
    {
      title: 'Links',
      icon: 'ri-instagram-line',
      submenu: [
        { title: 'Cadastrar Link', path: '/paineladmin/link-instagram/cadastrar' },
        { title: 'Listar Links', path: '/paineladmin/link-instagram/listar' },
        { title: 'Imagem Topo', path: '/paineladmin/link-instagram/imagem-topo' },
      ],
    },
    {
      title: 'Banners',
      icon: 'ri-image-line',
      path: '/paineladmin/banners/listar',
    },
    {
      title: 'Usuários',
      icon: 'ri-admin-line',
      path: '/paineladmin/usuarios/listar',
    },
    {
      title: 'Configurações',
      icon: 'ri-settings-line',
      submenu: [
        { title: 'Gerais', path: '/paineladmin/configuracoes/gerais' },
        { title: 'Integração', path: '/paineladmin/configuracoes/integracao' },
      ],
    },
  ];

  const toggleMenu = (title: string, containerEl?: HTMLElement | null) => {
    const isOpening = !openMenus.includes(title);
    // Modo acordeão: mantém apenas um menu aberto por vez e recolhe os demais
    setOpenMenus(isOpening ? [title] : []);

    if (isOpening && containerEl) {
      // Rola suavemente para revelar os submenus imediatamente sem corte
      setTimeout(() => {
        containerEl.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 60);
    }
  };

  // Abre automaticamente o submenu correspondente à rota atual (e recolhe os demais)
  useEffect(() => {
    const activeParent = menuItems.find(
      (item) => item.submenu && item.submenu.some((sub) => location.pathname === sub.path)
    );
    if (activeParent) {
      setOpenMenus([activeParent.title]);
    } else {
      setOpenMenus([]);
    }
  }, [location.pathname]);

  const isItemActive = (item: { path?: string; submenu?: { path: string }[] }) => {
    if (item.submenu) {
      return item.submenu.some((sub) => location.pathname === sub.path);
    }
    if (!item.path) return false;
    if (item.path === '/paineladmin/dashboard') {
      return location.pathname === '/paineladmin' || location.pathname === '/paineladmin/dashboard';
    }
    if (item.path === '/pdv') {
      return location.pathname === '/pdv';
    }
    const basePath = item.path.replace(/\/listar$/, '');
    return location.pathname === item.path || location.pathname.startsWith(basePath);
  };

  // Verificar se é admin ou atendente (acesso ao painel)
  const isAuthorizedAdmin = isAdmin || isAtendente;

  // Estados de carregamento e redirecionamento imediatos (após todos os hooks serem registrados)
  if (loading) {
    return <AdminPreloader />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!isAuthorizedAdmin) {
    return <Navigate to="/" replace />;
  }

  // Ocultar menus restritos para atendente
  const displayMenuItems = isAtendente
    ? menuItems.filter((item) => item.title !== 'Usuários' && item.title !== 'Configurações' && item.title !== 'Cupons')
    : menuItems;

  return (
    <AdminLayoutContext.Provider value={true}>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar fixa e permanente */}
        <aside
          className={`fixed top-0 left-0 h-full flex flex-col bg-pink-600 text-white transition-all duration-300 z-40 ${
            sidebarOpen ? 'w-72' : 'w-20'
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b border-pink-500 shrink-0">
            {sidebarOpen && (
              <h1 className="text-xl font-bold">Admin Panel</h1>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-8 h-8 flex items-center justify-center hover:bg-pink-700 rounded-lg transition-colors cursor-pointer"
            >
              <i className={`ri-${sidebarOpen ? 'menu-fold' : 'menu-unfold'}-line text-xl`}></i>
            </button>
          </div>

          <nav className="flex-1 min-h-0 p-4 pb-12 space-y-2 overflow-y-auto no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {displayMenuItems.map((item) => (
              <div key={item.title}>
                {item.submenu ? (
                  <div>
                    <button
                      onClick={(e) => toggleMenu(item.title, e.currentTarget.parentElement)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-pink-700 transition-colors cursor-pointer text-white"
                    >
                      <div className="flex items-center gap-3">
                        <i className={`${item.icon} text-xl`}></i>
                        {sidebarOpen && <span className="whitespace-nowrap">{item.title}</span>}
                      </div>
                      {sidebarOpen && (
                        <i
                          className={`ri-arrow-${
                            openMenus.includes(item.title) ? 'up' : 'down'
                          }-s-line`}
                        ></i>
                      )}
                    </button>
                    {openMenus.includes(item.title) && sidebarOpen && (
                      <div className="ml-4 mt-2 space-y-1">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            className={`block px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors text-white no-underline visited:text-white ${
                              location.pathname === subItem.path ? 'bg-pink-700' : ''
                            }`}
                          >
                            {subItem.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.path!}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-pink-700 transition-colors text-white no-underline visited:text-white ${
                      isItemActive(item) ? 'bg-pink-700' : ''
                    }`}
                  >
                    <i className={`${item.icon} text-xl`}></i>
                    {sidebarOpen && <span className="whitespace-nowrap">{item.title}</span>}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-pink-500 shrink-0 bg-pink-600">
            <button
              onClick={async () => { await signOut(); window.location.href = '/auth/login'; }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-pink-700 transition-colors cursor-pointer text-white"
            >
              <i className="ri-logout-box-line text-xl"></i>
              {sidebarOpen && <span>Sair</span>}
            </button>
          </div>
        </aside>

        {/* Área Principal de Conteúdo */}
        <div
          className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
            sidebarOpen ? 'ml-72' : 'ml-20'
          }`}
        >
          {/* Top Bar fixa e permanente */}
          <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                Olá, {adminName || 'Administrador'}
              </h2>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span>
                      {currentDateTime.toLocaleDateString('pt-BR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {currentDateTime.toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                </div>
                <button className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                  <i className="ri-notification-line text-xl"></i>
                </button>
                <a
                   href="/pdv"
                   target="_blank"
                   rel="noopener noreferrer"
                   className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors whitespace-nowrap no-underline visited:text-white"
                 >
                   PDV
                 </a>
                <a
                   href="/"
                   target="_blank"
                   rel="noopener noreferrer"
                   className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors whitespace-nowrap no-underline visited:text-white"
                 >
                   Ver Loja
                 </a>
              </div>
            </div>
          </header>

          {/* Miolo que troca dinamicamente sem recarregar a Sidebar */}
          <main className="flex-1 p-6">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </AdminLayoutContext.Provider>
  );
}
