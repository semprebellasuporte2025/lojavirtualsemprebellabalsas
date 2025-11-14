import { useState, useEffect } from 'react';
import AdminLayout from '../../../../components/feature/AdminLayout';
import { useToast } from '../../../../hooks/useToast';
import { supabase } from '../../../../lib/supabase';
import ConfirmationModal from '../../../../components/feature/modal/ConfirmationModal';
import { Modal, Button } from 'react-bootstrap';

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
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [filtros, setFiltros] = useState({
    busca: '',
    tipo: '',
    dataInicio: '',
    dataFim: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [movToDelete, setMovToDelete] = useState<Movimentacao | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [movToEdit, setMovToEdit] = useState<Movimentacao | null>(null);
  const [editForm, setEditForm] = useState({
    fornecedor_nome: '',
    numero_nota: '',
    motivo: '',
    observacoes: '',
    valor_unitario: 0,
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
        // Fallback para preencher nome do produto quando ausente
        let movs: Movimentacao[] = (data || []) as Movimentacao[];

        const produtoIds = Array.from(new Set(
          movs.map(m => m.produto_id).filter(id => !!id)
        ));

        if (produtoIds.length > 0) {
          const { data: produtos, error: produtosError } = await supabase
            .from('produtos')
            .select('id, nome')
            .in('id', produtoIds);

          if (produtosError) {
            console.warn('Falha ao buscar nomes de produtos para movimentações:', produtosError.message);
          } else {
            const nomePorId = new Map<string, string>();
            (produtos || []).forEach((p: any) => {
              if (p?.id) nomePorId.set(p.id, p?.nome || '');
            });
            movs = movs.map(m => ({
              ...m,
              produto_nome: m.produto_nome || nomePorId.get(m.produto_id) || m.produto_nome
            }));
          }
        }

        setMovimentacoes(movs);
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
      case 'entrada': return 'ri-arrow-up-line';
      case 'saida': return 'ri-arrow-down-line';
      case 'ajuste': return 'ri-edit-line';
      default: return 'ri-question-line';
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

  const [showViewModal, setShowViewModal] = useState(false);
  const [movToView, setMovToView] = useState<Movimentacao | null>(null);

  const handleVisualizar = (mov: Movimentacao) => {
    setMovToView(mov);
    setShowViewModal(true);
  };

  const handleEditar = (mov: Movimentacao) => {
    setMovToEdit(mov);
    setEditForm({
      fornecedor_nome: mov.fornecedor_nome || '',
      numero_nota: mov.numero_nota || '',
      motivo: mov.motivo || '',
      observacoes: mov.observacoes || '',
      valor_unitario: mov.valor_unitario || 0,
    });
    setShowEditModal(true);
  };

  const handleExcluir = (mov: Movimentacao) => {
    setMovToDelete(mov);
    setShowDeleteModal(true);
  };

  const confirmExcluir = async () => {
    if (!movToDelete) return;
    try {
      setDeleteLoading(true);
      const { error } = await supabase
        .from('movimentacoes_estoque')
        .delete()
        .eq('id', movToDelete.id);

      if (error) throw error;

      showToast('Movimentação excluída com sucesso!', 'success');
      setShowDeleteModal(false);
      setMovToDelete(null);
      await carregarMovimentacoes();
    } catch (error) {
      console.error('Erro ao excluir movimentação:', error);
      showToast('Erro ao excluir movimentação', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const updateMovimentacao = async () => {
    if (!movToEdit) return;
    try {
      setEditLoading(true);
      const novoValorTotal = (editForm.valor_unitario || 0) * (movToEdit.quantidade || 0);
      const { error } = await supabase
        .from('movimentacoes_estoque')
        .update({
          fornecedor_nome: editForm.fornecedor_nome || null,
          numero_nota: editForm.numero_nota || null,
          motivo: editForm.motivo || null,
          observacoes: editForm.observacoes || null,
          valor_unitario: editForm.valor_unitario || 0,
          valor_total: novoValorTotal,
        })
        .eq('id', movToEdit.id);

      if (error) throw error;
      showToast('Movimentação atualizada com sucesso!', 'success');
      setShowEditModal(false);
      setMovToEdit(null);
      await carregarMovimentacoes();
    } catch (error) {
      console.error('Erro ao atualizar movimentação:', error);
      showToast('Erro ao atualizar movimentação', 'error');
    } finally {
      setEditLoading(false);
    }
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
          <button
            onClick={() => alert('Funcionalidade de nova movimentação será implementada em breve.')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <i className="ri-add-line mr-2"></i>
            Nova Movimentação
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <i className="ri-list-check-2 text-gray-400 text-xl"></i>
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
                  <i className="ri-arrow-up-line text-green-400 text-xl"></i>
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
                  <i className="ri-arrow-down-line text-red-400 text-xl"></i>
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
                  <i className="ri-edit-line text-yellow-400 text-xl"></i>
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
            <table className="min-w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[260px]">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[220px]">
                    Detalhes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider sticky right-0 bg-gray-50 dark:bg-gray-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <i className="ri-loader-4-line animate-spin text-gray-400 mr-2"></i>
                        <span className="text-gray-500 dark:text-gray-400">Carregando movimentações...</span>
                      </div>
                    </td>
                  </tr>
                ) : movimentacoesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="text-gray-500 dark:text-gray-400">
                        <i className="ri-inbox-line text-4xl mb-4"></i>
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
                      <td className="px-6 py-4 pr-10 whitespace-normal break-words">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{mov.produto_nome || 'Produto não encontrado'}</div>
                      </td>
                      <td className="px-6 py-4 pl-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          mov.tipo === 'saida'
                            ? 'text-red-600 dark:text-red-400'
                            : mov.tipo === 'entrada'
                              ? 'text-green-600 dark:text-green-400'
                              : (mov.quantidade >= 0
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-red-600 dark:text-red-400')
                        }`}>
                          {
                            mov.tipo === 'saida'
                              ? `-${Math.abs(mov.quantidade)}`
                              : mov.tipo === 'entrada'
                                ? `+${Math.abs(mov.quantidade)}`
                                : `${mov.quantidade >= 0 ? '+' : ''}${Math.abs(mov.quantidade)}`
                          }
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
                      <td className="px-6 py-4 whitespace-normal break-words max-w-[320px]">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium sticky right-0 bg-white dark:bg-gray-800">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleVisualizar(mov)}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Visualizar"
                            aria-label="Visualizar"
                          >
                            <i className="ri-eye-line"></i>
                            <span className="text-xs">Ver</span>
                          </button>
                          <button
                            onClick={() => handleEditar(mov)}
                            className="inline-flex items-center gap-1 text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                            title="Editar"
                            aria-label="Editar"
                          >
                            <i className="ri-edit-line"></i>
                            <span className="text-xs">Editar</span>
                          </button>
                          <button
                            onClick={() => handleExcluir(mov)}
                            className="inline-flex items-center gap-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Excluir"
                            aria-label="Excluir"
                          >
                            <i className="ri-delete-bin-line"></i>
                            <span className="text-xs">Excluir</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        show={showDeleteModal}
        onHide={() => { if (!deleteLoading) { setShowDeleteModal(false); setMovToDelete(null); } }}
        onConfirm={confirmExcluir}
        title="Excluir movimentação"
        body={movToDelete ? `Confirma excluir a movimentação ${getTipoText(movToDelete.tipo)} de ${movToDelete.produto_nome || 'Produto'} com quantidade ${movToDelete.quantidade}? Esta ação não pode ser desfeita.` : ''}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deleteLoading}
      />

      {/* View Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Detalhes da movimentação</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {movToView && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTipoColor(movToView.tipo)}`}>
                  <i className={`${getTipoIcon(movToView.tipo)} text-sm`}></i>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoColor(movToView.tipo)}`}>
                  {getTipoText(movToView.tipo)}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Produto:</span> {movToView.produto_nome || 'Produto não encontrado'}
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Quantidade:</span> {
                  movToView.tipo === 'saida'
                    ? `-${Math.abs(movToView.quantidade)}`
                    : movToView.tipo === 'entrada'
                      ? `+${Math.abs(movToView.quantidade)}`
                      : `${movToView.quantidade >= 0 ? '+' : ''}${Math.abs(movToView.quantidade)}`
                }
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Valor unitário:</span> {formatarValor(movToView.valor_unitario)}
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Valor total:</span> {formatarValor(Math.abs(movToView.valor_total))}
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Data:</span> {formatarData(movToView.created_at)}
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Fornecedor:</span> {movToView.fornecedor_nome || '-'}
              </div>
              {movToView.numero_nota && (
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">NF:</span> {movToView.numero_nota}
                </div>
              )}
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Motivo:</span> {movToView.motivo || '-'}
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Observações:</span> {movToView.observacoes || '-'}
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Usuário:</span> {movToView.usuario_nome}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => { if (!editLoading) { setShowEditModal(false); setMovToEdit(null); } }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Editar movimentação</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {movToEdit && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <div><strong>Produto:</strong> {movToEdit.produto_nome || 'Produto'}</div>
                <div><strong>Tipo:</strong> {getTipoText(movToEdit.tipo)}</div>
                <div><strong>Quantidade:</strong> {movToEdit.quantidade}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fornecedor</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  value={editForm.fornecedor_nome}
                  onChange={(e) => setEditForm(prev => ({ ...prev, fornecedor_nome: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número da nota</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  value={editForm.numero_nota}
                  onChange={(e) => setEditForm(prev => ({ ...prev, numero_nota: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motivo</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  value={editForm.motivo}
                  onChange={(e) => setEditForm(prev => ({ ...prev, motivo: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  value={editForm.observacoes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, observacoes: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor unitário</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  value={editForm.valor_unitario}
                  onChange={(e) => setEditForm(prev => ({ ...prev, valor_unitario: parseFloat(e.target.value || '0') }))}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">O valor total será recalculado automaticamente.</p>
              </div>
              <div className="bg-yellow-50 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 p-3 rounded-md text-xs">
                Campos críticos (tipo e quantidade) não podem ser alterados aqui. Para corrigir, registre um ajuste de estoque.
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={editLoading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={updateMovimentacao} disabled={editLoading}>
            {editLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Salvar alterações
              </>
            ) : (
              'Salvar alterações'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

    </AdminLayout>
  );
}