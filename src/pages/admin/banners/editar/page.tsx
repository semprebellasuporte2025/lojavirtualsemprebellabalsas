import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { supabaseWithAuth } from '../../../../lib/supabaseAuth';
import AdminLayout from '../../../../components/feature/AdminLayout';
import AdminFormButtons from '../../../../components/feature/AdminFormButtons/AdminFormButtons';

interface Banner {
  id: string;
  titulo: string;
  subtitulo: string | null;
  imagem_url: string;
  imagem_url_mobile?: string | null;
  link_destino: string | null;
  texto_botao: string | null;
  ordem_exibicao: number;
  ativo: boolean;
}

export default function AdminBannersEditarPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Omit<Banner, 'id'>>({
    titulo: '',
    subtitulo: '',
    imagem_url: '',
    imagem_url_mobile: '',
    link_destino: '',
    texto_botao: '',
    ordem_exibicao: 0,
    ativo: true,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewMobile, setImagePreviewMobile] = useState<string | null>(null);
  const [imageFileMobile, setImageFileMobile] = useState<File | null>(null);

  // Utilitário: extrai a chave do objeto no Storage a partir da URL pública
  const getStorageKeyFromPublicUrl = (url: string): string | null => {
    try {
      const u = new URL(url);
      const prefix = `/storage/v1/object/public/banners/`;
      const idx = u.pathname.indexOf(prefix);
      if (idx === -1) return null;
      return u.pathname.substring(idx + prefix.length);
    } catch {
      const prefix = '/storage/v1/object/public/banners/';
      const idx = url.indexOf(prefix);
      if (idx === -1) return null;
      return url.substring(idx + prefix.length).split('?')[0];
    }
  };

  // Remove imagem desktop: limpa seleção local ou exclui arquivo do Storage
  const removeDesktopImage = async () => {
    try {
      // Se há arquivo novo selecionado (ainda não enviado), apenas limpar seleção
      if (imageFile) {
        setImageFile(null);
        setImagePreview(null);
        showToast('Imagem removida do formulário', 'success');
        return;
      }

      const url = formData.imagem_url;
      if (!url) {
        setImagePreview(null);
        showToast('Nenhuma imagem para remover', 'info');
        return;
      }

      const key = getStorageKeyFromPublicUrl(url);
      if (!key) {
        showToast('Não foi possível identificar o arquivo no Storage.', 'error');
        return;
      }

      const { error } = await supabaseWithAuth.storage.from('banners').remove([key]);
      if (error) {
        console.error('Erro ao remover imagem do Storage:', error);
        showToast('Erro ao remover imagem do Storage', 'error');
        return;
      }

      setFormData((prev) => ({ ...prev, imagem_url: '' }));
      setImagePreview(null);
      showToast('Imagem removida', 'success');
    } catch (err) {
      console.error('Erro inesperado ao remover imagem:', err);
      showToast('Erro inesperado ao remover imagem', 'error');
    }
  };

  // Remove imagem mobile: limpa seleção local ou exclui arquivo do Storage
  const removeMobileImage = async () => {
    try {
      if (imageFileMobile) {
        setImageFileMobile(null);
        setImagePreviewMobile(null);
        showToast('Imagem mobile removida do formulário', 'success');
        return;
      }

      const url = formData.imagem_url_mobile || '';
      if (!url) {
        setImagePreviewMobile(null);
        showToast('Nenhuma imagem mobile para remover', 'info');
        return;
      }

      const key = getStorageKeyFromPublicUrl(url);
      if (!key) {
        showToast('Não foi possível identificar o arquivo mobile no Storage.', 'error');
        return;
      }

      const { error } = await supabaseWithAuth.storage.from('banners').remove([key]);
      if (error) {
        console.error('Erro ao remover imagem mobile do Storage:', error);
        showToast('Erro ao remover imagem mobile do Storage', 'error');
        return;
      }

      setFormData((prev) => ({ ...prev, imagem_url_mobile: '' }));
      setImagePreviewMobile(null);
      showToast('Imagem mobile removida', 'success');
    } catch (err) {
      console.error('Erro inesperado ao remover imagem mobile:', err);
      showToast('Erro inesperado ao remover imagem mobile', 'error');
    }
  };

  useEffect(() => {
    if (id) {
      loadBanner();
    }
  }, [id]);

  const loadBanner = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseWithAuth
        .from('banners')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          titulo: data.titulo || '',
          subtitulo: data.subtitulo || '',
          imagem_url: data.imagem_url || '',
          imagem_url_mobile: data.imagem_url_mobile || '',
          link_destino: data.link_destino || '',
          texto_botao: data.texto_botao || '',
          ordem_exibicao: data.ordem_exibicao || 0,
          ativo: data.ativo ?? true,
        });
        if (data.imagem_url) {
          setImagePreview(data.imagem_url);
        }
        if (data.imagem_url_mobile) {
          setImagePreviewMobile(data.imagem_url_mobile);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar banner:', error);
      showToast('Erro ao carregar banner', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);

      let imageUrl = formData.imagem_url;
      let imageUrlMobile = formData.imagem_url_mobile || null;
      
      if (imageFile) {
        const fileName = `banners/${Date.now()}-${imageFile.name}`;
        
        const { error: uploadError } = await supabaseWithAuth.storage
          .from('banners')
          .upload(fileName, imageFile);
          
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabaseWithAuth.storage
          .from('banners')
          .getPublicUrl(fileName);
          
        imageUrl = urlData.publicUrl;
      }
      if (imageFileMobile) {
        const fileNameMobile = `banners/mobile/${Date.now()}-${imageFileMobile.name}`;
        const { error: uploadMobileError } = await supabaseWithAuth.storage
          .from('banners')
          .upload(fileNameMobile, imageFileMobile);
        if (uploadMobileError) throw uploadMobileError;
        const { data: urlMobileData } = supabaseWithAuth.storage
          .from('banners')
          .getPublicUrl(fileNameMobile);
        imageUrlMobile = urlMobileData.publicUrl;
      }
      // Gera título automático se o campo estiver vazio
      const titulo = formData.titulo.trim() || `Banner ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

      // Monta payload de atualização
      const payload: any = {
        titulo: titulo,
        subtitulo: formData.subtitulo,
        imagem_url: imageUrl,
        imagem_url_mobile: imageUrlMobile,
        link_destino: formData.link_destino,
        ordem_exibicao: formData.ordem_exibicao,
        ativo: formData.ativo,
      };

      // Inclui texto_botao quando presente
      if (formData.texto_botao !== undefined && formData.texto_botao !== null) {
        payload.texto_botao = formData.texto_botao;
      }

      // Tenta atualizar com todos os campos
      let { error } = await supabaseWithAuth
        .from('banners')
        .update(payload)
        .eq('id', id);

      // Se a coluna imagem_url_mobile/texto_botao não existir no banco, faz fallback sem elas
      if (error && (String(error.message).includes('imagem_url_mobile') || String(error.message).includes('texto_botao') || String(error.message).includes('column') )) {
        // Remove a propriedade e tenta novamente
        delete payload.texto_botao;
        delete payload.imagem_url_mobile;
        const retry = await supabaseWithAuth
          .from('banners')
          .update(payload)
          .eq('id', id);
        if (retry.error) throw retry.error;
      } else if (error) {
        throw error;
      }

      showToast('Banner atualizado com sucesso!', 'success');
      setTimeout(() => {
        navigate('/paineladmin/banners/listar');
      }, 1500);
    } catch (error) {
      console.error('Erro ao atualizar banner:', error);
      showToast('Erro ao atualizar banner', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFileMobile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreviewMobile(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <i className="ri-loader-4-line text-5xl text-pink-600 animate-spin"></i>
            <p className="mt-4 text-gray-600">Carregando banner...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Editar Banner</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Atualize as informações do banner</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coluna 1 */}
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  aria-invalid={false}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subtítulo
                </label>
                <input
                  type="text"
                  value={formData.subtitulo || ''}
                  onChange={(e) => setFormData({ ...formData, subtitulo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Texto do Botão
                </label>
                <input
                  type="text"
                  value={formData.texto_botao || ''}
                  onChange={(e) => setFormData({ ...formData, texto_botao: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Link de Destino
                </label>
                <input
                  type="url"
                  value={formData.link_destino || ''}
                  onChange={(e) => setFormData({ ...formData, link_destino: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="https://..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ordem de Exibição
                </label>
                <input
                  type="number"
                  value={formData.ordem_exibicao}
                  onChange={(e) => setFormData({ ...formData, ordem_exibicao: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  min={1}
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Banner Ativo</span>
                </label>
              </div>
            </div>

            {/* Coluna 2 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Imagem do Banner
              </label>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nova Imagem
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Recomendado: 1720x600px</p>
              </div>

              {imagePreview && (
                <div className="mt-4 relative">
                  <button
                    type="button"
                    onClick={removeDesktopImage}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded-md shadow"
                    title="Remover imagem"
                  >
                    Remover
                  </button>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Preview da Imagem:</p>
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-auto object-cover rounded-lg border dark:border-gray-600"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-large.svg';
                    }}
                  />
                </div>
              )}

              {formData.imagem_url && !imageFile && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL da Imagem Atual
                  </label>
                  <input
                    type="url"
                    value={formData.imagem_url}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 dark:text-white opacity-75"
                  />
                </div>
              )}

              {/* Imagem Mobile opcional */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Imagem Mobile (opcional)
                </label>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nova Imagem Mobile
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageMobileChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Recomendado: 1080x1350px</p>
                </div>
                {imagePreviewMobile && (
                  <div className="mt-4 relative">
                    <button
                      type="button"
                      onClick={removeMobileImage}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded-md shadow"
                      title="Remover imagem mobile"
                    >
                      Remover
                    </button>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Preview da Imagem Mobile:</p>
                    <img
                      src={imagePreviewMobile}
                      alt="Preview Mobile"
                      className="w-full h-auto object-cover rounded-lg border dark:border-gray-600"
                      onError={(e) => { e.currentTarget.src = '/placeholder-large.svg'; }}
                    />
                  </div>
                )}
                {formData.imagem_url_mobile && !imageFileMobile && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      URL da Imagem Mobile Atual
                    </label>
                    <input
                      type="url"
                      value={formData.imagem_url_mobile}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 dark:text-white opacity-75"
                    />
                  </div>
                )}
              </div>
            </div>

            </div>
          <AdminFormButtons
            onSave={handleSubmit}
            onBack={() => navigate('/paineladmin/banners/listar')}
            saveText={saving ? 'Salvando...' : 'Salvar Alterações'}
            isSaveDisabled={saving}
          />
        </form>
      </div>
    </AdminLayout>
  );
}