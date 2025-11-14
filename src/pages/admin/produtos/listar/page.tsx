
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../../hooks/useToast';
import { supabase } from '../../../../lib/supabase';
import type { Produto } from '../../../../lib/supabase';
import AdminLayout from '../../../../components/feature/AdminLayout';
import ConfirmationModal from '../../../../components/feature/modal/ConfirmationModal';

export default function ListarProdutosPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [produtoToDelete, setProdutoToDelete] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('produtos')
        .select(`
          *, 
          categorias(nome),
          variantes_produto(
            id,
            tamanho,
            cor,
            cor_hex,
            estoque,
            sku
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProdutos(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      showToast('Erro ao carregar produtos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calcularEstoqueTotal = (produto: any) => {
    if (produto.variantes_produto && produto.variantes_produto.length > 0) {
      return produto.variantes_produto.reduce((total: number, variante: any) => {
        return total + (variante.estoque || 0);
      }, 0);
    }
    return 0;
  };

  const filteredProdutos = produtos.filter(produto => {
    const matchSearch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (produto.variantes_produto && produto.variantes_produto.some(variante => 
                         variante.sku && variante.sku.toLowerCase().includes(searchTerm.toLowerCase())
                       ));
    const matchCategoria = !filterCategoria || produto.categoria_id === filterCategoria;
    const matchStatus = !filterStatus || 
                       (filterStatus === 'ativo' && produto.ativo) ||
                       (filterStatus === 'inativo' && !produto.ativo) ||
                       (filterStatus === 'destaque' && produto.destaque) ||
                       (filterStatus === 'sem-estoque' && calcularEstoqueTotal(produto) === 0);
    return matchSearch && matchCategoria && matchStatus;
  });

  // Paginação (client-side)
  const totalFiltered = filteredProdutos.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  useEffect(() => {
    // Resetar para primeira página quando filtros ou pageSize mudarem
    setCurrentPage(1);
  }, [searchTerm, filterCategoria, filterStatus, pageSize]);
  useEffect(() => {
    // Garantir que a página atual esteja dentro dos limites
    setCurrentPage(prev => Math.min(prev, totalPages));
  }, [totalPages]);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFiltered);
  const paginatedProdutos = filteredProdutos.slice(startIndex, endIndex);

  const handleDelete = (id: string) => {
    setProdutoToDelete(id);
    setShowDeleteModal(true);
  };

  const checkPedidosVinculados = async (produtoId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('itens_pedido')
        .select('*', { count: 'exact', head: true })
        .eq('produto_id', produtoId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Erro ao verificar pedidos vinculados:', error);
      return 0;
    }
  };

  const deleteProdutoCascata = async (produtoId: string): Promise<{ success: boolean; message: string }> => {
    try {
      // 1. Verificar se existem pedidos vinculados
      const pedidosCount = await checkPedidosVinculados(produtoId);
      if (pedidosCount > 0) {
        return {
          success: false,
          message: `Não é possível excluir o produto. Existem ${pedidosCount} pedido(s) vinculado(s) a este produto.`
        };
      }

      // 2. Buscar o produto para obter informações completas
      const { data: produto, error: fetchError } = await supabase
        .from('produtos')
        .select('*')
        .eq('id', produtoId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!produto) {
        return {
          success: false,
          message: 'Produto não encontrado para exclusão.'
        };
      }

      // 3. Excluir imagens do Storage (se houver)
      if (produto && produto.imagens && produto.imagens.length > 0) {
        const fileNames = produto.imagens.map((url: string) => {
          try {
            // Extrair o nome do arquivo da URL completa do Supabase Storage
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            // O caminho completo no storage inclui o bucket e o nome do arquivo
            const storagePath = pathParts.slice(pathParts.indexOf('imagens-produtos') + 1).join('/');
            return storagePath;
          } catch (error) {
            console.warn('URL de imagem inválida:', url);
            // Fallback: extrair apenas o nome do arquivo
            const parts = url.split('/');
            return parts[parts.length - 1];
          }
        }).filter(Boolean);

        if (fileNames.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('imagens-produtos')
            .remove(fileNames);

          if (storageError) {
            console.error('Erro ao excluir imagens do Storage:', storageError);
            // Continuar mesmo com erro no storage
          }
        }
      }

      // 4. Excluir variantes do produto (cascata via FK)
      const { error: variantesError } = await supabase
        .from('variantes_produto')
        .delete()
        .eq('produto_id', produtoId);

      if (variantesError) throw variantesError;

      // 5. Excluir reviews do produto (cascata via FK)
      const { error: reviewsError } = await supabase
        .from('reviews')
        .delete()
        .eq('produto_id', produtoId);

      if (reviewsError) throw reviewsError;

      // 6. Excluir favoritos do produto
      const { error: favoritosError } = await supabase
        .from('favoritos')
        .delete()
        .eq('produto_id', produtoId);

      if (favoritosError) throw favoritosError;

      // 7. Excluir o produto principal
      const { error: deleteError } = await supabase
        .from('produtos')
        .delete()
        .eq('id', produtoId);

      if (deleteError) throw deleteError;

      return { success: true, message: 'Produto excluído com sucesso!' };

    } catch (error) {
      console.error('Erro na exclusão em cascata:', error);
      return {
        success: false,
        message: 'Erro ao excluir produto. A operação foi revertida para evitar inconsistências.'
      };
    }
  };

  const confirmDelete = async () => {
    if (produtoToDelete) {
      try {
        setIsLoading(true);
        
        const resultado = await deleteProdutoCascata(produtoToDelete);
        
        if (resultado.success) {
          setProdutos(produtos.filter(p => p.id !== produtoToDelete));
          showToast(resultado.message, 'success');
        } else {
          showToast(resultado.message, 'error');
        }
      } catch (error) {
        console.error('Erro inesperado:', error);
        showToast('Erro inesperado ao processar a exclusão', 'error');
      } finally {
        setShowDeleteModal(false);
        setProdutoToDelete(null);
        setIsLoading(false);
      }
    }
  };

  const toggleStatus = async (id: string, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from('produtos')
        .update({ ativo: !ativo })
        .eq('id', id);

      if (error) throw error;

      setProdutos(produtos.map(p => 
        p.id === id ? { ...p, ativo: !ativo } : p
      ));
      showToast('Status alterado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      showToast('Erro ao alterar status', 'error');
    }
  };

  const handleRowClick = (id: string) => {
    navigate(`/produto/${id}`);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <i className="ri-loader-4-line text-5xl text-pink-600 animate-spin"></i>
            <p className="mt-4 text-gray-600">Carregando produtos...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <ConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        body="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita. Atenção: Esta operação irá excluir o produto do banco de dados, todas as imagens associadas do storage, variações de cores e tamanhos, e avaliações e favoritos do produto. A exclusão será bloqueada automaticamente se existirem pedidos vinculados a este produto."
        confirmText={isLoading ? "Excluindo..." : "Confirmar Exclusão"}
        cancelText="Cancelar"
        variant="danger"
        isLoading={isLoading}
      />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Produtos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie o catálogo de produtos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/paineladmin/produtos/cadastrar')}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors whitespace-nowrap"
          >
            <i className="ri-add-line mr-2"></i>
            Novo Produto
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                viewMode === 'table' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Modo Lista"
            >
              <i className="ri-table-2 mr-1"></i>
              Lista
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                viewMode === 'grid' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Modo Grade"
            >
              <i className="ri-grid-line mr-1"></i>
              Grade
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-2">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Buscar por nome ou SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="relative">
            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="w-full px-4 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white appearance-none cursor-pointer"
            >
              <option value="">Todas Categorias</option>
              <option value="Vestidos">Vestidos</option>
              <option value="Blusas">Blusas</option>
              <option value="Calças">Calças</option>
              <option value="Acessórios">Acessórios</option>
            </select>
            <i className="ri-arrow-down-s-line absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
          </div>

          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white appearance-none cursor-pointer"
            >
              <option value="">Todos Status</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
              <option value="destaque">Em Destaque</option>
              <option value="sem-estoque">Sem Estoque</option>
            </select>
            <i className="ri-arrow-down-s-line absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
          </div>
        </div>

        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Produto</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">SKU</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Categoria</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Preço</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Estoque</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProdutos.map((produto) => (
                  <tr 
                    key={produto.id} 
                    onClick={() => handleRowClick(produto.id)}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={produto.imagens?.[0] || '/placeholder-small.svg'} 
                          alt={produto.nome} 
                          className="w-12 h-12 object-cover rounded" 
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{produto.nome}</p>
                          {produto.destaque && (
                            <span className="text-xs text-yellow-600 dark:text-yellow-400">
                              <i className="ri-star-fill mr-1"></i>Destaque
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {produto.variantes_produto && produto.variantes_produto.length > 0 ? (
                        <div className="space-y-1">
                          {produto.variantes_produto?.map((variante, index) => (
                            <div key={variante.id} className="text-xs">
                              {variante.sku || '-'}
                              {index < (produto.variantes_produto?.length || 0) - 1 && (produto.variantes_produto?.length || 0) > 1 && (
                                <span className="text-gray-400"> | </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {produto.categorias?.nome || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        {produto.preco_promocional ? (
                          <>
                            <p className="text-gray-400 line-through text-xs">R$ {produto.preco.toFixed(2)}</p>
                            <p className="text-pink-600 font-semibold">R$ {produto.preco_promocional.toFixed(2)}</p>
                          </>
                        ) : (
                          <p className="text-gray-800 dark:text-gray-200 font-semibold">R$ {produto.preco.toFixed(2)}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-sm font-medium ${calcularEstoqueTotal(produto) === 0 ? 'text-red-600' : calcularEstoqueTotal(produto) < 50 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {calcularEstoqueTotal(produto)} un.
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStatus(produto.id, produto.ativo);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer ${
                          produto.ativo
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {produto.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/produto/${produto.slug || produto.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-gray-500 hover:text-gray-700"
                          title="Ver"
                        >
                          <i className="ri-eye-line"></i>
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/paineladmin/produtos/editar/${produto.id}`);
                          }}
                          className="text-blue-500 hover:text-blue-700"
                          title="Editar"
                        >
                          <i className="ri-pencil-line"></i>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(produto.id);
                          }}
                          className="text-red-500 hover:text-red-700"
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

            {paginatedProdutos.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <i className="ri-shopping-bag-line text-5xl mb-3"></i>
                <p className="text-lg">Nenhum produto encontrado</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedProdutos.map((produto) => (
              <div
                key={produto.id}
                className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-shadow"
              >
                <img
                  src={produto.imagens?.[0] || '/placeholder-product.svg'}
                  alt={produto.nome}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{produto.nome}</h3>
                    <button
                      onClick={() => toggleStatus(produto.id, produto.ativo)}
                      className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        produto.ativo
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {produto.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{produto.categorias?.nome || '-'}</p>
                  <p className="text-lg font-bold text-pink-600 dark:text-pink-400">R$ {produto.preco.toFixed(2)}</p>
                  <div className="flex justify-end gap-2 mt-4">
                        <a
                          href={`/produto/${produto.slug || produto.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-gray-500 hover:text-gray-700"
                          title="Ver"
                        >
                          <i className="ri-eye-line"></i>
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/paineladmin/produtos/editar/${produto.id}`);
                          }}
                          className="text-blue-500 hover:text-blue-700"
                          title="Editar"
                        >
                          <i className="ri-pencil-line"></i>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(produto.id);
                          }}
                          className="text-red-500 hover:text-red-700"
                          title="Excluir"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                </div>
              </div>
            ))}

            {paginatedProdutos.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400 col-span-full">
                <i className="ri-shopping-bag-line text-5xl mb-3"></i>
                <p className="text-lg">Nenhum produto encontrado</p>
              </div>
            )}
          </div>
        )}

        {/* Controles de paginação */}
        <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-gray-600 dark:text-gray-400">
          <p>
            Mostrando {totalFiltered === 0 ? 0 : startIndex + 1}
            –{endIndex} de {totalFiltered} produtos
          </p>
          {totalFiltered > 20 && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
                  className="px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white appearance-none cursor-pointer"
                >
                  <option value={20}>20 por página</option>
                  <option value={50}>50 por página</option>
                  <option value={100}>100 por página</option>
                </select>
                <i className="ri-arrow-down-s-line absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-white'
                  }`}
                  title="Anterior"
                >
                  <i className="ri-arrow-left-s-line mr-1"></i>
                  Anterior
                </button>
                <span className="px-2">Página {currentPage} de {totalPages}</span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-white'
                  }`}
                  title="Próxima"
                >
                  Próxima
                  <i className="ri-arrow-right-s-line ml-1"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
