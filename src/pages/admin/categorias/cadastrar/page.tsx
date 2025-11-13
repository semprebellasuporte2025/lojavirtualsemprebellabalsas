
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../../components/feature/AdminLayout';
import AdminFormButtons from '../../../../components/feature/AdminFormButtons/AdminFormButtons';
import { supabaseWithAuth } from '../../../../lib/supabaseAuth';
import { useToast } from '../../../../hooks/useToast';
import { generateSlug } from '../../../../utils/formatters';
import { getSlugValidationError, isUniqueSlug } from '../../../../utils/slugValidation';

export default function CadastrarCategoria() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    ordem: '1',
    ativo: true,
    slug: '',
  });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imagemUrlFinal = null;
      
      // Se há uma imagem selecionada (base64), fazer upload para o Supabase Storage
      if (imagePreview && imagePreview.startsWith('data:image')) {
        const file = await dataURLtoFile(imagePreview, `categoria-${Date.now()}.jpg`);
        const fileName = `categorias/${Date.now()}-${file.name}`;
        
        const { error: uploadError } = await supabaseWithAuth.storage
          .from('categorias')
          .upload(fileName, file);
          
        if (uploadError) throw uploadError;
        
        // Obter URL pública da imagem
        const { data: urlData } = supabaseWithAuth.storage
          .from('categorias')
          .getPublicUrl(fileName);
          
        imagemUrlFinal = urlData.publicUrl;
      }

      // Validar slug
      const slugToUse = formData.slug || generateSlug(formData.nome);
      const validationError = getSlugValidationError(slugToUse);
      if (validationError) {
        setSlugError(validationError);
        showToast(validationError, 'error');
        return;
      }

      const unique = await isUniqueSlug(slugToUse);
      if (!unique) {
        const msg = 'Slug já existe. Escolha outro.';
        setSlugError(msg);
        showToast(msg, 'error');
        return;
      }

      const { error } = await supabaseWithAuth
        .from('categorias')
        .insert([
          {
            nome: formData.nome,
            descricao: formData.descricao || null,
            imagem_url: imagemUrlFinal,
            ativa: formData.ativo,
            slug: slugToUse,
          },
        ]);

      if (error) throw error;

      showToast('Categoria cadastrada com sucesso!', 'success');
      navigate('/paineladmin/categorias/listar');
    } catch (err: any) {
      console.error('Erro ao cadastrar categoria:', err);
      showToast('Erro ao cadastrar categoria', 'error');
    }
  };

  // Função auxiliar para converter base64 para File
  const dataURLtoFile = (dataurl: string, filename: string): Promise<File> => {
    return new Promise((resolve) => {
      const arr = dataurl.split(',');
      const mime = arr[0].match(/:(.*?);/)![1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      
      resolve(new File([u8arr], filename, { type: mime }));
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nome = e.target.value;
    setFormData((prev) => ({ ...prev, nome }));
    if (!slugManuallyEdited) {
      const auto = generateSlug(nome);
      setFormData((prev) => ({ ...prev, slug: auto }));
      setSlugError(getSlugValidationError(auto));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSlugManuallyEdited(true);
    setFormData((prev) => ({ ...prev, slug: value }));
    setSlugError(getSlugValidationError(value));
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Cadastrar Categoria</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Adicione uma nova categoria de produtos</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-2xl">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Imagem da Categoria
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-pink-500 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="category-image"
                  />
                  <label htmlFor="category-image" className="cursor-pointer">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded" />
                    ) : (
                      <div>
                        <i className="ri-image-add-line text-4xl text-gray-400 mb-2"></i>
                        <p className="text-gray-600 dark:text-gray-400">Clique para selecionar uma imagem</p>
                        <p className="text-sm text-gray-500 mt-1">Recomendado: 400x400px</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={handleNomeChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Maquiagem"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slug da Categoria *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={handleSlugChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="ex.: maquiagem, roupas-infantis"
                  required
                />
                {slugError && (
                  <p className="text-sm text-red-600 mt-1">{slugError}</p>
                )}
                {!slugError && formData.slug && (
                  <p className="text-sm text-gray-500 mt-1">URL gerada: /categoria/{formData.slug}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  placeholder="Descreva a categoria..."
                />
                <p className="text-sm text-gray-500 mt-1">{formData.descricao.length}/500 caracteres</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ordem de Exibição *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.ordem}
                  onChange={(e) => setFormData({ ...formData, ordem: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500 cursor-pointer"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Categoria Ativa
                  </span>
                </label>
              </div>
            </div>

            <AdminFormButtons
              onSave={handleSubmit}
              onBack={() => window.history.back()}
              saveText="Salvar Categoria"
            />
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
