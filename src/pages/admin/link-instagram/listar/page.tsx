import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../../components/feature/AdminLayout';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import ConfirmationModal from '@/components/feature/modal/ConfirmationModal';

export default function LinkInstagramListarPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  interface InstagramLink {
    id: string;
    nome_link: string;
    link_img: string | null;
    img_link: string | null;
    ativo?: boolean;
    created_at?: string;
    ordem_exibicao?: number;
  }

  const [links, setLinks] = useState<InstagramLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);

  const bucket = 'imagens-produtos';

  const storagePathFromPublicUrl = (url: string | null | undefined) => {
    if (!url) return null;
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.substring(idx + marker.length);
  };

  useEffect(() => {
    const loadLinks = async () => {
      try {
        const { data, error } = await supabase
          .from('link_instagram')
          .select('id, nome_link, link_img, img_link, ativo, created_at, ordem_exibicao')
          .order('ordem_exibicao', { ascending: true })
          .order('created_at', { ascending: false });
        if (error) throw error;
        setLinks(data || []);
      } catch (err: any) {
        console.error('Erro ao carregar links do Instagram:', err);
        showToast('Erro ao carregar links.', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadLinks();
  }, []);

  const handleOrderChange = (id: string, value: number) => {
    setLinks(prev => prev.map(l => l.id === id ? { ...l, ordem_exibicao: value } : l));
  };

  const saveOrder = async (id: string) => {
    const link = links.find(l => l.id === id);
    if (!link) return;
    const newOrder = Number(link.ordem_exibicao) || 1;
    try {
      const { error } = await supabase
        .from('link_instagram')
        .update({ ordem_exibicao: newOrder })
        .eq('id', id);
      if (error) throw error;
      showToast('Ordem atualizada.', 'success');
      // Reordenar localmente
      setLinks(prev => [...prev].sort((a, b) => (a.ordem_exibicao ?? 0) - (b.ordem_exibicao ?? 0)));
    } catch (err: any) {
      console.error('Erro ao atualizar ordem:', err);
      showToast('Erro ao atualizar ordem.', 'error');
    }
  };

  const handleDelete = (id: string) => {
    setLinkToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!linkToDelete) return;
    try {
      // Buscar URL da imagem para exclusão do storage
      const { data: linkData, error: fetchError } = await supabase
        .from('link_instagram')
        .select('link_img, img_link')
        .eq('id', linkToDelete)
        .single();
      if (fetchError) throw fetchError;

      // Excluir o registro do banco
      const { error: dbError } = await supabase
        .from('link_instagram')
        .delete()
        .eq('id', linkToDelete);
      if (dbError) throw dbError;

      // Excluir imagem do storage (se existir)
      const imageUrl = linkData?.link_img || linkData?.img_link || null;
      const storagePath = storagePathFromPublicUrl(imageUrl);
      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from(bucket)
          .remove([storagePath]);
        if (storageError) {
          console.warn('Erro ao remover imagem do storage (link removido do banco):', storageError);
        }
      }

      setLinks((prev) => prev.filter((l) => l.id !== linkToDelete));
      showToast('Link removido com sucesso.', 'success');
    } catch (err: any) {
      console.error('Erro ao excluir link Instagram:', err);
      showToast('Erro ao excluir link. Tente novamente.', 'error');
    } finally {
      setShowDeleteModal(false);
      setLinkToDelete(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Link Instagram</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Listar Links</p>
          </div>
          <button
            onClick={() => navigate('/paineladmin/link-instagram/cadastrar')}
            className="btn-primary whitespace-nowrap"
          >
            Cadastrar Link
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
               <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Imagem</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordem</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      <i className="ri-loader-4-line animate-spin text-xl"></i>
                      <span className="ml-2">Carregando links...</span>
                    </td>
                  </tr>
                ) : links.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      <i className="ri-links-line text-2xl"></i>
                      <span className="ml-2">Nenhum link cadastrado</span>
                    </td>
                  </tr>
                ) : (
                  links.map((link) => (
                    <tr key={link.id}>
                      <td className="px-4 py-3">
                        <img
                          src={(link.link_img || link.img_link || '/placeholder-small.svg') as string}
                          alt={link.nome_link}
                          className="w-12 h-12 rounded object-cover border"
                        />
                      </td>
                      <td className="px-4 py-3 w-24">
                        <input
                          type="number"
                          min={1}
                          value={link.ordem_exibicao ?? 1}
                          onChange={(e) => handleOrderChange(link.id, Number(e.target.value))}
                          onBlur={() => saveOrder(link.id)}
                          className="input-field"
                          aria-label="Ordem de exibição"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{link.nome_link}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 break-all">{link.link_img || link.img_link || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => navigate(`/paineladmin/link-instagram/editar/${link.id}`)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                            title="Editar"
                          >
                            <i className="ri-pencil-line text-xl"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(link.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1"
                            title="Remover"
                          >
                            <i className="ri-delete-bin-line text-xl"></i>
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

        <ConfirmationModal
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          title="Confirmar Exclusão"
          body="Tem certeza que deseja excluir este link do Instagram?"
        />
      </div>
    </AdminLayout>
  );
}