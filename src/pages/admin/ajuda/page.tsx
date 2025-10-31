import { useState } from 'react';
import AdminLayout from '../../../components/feature/AdminLayout';

export default function Ajuda() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('todos');

  const categorias = [
    { id: 'todos', label: 'Todos', icon: 'ri-apps-line' },
    { id: 'primeiros-passos', label: 'Primeiros Passos', icon: 'ri-rocket-line' },
    { id: 'produtos', label: 'Produtos', icon: 'ri-shopping-bag-line' },
    { id: 'vendas', label: 'Vendas', icon: 'ri-money-dollar-circle-line' },
    { id: 'clientes', label: 'Clientes', icon: 'ri-user-line' },
    { id: 'configuracoes', label: 'Configurações', icon: 'ri-settings-3-line' }
  ];

  const artigos = [
    {
      categoria: 'primeiros-passos',
      titulo: 'Como começar a usar o sistema',
      descricao: 'Aprenda os primeiros passos para configurar sua loja',
      icon: 'ri-play-circle-line',
      tempo: '5 min'
    },
    {
      categoria: 'primeiros-passos',
      titulo: 'Configurando sua primeira loja',
      descricao: 'Guia completo para configurar informações básicas',
      icon: 'ri-store-line',
      tempo: '10 min'
    },
    {
      categoria: 'produtos',
      titulo: 'Cadastrando produtos',
      descricao: 'Como adicionar e gerenciar produtos no catálogo',
      icon: 'ri-add-circle-line',
      tempo: '8 min'
    },
    {
      categoria: 'produtos',
      titulo: 'Gerenciando estoque',
      descricao: 'Controle de entrada e saída de produtos',
      icon: 'ri-inbox-line',
      tempo: '7 min'
    },
    {
      categoria: 'produtos',
      titulo: 'Organizando categorias',
      descricao: 'Como criar e organizar categorias de produtos',
      icon: 'ri-folder-line',
      tempo: '5 min'
    },
    {
      categoria: 'vendas',
      titulo: 'Processando pedidos',
      descricao: 'Como gerenciar e processar pedidos de clientes',
      icon: 'ri-shopping-cart-line',
      tempo: '6 min'
    },
    {
      categoria: 'vendas',
      titulo: 'Relatórios de vendas',
      descricao: 'Entendendo os relatórios e métricas de vendas',
      icon: 'ri-bar-chart-line',
      tempo: '8 min'
    },
    {
      categoria: 'clientes',
      titulo: 'Gerenciando clientes',
      descricao: 'Como cadastrar e gerenciar informações de clientes',
      icon: 'ri-user-add-line',
      tempo: '5 min'
    },
    {
      categoria: 'configuracoes',
      titulo: 'Configurações gerais',
      descricao: 'Personalize as configurações da sua loja',
      icon: 'ri-settings-4-line',
      tempo: '10 min'
    },
    {
      categoria: 'configuracoes',
      titulo: 'Integrações e APIs',
      descricao: 'Como conectar serviços externos',
      icon: 'ri-plug-line',
      tempo: '12 min'
    }
  ];

  const faqItems = [
    {
      pergunta: 'Como redefinir minha senha?',
      resposta: 'Você pode redefinir sua senha acessando Minha Conta > Segurança > Alterar Senha. Digite sua senha atual e a nova senha duas vezes para confirmar.'
    },
    {
      pergunta: 'Como adicionar novos usuários ao sistema?',
      resposta: 'Acesse o menu Usuários > Cadastrar Usuário. Preencha os dados do novo usuário e selecione o tipo de acesso apropriado (Administrador, Gerente, Vendedor, etc.).'
    },
    {
      pergunta: 'Como configurar notificações de estoque baixo?',
      resposta: 'Vá em Configurações > Notificações e ative a opção "Estoque Baixo". Você pode definir o limite mínimo de estoque em cada produto individualmente.'
    },
    {
      pergunta: 'Posso exportar relatórios de vendas?',
      resposta: 'Sim! Na página de Vendas, clique no botão "Exportar" no canto superior direito. Você pode escolher entre formatos PDF, Excel ou CSV.'
    },
    {
      pergunta: 'Como funciona o backup automático?',
      resposta: 'O sistema realiza backups automáticos diários. Você pode configurar a frequência em Configurações > Sistema > Backup Automático.'
    }
  ];

  const artigosFiltrados = artigos.filter(artigo => 
    (activeCategory === 'todos' || artigo.categoria === activeCategory) &&
    (searchQuery === '' || 
     artigo.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
     artigo.descricao.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Central de Ajuda</h1>
          <p className="text-gray-600 dark:text-gray-400">Encontre respostas e aprenda a usar o sistema</p>
        </div>

        {/* Busca */}
        <div className="mb-8">
          <div className="relative">
            <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl"></i>
            <input
              type="text"
              placeholder="Buscar artigos de ajuda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
            />
          </div>
        </div>

        {/* Cards de Contato Rápido */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg p-6 text-white">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
              <i className="ri-customer-service-2-line text-2xl"></i>
            </div>
            <h3 className="font-semibold mb-2">Suporte por Chat</h3>
            <p className="text-sm text-white/80 mb-4">Fale com nossa equipe em tempo real</p>
            <button className="px-4 py-2 bg-white text-pink-600 rounded-lg hover:bg-pink-50 transition-colors cursor-pointer whitespace-nowrap text-sm font-medium">
              Iniciar Chat
            </button>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
              <i className="ri-mail-line text-2xl"></i>
            </div>
            <h3 className="font-semibold mb-2">Email</h3>
            <p className="text-sm text-white/80 mb-4">Envie sua dúvida por email</p>
            <button className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer whitespace-nowrap text-sm font-medium">
              Enviar Email
            </button>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
              <i className="ri-phone-line text-2xl"></i>
            </div>
            <h3 className="font-semibold mb-2">Telefone</h3>
            <p className="text-sm text-white/80 mb-4">(99) 3522-1234</p>
            <button className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-colors cursor-pointer whitespace-nowrap text-sm font-medium">
              Ligar Agora
            </button>
          </div>
        </div>

        {/* Categorias */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors cursor-pointer whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <i className={`${cat.icon} mr-2`}></i>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Artigos */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Artigos de Ajuda</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {artigosFiltrados.map((artigo, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/20 rounded-lg flex items-center justify-center text-pink-600 mr-4 flex-shrink-0">
                    <i className={`${artigo.icon} text-2xl`}></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{artigo.titulo}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{artigo.descricao}</p>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-500">
                      <i className="ri-time-line mr-1"></i>
                      {artigo.tempo} de leitura
                    </div>
                  </div>
                  <i className="ri-arrow-right-line text-gray-400 ml-2"></i>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Perguntas Frequentes</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            {faqItems.map((item, index) => (
              <details key={index} className="group">
                <summary className="px-6 py-4 cursor-pointer list-none flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <span className="font-medium text-gray-900 dark:text-white">{item.pergunta}</span>
                  <i className="ri-arrow-down-s-line text-xl text-gray-400 group-open:rotate-180 transition-transform"></i>
                </summary>
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.resposta}</p>
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Vídeos Tutoriais */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Vídeos Tutoriais</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { titulo: 'Introdução ao Sistema', duracao: '5:30', thumb: 'https://readdy.ai/api/search-image?query=Modern%20e-commerce%20dashboard%20interface%20tutorial%20video%20thumbnail%20with%20play%20button%2C%20clean%20professional%20design%2C%20bright%20lighting%2C%20minimalist%20style%2C%20technology%20theme&width=400&height=225&seq=vid1&orientation=landscape' },
              { titulo: 'Cadastrando Produtos', duracao: '8:15', thumb: 'https://readdy.ai/api/search-image?query=Product%20catalog%20management%20tutorial%20video%20thumbnail%20with%20shopping%20items%2C%20professional%20interface%2C%20bright%20clean%20background%2C%20modern%20design%2C%20technology%20theme&width=400&height=225&seq=vid2&orientation=landscape' },
              { titulo: 'Gerenciando Vendas', duracao: '6:45', thumb: 'https://readdy.ai/api/search-image?query=Sales%20management%20dashboard%20tutorial%20video%20thumbnail%20with%20charts%20and%20graphs%2C%20professional%20design%2C%20bright%20lighting%2C%20modern%20interface%2C%20business%20theme&width=400&height=225&seq=vid3&orientation=landscape' }
            ].map((video, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className="relative">
                  <img src={video.thumb} alt={video.titulo} className="w-full h-40 object-cover object-top" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                      <i className="ri-play-fill text-3xl text-pink-600 ml-1"></i>
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                    {video.duracao}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{video.titulo}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
