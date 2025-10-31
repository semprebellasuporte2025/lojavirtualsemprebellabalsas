
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import AdminLayout from '../../../components/feature/AdminLayout';
import { useAuth } from '../../../hooks/useAuth'; // Importar o hook de autenticação
import { formatarMoeda, getFormaPagamentoNome, getStatusColor } from '../../../utils/formatters';

interface DashboardStats {
  totalPedidos: number;
  faturamentoTotal: number;
  totalClientes: number;
  ticketMedio: number;
}

interface VendasMensais {
  mes: string;
  vendas: number;
  faturamento: number;
}

interface FormaPagamento {
  forma: string;
  quantidade: number;
  valor: number;
}

interface PedidoRecente {
  numero_pedido: string;
  nome: string;
  total: number;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user } = useAuth(); // Obter o usuário do hook de autenticação
  const [stats, setStats] = useState<DashboardStats>({
    totalPedidos: 0,
    faturamentoTotal: 0,
    totalClientes: 0,
    ticketMedio: 0
  });
  const [vendasMensais, setVendasMensais] = useState<VendasMensais[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [pedidosRecentes, setPedidosRecentes] = useState<PedidoRecente[]>([]);
  const [loading, setLoading] = useState(true); // Adicionar o estado de loading

  useEffect(() => {
    if (user) {
      carregarDados();
    } else {
      // Sem usuário, não há dados para carregar; evita loading infinito
      setLoading(false);
    }
  }, [user]);

  const carregarDados = async () => {
    try {
      // Carregar estatísticas gerais
      const { data: statsData, error: statsError } = await supabase.rpc('get_dashboard_stats');
      if (statsError) throw statsError;
      if (statsData && statsData.length > 0) {
        const stat = statsData[0];
        setStats({
          totalPedidos: stat.total_pedidos || 0,
          faturamentoTotal: parseFloat(stat.faturamento_total || '0'),
          totalClientes: stat.total_clientes || 0,
          ticketMedio: parseFloat(stat.ticket_medio || '0')
        });
      }

      // Carregar vendas mensais
      const { data: vendasData, error: vendasError } = await supabase.rpc('get_vendas_mensais');
      if (vendasError) throw vendasError;
      if (vendasData) {
        const vendas = vendasData.map((item: any) => ({
          mes: new Date(item.mes).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
          vendas: item.vendas_mes,
          faturamento: parseFloat(item.faturamento_mes)
        }));
        setVendasMensais(vendas);
      }

      // Carregar formas de pagamento
      const { data: pagamentoData, error: pagamentoError } = await supabase.rpc('get_formas_pagamento');
      if (pagamentoError) throw pagamentoError;
      if (pagamentoData) {
        const formas = pagamentoData.map((item: any) => ({
          forma: item.forma_pagamento,
          quantidade: item.quantidade,
          valor: parseFloat(item.valor_total)
        }));
        setFormasPagamento(formas);
      }

      // Carregar pedidos recentes
      const { data: pedidosData, error: pedidosError } = await supabase.rpc('get_pedidos_recentes');
      if (pedidosError) throw pedidosError;
      if (pedidosData) {
        setPedidosRecentes(pedidosData);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-full">
          <p>Carregando...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral do seu negócio</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPedidos}</p>
            </div>
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
              <i className="ri-shopping-bag-line text-pink-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Faturamento Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.faturamentoTotal > 0 ? formatarMoeda(stats.faturamentoTotal) : 'R$ 0,00'}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="ri-money-dollar-circle-line text-green-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clientes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalClientes}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="ri-user-line text-blue-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
              <p className="text-2xl font-bold text-gray-900">{stats.ticketMedio > 0 ? formatarMoeda(stats.ticketMedio) : 'R$ 0,00'}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="ri-bar-chart-line text-purple-600 text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gráfico de Vendas Mensais */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas Mensais</h3>
          <div className="space-y-4">
            {vendasMensais.map((item, index) => {
              const maxVendas = Math.max(...vendasMensais.map(v => v.vendas));
              const porcentagem = maxVendas > 0 ? (item.vendas / maxVendas) * 100 : 0;
              
              return (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 capitalize">{item.mes}</span>
                    <span className="text-sm text-gray-600">{item.vendas} vendas</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-pink-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${porcentagem}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{formatarMoeda(item.faturamento)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Formas de Pagamento */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Formas de Pagamento</h3>
          <div className="space-y-4">
            {formasPagamento.map((item, index) => {
              const maxQuantidade = Math.max(...formasPagamento.map(f => f.quantidade));
              const porcentagem = maxQuantidade > 0 ? (item.quantidade / maxQuantidade) * 100 : 0;
              
              return (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 capitalize">{getFormaPagamentoNome(item.forma)}</span>
                    <span className="text-sm text-gray-600">{item.quantidade} pedidos</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${porcentagem}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{formatarMoeda(item.valor)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pedidos Recentes */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pedidos Recentes</h3>
          <div className="space-y-4">
            {pedidosRecentes.map((pedido, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{pedido.numero_pedido}</p>
                  <p className="text-sm text-gray-600">{pedido.nome}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatarMoeda(parseFloat(pedido.total.toString()))}</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pedido.status)}`}>
                    {pedido.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumo do Negócio */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Negócio</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <i className="ri-box-line text-green-600"></i>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Produtos Ativos</p>
                  <p className="text-sm text-gray-600">Catálogo disponível</p>
                </div>
              </div>
              <span className="text-lg font-bold text-gray-900">32</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <i className="ri-truck-line text-blue-600"></i>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Taxa de Entrega</p>
                  <p className="text-sm text-gray-600">Pedidos entregues</p>
                </div>
              </div>
              <span className="text-lg font-bold text-green-600">100%</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <i className="ri-map-pin-line text-purple-600"></i>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Região Principal</p>
                  <p className="text-sm text-gray-600">Área de atuação</p>
                </div>
              </div>
              <span className="text-sm font-bold text-gray-900">Balsas - MA</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                  <i className="ri-alert-line text-yellow-600"></i>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Estoque Baixo</p>
                  <p className="text-sm text-gray-600">Produtos para repor</p>
                </div>
              </div>
              <span className="text-lg font-bold text-yellow-600">1</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
