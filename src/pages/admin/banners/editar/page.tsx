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
  link_destino: string | null;
  texto_botao: string | null;
  ordem_exibicao: number;
  ativo: boolean;
}

export default function AdminBannersEditarPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Omit<Banner, 'id'>>({
    titulo: '',
    subtitulo: '',
    imagem_url: '',
    link_destino: '',
    texto_botao: '',
    ordem_exibicao: 0,
    ativo: true,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

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
          link_destino: data.link_destino || '',
          texto_botao: data.texto_botao || '',
          ordem_exibicao: data.ordem_exibicao || 0,
          ativo: data.ativo ?? true,
        });
        if (data.imagem_url) {
          setImagePreview(data.imagem_url);
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
    
    if (!formData.titulo) {
      showToast('O título do banner é obrigatório', 'error');
      return;
    }

    try {
      setSaving(true);

      let imageUrl = formData.imagem_url;
      
      if (imageFile) {
        const fileName = `banners/${Date.now()}-${imageFile.name}`;
        
        const { data: uploadData, error: uploadError } = await supabaseWithAuth.storage
          .from('banners')
          .upload(fileName, imageFile);
          
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabaseWithAuth.storage
          .from('banners')
          .getPublicUrl(fileName);
          
        imageUrl = urlData.publicUrl;
      }
      // Monta payload de atualização
      const payload: any = {
        titulo: formData.titulo,
        subtitulo: formData.subtitulo,
        imagem_url: imageUrl,
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

      // Se a coluna texto_botao não existir no banco, faz fallback sem ela
      if (error && (String(error.message).includes('texto_botao') || String(error.message).includes('column') )) {
        // Remove a propriedade e tenta novamente
        delete payload.texto_botao;
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
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
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
              </div>

              {imagePreview && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Preview da Imagem:</p>
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-auto object-cover rounded-lg border dark:border-gray-600"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-banner.svg';
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