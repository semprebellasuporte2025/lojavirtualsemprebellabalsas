
import { useState } from 'react';
import AdminLayout from '../../../../components/feature/AdminLayout';
import { useToast } from '../../../../hooks/useToast';
import Toast from '../../../../components/base/Toast';

export default function ListarUsuariosPage() {
  const { toast, showToast, hideToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [usuarios, setUsuarios] = useState([
    {
      id: 1,
      nome: 'Kalina Arruda',
      email: 'kalina@semprebella.com',
      cpf: '123.456.789-01',
      telefone: '(99) 99999-9999',
      tipo: 'admin',
      tipoNome: 'Administrador',
      departamento: 'Administração',
      cargo: 'Administradora Geral',
      dataAdmissao: '2023-01-15',
      ultimoAcesso: '2024-01-20 14:30',
      ativo: true
    },
    {
      id: 2,
      nome: 'João Silva',
      email: 'joao@semprebella.com',
      cpf: '987.654.321-09',
      telefone: '(99) 98888-7777',
      tipo: 'gerente',
      tipoNome: 'Gerente',
      departamento: 'Vendas',
      cargo: 'Gerente de Vendas',
      dataAdmissao: '2023-03-10',
      ultimoAcesso: '2024-01-20 16:15',
      ativo: true
    },
    {
      id: 3,
      nome: 'Maria Santos',
      email: 'maria@semprebella.com',
      cpf: '456.789.123-45',
      telefone: '(99) 97777-6666',
      tipo: 'vendedor',
      tipoNome: 'Vendedor',
      departamento: 'Vendas',
      cargo: 'Vendedora Sênior',
      dataAdmissao: '2023-05-20',
      ultimoAcesso: '2024-01-20 15:45',
      ativo: true
    },
    {
      id: 4,
      nome: 'Pedro Costa',
      email: 'pedro@semprebella.com',
      cpf: '789.123.456-78',
      telefone: '(99) 96666-5555',
      tipo: 'estoquista',
      tipoNome: 'Estoquista',
      departamento: 'Estoque',
      cargo: 'Controlador de Estoque',
      dataAdmissao: '2023-07-01',
      ultimoAcesso: '2024-01-19 18:00',
      ativo: true
    },
    {
      id: 5,
      nome: 'Ana Oliveira',
      email: 'ana@semprebella.com',
      cpf: '321.654.987-32',
      telefone: '(99) 95555-4444',
      tipo: 'financeiro',
      tipoNome: 'Financeiro',
      departamento: 'Financeiro',
      cargo: 'Analista Financeira',
      dataAdmissao: '2023-09-15',
      ultimoAcesso: '2024-01-18 17:30',
      ativo: false
    }
  ]);

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'gerente': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'vendedor': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'estoquista': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'financeiro': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      case 'atendimento': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.cpf.includes(searchTerm) ||
                         usuario.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.departamento.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFilter === 'todos' || usuario.tipo === tipoFilter;
    const matchesStatus = statusFilter === 'todos' ||
                         (statusFilter === 'ativo' && usuario.ativo) ||
                         (statusFilter === 'inativo' && !usuario.ativo);
    return matchesSearch && matchesTipo && matchesStatus;
  });

  const toggleStatus = (id: number) => {
    console.log(`Toggle status for usuario ${id}`);
    // Aqui você implementaria a lógica para ativar/desativar o usuário
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      setUsuarios(usuarios.filter(u => u.id !== id));
      showToast('Usuário excluído com sucesso!', 'success');
    }
  };

  return (
    <>
      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
      <div className="p-6">
        <AdminLayout>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuários</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie todos os usuários do sistema</p>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center space-x-3">
                <button className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center space-x-2 whitespace-nowrap cursor-pointer">
                  <i className="ri-add-line"></i>
                  <span>Novo Usuário</span>
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{usuarios.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <i className="ri-user-line text-xl text-blue-600 dark:text-blue-400"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ativos</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{usuarios.filter(u => u.ativo).length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <i className="ri-check-line text-xl text-green-600 dark:text-green-400"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inativos</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{usuarios.filter(u => !u.ativo).length}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                    <i className="ri-close-line text-xl text-red-600 dark:text-red-400"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Administradores</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{usuarios.filter(u => u.tipo === 'admin').length}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <i className="ri-shield-user-line text-xl text-purple-600 dark:text-purple-400"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Buscar
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Nome, email, CPF ou cargo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                    <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo
                  </label>
                  <select
                    value={tipoFilter}
                    onChange={(e) => setTipoFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm pr-8"
                  >
                    <option value="todos">Todos os Tipos</option>
                    <option value="admin">Administrador</option>
                    <option value="gerente">Gerente</option>
                    <option value="vendedor">Vendedor</option>
                    <option value="estoquista">Estoquista</option>
                    <option value="financeiro">Financeiro</option>
                    <option value="atendimento">Atendimento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm pr-8"
                  >
                    <option value="todos">Todos</option>
                    <option value="ativo">Ativos</option>
                    <option value="inativo">Inativos</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setTipoFilter('todos');
                      setStatusFilter('todos');
                    }}
                    className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2 whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-refresh-line"></i>
                    <span>Limpar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Usuarios Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Contato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Cargo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Último Acesso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUsuarios.map((usuario) => (
                      <tr key={usuario.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-pink-600 dark:text-pink-400">
                                {usuario.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{usuario.nome}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{usuario.cpf}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900 dark:text-white">{usuario.email}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{usuario.telefone}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900 dark:text-white">{usuario.cargo}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{usuario.departamento}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoColor(usuario.tipo)}`}>
                            {usuario.tipoNome}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {new Date(usuario.ultimoAcesso).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {usuario.ultimoAcesso.split(' ')[1]}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleStatus(usuario.id)}
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer ${
                              usuario.ativo
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            }`}
                          >
                            {usuario.ativo ? 'Ativo' : 'Inativo'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 cursor-pointer">
                              <i className="ri-eye-line text-lg"></i>
                            </button>
                            <button className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 cursor-pointer">
                              <i className="ri-edit-line text-lg"></i>
                            </button>
                            <button
                              onClick={() => handleDelete(usuario.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 cursor-pointer"
                            >
                              <i className="ri-delete-bin-line text-lg"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {filteredUsuarios.length === 0 && (
              <div className="text-center py-12">
                <i className="ri-user-line text-4xl text-gray-400 dark:text-gray-600 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum usuário encontrado</h3>
                <p className="text-gray-500 dark:text-gray-400">Tente ajustar os filtros ou cadastre um novo usuário.</p>
              </div>
            )}
          </div>
        </AdminLayout>
      </div>
    </>
  );
}
