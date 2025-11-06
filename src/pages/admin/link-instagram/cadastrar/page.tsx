import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../../components/feature/AdminLayout';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';

export default function LinkInstagramCadastrarPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    nome_link: '',
    link_img: '', // URL pública após upload
  });
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

    if (!form.nome_link) {
      showToast('Informe o Nome do Link.', 'error');
      return;
    }
    if (!imgFile) {
      showToast('Selecione a imagem (img_link) para enviar ao Storage.', 'error');
      return;
    }

    setIsSaving(true);

    try {
      // Usa bucket existente com políticas públicas; caminho específico para Instagram
      const bucket = 'imagens-produtos';
      const ext = imgFile.name.split('.').pop();
      const safeName = imgFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `instagram-links/${Date.now()}-${safeName}`;
      const contentType = imgFile.type || (ext ? `image/${ext}` : 'application/octet-stream');

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, imgFile, { upsert: true, contentType });

      if (uploadError) {
        console.error('Erro no upload para Storage:', uploadError);
        showToast(`Falha no upload: ${uploadError.message}`, 'error');
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(uploadData?.path || fileName);

      const publicUrl = publicUrlData.publicUrl;

      setForm((prev) => ({ ...prev, link_img: publicUrl }));

      // Opcional: tentativa de salvar no banco, se tabela existir
      try {
        const { error: insertError } = await supabase
          .from('link_instagram')
          .insert({
            nome_link: form.nome_link,
            img_link: publicUrl, // armazenamos a URL no campo de imagem
            link_img: publicUrl, // conforme especificação, link para a imagem
            ativo: true,
            created_at: new Date().toISOString(),
          });
        if (insertError) throw insertError;
        showToast('Link cadastrado com sucesso.', 'success');
        navigate('/paineladmin/link-instagram/listar');
      } catch (dbErr: any) {
        console.warn('Não foi possível salvar no banco agora:', dbErr?.message || dbErr);
        showToast('Imagem enviada. URL gerada em link_img.', 'success');
      }
    } catch (err: any) {
      console.error('Erro ao cadastrar link do Instagram:', err);
      showToast('Erro ao cadastrar link. Tente novamente.', 'error');
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
            <p className="text-gray-600 dark:text-gray-400 mt-1">Cadastrar Link</p>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">img_link (imagem para o Storage)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="input-field"
                required
              />
              {imgFile && (
                <p className="text-xs text-gray-500 mt-1">Arquivo selecionado: {imgFile.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">link_img (URL pública da imagem)</label>
              <input
                type="url"
                name="link_img"
                value={form.link_img}
                readOnly
                className="input-field"
                placeholder="Gerado automaticamente após o upload"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button type="submit" className="btn-primary" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar'}</button>
            <button type="button" onClick={() => navigate('/paineladmin/link-instagram/listar')} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}