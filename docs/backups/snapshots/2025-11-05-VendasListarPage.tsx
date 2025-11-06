import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase';
import AdminLayout from '../../../../components/feature/AdminLayout';
import { useToast } from '@/hooks/useToast';
import { generateEtiqueta } from '@/lib/pdfGenerator';
import type { Venda, ItemPedido } from '@/domain/vendas';

export default function ListarVendas() {
  const { showToast } = useToast();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [dateFilter, setDateFilter] = useState('todos');
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVenda, setEditingVenda] = useState<Venda | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [autoOpenedFromParam, setAutoOpenedFromParam] = useState(false);

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
  const openEditModal = (venda: Venda) => {
    setEditingVenda(venda);
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
    setEditingVenda(null);
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
          numero_rastreio: editingVenda.numero_rastreio || null
        })
        .eq('id', editingVenda.id);

      if (error) {
        console.error('Erro ao atualizar venda:', error);
        showToast('Erro ao atualizar venda: ' + error.message, 'error');
      } else {
        // Atualizar a lista de vendas localmente, mantendo os itens do pedido
        setVendas(prevVendas => 
          prevVendas.map(v => 
            v.id === editingVenda.id 
              ? { 
                  ...v, 
                  status: editingVenda.status, 
                  numero_rastreio: editingVenda.numero_rastreio,
                  // Garantir que os itens do pedido não sejam perdidos
                  itens_pedido: v.itens_pedido 
                }
              : v
          )
        );
        showToast('Venda atualizada com sucesso!', 'success');
        closeEditModal();
      }
    } catch (error) {
      console.error('Erro inesperado:', error);
      alert('Erro inesperado ao atualizar venda');
    } finally {
      setUpdating(false);
    }
  };

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
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{venda.cliente_nome || '—'}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{venda.cliente_email || '—'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {venda.itens_pedido?.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex items-center gap-2">
                            {item.imagem ? (
                              <img src={item.imagem} alt={item.nome} className="w-8 h-8 rounded object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700"></div>
                            )}
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {item.nome} × {item.quantidade}
                            </span>
                          </div>
                        ))}
                        {venda.itens_count > 3 && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">+{venda.itens_count - 3} itens</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {new Date(venda.created_at).toLocaleString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">R$ {venda.total.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(venda.status)}`}>
                        {getStatusText(venda.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{venda.forma_pagamento || '—'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(venda)}
                          className="px-3 py-1.5 bg-pink-600 text-white rounded hover:bg-pink-700 transition-colors cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => generateEtiqueta(venda)}
                          className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                        >
                          Etiqueta
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal */}
        {isModalOpen && editingVenda && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-2xl">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Editar Venda</h2>
              </div>
              <form onSubmit={updateVenda}>
                <div className="px-6 py-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número do Pedido</label>
                      <input
                        type="text"
                        value={editingVenda.numero_pedido}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                      <select
                        value={editingVenda.status}
                        onChange={(e) => setEditingVenda(prev => prev ? { ...prev, status: e.target.value } : prev)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="pendente">Pendente</option>
                        <option value="preparando">Preparando</option>
                        <option value="enviado">Enviado</option>
                        <option value="entregue">Entregue</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número de Rastreamento</label>
                    <input
                      type="text"
                      value={editingVenda.numero_rastreio || ''}
                      onChange={(e) => setEditingVenda(prev => prev ? { ...prev, numero_rastreio: e.target.value } : prev)}
                      placeholder="Ex.: BR1234567890"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Itens do Pedido</label>
                    <div className="space-y-2">
                      {editingVenda.itens_pedido?.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          {item.imagem ? (
                            <img src={item.imagem} alt={item.nome} className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-700"></div>
                          )}
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{item.nome}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Qtd: {item.quantidade} • R$ {item.preco_unitario.toFixed(2)}</div>
                          </div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white">R$ {item.subtotal.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
                  >
                    {updating ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}