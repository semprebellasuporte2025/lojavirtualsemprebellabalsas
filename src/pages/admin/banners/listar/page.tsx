
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/feature/AdminLayout';
import { useToast } from '@/hooks/useToast';
import ConfirmationModal from '@/components/feature/modal/ConfirmationModal';

interface Banner {
  id: string;
  titulo: string;
  subtitulo: string;
  imagem_url: string;
  imagem_url_mobile?: string | null;
  link_destino: string;
  ordem_exibicao: number;
  ativo: boolean;
}

export default function ListarBannersPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase
          .from('banners')
          .select('*')
          .order('ordem_exibicao', { ascending: true });

        if (error) {
          console.error('Erro ao buscar banners:', error);
          showToast('error', 'Erro ao carregar banners');
        } else {
          setBanners(data || []);
        }
      } catch (error) {
        console.error('Erro inesperado:', error);
        showToast('error', 'Erro inesperado ao carregar banners');
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [showToast]);

  const filteredBanners = banners.filter(banner =>
    banner.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (banner.subtitulo && banner.subtitulo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = (id: string) => {
    setBannerToDelete(id);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (!bannerToDelete) return;

    try {
      // 1. Get image_url from the banner to be deleted
      const { data: bannerData, error: fetchError } = await supabase
        .from('banners')
        .select('imagem_url')
        .eq('id', bannerToDelete)
        .single();

      if (fetchError) {
        throw new Error(`Erro ao buscar banner para exclusão: ${fetchError.message}`);
      }

      // 2. Delete the banner record from the database
      const { error: deleteBannerError } = await supabase
        .from('banners')
        .delete()
        .eq('id', bannerToDelete);

      if (deleteBannerError) {
        throw new Error(`Erro ao excluir banner do banco de dados: ${deleteBannerError.message}`);
      }

      // 3. If database deletion is successful, delete the image from storage
      if (bannerData?.imagem_url) {
        const fileName = bannerData.imagem_url.split('/').pop();
        if (fileName) {
          const { error: deleteImageError } = await supabase.storage
            .from('banners')
            .remove([`public/${fileName}`]);

          if (deleteImageError) {
            // Log the image deletion error but don't block the success message
            // as the main record is already deleted.
            console.error('Erro ao excluir a imagem do storage, mas o banner foi removido do banco de dados:', deleteImageError);
            showToast('warning', 'O banner foi excluído, mas houve um erro ao remover o arquivo de imagem.');
          }
        }
      }

      setBanners(banners.filter((banner) => banner.id !== bannerToDelete));
      showToast('success', 'Banner excluído com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir o banner:', error.message);
      showToast('error', `Erro ao excluir o banner: ${error.message}`);
    } finally {
      setShowModal(false);
      setBannerToDelete(null);
    }
  };

  const toggleStatus = async (id: string, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from('banners')
        .update({ ativo: !ativo })
        .eq('id', id);

      if (error) {
        console.error('Erro ao alterar status:', error);
        showToast('error', 'Erro ao alterar status');
      } else {
        setBanners(banners.map(banner =>
          banner.id === id ? { ...banner, ativo: !banner.ativo } : banner
        ));
        showToast('success', 'Status alterado com sucesso!');
      }
    } catch (error) {
      console.error('Erro inesperado:', error);
      showToast('error', 'Erro inesperado ao alterar status');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 text-center">
          <p>Carregando banners...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Banners</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie os banners da loja</p>
          </div>
          <button
            onClick={() => navigate('/paineladmin/banners/cadastrar')}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors whitespace-nowrap"
          >
            <i className="ri-add-line mr-2"></i>
            Novo Banner
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="mb-4">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Buscar banners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Imagem</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Título</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Subtítulo</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Ordem</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredBanners.map((banner) => (
                  <tr key={banner.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-4">
                      <img src={banner.imagem_url} alt={banner.titulo || 'Banner'} className="w-24 h-16 object-cover rounded" />
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">{banner.titulo || 'Sem título'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{banner.subtitulo}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{banner.ordem_exibicao}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${
                          banner.ativo
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                        onClick={() => toggleStatus(banner.id, banner.ativo)}
                      >
                        {banner.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/paineladmin/banners/editar/${banner.id}`)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                          title="Editar"
                        >
                          <i className="ri-pencil-line"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1"
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

            {filteredBanners.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <i className="ri-image-line text-4xl mb-2"></i>
                <p>Nenhum banner encontrado</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <ConfirmationModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        body="Tem certeza que deseja excluir este banner?"
      />
    </AdminLayout>
  );
}
