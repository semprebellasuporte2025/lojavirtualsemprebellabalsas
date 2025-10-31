import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../../../hooks/useToast';
import Toast from '../../../../components/base/Toast';
import { supabaseWithAuth } from '../../../../lib/supabaseAuth';
import AdminLayout from '../../../../components/feature/AdminLayout';
import AdminFormButtons from '../../../../components/feature/AdminFormButtons/AdminFormButtons';

export default function EditarCategoriaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    imagem_url: '',
    ativa: true,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (id) {
      carregarCategoria();
    }
  }, [id]);

  const carregarCategoria = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseWithAuth
        .from('categorias')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          nome: data.nome || '',
          descricao: data.descricao || '',
          imagem_url: data.imagem_url || '',
          ativa: data.ativa ?? true,
        });
        if (data.imagem_url) {
          setImagePreview(data.imagem_url);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar categoria:', error);
      showToast('Erro ao carregar categoria', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome) {
      showToast('O nome da categoria é obrigatório', 'error');
      return;
    }

    try {
      setSaving(true);

      let imagemUrlFinal = formData.imagem_url;
      
      // Se há uma nova imagem selecionada, fazer upload para o Supabase Storage
      if (imageFile) {
        const fileName = `categorias/${Date.now()}-${imageFile.name}`;
        
        const { data: uploadData, error: uploadError } = await supabaseWithAuth.storage
          .from('categorias')
          .upload(fileName, imageFile);
          
        if (uploadError) throw uploadError;
        
        // Obter URL pública da imagem
        const { data: urlData } = supabaseWithAuth.storage
          .from('categorias')
          .getPublicUrl(fileName);
          
        imagemUrlFinal = urlData.publicUrl;
      }

      const { error } = await supabaseWithAuth
        .from('categorias')
        .update({
          nome: formData.nome,
          descricao: formData.descricao,
          imagem_url: imagemUrlFinal,
          ativa: formData.ativa,
        })
        .eq('id', id);

      if (error) throw error;

      showToast('Categoria atualizada com sucesso!', 'success');
      setTimeout(() => {
        navigate('/paineladmin/categorias/listar');
      }, 1500);
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      showToast('Erro ao atualizar categoria', 'error');
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
            <p className="mt-4 text-gray-600">Carregando categoria...</p>
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
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Editar Categoria</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Atualize as informações da categoria</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome da Categoria *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Imagem da Categoria
              </label>
              
              {/* Upload de nova imagem */}
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

              {/* Preview da imagem */}
              {imagePreview && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Preview da Imagem:</p>
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-category.svg';
                    }}
                  />
                </div>
              )}

              {/* URL da imagem atual (apenas para referência) */}
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

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.ativa}
                  onChange={(e) => setFormData({ ...formData, ativa: e.target.checked })}
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500 cursor-pointer"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Categoria Ativa</span>
              </label>
            </div>
          </div>

          <AdminFormButtons
            onSave={handleSubmit}
            onBack={() => navigate('/paineladmin/categorias/listar')}
            saveText={saving ? 'Salvando...' : 'Salvar Alterações'}
            isSaveDisabled={saving}
          />
        </form>
      </div>
    </AdminLayout>
  );
}
