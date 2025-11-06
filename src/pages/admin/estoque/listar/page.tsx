import { useState, useEffect } from 'react';
import AdminLayout from '../../../../components/feature/AdminLayout';
import { useToast } from '../../../../hooks/useToast';
import { supabase } from '../../../../lib/supabase';

interface Movimentacao {
  id: string;
  tipo: 'entrada' | 'saida' | 'ajuste';
  produto_id: string;
  produto_nome?: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  fornecedor_nome?: string;
  numero_nota?: string;
  motivo?: string;
  observacoes?: string;
  usuario_nome: string;
  created_at: string;
}

export default function ListarEstoquePage() {
  const { toast, showToast, hideToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [filtros, setFiltros] = useState({
    busca: '',
    tipo: '',
    dataInicio: '',
    dataFim: ''
  });

  useEffect(() => {
    carregarMovimentacoes();
  }, []);

  const carregarMovimentacoes = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('movimentacoes_estoque')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Tabela movimentacoes_estoque não encontrada, usando dados vazios');
        setMovimentacoes([]);
      } else {
        setMovimentacoes(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
      showToast('Erro ao carregar movimentações', 'error');
      setMovimentacoes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFiltroChange = (campo: string, valor: string) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

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
      case 'entrada': return 'fas fa-arrow-up';
      case 'saida': return 'fas fa-arrow-down';
      case 'ajuste': return 'fas fa-edit';
      default: return 'fas fa-question';
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Filtrar movimentações
  const movimentacoesFiltradas = movimentacoes.filter(mov => {
    const matchBusca = !filtros.busca || 
      mov.produto_nome?.toLowerCase().includes(filtros.busca.toLowerCase()) ||
      mov.usuario_nome.toLowerCase().includes(filtros.busca.toLowerCase()) ||
      mov.fornecedor_nome?.toLowerCase().includes(filtros.busca.toLowerCase());

    const matchTipo = !filtros.tipo || mov.tipo === filtros.tipo;

    const matchData = (!filtros.dataInicio && !filtros.dataFim) ||
      (filtros.dataInicio && new Date(mov.created_at) >= new Date(filtros.dataInicio)) &&
      (filtros.dataFim && new Date(mov.created_at) <= new Date(filtros.dataFim));

    return matchBusca && matchTipo && matchData;
  });

  // Calcular estatísticas
  const totalMovimentacoes = movimentacoesFiltradas.length;
  const totalEntradas = movimentacoesFiltradas.filter(m => m.tipo === 'entrada').length;
  const totalSaidas = movimentacoesFiltradas.filter(m => m.tipo === 'saida').length;
  const totalAjustes = movimentacoesFiltradas.filter(m => m.tipo === 'ajuste').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Movimentações de Estoque
          </h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <i className="fas fa-list-ul text-gray-400 text-xl"></i>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total</dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">{totalMovimentacoes}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <i className="fas fa-arrow-up text-green-400 text-xl"></i>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Entradas</dt>
                    <dd className="text-lg font-medium text-green-600 dark:text-green-400">{totalEntradas}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <i className="fas fa-arrow-down text-red-400 text-xl"></i>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Saídas</dt>
                    <dd className="text-lg font-medium text-red-600 dark:text-red-400">{totalSaidas}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <i className="fas fa-edit text-yellow-400 text-xl"></i>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Ajustes</dt>
                    <dd className="text-lg font-medium text-yellow-600 dark:text-yellow-400">{totalAjustes}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Produto, usuário ou fornecedor..."
                value={filtros.busca}
                onChange={(e) => handleFiltroChange('busca', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                value={filtros.tipo}
                onChange={(e) => handleFiltroChange('tipo', e.target.value)}
              >
                <option value="">Todos</option>
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
                <option value="ajuste">Ajuste</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Início
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                value={filtros.dataInicio}
                onChange={(e) => handleFiltroChange('dataInicio', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Fim
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                value={filtros.dataFim}
                onChange={(e) => handleFiltroChange('dataFim', e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setFiltros({ busca: '', tipo: '', dataInicio: '', dataFim: '' })}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>

        {/* Movimentações Table */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Quantidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Detalhes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Usuário
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <i className="fas fa-spinner fa-spin text-gray-400 mr-2"></i>
                        <span className="text-gray-500 dark:text-gray-400">Carregando movimentações...</span>
                      </div>
                    </td>
                  </tr>
                ) : movimentacoesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-gray-500 dark:text-gray-400">
                        <i className="fas fa-inbox text-4xl mb-4"></i>
                        <p>Nenhuma movimentação encontrada</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  movimentacoesFiltradas.map((mov) => (
                    <tr key={mov.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTipoColor(mov.tipo)}`}>
                            <i className={`${getTipoIcon(mov.tipo)} text-sm`}></i>
                          </div>
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoColor(mov.tipo)}`}>
                            {getTipoText(mov.tipo)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{mov.produto_nome || 'Produto não encontrado'}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">ID: {mov.produto_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${mov.quantidade > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {mov.quantidade > 0 ? '+' : ''}{mov.quantidade}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatarValor(Math.abs(mov.valor_total))}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Unit: {formatarValor(mov.valor_unitario)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{formatarData(mov.created_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {mov.fornecedor_nome || mov.motivo || '-'}
                        </div>
                        {mov.numero_nota && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">NF: {mov.numero_nota}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {mov.usuario_nome}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </AdminLayout>
  );
}