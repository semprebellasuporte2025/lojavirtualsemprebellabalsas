import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../../hooks/useToast';
import Toast from '../../../../components/base/Toast';
import { supabaseWithAuth } from '../../../../lib/supabaseAuth';
import type { Categoria } from '../../../../lib/supabase';
import AdminLayout from '../../../../components/feature/AdminLayout';
import ConfirmationModal from '../../../../components/feature/modal/ConfirmationModal';

export default function ListarCategoriasPage() {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoriaToDelete, setCategoriaToDelete] = useState<string | null>(null);

  useEffect(() => {
    carregarCategorias();
  }, []);

  const carregarCategorias = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseWithAuth
        .from('categorias')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCategorias(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      showToast('Erro ao carregar categorias', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategorias = categorias.filter(cat =>
    cat.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cat.descricao && cat.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleStatus = async (id: string, ativa: boolean) => {
    try {
      const { error } = await supabaseWithAuth
        .from('categorias')
        .update({ ativa: !ativa })
        .eq('id', id);

      if (error) throw error;

      setCategorias(categorias.map(c => 
        c.id === id ? { ...c, ativa: !ativa } : c
      ));
      showToast('Status alterado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      showToast('Erro ao alterar status', 'error');
    }
  };

  const handleRowClick = (nome: string) => {
    navigate(`/categoria/${encodeURIComponent(nome)}`);
  };

  const handleDelete = (id: string) => {
    setCategoriaToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (categoriaToDelete) {
      try {
        const { error } = await supabaseWithAuth.rpc('delete_category_cascade', {
          category_id_to_delete: categoriaToDelete
        });

        if (error) throw error;

        setCategorias(categorias.filter(c => c.id !== categoriaToDelete));
        showToast('Categoria e produtos associados excluídos com sucesso!', 'success');
      } catch (error) {
        console.error('Erro ao excluir categoria:', error);
        showToast('Erro ao excluir categoria', 'error');
      } finally {
        setShowDeleteModal(false);
        setCategoriaToDelete(null);
      }
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <i className="ri-loader-4-line text-5xl text-pink-600 animate-spin"></i>
            <p className="mt-4 text-gray-600">Carregando categorias...</p>
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
        body="Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita."
      />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Categorias</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie as categorias de produtos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/paineladmin/categorias/cadastrar')}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors whitespace-nowrap"
          >
            <i className="ri-add-line mr-2"></i>
            Nova Categoria
          </button>
          <div className="flex items-center gap-2">
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
        <div className="mb-4">
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Buscar categorias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Categoria</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Descrição</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategorias.map((categoria) => (
                  <tr
                    key={categoria.id}
                    onClick={() => handleRowClick(categoria.nome)}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={categoria.imagem_url || '/placeholder-small.svg'}
                          alt={categoria.nome}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{categoria.nome}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{categoria.descricao || '-'}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStatus(categoria.id, categoria.ativa);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer ${
                          categoria.ativa
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {categoria.ativa ? 'Ativa' : 'Inativa'}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/categoria/${encodeURIComponent(categoria.nome)}`, '_blank');
                          }}
                          className="text-gray-500 hover:text-gray-700"
                          title="Ver"
                        >
                          <i className="ri-eye-line"></i>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/paineladmin/categorias/editar/${categoria.id}`);
                          }}
                          className="text-blue-500 hover:text-blue-700"
                          title="Editar"
                        >
                          <i className="ri-pencil-line"></i>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(categoria.id);
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
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCategorias.map((categoria) => (
              <div key={categoria.id} className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-shadow">
                <img
                  src={categoria.imagem_url || '/placeholder-category.svg'}
                  alt={categoria.nome}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{categoria.nome}</h3>
                    <button
                      onClick={() => toggleStatus(categoria.id, categoria.ativa)}
                      className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer ${
                        categoria.ativa
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {categoria.ativa ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {categoria.descricao || 'Sem descrição'}
                  </p>
                  <div className="flex justify-end gap-2 mt-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/categoria/${encodeURIComponent(categoria.nome)}`, '_blank');
                          }}
                          className="text-gray-500 hover:text-gray-700"
                          title="Ver"
                        >
                          <i className="ri-eye-line"></i>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/paineladmin/categorias/editar/${categoria.id}`);
                          }}
                          className="text-blue-500 hover:text-blue-700"
                          title="Editar"
                        >
                          <i className="ri-pencil-line"></i>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(categoria.id);
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
          </div>
        )}

        {filteredCategorias.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <i className="ri-folder-line text-5xl mb-3"></i>
            <p className="text-lg">Nenhuma categoria encontrada</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
