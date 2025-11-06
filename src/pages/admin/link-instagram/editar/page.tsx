import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../../../components/feature/AdminLayout';
import AdminFormButtons from '../../../../components/feature/AdminFormButtons/AdminFormButtons';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';

interface InstagramLink {
  id: string;
  nome_link: string;
  link_img: string | null;
  img_link: string | null;
  ativo?: boolean;
  created_at?: string;
}

export default function EditarLinkInstagramPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Pick<InstagramLink, 'nome_link' | 'link_img' | 'img_link'>>({
    nome_link: '',
    link_img: '',
    img_link: '',
  });
  const [imgFile, setImgFile] = useState<File | null>(null);

  const bucket = 'imagens-produtos';

  const storagePathFromPublicUrl = (url: string | null | undefined) => {
    if (!url) return null;
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.substring(idx + marker.length);
  };

  useEffect(() => {
    const loadLink = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('link_instagram')
          .select('id, nome_link, link_img, img_link')
          .eq('id', id)
          .single();
        if (error) throw error;
        setForm({
          nome_link: data?.nome_link || '',
          link_img: data?.link_img || data?.img_link || '',
          img_link: data?.img_link || data?.link_img || '',
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
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImgFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!form.nome_link) {
      showToast('Informe o Nome do Link.', 'error');
      return;
    }

    setSaving(true);

    try {
      let newPublicUrl: string | null = null;

      if (imgFile) {
        const ext = imgFile.name.split('.').pop();
        const safeName = imgFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileName = `instagram-links/${Date.now()}-${safeName}`;
        const contentType = imgFile.type || (ext ? `image/${ext}` : 'application/octet-stream');

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, imgFile, { upsert: true, contentType });
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);
        newPublicUrl = publicUrlData.publicUrl;

        // Remover imagem antiga, se houver
        const oldUrl = form.link_img || form.img_link || null;
        const oldPath = storagePathFromPublicUrl(oldUrl);
        if (oldPath) {
          await supabase.storage.from(bucket).remove([oldPath]);
        }
      }

      const updatePayload: Partial<InstagramLink> = {
        nome_link: form.nome_link,
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Imagem atual</label>
              {form.link_img || form.img_link ? (
                <img src={(form.link_img || form.img_link) as string} alt="Imagem do link" className="w-48 h-48 object-cover rounded-md border mb-3" />
              ) : (
                <p className="text-sm text-gray-500">Nenhuma imagem cadastrada.</p>
              )}
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-2">Substituir imagem</label>
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