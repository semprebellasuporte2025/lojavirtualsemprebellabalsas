
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../../components/feature/AdminLayout';
import AdminFormButtons from '../../../../components/feature/AdminFormButtons/AdminFormButtons';
import { useToast } from '../../../../hooks/useToast';
import { supabase } from '../../../../lib/supabase';
import RichTextEditor from '../../../../components/base/RichTextEditor';
import { AVAILABLE_COLORS, AVAILABLE_SIZES } from '../../../../constants/colors';
import type { ColorOption } from '../../../../constants/colors';

interface ProductVariation {
  id: string;
  size: string;
  color: string;
  colorHex: string;
  stock: number;
  sku: string;
}

const EditarProduto = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    categoriaId: '',
    preco: '',
    precoPromocional: '',
    descricao: '',
    material: '',
    referencia: '',
    peso: '',
    altura: '',
    largura: '',
    profundidade: '',
    ativo: true,
    destaque: false,
    recemChegado: false
  });
  const [images, setImages] = useState<string[]>([]);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [availableSizes] = useState(AVAILABLE_SIZES);
  const [availableColors] = useState<ColorOption[]>(AVAILABLE_COLORS);
  const [categorias, setCategorias] = useState<any[]>([]);

  // Carregar categorias
  useEffect(() => {
    const carregarCategorias = async () => {
      try {
        const { data, error } = await supabase
          .from('categorias')
          .select('id, nome')
          .eq('ativa', true)
          .order('nome');
        
        if (error) throw error;
        setCategorias(data || []);
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        showToast('Erro ao carregar categorias', 'error');
      }
    };

    carregarCategorias();
  }, []);

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoadingProduct(true);
      
      // Carregar produto com categoria
      const { data: produto, error: produtoError } = await supabase
        .from('produtos')
        .select(`
          *,
          categorias (
            nome
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (produtoError) throw produtoError;
      if (!produto) throw new Error('Produto não encontrado');

      // Carregar variações
      const { data: variacoes, error: variacoesError } = await supabase
        .from('variantes_produto')
        .select('*')
        .eq('produto_id', id);

      if (variacoesError) throw variacoesError;

      // Preencher formulário
      setFormData({
        nome: produto.nome || '',
        categoria: produto.categorias?.nome || '',
        categoriaId: produto.categoria_id || '',
        preco: produto.preco?.toString() || '',
        precoPromocional: produto.preco_promocional?.toString() || '',
        descricao: produto.descricao || '',
        material: produto.material || '',
        referencia: produto.referencia || '',
        peso: produto.peso?.toString() || '',
        altura: produto.altura?.toString() || '',
        largura: produto.largura?.toString() || '',
        profundidade: produto.profundidade?.toString() || '',
        ativo: produto.ativo ?? true,
        destaque: produto.destaque ?? false,
        recemChegado: produto.recem_chegado ?? false
      });

      setImages(produto.imagens || []);

      // Converter variações para o formato do componente
      if (variacoes) {
        const variationsFormatted = variacoes.map((variacao, index) => ({
          id: variacao.id?.toString() || index.toString(),
          size: variacao.tamanho || 'M',
          color: variacao.cor || 'Preto',
          colorHex: variacao.cor_hex || '#000000',
          stock: typeof variacao.estoque === 'number' ? variacao.estoque : 0,
          sku: variacao.sku || ''
        }));
        setVariations(variationsFormatted);
      }

    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      showToast('Erro ao carregar produto', 'error');
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validar se há pelo menos uma variação
      if (variations.length === 0) {
        showToast('Adicione pelo menos uma variação do produto (cor e tamanho)', 'error');
        setIsLoading(false);
        return;
      }

      // Buscar categoria_id pelo nome
      const { data: categoriaData, error: categoriaError } = await supabase
        .from('categorias')
        .select('id')
        .eq('nome', formData.categoria)
        .single();

      if (categoriaError) {
        showToast('Categoria não encontrada', 'error');
        setIsLoading(false);
        return;
      }

      // Atualizar produto principal, com fallback se coluna 'material' não existir
      const { error: produtoError } = await supabase
        .from('produtos')
        .update({
          nome: formData.nome,
          categoria_id: categoriaData.id,
          preco: parseFloat(formData.preco),
          preco_promocional: formData.precoPromocional ? parseFloat(formData.precoPromocional) : null,
          descricao: formData.descricao,
          material: formData.material || null,
          referencia: formData.referencia,
          peso: parseFloat(formData.peso),
          altura: formData.altura ? parseFloat(formData.altura) : null,
          largura: formData.largura ? parseFloat(formData.largura) : null,
          profundidade: formData.profundidade ? parseFloat(formData.profundidade) : null,
          imagens: images,
          ativo: formData.ativo,
          destaque: formData.destaque,
          recem_chegado: formData.recemChegado,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (produtoError) {
        const msg = String((produtoError as any)?.message || '');
        if (/column\s+.*material.*does not exist|material.*column/i.test(msg)) {
          const { error: produtoFallbackError } = await supabase
            .from('produtos')
            .update({
              nome: formData.nome,
              categoria_id: categoriaData.id,
              preco: parseFloat(formData.preco),
              preco_promocional: formData.precoPromocional ? parseFloat(formData.precoPromocional) : null,
              descricao: formData.descricao,
              referencia: formData.referencia,
              peso: parseFloat(formData.peso),
              altura: formData.altura ? parseFloat(formData.altura) : null,
              largura: formData.largura ? parseFloat(formData.largura) : null,
              profundidade: formData.profundidade ? parseFloat(formData.profundidade) : null,
              imagens: images,
              ativo: formData.ativo,
              destaque: formData.destaque,
              recem_chegado: formData.recemChegado,
              updated_at: new Date().toISOString()
            })
            .eq('id', id);
          if (produtoFallbackError) throw produtoFallbackError;
        } else {
          throw produtoError;
        }
      }

      // Remover variações existentes
      const { error: deleteError } = await supabase
        .from('variantes_produto')
        .delete()
        .eq('produto_id', id);

      if (deleteError) throw deleteError;

      // Inserir novas variações
      const variacoesParaInserir = variations.map(variation => ({
        produto_id: id,
        tamanho: variation.size,
        cor: variation.color,
        cor_hex: variation.colorHex,
        estoque: Number.isFinite(Math.floor(Number(variation.stock))) ? Math.max(0, Math.floor(Number(variation.stock))) : 0,
        sku: variation.sku // Usar apenas o SKU específico da variação, não gerar automaticamente
      }));

      const { error: variacoesError } = await supabase
        .from('variantes_produto')
        .insert(variacoesParaInserir);

      if (variacoesError) throw variacoesError;

      showToast('Produto atualizado com sucesso!', 'success');
      setTimeout(() => {
        navigate('/paineladmin/produtos/listar');
      }, 2000);

    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      showToast('Erro ao atualizar produto', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const MAX_SIZE_BYTES = 10 * 1024 * 1024;
      const ALLOWED_TYPES = new Set([
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/heic',
        'image/heif',
        'image/svg+xml'
      ]);

      // Função para sanitizar nome do arquivo
      const sanitizeFileName = (fileName: string): string => {
        // Remove extensão temporariamente
        const lastDotIndex = fileName.lastIndexOf('.');
        const name = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
        const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';
        
        // Sanitiza o nome: remove acentos, caracteres especiais e espaços
        const sanitizedName = name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove acentos
          .replace(/[^a-zA-Z0-9]/g, '_') // Substitui caracteres especiais por underscore
          .replace(/_+/g, '_') // Remove underscores duplicados
          .replace(/^_|_$/g, ''); // Remove underscores do início e fim
        
        return sanitizedName + extension;
      };

      const validFiles = Array.from(files).filter((file) => {
        if (!ALLOWED_TYPES.has(file.type)) {
          console.warn(`Tipo de arquivo não suportado: ${file.type}`);
          showToast('Tipo de arquivo não suportado.', 'error');
          return false;
        }
        if (file.size > MAX_SIZE_BYTES) {
          console.warn(`Arquivo excede 10MB: ${file.name}`);
          showToast('Arquivo excede o limite de 10MB.', 'error');
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) {
        return;
      }

      const folder = `produtos/${id || 'sem-id'}-${Date.now()}`;
      const uploads = validFiles.map(async (file) => {
        const sanitizedFileName = sanitizeFileName(file.name);
        const fileName = `${Date.now()}-${sanitizedFileName}`;
        const path = `${folder}/${fileName}`;
        
        console.log(`[Upload] Arquivo original: ${file.name}`);
        console.log(`[Upload] Arquivo sanitizado: ${fileName}`);
        console.log(`[Upload] Caminho: ${path}`);
        
        const { data, error } = await supabase.storage
          .from('imagens-produtos')
          .upload(path, file, { 
            upsert: true,
            contentType: file.type
          });
        if (error) {
          console.error('Erro no upload da imagem:', error);
        showToast('Erro ao enviar imagem.', 'error');
        return null;
      }
      const { data: publicUrlData } = supabase.storage
        .from('imagens-produtos')
        .getPublicUrl(data.path);
      return publicUrlData.publicUrl;
    });

    const results = await Promise.all(uploads);
    const publicUrls = results.filter((u): u is string => !!u);
    setImages((prev) => [...prev, ...publicUrls]);
  } catch (err) {
    console.error('Falha geral no upload de imagens:', err);
    showToast('Falha geral no upload de imagens.', 'error');
  }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Extrai o caminho relativo do bucket a partir da URL pública
  const extractStoragePath = (publicUrl: string): string | null => {
    if (!publicUrl) return null;
    const markers = [
      '/storage/v1/object/public/imagens-produtos/',
      '/object/public/imagens-produtos/',
      '/public/imagens-produtos/'
    ];
    for (const marker of markers) {
      const idx = publicUrl.indexOf(marker);
      if (idx >= 0) {
        return publicUrl.substring(idx + marker.length);
      }
    }
    return null;
  };

  // Exclui a imagem do Supabase Storage e atualiza o registro de produto
  const deleteImageServer = async (index: number) => {
    const imageUrl = images[index];
    if (!imageUrl) return;
    setIsDeletingImage(true);
    setDeletingIndex(index);
    try {
      const storagePath = extractStoragePath(imageUrl);
      if (storagePath) {
        const { error: removeError } = await supabase
          .storage
          .from('imagens-produtos')
          .remove([storagePath]);
        if (removeError) throw removeError;
      } else {
        console.warn('Caminho do storage não identificado a partir da URL:', imageUrl);
      }

      const newImages = images.filter((_, i) => i !== index);
      setImages(newImages);
      if (id) {
        const { error: updateError } = await supabase
          .from('produtos')
          .update({ imagens: newImages, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (updateError) throw updateError;
      }
      showToast('Imagem excluída com sucesso.', 'success');
    } catch (err) {
      console.error('Erro ao excluir imagem do storage/DB:', err);
      showToast('Falha ao excluir imagem. Tente novamente.', 'error');
    } finally {
      setIsDeletingImage(false);
      setDeletingIndex(null);
    }
  };

  const addVariation = () => {
    const newVariation: ProductVariation = {
      id: Date.now().toString(),
      size: availableSizes[0],
      color: availableColors[0].name,
      colorHex: availableColors[0].hex,
      stock: 0,
      sku: ''
    };
    setVariations([...variations, newVariation]);
  };

  const updateVariation = (id: string, field: keyof ProductVariation, value: string | number) => {
    setVariations(variations.map(variation => {
      if (variation.id === id) {
        if (field === 'color') {
          const selectedColor = availableColors.find(color => color.name === value);
          return {
            ...variation,
            color: value as string,
            colorHex: selectedColor?.hex || '#000000'
          };
        }
        if (field === 'colorHex') {
          const selectedColor = availableColors.find(color => color.hex.toLowerCase() === (value as string).toLowerCase());
          return {
            ...variation,
            colorHex: value as string,
            color: selectedColor?.name || variation.color
          };
        }
        if (field === 'stock') {
          const n = Math.floor(Number(value));
          return { ...variation, stock: Number.isFinite(n) && n > 0 ? n : 0 };
        }
        return { ...variation, [field]: value };
      }
      return variation;
    }));
  };

  const removeVariation = (id: string) => {
    setVariations(variations.filter(variation => variation.id !== id));
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Editar Produto</h1>
          <p className="text-gray-600 mt-1">Atualize os dados do produto</p>
        </div>

        {loadingProduct ? (
          <div className="flex items-center justify-center py-12">
            <i className="ri-loader-4-line text-4xl text-pink-600 animate-spin"></i>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Ex: Vestido Floral Primavera"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria *
                    </label>
                    <div className="relative">
                      <select
                        value={formData.categoriaId}
                        onChange={(e) => {
                          const selectedCategoria = categorias.find(cat => cat.id === e.target.value);
                          setFormData({ 
                            ...formData, 
                            categoriaId: e.target.value,
                            categoria: selectedCategoria?.nome || ''
                          });
                        }}
                        className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none cursor-pointer"
                        required
                      >
                        <option value="">Selecione uma categoria</option>
                        {categorias.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.nome}</option>
                        ))}
                      </select>
                      <i className="ri-arrow-down-s-line absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Referência Base *
                    </label>
                    <input
                      type="text"
                      value={formData.referencia}
                      onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="Ex: VEST-001"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Material
                  </label>
                  <input
                    type="text"
                    value={formData.material}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Ex: Algodão Premium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.preco}
                        onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="0,00"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço Promocional
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.precoPromocional}
                        onChange={(e) => setFormData({ ...formData, precoPromocional: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Peso (gramas) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.peso}
                    onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Ex: 500"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    <i className="ri-information-line mr-1"></i>
                    Peso necessário para calcular o frete
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Altura (cm)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.altura}
                      onChange={(e) => setFormData({ ...formData, altura: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Ex: 5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Largura (cm)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.largura}
                      onChange={(e) => setFormData({ ...formData, largura: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Ex: 15"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Profundidade (cm)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.profundidade}
                      onChange={(e) => setFormData({ ...formData, profundidade: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Ex: 20"
                    />
                  </div>


                </div>
                <p className="text-sm text-gray-500 -mt-4">
                  <i className="ri-information-line mr-1"></i>
                  Dimensões necessárias para calcular o frete corretamente
                </p>

                {/* Descrição */}
                <div>
                  <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição *
                  </label>
                  <RichTextEditor
                    id="descricao"
                    value={formData.descricao}
                    onChange={(value) => setFormData({ ...formData, descricao: value })}
                    placeholder="Descreva o produto..."
                  />
                </div>

                {/* Variações de Produto */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Variações do Produto *
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        As cores aqui cadastradas aparecerão nos cards dos produtos
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addVariation}
                      className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <i className="ri-add-line mr-2"></i>
                      Adicionar Variação
                    </button>
                  </div>

                  {variations.length > 0 && (
                    <div className="space-y-4">
                      {variations.map((variation) => (
                        <div key={variation.id} className="bg-gray-50 p-6 rounded-lg">
                          <div className="grid grid-cols-12 gap-4 items-end">
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tamanho
                              </label>
                              <div className="relative">
                                <select
                                  value={variation.size}
                                  onChange={(e) => updateVariation(variation.id, 'size', e.target.value)}
                                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                >
                                  {availableSizes.map(size => (
                                    <option key={size} value={size}>{size}</option>
                                  ))}
                                </select>
                                <i className="ri-arrow-down-s-line absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                              </div>
                            </div>

                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cor
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={variation.color}
                                  onChange={(e) => updateVariation(variation.id, 'color', e.target.value)}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                  placeholder="Digite o nome da cor"
                                />
                                <div
                                  className="w-8 h-8 rounded-md border border-gray-300"
                                  style={{ backgroundColor: variation.colorHex }}
                                  title={variation.color}
                                ></div>
                              </div>
                            </div>

                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Código Hex da Cor
                              </label>
                              <input
                                type="text"
                                value={variation.colorHex}
                                onChange={(e) => updateVariation(variation.id, 'colorHex', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                placeholder="#000000"
                                pattern="^#[0-9A-Fa-f]{6}$"
                              />
                            </div>

                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Estoque
                              </label>
                              <input
                                type="number"
                                value={variation.stock}
                                min={0}
                                onChange={(e) => updateVariation(variation.id, 'stock', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                placeholder="0"
                              />
                            </div>

                            <div className="col-span-3">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Referência Variação
                              </label>
                              <input
                                type="text"
                                value={variation.sku}
                                onChange={(e) => updateVariation(variation.id, 'sku', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                placeholder="Ex: VEST-001-P-PRETO"
                              />
                            </div>

                            <div className="col-span-1">
                              <button
                                type="button"
                                onClick={() => removeVariation(variation.id)}
                                className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap flex items-center justify-center cursor-pointer"
                              >
                                <i className="ri-delete-bin-line"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {variations.length === 0 && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                      <i className="ri-palette-line text-4xl mb-2"></i>
                      <p className="font-medium">Nenhuma variação adicionada</p>
                      <p className="text-sm">Adicione as cores e tamanhos do produto</p>
                      <p className="text-xs mt-1">As cores aparecerão nos cards da loja</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.ativo}
                      onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                      className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500 cursor-pointer"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Produto Ativo
                    </span>
                  </label>

                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.destaque}
                      onChange={(e) => setFormData({ ...formData, destaque: e.target.checked })}
                      className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500 cursor-pointer"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Produto em Destaque
                    </span>
                  </label>

                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.recemChegado}
                      onChange={(e) => setFormData({ ...formData, recemChegado: e.target.checked })}
                      className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500 cursor-pointer"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Recém Chegado
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagens do Produto *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-pink-500 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    id="product-images"
                  />
                  <label htmlFor="product-images" className="cursor-pointer">
                    <i className="ri-image-add-line text-4xl text-gray-400 mb-2"></i>
                    <p className="text-gray-600 text-sm">Clique para adicionar imagens</p>
                    <p className="text-xs text-gray-500 mt-1">Múltiplas imagens permitidas</p>
                  </label>
                </div>

                {images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img src={img} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded" />
                        <div className="absolute top-1 right-1 flex gap-1">
                          <button
                            type="button"
                            title="Remover do formulário"
                            onClick={() => removeImage(index)}
                            className="w-8 h-8 flex items-center justify-center bg-yellow-500/80 text-white rounded-full cursor-pointer hover:bg-yellow-600"
                          >
                            <i className="ri-close-line"></i>
                          </button>
                          <button
                            type="button"
                            title="Excluir do servidor"
                            onClick={() => deleteImageServer(index)}
                            disabled={isDeletingImage && deletingIndex === index}
                            className="w-8 h-8 flex items-center justify-center bg-red-600/80 text-white rounded-full cursor-pointer hover:bg-red-700 disabled:opacity-60"
                          >
                            {isDeletingImage && deletingIndex === index ? (
                              <i className="ri-loader-4-line animate-spin"></i>
                            ) : (
                              <i className="ri-delete-bin-line"></i>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <AdminFormButtons
              onSave={handleSubmit}
              onBack={() => window.history.back()}
              saveText={isLoading ? 'Salvando...' : 'Salvar Produto'}
              isSaveDisabled={isLoading}
            />
          </form>
        )}
      </div>
    </AdminLayout>
  );
}

export default EditarProduto;
