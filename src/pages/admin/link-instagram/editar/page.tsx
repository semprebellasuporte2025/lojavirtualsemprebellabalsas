import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../../../components/feature/AdminLayout';
import AdminFormButtons from '../../../../components/feature/AdminFormButtons/AdminFormButtons';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';

interface InstagramLink {
  id: string;
  nome_link: string;
  link: string;
  link_img: string | null;
  img_link: string | null;
  ativo?: boolean;
  created_at?: string;
  ordem_exibicao?: number;
}

export default function EditarLinkInstagramPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState<Partial<InstagramLink>>({
    nome_link: '',
    link: '',
    link_img: '',
    img_link: '',
    ordem_exibicao: 1,
  });
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);

  const bucket = 'imagens-links';

  const parseSupabasePublicUrl = (url: string | null | undefined): { bucket: string; path: string } | null => {
    if (!url) return null;
    // Formato esperado: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (match) {
      const [, bkt, pth] = match;
      return { bucket: bkt, path: decodeURIComponent(pth) };
    }
    return null;
  };

  const handleDeleteImage = async () => {
    if (!id) return;
    const imageUrl = form.link_img || form.img_link;
    if (!imageUrl) {
      showToast('Nenhuma imagem para excluir.', 'info');
      return;
    }

    const parsed = parseSupabasePublicUrl(imageUrl);
    if (!parsed) {
      showToast('Não foi possível determinar o caminho da imagem para exclusão.', 'error');
      return;
    }

    try {
      // 1. Excluir do Storage
      const { error: storageError } = await supabase.storage.from(parsed.bucket).remove([parsed.path]);
      if (storageError && storageError.message !== 'The resource was not found') {
        throw storageError;
      }

      // 2. Limpar campos no banco de dados
      const { error: dbError } = await supabase
        .from('link_instagram')
        .update({ link_img: null, img_link: null })
        .eq('id', id);
      if (dbError) throw dbError;

      // 3. Atualizar estado local
      setForm(prev => ({ ...prev, link_img: null, img_link: null }));
      showToast('Imagem excluída com sucesso!', 'success');

    } catch (error: any) {
      console.error('Erro ao excluir imagem:', error);
      showToast(`Erro ao excluir a imagem: ${error.message}`, 'error');
    }
  };

  useEffect(() => {
    const loadLink = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('link_instagram')
          .select('id, nome_link, link, link_img, img_link, ordem_exibicao')
          .eq('id', id)
          .single();
        if (error) throw error;
        setForm({
          nome_link: data?.nome_link || '',
          link: data?.link || '',
          link_img: data?.link_img || data?.img_link || '',
          img_link: data?.img_link || data?.link_img || '',
          ordem_exibicao: data?.ordem_exibicao ?? 1,
        });
      } catch (err: any) {
        console.error('Erro ao carregar link do Instagram:', err);
        showToast('Erro ao carregar link.', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadLink();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'ordem_exibicao' ? Number(value) : value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!form.nome_link) {
      showToast('Informe o Nome do Link.', 'error');
      return;
    }
    if (!form.link) {
      showToast('Informe o Link de destino.', 'error');
      return;
    }

    setSaving(true);

    try {
      let newPublicUrl: string | null = null;

      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileName = `instagram-links/${Date.now()}-${safeName}`;
        const contentType = imageFile.type || (ext ? `image/${ext}` : 'application/octet-stream');

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, imageFile, { upsert: true, contentType });
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);
        newPublicUrl = publicUrlData.publicUrl;

        // Remover imagem antiga, se houver
        const oldUrl = form.link_img || form.img_link || null;
        const oldParsed = parseSupabasePublicUrl(oldUrl);
        if (oldParsed) {
          await supabase.storage.from(oldParsed.bucket).remove([oldParsed.path]);
        }
      }

      const updatePayload: Partial<InstagramLink> = {
        nome_link: form.nome_link,
        link: form.link,
        ordem_exibicao: form.ordem_exibicao ?? 1,
      };
      if (newPublicUrl) {
        updatePayload.link_img = newPublicUrl;
        updatePayload.img_link = newPublicUrl;
      }

      const { error: updateError } = await supabase
        .from('link_instagram')
        .update(updatePayload)
        .eq('id', id);
      if (updateError) throw updateError;

      showToast('Link atualizado com sucesso.', 'success');
      navigate('/paineladmin/link-instagram/listar');
    } catch (err: any) {
      console.error('Erro ao salvar alterações do link do Instagram:', err);
      showToast('Erro ao salvar alterações. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 text-center">
          <i className="ri-loader-4-line animate-spin text-2xl text-gray-500"></i>
          <p className="mt-2 text-gray-600">Carregando link...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Link Instagram</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Editar Link</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 max-w-2xl">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ordem de exibição</label>
              <input
                type="number"
                name="ordem_exibicao"
                value={form.ordem_exibicao ?? 1}
                onChange={handleChange}
                min={1}
                className="input-field"
                placeholder="1 (menor aparece primeiro)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome do Link</label>
              <input
                type="text"
                name="nome_link"
                value={form.nome_link}
                onChange={handleChange}
                className="input-field"
                placeholder="Ex.: Loja Online"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Link (URL de destino)</label>
              <input
                type="url"
                name="link"
                value={form.link}
                onChange={handleChange}
                className="input-field"
                placeholder="https://sua-url.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Imagem atual</label>
              {form.link_img || form.img_link ? (
                <div>
                  <img src={(form.link_img || form.img_link) as string} alt="Imagem do link" className="w-48 h-48 object-cover rounded-md border mb-2" />
                  <button
                    type="button"
                    onClick={handleDeleteImage}
                    className="px-3 py-1 text-sm font-medium text-red-600 bg-red-100 border border-red-200 rounded-md hover:bg-red-200"
                  >
                    Excluir Imagem
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Nenhuma imagem cadastrada.</p>
              )}
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-4">Substituir imagem</label>
              <input type="file" accept="image/*" onChange={handleFileChange} className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL da Imagem</label>
              <input
                type="url"
                name="link_img"
                value={form.link_img || ''}
                readOnly
                className="input-field"
                placeholder="Atualizado automaticamente após o upload"
              />
            </div>
          </div>

          <AdminFormButtons
            onSave={handleSubmit}
            onBack={() => navigate('/paineladmin/link-instagram/listar')}
            saveText={saving ? 'Salvando...' : 'Salvar Alterações'}
            isSaveDisabled={saving}
          />
        </form>
      </div>
    </AdminLayout>
  );
}