
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../../hooks/useToast';
import Toast from '../../../../components/base/Toast';
import { supabase, Produto } from '../../../../lib/supabase';
import AdminLayout from '../../../../components/feature/AdminLayout';
import ConfirmationModal from '../../../../components/feature/modal/ConfirmationModal';

export default function ListarProdutosPage() {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [produtoToDelete, setProdutoToDelete] = useState<string | null>(null);

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('produtos')
        .select('*, categorias(nome)')
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

  const filteredProdutos = produtos.filter(produto => {
    const matchSearch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (produto.sku && produto.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCategoria = !filterCategoria || produto.categoria_id === filterCategoria;
    const matchStatus = !filterStatus || 
                       (filterStatus === 'ativo' && produto.ativo) ||
                       (filterStatus === 'inativo' && !produto.ativo) ||
                       (filterStatus === 'destaque' && produto.destaque) ||
                       (filterStatus === 'sem-estoque' && produto.estoque === 0);
    return matchSearch && matchCategoria && matchStatus;
  });

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
      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
      <ConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        body={
          <div>
            <p className="mb-3">Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
              <i className="ri-error-warning-line mr-1"></i>
              <strong>Atenção:</strong> Esta operação irá excluir:
              <ul className="mt-1 ml-4 list-disc">
                <li>O produto do banco de dados</li>
                <li>Todas as imagens associadas do storage</li>
                <li>Variações de cores e tamanhos</li>
                <li>Avaliações e favoritos do produto</li>
              </ul>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              A exclusão será bloqueada automaticamente se existirem pedidos vinculados a este produto.
            </p>
          </div>
        }
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
                {filteredProdutos.map((produto) => (
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
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{produto.sku || '-'}</td>
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
                      <span className={`text-sm font-medium ${produto.estoque === 0 ? 'text-red-600' : produto.estoque < 50 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {produto.estoque} un.
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
                          href={`/produto/${produto.id}`}
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

            {filteredProdutos.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <i className="ri-shopping-bag-line text-5xl mb-3"></i>
                <p className="text-lg">Nenhum produto encontrado</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProdutos.map((produto) => (
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
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{produto.categorias.nome}</p>
                  <p className="text-lg font-bold text-pink-600 dark:text-pink-400">R$ {produto.preco.toFixed(2)}</p>
                  <div className="flex justify-end gap-2 mt-4">
                        <a
                          href={`/produto/${produto.id}`}
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

            {filteredProdutos.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400 col-span-full">
                <i className="ri-shopping-bag-line text-5xl mb-3"></i>
                <p className="text-lg">Nenhum produto encontrado</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
          <p>Mostrando {filteredProdutos.length} de {produtos.length} produtos</p>
        </div>
      </div>
    </AdminLayout>
  );
}
