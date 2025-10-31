
import { useState } from 'react';
import AdminLayout from '../../../../components/feature/AdminLayout';

export default function ListarMovimentacoes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [dateFilter, setDateFilter] = useState('todos');

  const movimentacoes = [
    {
      id: 1,
      tipo: 'entrada',
      produto: 'Batom Matte Vermelho',
      sku: 'BAT001',
      quantidade: 50,
      valorUnitario: 25.90,
      valorTotal: 1295.00,
      fornecedor: 'Beleza & Cia Ltda',
      data: '2024-01-20',
      hora: '14:30',
      numeroNota: '123456',
      usuario: 'Kalina Arruda'
    },
    {
      id: 2,
      tipo: 'saida',
      produto: 'Base Líquida Bege',
      sku: 'BAS002',
      quantidade: 3,
      valorUnitario: 45.90,
      valorTotal: 137.70,
      motivo: 'Venda #VD002',
      data: '2024-01-20',
      hora: '16:45',
      usuario: 'Sistema'
    },
    {
      id: 3,
      tipo: 'entrada',
      produto: "Rímel à Prova D'água",
      sku: 'RIM003',
      quantidade: 30,
      valorUnitario: 32.50,
      valorTotal: 975.00,
      fornecedor: 'Cosméticos Premium',
      data: '2024-01-19',
      hora: '10:15',
      numeroNota: '789012',
      usuario: 'Kalina Arruda'
    },
    {
      id: 4,
      tipo: 'ajuste',
      produto: 'Pó Compacto Translúcido',
      sku: 'POC004',
      quantidade: -2,
      valorUnitario: 28.90,
      valorTotal: -57.80,
      motivo: 'Produto danificado',
      data: '2024-01-19',
      hora: '09:20',
      usuario: 'Kalina Arruda'
    },
    {
      id: 5,
      tipo: 'saida',
      produto: 'Blush Rosa Natural',
      sku: 'BLU005',
      quantidade: 1,
      valorUnitario: 22.90,
      valorTotal: 22.90,
      motivo: 'Venda #VD005',
      data: '2024-01-18',
      hora: '15:30',
      usuario: 'Sistema'
    }
  ];

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'entrada': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'saida': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'ajuste': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTipoText = (tipo: string) => {
    switch (tipo) {
      case 'entrada': return 'Entrada';
      case 'saida': return 'Saída';
      case 'ajuste': return 'Ajuste';
      default: return tipo;
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'entrada': return 'ri-arrow-down-line';
      case 'saida': return 'ri-arrow-up-line';
      case 'ajuste': return 'ri-edit-line';
      default: return 'ri-question-line';
    }
  };

  const filteredMovimentacoes = movimentacoes.filter(mov => {
    const matchesSearch = mov.produto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mov.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (mov.fornecedor && mov.fornecedor.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (mov.motivo && mov.motivo.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTipo = tipoFilter === 'todos' || mov.tipo === tipoFilter;
    const matchesDate = dateFilter === 'todos' || 
                       (dateFilter === 'hoje' && mov.data === '2024-01-20') ||
                       (dateFilter === 'ontem' && mov.data === '2024-01-19') ||
                       (dateFilter === 'semana' && ['2024-01-18', '2024-01-19', '2024-01-20'].includes(mov.data));
    
    return matchesSearch && matchesTipo && matchesDate;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Movimentações de Estoque</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Histórico completo de entradas, saídas e ajustes</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <button className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center space-x-2 whitespace-nowrap cursor-pointer">
              <i className="ri-download-line"></i>
              <span>Exportar</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Movimentações</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredMovimentacoes.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <i className="ri-exchange-line text-xl text-blue-600 dark:text-blue-400"></i>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Entradas</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{filteredMovimentacoes.filter(m => m.tipo === 'entrada').length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <i className="ri-arrow-down-line text-xl text-green-600 dark:text-green-400"></i>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Saídas</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{filteredMovimentacoes.filter(m => m.tipo === 'saida').length}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <i className="ri-arrow-up-line text-xl text-red-600 dark:text-red-400"></i>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ajustes</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{filteredMovimentacoes.filter(m => m.tipo === 'ajuste').length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <i className="ri-edit-line text-xl text-yellow-600 dark:text-yellow-400"></i>
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
                  placeholder="Produto, Referência, fornecedor..."
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
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
                <option value="ajuste">Ajuste</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Período
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm pr-8"
              >
                <option value="todos">Todos os Períodos</option>
                <option value="hoje">Hoje</option>
                <option value="ontem">Ontem</option>
                <option value="semana">Esta Semana</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setTipoFilter('todos');
                  setDateFilter('todos');
                }}
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2 whitespace-nowrap cursor-pointer"
              >
                <i className="ri-refresh-line"></i>
                <span>Limpar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Movimentações Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Quantidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Origem/Destino
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Usuário
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredMovimentacoes.map((mov) => (
                  <tr key={mov.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTipoColor(mov.tipo)}`}>
                          <i className={`${getTipoIcon(mov.tipo)} text-sm`}></i>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoColor(mov.tipo)}`}>
                          {getTipoText(mov.tipo)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{mov.produto}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{mov.sku}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${mov.quantidade > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {mov.quantidade > 0 ? '+' : ''}{mov.quantidade}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          R$ {Math.abs(mov.valorTotal).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Unit: R$ {mov.valorUnitario.toFixed(2)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900 dark:text-white">{new Date(mov.data).toLocaleDateString('pt-BR')}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{mov.hora}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {mov.fornecedor || mov.motivo || '-'}
                      </div>
                      {mov.numeroNota && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">NF: {mov.numeroNota}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {mov.usuario}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredMovimentacoes.length === 0 && (
          <div className="text-center py-12">
            <i className="ri-exchange-line text-4xl text-gray-400 dark:text-gray-600 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhuma movimentação encontrada</h3>
            <p className="text-gray-500 dark:text-gray-400">Tente ajustar os filtros para encontrar movimentações.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
