'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { logBanner } from '../../../lib/logger';
import AdminLayout from '../../../components/feature/AdminLayout';

interface Banner {
  id: string;
  titulo: string;
  subtitulo: string | null;
  imagem_url: string;
  link_destino: string | null;
  ordem_exibicao: number;
  ativo: boolean;
  created_at: string;
}

export default function GerenciarBanners() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('ordem_exibicao', { ascending: true });

      if (error) {
        logBanner('error', 'Admin: erro ao buscar banners', error);
        alert('Erro ao carregar banners.');
        return;
      }

      setBanners(data || []);
      logBanner('info', 'Admin: banners carregados', { count: (data || []).length });
    } catch (error) {
      logBanner('error', 'Admin: erro inesperado ao carregar', error);
      alert('Erro inesperado ao carregar banners.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('banners')
        .update({ ativo: !currentStatus })
        .eq('id', id);

      if (error) {
        logBanner('error', 'Admin: erro ao atualizar status', error);
        alert('Erro ao atualizar status do banner.');
        return;
      }

      // Atualizar estado local
      setBanners(banners.map(banner => 
        banner.id === id ? { ...banner, ativo: !currentStatus } : banner
      ));
      logBanner('info', 'Admin: status atualizado', { id, ativo: !currentStatus });
    } catch (error) {
      logBanner('error', 'Admin: erro inesperado ao atualizar status', error);
      alert('Erro inesperado ao atualizar status.');
    }
  };

  const handleDelete = async (id: string, imagemUrl: string) => {
    if (!confirm('Tem certeza que deseja excluir este banner?')) {
      return;
    }

    setDeleting(id);

    try {
      // Extrair caminho da imagem da URL
      const urlParts = imagemUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `banners/${fileName}`;

      // Excluir imagem do Storage
      const { error: storageError } = await supabase.storage
        .from('banners')
        .remove([filePath]);

      if (storageError) {
        logBanner('warn', 'Admin: erro ao excluir imagem do storage', storageError);
        // Continuar mesmo se houver erro no storage
      }

      // Excluir banner do banco
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);

      if (error) {
        logBanner('error', 'Admin: erro ao excluir banner', error);
        alert('Erro ao excluir banner.');
        return;
      }

      // Atualizar estado local
      setBanners(banners.filter(banner => banner.id !== id));
      alert('Banner excluído com sucesso!');
      logBanner('info', 'Admin: banner excluído', { id, imagemUrl });
    } catch (error) {
      logBanner('error', 'Admin: erro inesperado ao excluir', error);
      alert('Erro inesperado ao excluir banner.');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600 dark:text-gray-400">Carregando banners...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gerenciar Banners</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie os banners da sua loja
            </p>
          </div>
          <button
            onClick={() => navigate('/paineladmin/banners/cadastrar')}
            className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <i className="ri-add-line"></i>
            Novo Banner
          </button>
        </div>

        {banners.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <i className="ri-image-line text-6xl text-gray-400 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
              Nenhum banner cadastrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Comece criando seu primeiro banner para a loja.
            </p>
            <button
              onClick={() => navigate('/paineladmin/banners/cadastrar')}
              className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Criar Primeiro Banner
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <div key={banner.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="relative">
                  <img
                    src={banner.imagem_url}
                    alt={banner.titulo || 'Banner'}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      banner.ativo 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {banner.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className="absolute top-2 left-2">
                    <span className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      Ordem: {banner.ordem_exibicao}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-1">
                    {banner.titulo || 'Sem título'}
                  </h3>
                  {banner.subtitulo && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {banner.subtitulo}
                    </p>
                  )}
                  {banner.link_destino && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-3 truncate">
                      {banner.link_destino}
                    </p>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleStatus(banner.id, banner.ativo)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          banner.ativo
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
                        }`}
                      >
                        {banner.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                    </div>

                    <button
                      onClick={() => handleDelete(banner.id, banner.imagem_url)}
                      disabled={deleting === banner.id}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50"
                    >
                      {deleting === banner.id ? (
                        <i className="ri-loader-4-line animate-spin"></i>
                      ) : (
                        <i className="ri-delete-bin-line"></i>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}