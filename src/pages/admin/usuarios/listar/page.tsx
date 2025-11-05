
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../../components/feature/AdminLayout';
import { useToast } from '../../../../hooks/useToast';
import { useAuth } from '../../../../hooks/useAuth';
import Toast from '../../../../components/base/Toast';
import { supabase } from '../../../../lib/supabase';

// Interface atualizada para campos opcionais
interface Usuario {
  id: string;
  nome?: string | null;
  email?: string | null;
  tipo?: string | null;
  departamento?: string | null;
  cargo?: string | null;
  data_admissao?: string | null;
  ativo?: boolean | null;
}

// Função utilitária para gerar iniciais de forma segura
const getInitials = (usuario: Partial<Usuario>) => {
  // Monta uma fonte com o que existir
  const fonte = 
    [usuario?.nome].filter(Boolean).join(' ').trim() || 
    (usuario?.email ?? '').split('@')[0] || // pega antes do @ se só tiver email
    'U';

  const partes = fonte.split(/\s+/);
  const a = partes[0]?.[0] ?? '';
  const b = partes[1]?.[0] ?? '';
  const iniciais = (a + b || fonte[0] || 'U').toUpperCase();
  return iniciais.substring(0, 2);
};

// Função utilitária para capitalizar strings de forma segura
const capitalizeString = (str?: string | null) => {
  if (!str || typeof str !== 'string') return 'N/A';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export default function ListarUsuariosPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast, showToast, hideToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para modais
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [editFormData, setEditFormData] = useState<Usuario>({
    id: '',
    nome: '',
    email: '',
    tipo: '',
    departamento: '',
    cargo: '',
    data_admissao: '',
    ativo: true
  });

  // Carregar usuários do Supabase
  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('usuarios_admin')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setUsuarios(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar usuários:', err);
      setError('Erro ao carregar usuários: ' + err.message);
      showToast('Erro ao carregar usuários', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getTipoColor = (tipo?: string | null) => {
    if (!tipo) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    
    switch (tipo.toLowerCase()) {
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'gerente': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'vendedor': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'estoquista': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'financeiro': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      case 'atendimento': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  // Proteção para o array de usuários
  const usuariosList = Array.isArray(usuarios) ? usuarios : [];

  const filteredUsuarios = usuariosList.filter(usuario => {
    const matchesSearch = (usuario.nome ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (usuario.email ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (usuario.cargo ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (usuario.departamento ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFilter === 'todos' || (usuario.tipo ?? '') === tipoFilter;
    const matchesStatus = statusFilter === 'todos' ||
                         (statusFilter === 'ativo' && usuario.ativo === true) ||
                         (statusFilter === 'inativo' && usuario.ativo === false);
    return matchesSearch && matchesTipo && matchesStatus;
  });

  const toggleStatus = async (id: string) => {
    try {
      const usuario = usuariosList.find(u => u.id === id);
      if (!usuario) return;

      const { error } = await supabase
        .from('usuarios_admin')
        .update({ ativo: !usuario.ativo })
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Atualizar o estado local
      setUsuarios(usuariosList.map(u => 
        u.id === id ? { ...u, ativo: !u.ativo } : u
      ));

      showToast(`Usuário ${!usuario.ativo ? 'ativado' : 'desativado'} com sucesso!`, 'success');
    } catch (err: any) {
      console.error('Erro ao alterar status:', err);
      showToast('Erro ao alterar status do usuário', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        const { error } = await supabase
          .from('usuarios_admin')
          .delete()
          .eq('id', id);

        if (error) {
          throw error;
        }

        setUsuarios(usuariosList.filter(u => u.id !== id));
        showToast('Usuário excluído com sucesso!', 'success');
      } catch (err: any) {
        console.error('Erro ao excluir usuário:', err);
        showToast('Erro ao excluir usuário', 'error');
      }
    }
  };

  // Função para visualizar usuário
  const handleView = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setShowViewModal(true);
  };

  // Função para editar usuário
  const handleEdit = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setEditFormData({
      id: usuario.id,
      nome: usuario.nome || '',
      email: usuario.email || '',
      tipo: usuario.tipo || '',
      departamento: usuario.departamento || '',
      cargo: usuario.cargo || '',
      data_admissao: usuario.data_admissao || '',
      ativo: usuario.ativo || true
    });
    setShowEditModal(true);
  };

  // Função para salvar edição
  const handleSaveEdit = async () => {
    try {
      // Validar se o ID existe
      if (!editFormData.id) {
        throw new Error('ID do usuário não encontrado');
      }

      // Preparar dados para atualização (apenas campos não nulos)
      const updateData: any = {};
      
      if (editFormData.nome?.trim()) updateData.nome = editFormData.nome.trim();
      if (editFormData.email?.trim()) updateData.email = editFormData.email.trim();
      if (editFormData.tipo?.trim()) updateData.tipo = editFormData.tipo.trim();
      if (editFormData.departamento?.trim()) updateData.departamento = editFormData.departamento.trim();
      if (editFormData.cargo?.trim()) updateData.cargo = editFormData.cargo.trim();
      if (editFormData.data_admissao) updateData.data_admissao = editFormData.data_admissao;
      updateData.ativo = editFormData.ativo;

      console.log('Atualizando usuário:', editFormData.id, updateData);

      const { data, error } = await supabase
        .from('usuarios_admin')
        .update(updateData)
        .eq('id', editFormData.id)
        .select();

      if (error) {
        console.error('Erro do Supabase:', error);
        throw error;
      }

      console.log('Usuário atualizado:', data);

      // Atualizar lista local
      setUsuarios(usuariosList.map(u => 
        u.id === editFormData.id ? { ...u, ...editFormData } : u
      ));

      setShowEditModal(false);
      showToast('Usuário atualizado com sucesso!', 'success');
    } catch (err: any) {
      console.error('Erro ao atualizar usuário:', err);
      showToast(`Erro ao atualizar usuário: ${err.message}`, 'error');
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
                <button 
                  onClick={() => navigate('/paineladmin/usuarios/cadastrar')}
                  className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center space-x-2 whitespace-nowrap cursor-pointer"
                >
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
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{usuariosList.length}</p>
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
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{usuariosList.filter(u => u.ativo === true).length}</p>
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
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{usuariosList.filter(u => u.ativo === false).length}</p>
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
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{usuariosList.filter(u => (u.tipo ?? '').toLowerCase() === 'admin').length}</p>
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
                      placeholder="Nome, email, cargo ou departamento..."
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
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Carregando usuários...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <i className="ri-error-warning-line text-4xl text-red-400 mb-4"></i>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Erro ao carregar usuários</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
                  <button
                    onClick={carregarUsuarios}
                    className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : (
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
                          Data Admissão
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
                                  {getInitials(usuario)}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{usuario.nome ?? 'Nome não informado'}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">ID: {usuario.id.substring(0, 8)}...</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">{usuario.email}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{usuario.departamento}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">{capitalizeString(usuario.cargo)}</div>
                          </td>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoColor(usuario.tipo)}`}>
                            {capitalizeString(usuario.tipo)}
                          </span>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {usuario.data_admissao ? new Date(usuario.data_admissao).toLocaleDateString('pt-BR') : 'Data não informada'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Admissão
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
                              <button 
                                onClick={() => handleView(usuario)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 cursor-pointer"
                                title="Visualizar usuário"
                              >
                                <i className="ri-eye-line text-lg"></i>
                              </button>
                              <button 
                                onClick={() => handleEdit(usuario)}
                                className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 cursor-pointer"
                                title="Editar usuário"
                              >
                                <i className="ri-edit-line text-lg"></i>
                              </button>
                              {usuario.email !== 'semprebellasuporte2025@gmail.com' && (
                                <button
                                  onClick={() => handleDelete(usuario.id)}
                                  className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 cursor-pointer"
                                  title="Excluir usuário"
                                >
                                  <i className="ri-delete-bin-line text-lg"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!loading && !error && filteredUsuarios.length === 0 && (
                <div className="text-center py-12">
                  <i className="ri-user-line text-4xl text-gray-400 dark:text-gray-600 mb-4"></i>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum usuário encontrado</h3>
                  <p className="text-gray-500 dark:text-gray-400">Tente ajustar os filtros ou cadastre um novo usuário.</p>
                </div>
              )}
            </div>
          </div>
        </AdminLayout>
      </div>

      {/* Modal de Visualização */}
      {showViewModal && selectedUsuario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detalhes do Usuário</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                <p className="text-gray-900 dark:text-white">{selectedUsuario.nome || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <p className="text-gray-900 dark:text-white">{selectedUsuario.email || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                <p className="text-gray-900 dark:text-white">{capitalizeString(selectedUsuario.tipo)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Departamento</label>
                <p className="text-gray-900 dark:text-white">{selectedUsuario.departamento || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cargo</label>
                <p className="text-gray-900 dark:text-white">{selectedUsuario.cargo || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Admissão</label>
                <p className="text-gray-900 dark:text-white">{formatDate(selectedUsuario.data_admissao)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  selectedUsuario.ativo
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                }`}>
                  {selectedUsuario.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editar Usuário</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome</label>
                <input
                  type="text"
                  value={editFormData.nome || ''}
                  onChange={(e) => setEditFormData({...editFormData, nome: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={editFormData.email || ''}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo</label>
                <select
                  value={editFormData.tipo || ''}
                  onChange={(e) => setEditFormData({...editFormData, tipo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Selecione o tipo</option>
                  <option value="admin">Administrador</option>
                  <option value="gerente">Gerente</option>
                  <option value="vendedor">Vendedor</option>
                  <option value="estoquista">Estoquista</option>
                  <option value="financeiro">Financeiro</option>
                  <option value="atendimento">Atendimento</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Departamento</label>
                <input
                  type="text"
                  value={editFormData.departamento || ''}
                  onChange={(e) => setEditFormData({...editFormData, departamento: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cargo</label>
                <input
                  type="text"
                  value={editFormData.cargo || ''}
                  onChange={(e) => setEditFormData({...editFormData, cargo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data de Admissão</label>
                <input
                  type="date"
                  value={editFormData.data_admissao || ''}
                  onChange={(e) => setEditFormData({...editFormData, data_admissao: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editFormData.ativo || false}
                    onChange={(e) => setEditFormData({...editFormData, ativo: e.target.checked})}
                    className="mr-2 h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Usuário ativo</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
