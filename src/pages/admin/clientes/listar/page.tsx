
import { useState } from 'react';
import AdminLayout from '../../../../components/feature/AdminLayout';
import { useToast } from '../../../../hooks/useToast';
import Toast from '../../../../components/base/Toast';

interface Cliente {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  cidade: string;
  estado: string;
  totalCompras: number;
  ultimaCompra: string;
  ativo: boolean;
}

export default function ListarClientesPage() {
  const { toast, showToast, hideToast } = useToast();

  const [clientes, setClientes] = useState<Cliente[]>([
    {
      id: 1,
      nome: 'Maria Silva Santos',
      email: 'maria.silva@email.com',
      telefone: '(99) 99999-1111',
      cpf: '123.456.789-00',
      cidade: 'São Paulo',
      estado: 'SP',
      totalCompras: 15,
      ultimaCompra: '2025-01-20',
      ativo: true
    },
    {
      id: 2,
      nome: 'Ana Paula Oliveira',
      email: 'ana.paula@email.com',
      telefone: '(99) 99999-2222',
      cpf: '234.567.890-11',
      cidade: 'Rio de Janeiro',
      estado: 'RJ',
      totalCompras: 8,
      ultimaCompra: '2025-01-18',
      ativo: true
    },
    {
      id: 3,
      nome: 'Juliana Costa Lima',
      email: 'juliana.costa@email.com',
      telefone: '(99) 99999-3333',
      cpf: '345.678.901-22',
      cidade: 'Belo Horizonte',
      estado: 'MG',
      totalCompras: 23,
      ultimaCompra: '2025-01-22',
      ativo: true
    },
    {
      id: 4,
      nome: 'Fernanda Rodrigues',
      email: 'fernanda.r@email.com',
      telefone: '(99) 99999-4444',
      cpf: '456.789.012-33',
      cidade: 'Curitiba',
      estado: 'PR',
      totalCompras: 5,
      ultimaCompra: '2024-12-15',
      ativo: false
    },
    {
      id: 5,
      nome: 'Camila Souza Alves',
      email: 'camila.souza@email.com',
      telefone: '(99) 99999-5555',
      cpf: '567.890.123-44',
      cidade: 'Porto Alegre',
      estado: 'RS',
      totalCompras: 12,
      ultimaCompra: '2025-01-19',
      ativo: true
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filteredClientes = clientes.filter(cliente => {
    const matchSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       cliente.cpf.includes(searchTerm);
    const matchStatus = !filterStatus || 
                       (filterStatus === 'ativo' && cliente.ativo) ||
                       (filterStatus === 'inativo' && !cliente.ativo);
    return matchSearch && matchStatus;
  });

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      setClientes(clientes.filter(c => c.id !== id));
      showToast('Cliente excluído com sucesso!', 'success');
    }
  };

  const toggleStatus = (id: number) => {
    console.log('Alternar status do cliente:', id);
    alert('Status alterado com sucesso!');
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
      <AdminLayout>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Clientes</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie os clientes cadastrados</p>
            </div>
            <button
              onClick={() => window.REACT_APP_NAVIGATE('/paineladmin/clientes/cadastrar')}
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
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Cliente</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">CPF</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Telefone</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Localização</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Compras</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Última Compra</th>
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
                        {cliente.cidade} - {cliente.estado}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {cliente.totalCompras}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(cliente.ultimaCompra).toLocaleDateString('pt-BR')}
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
                            onClick={() => console.log('Ver detalhes:', cliente.id)}
                            className="w-8 h-8 flex items-center justify-center text-green-600 hover:bg-green-50 dark:hover:bg-green-900 rounded cursor-pointer"
                            title="Ver Detalhes"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                          <button
                            onClick={() => console.log('Editar cliente:', cliente.id)}
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

              {filteredClientes.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <i className="ri-user-line text-5xl mb-3"></i>
                  <p className="text-lg">Nenhum cliente encontrado</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
              <p>Mostrando {filteredClientes.length} de {clientes.length} clientes</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
