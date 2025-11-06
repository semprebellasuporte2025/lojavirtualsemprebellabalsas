
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../../components/feature/AdminLayout';
import { useToast } from '../../../../hooks/useToast';
import { supabase } from '../../../../lib/supabase';
import ConfirmationModal from '../../../../components/feature/modal/ConfirmationModal';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  cidade: string;
  estado: string;
  cep: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export default function ListarClientesPage() {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Buscar clientes do Supabase
  const fetchClientes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar clientes:', error);
        showToast('Erro ao carregar clientes', 'error');
        return;
      }

      setClientes(data || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      showToast('Erro ao carregar clientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Carregar clientes ao montar o componente
  useEffect(() => {
    fetchClientes();
  }, []);

  const filteredClientes = clientes.filter(cliente => {
    const matchSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       cliente.cpf.includes(searchTerm);
    const matchStatus = !filterStatus || 
                       (filterStatus === 'ativo' && cliente.ativo) ||
                       (filterStatus === 'inativo' && !cliente.ativo);
    return matchSearch && matchStatus;
  });

  const handleDelete = (id: string) => {
    setClienteToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (clienteToDelete) {
      try {
        setIsDeleting(true);
        
        const { error } = await supabase
          .from('clientes')
          .delete()
          .eq('id', clienteToDelete);

        if (error) {
          console.error('Erro ao excluir cliente:', error);
          showToast('Erro ao excluir cliente', 'error');
          return;
        }

        // Atualizar a lista local
        setClientes(clientes.filter(c => c.id !== clienteToDelete));
        showToast('Cliente excluído com sucesso!', 'success');
      } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        showToast('Erro ao excluir cliente', 'error');
      } finally {
        setShowDeleteModal(false);
        setClienteToDelete(null);
        setIsDeleting(false);
      }
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      const cliente = clientes.find(c => c.id === id);
      if (!cliente) return;

      const { error } = await supabase
        .from('clientes')
        .update({ ativo: !cliente.ativo })
        .eq('id', id);

      if (error) {
        console.error('Erro ao alterar status:', error);
        showToast('Erro ao alterar status do cliente', 'error');
        return;
      }

      // Atualizar a lista local
      setClientes(clientes.map(c => 
        c.id === id ? { ...c, ativo: !c.ativo } : c
      ));
      showToast('Status alterado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      showToast('Erro ao alterar status do cliente', 'error');
    }
  };

  return (
    <>
      <AdminLayout>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Clientes</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie os clientes cadastrados</p>
            </div>
            <button
              onClick={() => navigate('/paineladmin/clientes/cadastrar')}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors whitespace-nowrap"
            >
              <i className="ri-add-line mr-2"></i>
              Novo Cliente
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="md:col-span-2">
                <div className="relative">
                  <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Buscar por nome, e-mail ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-5
                focus:border-transparent dark:bg-gray-700 dark:text-white appearance-none cursor-pointer"
                >
                  <option value="">Todos Status</option>
                  <option value="ativo">Ativos</option>
                  <option value="inativo">Inativos</option>
                </select>
                <i className="ri-arrow-down-s-line absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando clientes...</span>
                </div>
              ) : filteredClientes.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <i className="ri-user-line text-5xl mb-3"></i>
                  <p className="text-lg">Nenhum cliente encontrado</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Cliente</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">CPF</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Telefone</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Localização</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Data Cadastro</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClientes.map((cliente) => (
                      <tr key={cliente.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{cliente.nome}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{cliente.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{cliente.cpf}</td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{cliente.telefone}</td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          <div>
                            <p>{cliente.cidade} - {cliente.estado}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">CEP: {cliente.cep}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(cliente.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => toggleStatus(cliente.id)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer ${
                              cliente.ativo
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}
                          >
                            {cliente.ativo ? 'Ativo' : 'Inativo'}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/paineladmin/clientes/editar/${cliente.id}`)}
                              className="w-8 h-8 flex items-center justify-center text-green-600 hover:bg-green-50 dark:hover:bg-green-900 rounded cursor-pointer"
                              title="Ver/Editar Cliente"
                            >
                              <i className="ri-eye-line"></i>
                            </button>
                            <button
                              onClick={() => navigate(`/paineladmin/clientes/editar/${cliente.id}`)}
                              className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded cursor-pointer"
                              title="Editar"
                            >
                              <i className="ri-edit-line"></i>
                            </button>
                            <button
                              onClick={() => handleDelete(cliente.id)}
                              className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded cursor-pointer"
                              title="Excluir"
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="mt-6 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
              <p>Mostrando {filteredClientes.length} de {clientes.length} clientes</p>
            </div>
          </div>
        </div>

        {/* Modal de Confirmação de Exclusão */}
        <ConfirmationModal
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          title="Confirmar Exclusão"
          body="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
        />
      </AdminLayout>
    </>
  );
}
