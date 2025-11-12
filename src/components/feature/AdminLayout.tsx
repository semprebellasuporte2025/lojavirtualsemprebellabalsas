
import { useState, useEffect } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
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

  // Navegações foram removidas — usamos retornos condicionais abaixo para evitar loops

  // Verificar se é admin ou atendente (acesso ao painel)
  const isAuthorizedAdmin = isAdmin || isAtendente;

  // Estados de carregamento e redirecionamento imediatos para evitar tela em branco
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!isAuthorizedAdmin) {
    return <Navigate to="/" replace />;
  }

  const menuItems = [
    {
      title: 'Dashboard',
      icon: 'ri-dashboard-line',
      path: '/paineladmin/dashboard',
    },
    {
      title: 'Produtos',
      icon: 'ri-shopping-bag-line',
      submenu: [
        { title: 'Cadastrar', path: '/paineladmin/produtos/cadastrar' },
        { title: 'Listar', path: '/paineladmin/produtos/listar' },
      ],
    },
    {
      title: 'Categorias',
      icon: 'ri-folder-line',
      submenu: [
        { title: 'Cadastrar', path: '/paineladmin/categorias/cadastrar' },
        { title: 'Listar', path: '/paineladmin/categorias/listar' },
      ],
    },
    {
      title: 'Clientes',
      icon: 'ri-user-line',
      submenu: [
        { title: 'Cadastrar', path: '/paineladmin/clientes/cadastrar' },
        { title: 'Listar', path: '/paineladmin/clientes/listar' },
      ],
    },
    {
      title: 'Estoque',
      icon: 'ri-archive-line',
      submenu: [
        { title: 'Entrada', path: '/paineladmin/estoque/entrada' },
        { title: 'Listar', path: '/paineladmin/estoque/listar' },
      ],
    },
    {
      title: 'Vendas',
      icon: 'ri-money-dollar-circle-line',
      submenu: [
        { title: 'Listar', path: '/paineladmin/vendas/listar' },
      ],
    },
    {
      title: 'Link Instagram',
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
      submenu: [
        { title: 'Cadastrar', path: '/paineladmin/banners/cadastrar' },
        { title: 'Listar', path: '/paineladmin/banners/listar' },
      ],
    },
    {
      title: 'Usuários',
      icon: 'ri-admin-line',
      submenu: [
        { title: 'Cadastrar', path: '/paineladmin/usuarios/cadastrar' },
        { title: 'Listar', path: '/paineladmin/usuarios/listar' },
      ],
    },
    {
      title: 'Configurações',
      icon: 'ri-settings-line',
      submenu: [
        { title: 'Gerais', path: '/paineladmin/configuracoes/gerais' },
        { title: 'Integração', path: '/paineladmin/configuracoes/integracao' },
        { title: 'Notificações', path: '/paineladmin/configuracoes/notificacoes' },
        { title: 'Sistema', path: '/paineladmin/configuracoes/sistema' },
      ],
    },
    {
      title: 'Ajuda',
      icon: 'ri-question-line',
      path: '/paineladmin/ajuda',
    },
  ];

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  // Ocultar menus restritos para atendente
  const displayMenuItems = isAtendente
    ? menuItems.filter((item) => item.title !== 'Usuários' && item.title !== 'Configurações')
    : menuItems;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-pink-600 text-white transition-all duration-300 z-40 ${
          sidebarOpen ? 'w-72' : 'w-20'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-pink-500">
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

        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-140px)]">
          {displayMenuItems.map((item) => (
            <div key={item.title}>
              {item.submenu ? (
                <div>
                  <button
                    onClick={() => toggleMenu(item.title)}
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
                    location.pathname === item.path ? 'bg-pink-700' : ''
                  }`}
                >
                  <i className={`${item.icon} text-xl`}></i>
                  {sidebarOpen && <span className="whitespace-nowrap">{item.title}</span>}
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-pink-500">
          <button
            onClick={async () => { await signOut(); window.location.href = '/auth/login'; }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-pink-700 transition-colors cursor-pointer"
            title="Sair"
          >
            <i className="ri-logout-box-line text-xl"></i>
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? 'ml-72' : 'ml-20'
        }`}
      >
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
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

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
