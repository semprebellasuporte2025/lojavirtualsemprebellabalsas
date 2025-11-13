
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase';
import AdminLayout from '../../../../components/feature/AdminLayout';
import AdminFormButtons from '../../../../components/feature/AdminFormButtons/AdminFormButtons';
import { useToast } from '@/hooks/useToast';

export default function CadastrarBanner() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    titulo: '',
    subtitulo: '',
    link: '',
    texto_botao: '', // Adicionado
    ordem: '1',
    ativo: true
  });
  const [imagePreview, setImagePreview] = useState('');
  const [imagePreviewMobile, setImagePreviewMobile] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileMobile, setSelectedFileMobile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ image?: string; ordem?: string; link?: string }>({});

  const removeDesktopPreview = () => {
    setSelectedFile(null);
    setImagePreview('');
  };
  const removeMobilePreview = () => {
    setSelectedFileMobile(null);
    setImagePreviewMobile('');
  };

  const isValidUrl = (value: string) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  const validateForm = () => {
    const newErrors: { image?: string; ordem?: string; link?: string } = {};
    if (!selectedFile) {
      newErrors.image = 'Imagem do banner é obrigatória';
    }
    const ordemNum = parseInt(formData.ordem, 10);
    if (!Number.isFinite(ordemNum) || ordemNum < 1) {
      newErrors.ordem = 'Ordem deve ser um número maior ou igual a 1';
    }
    if (formData.link && !isValidUrl(formData.link)) {
      newErrors.link = 'Informe uma URL válida (ex.: https://exemplo.com)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('Preencha os campos obrigatórios corretamente.', 'error');
      return;
    }

    setLoading(true);

    try {
      // Garante que o arquivo de desktop está definido para evitar erros de tipo
      const desktopFile = selectedFile;
      if (!desktopFile) {
        showToast('Imagem do banner é obrigatória.', 'error');
        setLoading(false);
        return;
      }

      // Upload da imagem desktop para o Supabase Storage
      const fileExt = desktopFile.name.split('.').pop();
      const fileName = `banner-${Date.now()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(filePath, desktopFile);

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        showToast('Erro ao fazer upload da imagem. Tente novamente.', 'error');
        return;
      }

      // Obter URL pública da imagem
      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(filePath);

      // Upload opcional da imagem mobile
      let publicUrlMobile: string | null = null;
      if (selectedFileMobile) {
        const mobileExt = selectedFileMobile.name.split('.').pop();
        const mobileName = `banner-mobile-${Date.now()}.${mobileExt}`;
        const mobilePath = `banners/mobile/${mobileName}`;

        const { error: mobileUploadError } = await supabase.storage
          .from('banners')
          .upload(mobilePath, selectedFileMobile);

        if (mobileUploadError) {
          console.error('Erro no upload da imagem mobile:', mobileUploadError);
          showToast('Erro ao fazer upload da imagem mobile. Tente novamente.', 'error');
          return;
        }

        const { data: { publicUrl: publicUrlM } } = supabase.storage
          .from('banners')
          .getPublicUrl(mobilePath);
        publicUrlMobile = publicUrlM;
      }

      // Monta payload de inserção
      const payload: any = {
        // título pode ficar em branco; banco aceita string vazia
        titulo: formData.titulo,
        subtitulo: formData.subtitulo || null,
        imagem_url: publicUrl,
        imagem_url_mobile: publicUrlMobile,
        link_destino: formData.link || null,
        ordem_exibicao: parseInt(formData.ordem),
        ativo: formData.ativo,
      };

      if (formData.texto_botao) {
        payload.texto_botao = formData.texto_botao;
      }

      // Tenta inserir com todos os campos
      const { error } = await supabase
        .from('banners')
        .insert([payload])
        .select();

      // Se a coluna imagem_url_mobile/texto_botao não existir, faz fallback e insere sem elas
      if (error && (String(error.message).includes('imagem_url_mobile') || String(error.message).includes('texto_botao') || String(error.message).includes('column'))) {
        delete payload.texto_botao;
        delete payload.imagem_url_mobile;
        const retry = await supabase
          .from('banners')
          .insert([payload])
          .select();
        if (retry.error) {
          console.error('Erro ao salvar banner:', retry.error);
          showToast('Erro ao salvar banner. Tente novamente.', 'error');
          return;
        }
      } else if (error) {
        console.error('Erro ao salvar banner:', error);
        showToast('Erro ao salvar banner. Tente novamente.', 'error');
        return;
      }

      showToast('Banner cadastrado com sucesso!', 'success');
      navigate('/paineladmin/banners/listar');

    } catch (error) {
      console.error('Erro inesperado:', error);
      showToast('Erro inesperado. Tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMobileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileMobile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewMobile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Cadastrar Banner</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Adicione um novo banner para a loja</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Imagem do Banner *
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-pink-500 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="banner-image"
                    required
                  />
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={removeDesktopPreview}
                      className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded-md shadow"
                      title="Remover imagem"
                    >
                      Remover
                    </button>
                  )}
                  <label htmlFor="banner-image" className="cursor-pointer">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded" />
                    ) : (
                      <div>
                        <i className="ri-image-add-line text-4xl text-gray-400 mb-2"></i>
                        <p className="text-gray-600 dark:text-gray-400">Clique para selecionar uma imagem</p>
                        <p className="text-sm text-gray-500 mt-1">Recomendado: 1720x600px</p>
                      </div>
                    )}
                  </label>
                  {errors.image && (
                    <p className="mt-2 text-sm text-red-600" role="alert">{errors.image}</p>
                  )}
                </div>
              </div>

              {/* Imagem Mobile opcional */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Imagem Mobile (opcional)
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-pink-500 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMobileImageChange}
                    className="hidden"
                    id="banner-image-mobile"
                  />
                  {imagePreviewMobile && (
                    <button
                      type="button"
                      onClick={removeMobilePreview}
                      className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded-md shadow"
                      title="Remover imagem mobile"
                    >
                      Remover
                    </button>
                  )}
                  <label htmlFor="banner-image-mobile" className="cursor-pointer">
                    {imagePreviewMobile ? (
                      <img src={imagePreviewMobile} alt="Preview Mobile" className="max-h-64 mx-auto rounded" />
                    ) : (
                      <div>
                        <i className="ri-smartphone-line text-4xl text-gray-400 mb-2"></i>
                        <p className="text-gray-600 dark:text-gray-400">Clique para selecionar uma imagem para mobile</p>
                        <p className="text-sm text-gray-500 mt-1">Recomendado: 1080x1350px</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Promoção de Verão"
                  aria-invalid={false}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subtítulo
                </label>
                <input
                  type="text"
                  value={formData.subtitulo}
                  onChange={(e) => setFormData({ ...formData, subtitulo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Até 50% de desconto"
                />
              </div>

              <div className="md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Link de Destino
                    </label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="https://exemplo.com/promocao"
                  aria-invalid={Boolean(errors.link)}
                  aria-describedby={errors.link ? 'erro-link' : undefined}
                />
                {errors.link && (
                  <p id="erro-link" className="mt-2 text-sm text-red-600" role="alert">{errors.link}</p>
                )}
              </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Texto do Botão
                    </label>
                    <input
                      type="text"
                      value={formData.texto_botao}
                      onChange={(e) => setFormData({ ...formData, texto_botao: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Ex: Saiba Mais"
                    />
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
                  aria-invalid={Boolean(errors.ordem)}
                  aria-describedby={errors.ordem ? 'erro-ordem' : undefined}
                />
                {errors.ordem && (
                  <p id="erro-ordem" className="mt-2 text-sm text-red-600" role="alert">{errors.ordem}</p>
                )}
              </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500 cursor-pointer"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Banner Ativo
                  </span>
                </label>
              </div>
            </div>

            <AdminFormButtons
              onSave={handleSubmit}
              onBack={() => window.history.back()}
              saveText={loading ? "Salvando..." : "Salvar Banner"}
              isSaveDisabled={loading}
            />

          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
