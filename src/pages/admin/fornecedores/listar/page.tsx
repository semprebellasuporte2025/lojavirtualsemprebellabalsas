
import { useState } from 'react';
import AdminLayout from '../../../../components/feature/AdminLayout';
import { useToast } from '../../../../hooks/useToast';
import Toast from '../../../../components/base/Toast';

export default function ListarFornecedoresPage() {
  const { toast, showToast, hideToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  const fornecedores = [
    {
      id: 1,
      razaoSocial: 'Beleza & Cia Ltda',
      nomeFantasia: 'Beleza & Cia',
      cnpj: '12.345.678/0001-90',
      email: 'contato@belezaecia.com',
      telefone: '(11) 3456-7890',
      celular: '(11) 99876-5432',
      cidade: 'São Paulo',
      estado: 'SP',
      contato: 'Maria Silva',
      ativo: true,
      ultimaCompra: '2024-01-15'
    },
    {
      id: 2,
      razaoSocial: 'Cosméticos Premium Ltda',
      nomeFantasia: 'Premium Cosméticos',
      cnpj: '98.765.432/0001-10',
      email: 'vendas@premiumcosmeticos.com',
      telefone: '(21) 2345-6789',
      celular: '(21) 98765-4321',
      cidade: 'Rio de Janeiro',
      estado: 'RJ',
      contato: 'João Santos',
      ativo: true,
      ultimaCompra: '2024-01-10'
    },
    {
      id: 3,
      razaoSocial: 'Distribuidora Beauty Ltda',
      nomeFantasia: 'Beauty Distribuidora',
      cnpj: '11.222.333/0001-44',
      email: 'comercial@beautydist.com',
      telefone: '(31) 3333-4444',
      celular: '(31) 99999-8888',
      cidade: 'Belo Horizonte',
      estado: 'MG',
      contato: 'Ana Costa',
      ativo: false,
      ultimaCompra: '2023-12-20'
    },
    {
      id: 4,
      razaoSocial: 'Makeup Supply Co. Ltda',
      nomeFantasia: 'Makeup Supply',
      cnpj: '55.666.777/0001-88',
      email: 'suporte@makeupsupply.com',
      telefone: '(85) 4444-5555',
      celular: '(85) 98888-7777',
      cidade: 'Fortaleza',
      estado: 'CE',
      contato: 'Pedro Lima',
      ativo: true,
      ultimaCompra: '2024-01-18'
    },
    {
      id: 5,
      razaoSocial: 'Perfumes & Fragrâncias Ltda',
      nomeFantasia: 'Perfumes & Fragrâncias',
      cnpj: '99.888.777/0001-66',
      email: 'atendimento@perfumesfragrancias.com',
      telefone: '(41) 5555-6666',
      celular: '(41) 97777-6666',
      cidade: 'Curitiba',
      estado: 'PR',
      contato: 'Carla Oliveira',
      ativo: true,
      ultimaCompra: '2024-01-12'
    }
  ];

  const filteredFornecedores = fornecedores.filter(fornecedor => {
    const matchesSearch = fornecedor.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fornecedor.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fornecedor.cnpj.includes(searchTerm) ||
                         fornecedor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fornecedor.contato.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || 
                         (statusFilter === 'ativo' && fornecedor.ativo) ||
                         (statusFilter === 'inativo' && !fornecedor.ativo);
    
    return matchesSearch && matchesStatus;
  });

  const toggleStatus = (id: number) => {
    console.log(`Toggle status for fornecedor ${id}`);
    // Aqui você implementaria a lógica para ativar/desativar o fornecedor
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este fornecedor?')) {
      setFornecedores(fornecedores.filter(f => f.id !== id));
      showToast('Fornecedor excluído com sucesso!', 'success');
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fornecedores</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie todos os fornecedores da loja</p>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center space-x-3">
                <button className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center space-x-2 whitespace-nowrap cursor-pointer">
                  <i className="ri-add-line"></i>
                  <span>Novo Fornecedor</span>
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{fornecedores.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <i className="ri-truck-line text-xl text-blue-600 dark:text-blue-400"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ativos</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{fornecedores.filter(f => f.ativo).length}</p>
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
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{fornecedores.filter(f => !f.ativo).length}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                    <i className="ri-close-line text-xl text-red-600 dark:text-red-400"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Estados</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{new Set(fornecedores.map(f => f.estado)).size}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <i className="ri-map-pin-line text-xl text-purple-600 dark:text-purple-400"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Buscar
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Nome, CNPJ, email ou contato..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                    <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
                  </div>
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
              </div>
            </div>

            {/* Fornecedores Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Fornecedor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Contato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Localização
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Última Compra
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
                    {filteredFornecedores.map((fornecedor) => (
                      <tr key={fornecedor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{fornecedor.razaoSocial}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{fornecedor.nomeFantasia}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{fornecedor.cnpj}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900 dark:text-white">{fornecedor.contato}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{fornecedor.email}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{fornecedor.celular}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{fornecedor.cidade}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{fornecedor.estado}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Date(fornecedor.ultimaCompra).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleStatus(fornecedor.id)}
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer ${
                              fornecedor.ativo
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            }`}
                          >
                            {fornecedor.ativo ? 'Ativo' : 'Inativo'}
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
                            <button className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 cursor-pointer">
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

            {filteredFornecedores.length === 0 && (
              <div className="text-center py-12">
                <i className="ri-truck-line text-4xl text-gray-400 dark:text-gray-600 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum fornecedor encontrado</h3>
                <p className="text-gray-500 dark:text-gray-400">Tente ajustar os filtros ou cadastre um novo fornecedor.</p>
              </div>
            )}
          </div>
        </AdminLayout>
      </div>
    </>
  );
}
