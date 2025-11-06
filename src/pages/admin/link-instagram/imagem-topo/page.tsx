import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../../components/feature/AdminLayout';
import AdminFormButtons from '../../../../components/feature/AdminFormButtons/AdminFormButtons';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';

export default function LinkInstagramImagemTopoCadastrarPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    linktopo_img_: '',
    descricao_topo: '',
  });
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreviewUrl, setImgPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const bucket = 'imagens-produtos';

  const sanitizeFileName = (name: string) => {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^\.+/, '')
      .toLowerCase();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    // Limpa URL anterior, se houver
    if (imgPreviewUrl) {
      URL.revokeObjectURL(imgPreviewUrl);
    }
    setImgFile(file);
    setImgPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleRemoveImage = () => {
    if (imgPreviewUrl) {
      URL.revokeObjectURL(imgPreviewUrl);
    }
    setImgFile(null);
    setImgPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    // Cleanup quando o componente desmontar ou a URL mudar
    return () => {
      if (imgPreviewUrl) {
        URL.revokeObjectURL(imgPreviewUrl);
      }
    };
  }, [imgPreviewUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);

    try {
      if (!imgFile) {
        showToast('Selecione a imagem do topo.', 'error');
        return;
      }

      const safeName = sanitizeFileName(imgFile.name);
      const filename = `${Date.now()}-${safeName}`;
      const storagePath = `instagram-topo/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, imgFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: imgFile.type,
        });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);
      const publicUrl = publicUrlData.publicUrl;

      const { error: insertError } = await supabase
        .from('link_instagram')
        .insert({
          nome_link: 'Imagem Topo', // Campo obrigatório
          img_topo: publicUrl,
          linktopo_img_: form.linktopo_img_,
          descricao_topo: form.descricao_topo,
        });
      if (insertError) throw insertError;

      // Exibe toast de sucesso e redireciona para a listagem
      showToast('Imagem topo cadastrada com sucesso.', 'success');
      navigate('/paineladmin/link-instagram/listar');
    } catch (err: any) {
      console.error('Erro ao cadastrar imagem topo:', err);
      showToast('Erro ao cadastrar imagem topo. Tente novamente.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Link Instagram</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Imagem Topo</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 max-w-2xl">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Imagem Topo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="input-field"
                ref={fileInputRef}
                required
              />
              {imgPreviewUrl && (
                <div className="mt-2">
                  <img
                    src={imgPreviewUrl}
                    alt="Preview da imagem topo"
                    className="w-32 h-32 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="mt-2 inline-flex items-center px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm"
                    disabled={isSaving}
                  >
                    Remover imagem
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">linktopo_img_ (URL de destino ao clicar)</label>
              <input
                type="url"
                name="linktopo_img_"
                value={form.linktopo_img_}
                onChange={handleChange}
                className="input-field"
                placeholder="https://exemplo.com/"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descrição_topo</label>
              <textarea
                name="descricao_topo"
                value={form.descricao_topo}
                onChange={handleChange}
                className="input-field"
                rows={3}
                placeholder="Descrição opcional da imagem topo"
              />
            </div>
          </div>

          <AdminFormButtons
            onSave={handleSubmit}
            onBack={() => navigate('/paineladmin/link-instagram/listar')}
            saveText={isSaving ? 'Salvando...' : 'Salvar Imagem Topo'}
            isSaveDisabled={isSaving}
          />
        </form>
      </div>
    </AdminLayout>
  );
}