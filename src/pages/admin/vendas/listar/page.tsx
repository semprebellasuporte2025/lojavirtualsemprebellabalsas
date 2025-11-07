
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '../../../../lib/supabase';
import AdminLayout from '../../../../components/feature/AdminLayout';
import { useToast } from '@/hooks/useToast';
import { generateEtiqueta } from '@/lib/pdfGenerator';
import type { Venda, ItemPedido } from '@/domain/vendas';
import ConfirmationModal from '@/components/feature/modal/ConfirmationModal';

export default function ListarVendas() {
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAtendente } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [dateFilter, setDateFilter] = useState('todos');
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVenda, setEditingVenda] = useState<Venda | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [autoOpenedFromParam, setAutoOpenedFromParam] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [vendaParaExcluir, setVendaParaExcluir] = useState<Venda | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openEditModal = (venda: Venda) => {
    setEditingVenda(venda);
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setEditingVenda(null);
    setIsModalOpen(false);
  };

  const updateVenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVenda) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({
          status: editingVenda.status,
          numero_rastreio: editingVenda.numero_rastreio,
        })
        .eq('id', editingVenda.id);

      if (error) throw error;

      showToast('Venda atualizada com sucesso!', 'success');
      closeEditModal();
      loadVendas(); // Recarrega a lista de vendas
    } catch (error: any) {
      console.error('Erro ao atualizar venda:', error);
      showToast(`Erro ao atualizar venda: ${error.message}`, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteVenda = async (vendaId: string) => {
    // Mantido por compatibilidade, mas agora abrimos o modal padrão
    const venda = vendas.find(v => v.id === vendaId) || null;
    if (venda) {
      setVendaParaExcluir(venda);
      setShowDeleteModal(true);
    } else {
      showToast('Venda não encontrada para exclusão.', 'error');
    }
  };

  const openDeleteModal = (venda: Venda) => {
    // Bloquear atendentes
    if (isAtendente) {
      showToast('Atendentes não podem excluir vendas.', 'error');
      return;
    }
    setVendaParaExcluir(venda);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setVendaParaExcluir(null);
  };

  const confirmDeleteVenda = async () => {
    if (!vendaParaExcluir) return;
    setDeleting(true);
    try {
      // 1) Reverter estoque inserindo movimentações de "entrada" para cada item do pedido
      const itens = vendaParaExcluir.itens_pedido || [];
      if (itens.length > 0) {
        const movimentos = itens.map(item => ({
          produto_id: item.produto_id,
          tipo: 'entrada',
          quantidade: item.quantidade,
          valor_unitario: item.preco_unitario ?? 0,
          valor_total: item.subtotal ?? 0,
          motivo: 'Cancelamento de venda',
          observacoes: `Reversão de estoque - Pedido: ${vendaParaExcluir.numero_pedido}`,
          usuario_nome: 'Sistema - Exclusão de Venda'
        }));

        const { error: movError } = await supabase
          .from('movimentacoes_estoque')
          .insert(movimentos);

        if (movError) throw movError;
      }

      // 2) Excluir itens do pedido (em cascata já existe, mas garantimos)
      const { error: itensError } = await supabase
        .from('itens_pedido')
        .delete()
        .eq('pedido_id', vendaParaExcluir.id);
      if (itensError) throw itensError;

      // 3) Excluir o pedido
      const { error: pedidoError } = await supabase
        .from('pedidos')
        .delete()
        .eq('id', vendaParaExcluir.id);
      if (pedidoError) throw pedidoError;

      showToast('Venda excluída e estoque revertido com sucesso!', 'success');
      closeDeleteModal();
      loadVendas();
      // Forçar retorno à listagem (rota oficial do painel)
      try {
        navigate('/paineladmin/vendas/listar', { replace: true });
      } catch (_) {
        // Fallback caso o router não esteja disponível
        window.location.href = '/paineladmin/vendas/listar';
      }
    } catch (error: any) {
      console.error('Erro ao excluir venda com reversão de estoque:', error);
      showToast(`Erro ao excluir venda: ${error.message}`, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const loadVendas = async () => {
    setLoading(true);
    try {
      console.log('Carregando vendas...');
      
      // Buscar pedidos
      const { data: pedidos, error: pedidosError } = await supabase
        .from('pedidos')
        .select(`
          *,
          clientes ( nome, email )
        `)
        .order('created_at', { ascending: false });

      if (pedidosError) {
        console.error('Erro ao buscar pedidos:', pedidosError);
        alert('Erro ao carregar vendas: ' + pedidosError.message);
        return;
      }

      console.log('Pedidos encontrados:', pedidos?.length || 0);

      // Buscar todos os itens de pedido de uma vez
      const { data: todosItens, error: itensError } = await supabase
        .from('itens_pedido')
        .select('*');

      if (itensError) {
        console.error('Erro ao buscar itens:', itensError);
        alert('Erro ao carregar itens: ' + itensError.message);
        return;
      }

      console.log('Itens encontrados:', todosItens?.length || 0);

      // Criar mapa de itens por pedido_id
      const itensPorPedido = new Map<string, ItemPedido[]>();
      todosItens?.forEach(item => {
        if (!itensPorPedido.has(item.pedido_id)) {
          itensPorPedido.set(item.pedido_id, []);
        }
        itensPorPedido.get(item.pedido_id)?.push({
          id: item.id,
          produto_id: item.produto_id,
          nome: item.nome,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.subtotal,
          tamanho: item.tamanho,
          cor: item.cor,
          imagem: item.imagem
        });
      });

      // Processar vendas com contagem de itens
      const vendasProcessadas = pedidos?.map(pedido => {
        const itensCount = itensPorPedido.get(pedido.id)?.length || 0;
        const itensPedido = itensPorPedido.get(pedido.id) || [];
        
        return {
          id: pedido.id,
          numero_pedido: pedido.numero_pedido,
          cliente_nome: pedido.clientes?.nome || pedido.cliente_nome, // Fallback para o campo antigo
          cliente_email: pedido.clientes?.email || pedido.cliente_email, // Fallback para o campo antigo
          total: pedido.total,
          status: pedido.status,
          forma_pagamento: pedido.forma_pagamento,
          created_at: pedido.created_at,
          itens_count: itensCount,
          numero_rastreio: pedido.numero_rastreio,
          itens_pedido: itensPedido,
          endereco_entrega: pedido.endereco_entrega
        };
      }) || [];

      console.log('Vendas processadas:', vendasProcessadas.length);
      setVendas(vendasProcessadas);
    } catch (error) {
      console.error('Erro inesperado:', error);
      alert('Erro inesperado ao carregar vendas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useEffect executado - carregando vendas...');
    loadVendas();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'entregue': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'enviado': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'preparando': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'pendente': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'cancelado': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'entregue': return 'Entregue';
      case 'enviado': return 'Enviado';
      case 'preparando': return 'Preparando';
      case 'pendente': return 'Pendente';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  // Filtrar vendas baseado nos filtros aplicados
  const filteredVendas = vendas.filter(venda => {
    console.log('Filtrando venda:', venda.numero_pedido, 'Status atual dos filtros:', { searchTerm, statusFilter, dateFilter });
    
    const matchesSearch = searchTerm === '' || 
      venda.numero_pedido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venda.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venda.cliente_email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'todos' || venda.status === statusFilter;

    let matchesDate = true;
    if (dateFilter !== 'todos') {
      const vendaDate = new Date(venda.created_at);
      const today = new Date();
      
      switch (dateFilter) {
        case 'hoje':
          matchesDate = vendaDate.toDateString() === today.toDateString();
          break;
        case 'ontem':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          matchesDate = vendaDate.toDateString() === yesterday.toDateString();
          break;
        case 'semana':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          matchesDate = vendaDate >= weekAgo;
          break;
      }
    }

    const matches = matchesSearch && matchesStatus && matchesDate;
    console.log('Venda', venda.numero_pedido, 'matches:', matches, { matchesSearch, matchesStatus, matchesDate });
    return matches;
  });

  console.log('Total de vendas:', vendas.length);
  console.log('Vendas filtradas:', filteredVendas.length);
  console.log('Estado loading:', loading);

  const totalVendas = filteredVendas.reduce((sum, venda) => sum + venda.total, 0);

  // Abrir modal automaticamente quando há parâmetro na URL
  useEffect(() => {
    if (autoOpenedFromParam) return;
    try {
      const params = new URLSearchParams(location.search);
      const idParam = params.get('edit');
      const numeroPedidoParam = params.get('pedido');
      let target: Venda | undefined;
      if (idParam) {
        target = vendas.find(v => v.id === idParam);
      } else if (numeroPedidoParam) {
        target = vendas.find(v => v.numero_pedido === numeroPedidoParam);
      }
      if (target) {
        openEditModal(target);
        setAutoOpenedFromParam(true);
      }
    } catch (e) {
      console.warn('Falha ao processar parâmetros de edição:', e);
    }
  }, [vendas, location.search, autoOpenedFromParam]);

  // Funções para editar venda
  // (duplicatas removidas)

  return (
    <AdminLayout className="no-print">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendas</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie todas as vendas da loja</p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Vendas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredVendas.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <i className="ri-shopping-cart-line text-xl text-blue-600 dark:text-blue-400"></i>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Faturamento</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">R$ {totalVendas.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <i className="ri-money-dollar-circle-line text-xl text-green-600 dark:text-green-400"></i>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ticket Médio</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">R$ {filteredVendas.length > 0 ? (totalVendas / filteredVendas.length).toFixed(2) : '0.00'}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <i className="ri-bar-chart-line text-xl text-purple-600 dark:text-purple-400"></i>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Entregues</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredVendas.filter(v => v.status === 'entregue').length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <i className="ri-truck-line text-xl text-green-600 dark:text-green-400"></i>
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
                  placeholder="Número, cliente ou email..."
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
                <option value="todos">Todos os Status</option>
                <option value="pendente">Pendente</option>
                <option value="preparando">Preparando</option>
                <option value="enviado">Enviado</option>
                <option value="entregue">Entregue</option>
                <option value="cancelado">Cancelado</option>
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
                  setStatusFilter('todos');
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

        {/* Vendas Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">
                    Venda
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[200px]">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[250px]">
                    Produtos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">
                    Pagamento
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <i className="ri-loader-4-line text-2xl text-gray-400 animate-spin"></i>
                      <p className="text-gray-500 mt-2">Carregando vendas...</p>
                    </td>
                  </tr>
                ) : filteredVendas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <i className="ri-shopping-cart-line text-4xl text-gray-400 dark:text-gray-600 mb-4"></i>
                      <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhuma venda encontrada</div>
                      <div className="text-gray-500 dark:text-gray-400">Tente ajustar os filtros para encontrar vendas.</div>
                    </td>
                  </tr>
                ) : filteredVendas.map((venda) => (
                  <tr key={venda.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{venda.numero_pedido}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{venda.itens_count} {venda.itens_count === 1 ? 'item' : 'itens'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{venda.cliente_nome}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{venda.cliente_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {venda.itens_pedido?.slice(0, 3).map((item, index) => (
                          <div key={index} className="text-sm text-gray-900 dark:text-white">
                            • {item.nome} ({item.quantidade}x)
                          </div>
                        ))}
                        {venda.itens_pedido && venda.itens_pedido.length > 3 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            + {venda.itens_pedido.length - 3} mais itens
                          </div>
                        )}
                        {(!venda.itens_pedido || venda.itens_pedido.length === 0) && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Nenhum item
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900 dark:text-white">{new Date(venda.created_at).toLocaleDateString('pt-BR')}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{new Date(venda.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        R$ {venda.total.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(venda.status)}`}>
                        {getStatusText(venda.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {venda.forma_pagamento}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(venda)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                          title="Editar/Visualizar venda"
                        >
                          <i className="ri-edit-line text-lg"></i>
                        </button>
                        <button 
                          onClick={() => openEditModal(venda)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 cursor-pointer"
                          title="Visualizar detalhes"
                        >
                          <i className="ri-eye-line text-lg"></i>
                        </button>
                        <button 
                          onClick={() => openEditModal(venda)}
                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 cursor-pointer"
                          title="Imprimir/Gerar Etiqueta"
                        >
                          <i className="ri-printer-line text-lg"></i>
                        </button>
                        {!isAtendente && (
                          <button 
                            onClick={() => openDeleteModal(venda)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 cursor-pointer"
                            title="Excluir venda"
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
        </div>

        {/* Mensagem de nenhuma venda encontrada removida daqui pois foi movida para dentro da tabela */}
      </div>

      {/* Modal de Detalhes da Venda */}
      {isModalOpen && editingVenda && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 printable-modal">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Venda #{editingVenda.numero_pedido}
                </h3>
                <button
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors no-print"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              {/* Informações da Venda */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Informações do Cliente</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Nome:</span> {editingVenda.cliente_nome}</p>
                    <p><span className="font-medium">Email:</span> {editingVenda.cliente_email}</p>
                    <p><span className="font-medium">Data:</span> {new Date(editingVenda.created_at).toLocaleString('pt-BR')}</p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Informações do Pedido</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Status:</span> {getStatusText(editingVenda.status)}</p>
                    <p><span className="font-medium">Pagamento:</span> {editingVenda.forma_pagamento}</p>
                    <p><span className="font-medium">Total:</span> R$ {editingVenda.total.toFixed(2)}</p>
                    {editingVenda.numero_rastreio && (
                      <p><span className="font-medium">Rastreio:</span> {editingVenda.numero_rastreio}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Produtos Vendidos */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">Produtos Vendidos</h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100 dark:bg-gray-600">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Produto</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Quantidade</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Preço Unit.</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {editingVenda.itens_pedido?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              {item.imagem && (
                                <img 
                                  src={item.imagem} 
                                  alt={item.nome}
                                  className="w-10 h-10 rounded object-cover mr-3"
                                />
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{item.nome}</div>
                                {(item.tamanho || item.cor) && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {item.tamanho && `Tamanho: ${item.tamanho}`}
                                    {item.tamanho && item.cor && ' • '}
                                    {item.cor && `Cor: ${item.cor}`}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.quantidade}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">R$ {item.preco_unitario.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">R$ {item.subtotal.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Formulário de Edição */}
              <form onSubmit={updateVenda} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={editingVenda.status}
                      onChange={(e) => setEditingVenda({...editingVenda, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      required
                    >
                      <option value="pendente">Pendente</option>
                      <option value="preparando">Preparando</option>
                      <option value="enviado">Enviado</option>
                      <option value="entregue">Entregue</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Número de Rastreio
                    </label>
                    <input
                      type="text"
                      value={editingVenda.numero_rastreio || ''}
                      onChange={(e) => setEditingVenda({...editingVenda, numero_rastreio: e.target.value})}
                      placeholder="Código de rastreamento"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    disabled={updating}
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? (
                      <>
                        <i className="ri-loader-4-line animate-spin mr-2"></i>
                        Atualizando...
                      </>
                    ) : (
                      'Atualizar Venda'
                    )}
                  </button>
                </div>
                <div className="flex items-center space-x-3 pt-4 no-print">
                  <button
                    type="button"
                    onClick={() => editingVenda && generateEtiqueta(editingVenda)}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Gerar Etiqueta
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Imprimir
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão - padrão do sistema */}
      <ConfirmationModal
        show={showDeleteModal}
        onHide={closeDeleteModal}
        onConfirm={confirmDeleteVenda}
        title="Confirmar exclusão"
        body={
          vendaParaExcluir 
            ? `Tem certeza que deseja excluir a venda #${vendaParaExcluir.numero_pedido}? Esta ação não pode ser desfeita e o estoque será revertido.`
            : 'Tem certeza que deseja excluir esta venda?'
        }
      />
    </AdminLayout>
  );
}
