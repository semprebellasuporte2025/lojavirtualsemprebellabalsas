
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import AdminLayout from '../../../components/feature/AdminLayout';
import { useAuth } from '../../../hooks/useAuth'; // Importar o hook de autenticação
import { formatarMoeda, getFormaPagamentoNome, getStatusColor } from '../../../utils/formatters';

interface DashboardStats {
  totalPedidos: number;
  faturamentoTotal: number;
  totalClientes: number;
  totalProdutos: number;
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

interface BusinessSummary {
  produtosAtivos: number;
  taxaEntrega: number;
  regiaoPrincipal: string;
  produtosEstoqueBaixo: number;
}

export default function DashboardPage() {
  const { user } = useAuth(); // Obter o usuário do hook de autenticação
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalPedidos: 0,
    faturamentoTotal: 0,
    totalClientes: 0,
    totalProdutos: 0,
    ticketMedio: 0
  });
  const [vendasMensais, setVendasMensais] = useState<VendasMensais[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [pedidosRecentes, setPedidosRecentes] = useState<PedidoRecente[]>([]);
  const [businessSummary, setBusinessSummary] = useState<BusinessSummary>({
    produtosAtivos: 0,
    taxaEntrega: 0,
    regiaoPrincipal: 'Balsas - MA',
    produtosEstoqueBaixo: 0
  });
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
      // Carregar estatísticas gerais usando a nova função
      const { data: statsData, error: statsError } = await supabase.rpc('get_dashboard_stats');
      
      if (statsError) {
        console.error('Erro ao carregar estatísticas:', statsError);
        // Fallback para consultas diretas se a função não existir
        const { count: totalPedidos } = await supabase
          .from('pedidos')
          .select('*', { count: 'exact', head: true });
        
        const { count: totalClientes } = await supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true });

        const { count: totalProdutos } = await supabase
          .from('produtos')
          .select('*', { count: 'exact', head: true });

        setStats({
          totalPedidos: totalPedidos || 0,
          faturamentoTotal: 0,
          totalClientes: totalClientes || 0,
          totalProdutos: totalProdutos || 0,
          ticketMedio: 0
        });
      } else if (statsData && statsData.length > 0) {
        const stat = statsData[0];
        setStats({
          totalPedidos: stat.total_pedidos || 0,
          faturamentoTotal: parseFloat(stat.faturamento_total || '0'),
          totalClientes: stat.total_clientes || 0,
          totalProdutos: stat.total_produtos || 0,
          ticketMedio: parseFloat(stat.ticket_medio || '0')
        });
      }

      // Carregar vendas mensais
      const { data: vendasData, error: vendasError } = await supabase.rpc('get_vendas_mensais');
      if (vendasError) {
        console.error('Erro ao carregar vendas mensais:', vendasError);
      } else if (vendasData) {
        const vendas = vendasData.map((item: any) => ({
          mes: new Date(item.mes).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
          vendas: item.vendas_mes,
          faturamento: parseFloat(item.faturamento_mes)
        }));
        setVendasMensais(vendas);
      }

      // Carregar formas de pagamento
      const { data: pagamentoData, error: pagamentoError } = await supabase.rpc('get_formas_pagamento_stats');
      if (pagamentoError) {
        console.error('Erro ao carregar formas de pagamento:', pagamentoError);
      } else if (pagamentoData) {
        const formas = pagamentoData.map((item: any) => ({
          forma: item.forma_pagamento,
          quantidade: item.quantidade,
          valor: parseFloat(item.valor_total)
        }));
        setFormasPagamento(formas);
      }

      // Carregar pedidos recentes
      const { data: pedidosData, error: pedidosError } = await supabase.rpc('get_pedidos_recentes', { limite: 10 });
      if (pedidosError) {
        console.error('Erro ao carregar pedidos recentes:', pedidosError);
      } else if (pedidosData) {
        setPedidosRecentes(pedidosData);
      }

      // Carregar resumo do negócio
      const { data: businessData, error: businessError } = await supabase.rpc('get_business_summary');
      if (businessError) {
        console.error('Erro ao carregar resumo do negócio:', businessError);
        console.log('Função get_business_summary não encontrada ou com erro. Usando consulta direta...');

        // Fallback: calcular usando variantes de produto (estoque por variação)
        const { data: variantesPositivas, error: variantesError } = await supabase
          .from('variantes_produto')
          .select('produto_id')
          .gt('estoque', 0)
          .eq('ativo', true);

        if (variantesError) {
          console.error('Erro ao carregar variantes para resumo do negócio:', variantesError);
        }

        const produtoIdsComEstoque = Array.from(new Set((variantesPositivas || []).map(v => v.produto_id).filter(Boolean)));

        let produtosAtivosCount = 0;
        if (produtoIdsComEstoque.length > 0) {
          const { count: ativosCount } = await supabase
            .from('produtos')
            .select('*', { count: 'exact', head: true })
            .in('id', produtoIdsComEstoque)
            .eq('ativo', true);
          produtosAtivosCount = ativosCount || 0;
        }

        // Produtos com estoque baixo: soma estoque de variações por produto e filtrar <= 5
        const { data: variantesTodas, error: variantesTodasError } = await supabase
          .from('variantes_produto')
          .select('produto_id, estoque')
          .eq('ativo', true);

        if (variantesTodasError) {
          console.error('Erro ao carregar variantes para estoque baixo:', variantesTodasError);
        }

        const somaPorProduto = new Map<string, number>();
        for (const v of (variantesTodas || [])) {
          const id = v.produto_id as string;
          const atual = somaPorProduto.get(id) || 0;
          somaPorProduto.set(id, atual + (v.estoque || 0));
        }
        const idsEstoqueBaixo = Array.from(somaPorProduto.entries())
          .filter(([_, total]) => total <= 5 && total >= 0)
          .map(([id]) => id);

        let produtosEstoqueBaixoCount = 0;
        if (idsEstoqueBaixo.length > 0) {
          const { count: baixoCount } = await supabase
            .from('produtos')
            .select('*', { count: 'exact', head: true })
            .in('id', idsEstoqueBaixo)
            .eq('ativo', true);
          produtosEstoqueBaixoCount = baixoCount || 0;
        }

        // Calcular taxa de entrega usando pedidos
        const { count: pedidosEntregues } = await supabase
          .from('pedidos')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'entregue');

        const { count: totalPedidos } = await supabase
          .from('pedidos')
          .select('*', { count: 'exact', head: true })
          .neq('status', 'cancelado');

        const totalPedidosNum = Number(totalPedidos ?? 0);
        const pedidosEntreguesNum = Number(pedidosEntregues ?? 0);
        const taxaEntrega = totalPedidosNum > 0
          ? Math.round((pedidosEntreguesNum / totalPedidosNum) * 100 * 10) / 10
          : 0;

        console.log('Fallback - Pedidos entregues:', pedidosEntreguesNum, 'Total pedidos:', totalPedidosNum, 'Taxa:', taxaEntrega);

        setBusinessSummary({
          produtosAtivos: produtosAtivosCount,
          taxaEntrega: taxaEntrega,
          regiaoPrincipal: 'Balsas - MA',
          produtosEstoqueBaixo: produtosEstoqueBaixoCount
        });
      } else if (businessData && businessData.length > 0) {
        const business = businessData[0];
        console.log('Dados do resumo do negócio carregados:', business);
        setBusinessSummary({
          produtosAtivos: business.produtos_ativos || 0,
          // Compatibiliza nomes: taxa_entrega_percentual (antigo) ou taxa_entrega (novo)
          taxaEntrega: parseFloat((business.taxa_entrega_percentual ?? business.taxa_entrega ?? '0') as string),
          regiaoPrincipal: business.regiao_principal || 'Balsas - MA',
          produtosEstoqueBaixo: business.produtos_estoque_baixo || 0
        });
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
              <p className="text-sm font-medium text-gray-600">Produtos Cadastrados</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProdutos}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="ri-box-3-line text-purple-600 text-xl"></i>
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
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  const np = encodeURIComponent(pedido.numero_pedido);
                  navigate(`/paineladmin/vendas/listar?pedido=${np}`);
                }}
                title="Editar venda"
              >
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
                  <p className="text-sm text-gray-600">Com estoque disponível</p>
                </div>
              </div>
              <span className="text-lg font-bold text-gray-900">{businessSummary.produtosAtivos}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${businessSummary.produtosEstoqueBaixo > 0 ? 'bg-yellow-100' : 'bg-green-100'}`}>
                  <i className={`${businessSummary.produtosEstoqueBaixo > 0 ? 'ri-alert-line text-yellow-600' : 'ri-check-line text-green-600'}`}></i>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Estoque Baixo</p>
                  <p className="text-sm text-gray-600">Produtos para repor</p>
                </div>
              </div>
              <span className={`text-lg font-bold ${businessSummary.produtosEstoqueBaixo > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                {businessSummary.produtosEstoqueBaixo}
              </span>
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
              <span className={`text-lg font-bold ${businessSummary.taxaEntrega >= 95 ? 'text-green-600' : businessSummary.taxaEntrega >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                {businessSummary.taxaEntrega.toFixed(1)}%
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <i className="ri-map-pin-line text-purple-600"></i>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Região Principal</p>
                  <p className="text-sm text-gray-600">Maior volume de vendas</p>
                </div>
              </div>
              <span className="text-sm font-bold text-gray-900">{businessSummary.regiaoPrincipal}</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
