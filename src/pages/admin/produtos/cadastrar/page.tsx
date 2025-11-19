import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../../components/feature/AdminLayout';
import { supabase } from '../../../../lib/supabase';
import { useToast } from '../../../../hooks/useToast';
import RichTextEditor from '../../../../components/base/RichTextEditor';
import { AVAILABLE_COLORS, AVAILABLE_SIZES, findClosestColorName } from '../../../../constants/colors';
import type { ColorOption } from '../../../../constants/colors';

interface ProductVariation {
  id: string;
  size: string;
  color: string;
  colorHex: string;
  stock: number;
  sku: string;
}

const CadastrarProdutoCopy = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    categoriaId: '', // ID da categoria selecionada
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
    recemChegado: false,
    nomeInvisivel: false
  });
  const [images, setImages] = useState<string[]>([]);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [availableSizes] = useState(AVAILABLE_SIZES);
  const [availableColors] = useState<ColorOption[]>(AVAILABLE_COLORS);
  const [categorias, setCategorias] = useState<{ id: string; nome: string }[]>([]);
  const saveAttemptsRef = useRef<number>(0); // Contador de tentativas de salvamento
  const isSavingRef = useRef<boolean>(false); // Proteção contra dupla execução
  const nomeRef = useRef<HTMLInputElement>(null);
  const categoriaRef = useRef<HTMLSelectElement>(null);
  const precoRef = useRef<HTMLInputElement>(null);
  const precoPromocionalRef = useRef<HTMLInputElement>(null);
  const materialRef = useRef<HTMLInputElement>(null);
  const referenciaRef = useRef<HTMLInputElement>(null);
  const pesoRef = useRef<HTMLInputElement>(null);
  const alturaRef = useRef<HTMLInputElement>(null);
  const larguraRef = useRef<HTMLInputElement>(null);
  const profundidadeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCategorias = async () => {
      console.log('🔄 useEffect: Iniciando busca de categorias...');
      console.log('Estado inicial do formData:', formData);
      const { data, error } = await supabase.from('categorias').select('id, nome');
      if (error) {
        console.error('❌ Erro ao buscar categorias:', error);
      } else {
        console.log(`✅ Categorias carregadas: ${data?.length || 0}`, data);
        setCategorias(data);
      }
    };
    fetchCategorias();
    
    // Focar automaticamente no primeiro campo ao carregar a página
    setTimeout(() => {
      nomeRef.current?.focus();
    }, 100);
  }, []);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[CadastrarProduto] 🚀 handleSubmit chamado - enviando para n8n');
    
    // Proteção contra dupla execução
    if (isSavingRef.current) {
      console.log('[CadastrarProduto] Salvamento já em andamento, ignorando nova tentativa');
      return;
    }
    
    isSavingRef.current = true;
    setIsLoading(true);
    
    try {
      // Validações básicas
      if (variations.length === 0) {
        showToast('Adicione pelo menos uma variação do produto (cor e tamanho)', 'error');
        setIsLoading(false);
        isSavingRef.current = false;
        return;
      }
      
      if (isUploading) {
        showToast('Aguarde o término do upload das imagens', 'info');
        setIsLoading(false);
        isSavingRef.current = false;
        return;
      }

      // Preparar dados para envio
      const produtoData = {
        nome: formData.nome,
        categoria: formData.categoria,
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
        variacoes: variations.map(variation => ({
          tamanho: variation.size,
          cor: variation.color,
          cor_hex: variation.colorHex,
          sku: variation.sku || formData.referencia
        }))
      };

      console.log('[CadastrarProduto] 📤 Enviando dados para n8n:', produtoData);

      // Buscar categoria_id pelo nome
      const { data: categoriaData, error: categoriaError } = await supabase
        .from('categorias')
        .select('id')
        .eq('nome', formData.categoria)
        .single();

      if (categoriaError) {
        showToast('Categoria não encontrada', 'error');
        setIsLoading(false);
        isSavingRef.current = false;
        return;
      }

      // Inserir produto principal
      const { data: produtoDataInsert, error: produtoError } = await supabase
        .from('produtos')
        .insert({
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
          nome_invisivel: formData.nomeInvisivel,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (produtoError) {
        console.error('Erro ao inserir produto:', produtoError);
        throw produtoError;
      }

      const produtoId = produtoDataInsert[0].id;
      console.log('[CadastrarProduto] ✅ Produto inserido com ID:', produtoId);

      // Inserir variações do produto
      const variacoesParaInserir = variations.map(variation => ({
        produto_id: produtoId,
        tamanho: variation.size,
        cor: variation.color,
        cor_hex: variation.colorHex,
        estoque: Number.isFinite(Math.floor(Number(variation.stock))) ? Math.max(0, Math.floor(Number(variation.stock))) : 0,
        sku: variation.sku // Usar apenas o SKU específico da variação, não gerar automaticamente
      }));

      const { error: variacoesError } = await supabase
        .from('variantes_produto')
        .insert(variacoesParaInserir);

      if (variacoesError) {
        console.error('Erro ao inserir variações:', variacoesError);
        throw variacoesError;
      }

      console.log('[CadastrarProduto] ✅ Variações inseridas com sucesso');

      // Sucesso
      showToast('Produto cadastrado com sucesso!', 'success');
      setShowConfirmationModal(true);
      
      // Reset do formulário
      saveAttemptsRef.current = 0;

    } catch (error) {
      console.error('[CadastrarProduto] ❌ Erro ao enviar para n8n:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      showToast(`Erro ao cadastrar produto: ${errorMessage}`, 'error');
    } finally {
      setIsLoading(false);
      isSavingRef.current = false;
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    console.log('[Upload] Iniciando upload de', files.length, 'arquivo(s)');
    setIsUploading(true);
    
    // Timeout de segurança para evitar loop infinito
    const safetyTimeoutId = setTimeout(() => {
      console.warn('[Upload] Timeout de segurança ativado - resetando estado');
      setIsUploading(false);
      showToast('Upload demorou muito e foi cancelado. Tente novamente.', 'error');
    }, 30000); // 30 segundos
    
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
        console.log('[Upload] Nenhum arquivo válido encontrado');
        clearTimeout(safetyTimeoutId);
        setIsUploading(false);
        return;
      }
      
      console.log('[Upload] Processando', validFiles.length, 'arquivo(s) válido(s)');
      const folder = `produtos/temp-${Date.now()}`;
      
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
      
      const uploads = validFiles.map(async (file, index) => {
        const sanitizedFileName = sanitizeFileName(file.name);
        const fileName = `${Date.now()}-${index}-${sanitizedFileName}`;
        const path = `${folder}/${fileName}`;
        
        console.log(`[Upload] Arquivo original: ${file.name}`);
        console.log(`[Upload] Arquivo sanitizado: ${fileName}`);
        console.log(`[Upload] Enviando arquivo ${index + 1}/${validFiles.length}:`, fileName);
        
        // Upload com timeout individual aumentado e sistema de retry
        const uploadWithRetry = async (retryCount = 0): Promise<any> => {
          try {
            console.log(`[Upload] Iniciando tentativa ${retryCount + 1} para ${fileName}`);
            
            const uploadPromise = supabase.storage
              .from('imagens-produtos')
              .upload(path, file, { 
                upsert: true,
                contentType: file.type
              });
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout no upload individual')), 45000) // Aumentado para 45 segundos
            );
            
            console.log(`[Upload] Aguardando resposta do upload para ${fileName}...`);
            const result = await Promise.race([uploadPromise, timeoutPromise]);
            const { data, error } = result as { data: any; error: any };
            
            if (error) {
              console.log(`[Upload] Erro detectado para ${fileName}:`, error.message);
              if (retryCount < 2 && error.message !== 'Timeout no upload individual') {
                console.log(`[Upload] Tentativa ${retryCount + 1} falhou, tentando novamente...`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Espera 2 segundos antes de retry
                return uploadWithRetry(retryCount + 1);
              }
              throw error;
            }
            
            console.log(`[Upload] Upload bem-sucedido para ${fileName}`);
            return { data, error: null };
          } catch (err) {
            console.log(`[Upload] Exceção capturada para ${fileName}:`, err instanceof Error ? err.message : err);
            if (retryCount < 2 && err instanceof Error && err.message === 'Timeout no upload individual') {
              console.log(`[Upload] Timeout na tentativa ${retryCount + 1}, tentando novamente...`);
              await new Promise(resolve => setTimeout(resolve, 3000)); // Espera 3 segundos antes de retry
              return uploadWithRetry(retryCount + 1);
            }
            throw err;
          }
        };
        
        console.log(`[Upload] Iniciando processo de upload para ${fileName}...`);
        const { data, error } = await uploadWithRetry();
        
        if (error) {
          console.error(`[Upload] Erro final no upload do arquivo ${fileName}:`, error);
          showToast(`Erro ao enviar ${file.name}.`, 'error');
          return null;
        }
        
        console.log(`[Upload] Sucesso no upload:`, data.path);
        
        const { data: publicUrlData } = supabase.storage
          .from('imagens-produtos')
          .getPublicUrl(data.path);
        
        console.log(`[Upload] URL pública gerada:`, publicUrlData.publicUrl);
        return publicUrlData.publicUrl;
      });
      
      console.log('[Upload] Aguardando conclusão de todos os uploads...');
      const results = await Promise.allSettled(uploads);
      
      // Processar resultados do Promise.allSettled
      const publicUrls: string[] = [];
      let failedCount = 0;
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          publicUrls.push(result.value);
          console.log(`[Upload] Sucesso no arquivo ${index + 1}:`, result.value);
        } else {
          failedCount++;
          console.error(`[Upload] Falha no arquivo ${index + 1}:`, result.status === 'rejected' ? result.reason : 'Valor nulo');
        }
      });
      
      console.log('[Upload] Upload concluído. URLs válidas:', publicUrls.length, 'Falhas:', failedCount);
      setImages((prev) => [...prev, ...publicUrls]);
      
      if (publicUrls.length > 0) {
        if (failedCount > 0) {
          showToast(`${publicUrls.length} imagem(ns) enviada(s) com sucesso! ${failedCount} falharam.`, 'info');
        } else {
          showToast(`${publicUrls.length} imagem(ns) enviada(s) com sucesso!`, 'success');
        }
      } else if (failedCount > 0) {
        showToast('Todas as imagens falharam no upload. Tente novamente.', 'error');
      }
      
    } catch (err) {
      console.error('[Upload] Falha geral no upload de imagens:', err);
      showToast('Falha geral no upload de imagens.', 'error');
    } finally {
      clearTimeout(safetyTimeoutId);
      console.log('[Upload] Finalizando - resetando estado isUploading');
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
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
        const updatedVariation = { ...variation, [field]: value };

        if (field === 'color') {
          const selectedColor = availableColors.find(c => c.name === value);
          if (selectedColor) {
            updatedVariation.colorHex = selectedColor.hex;
            updatedVariation.color = selectedColor.name;
          } else {
            const typed = (value as string);
            const isHex = /^#([0-9A-Fa-f]{6})$/.test(typed);
            if (isHex) {
              updatedVariation.colorHex = typed;
              const nearest = findClosestColorName(typed);
              updatedVariation.color = nearest ?? typed;
            } else {
              // Nome livre digitado: mantém o nome como digitado e não altera o hex atual
              updatedVariation.color = typed;
            }
          }
        } else if (field === 'colorHex') {
          const hex = (value as string);
          updatedVariation.colorHex = hex;
          const matched = availableColors.find(c => c.hex.toLowerCase() === hex.toLowerCase());
          if (matched) {
            updatedVariation.color = matched.name;
          } else {
            const nearest = findClosestColorName(hex);
            updatedVariation.color = nearest ?? hex;
          }
        } else if (field === 'stock') {
          const n = Math.floor(Number(value));
          updatedVariation.stock = Number.isFinite(n) && n > 0 ? n : 0;
        }

        return updatedVariation;
      }
      return variation;
    }));
  };

  const removeVariation = (id: string) => {
    setVariations(variations.filter(variation => variation.id !== id));
  };

  const resetForm = () => {
    setFormData({
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
      recemChegado: false,
      nomeInvisivel: false
    });
    setImages([]);
    setVariations([]);
  };

  const handleAddNewProduct = () => {
    resetForm();
    setShowConfirmationModal(false);
  };

  const handleGoToList = () => {
    navigate('/paineladmin/produtos/listar');
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Cadastrar Novo Produto</h1>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coluna da Esquerda */}
            <div>
              {/* Nome do Produto */}
              <div className="mb-4">
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700">Nome do Produto</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  ref={nomeRef}
                  onBlur={() => categoriaRef.current?.focus()}
                  onKeyDown={(e) => { if (e.key === 'Enter') categoriaRef.current?.focus(); }}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>

              {/* Categoria */}
              <div className="mb-4">
                <label htmlFor="categoria" className="block text-sm font-medium text-gray-700">Categoria</label>
                <select
                  id="categoria"
                  name="categoria"
                  value={formData.categoriaId}
                  onChange={(e) => {
                    const selectedCat = categorias.find(cat => cat.id === e.target.value);
                    setFormData({ 
                      ...formData, 
                      categoria: selectedCat ? selectedCat.nome : '',
                      categoriaId: e.target.value 
                    });
                  }}
                  ref={categoriaRef}
                  onBlur={() => precoRef.current?.focus()}
                  onKeyDown={(e) => { if (e.key === 'Enter') precoRef.current?.focus(); }}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </select>
              </div>

              {/* Preço */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="preco" className="block text-sm font-medium text-gray-700">Preço (R$)</label>
                  <input
                    type="number"
                    id="preco"
                    name="preco"
                    value={formData.preco}
                    onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                    ref={precoRef}
                    onBlur={() => precoPromocionalRef.current?.focus()}
                    onKeyDown={(e) => { if (e.key === 'Enter') precoPromocionalRef.current?.focus(); }}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="precoPromocional" className="block text-sm font-medium text-gray-700">Preço Promocional (R$)</label>
                  <input
                    type="number"
                    id="precoPromocional"
                    name="precoPromocional"
                    value={formData.precoPromocional}
                    onChange={(e) => setFormData({ ...formData, precoPromocional: e.target.value })}
                    ref={precoPromocionalRef}
                    onBlur={() => materialRef.current?.focus()}
                    onKeyDown={(e) => { if (e.key === 'Enter') materialRef.current?.focus(); }}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div className="mb-4">
                <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">Descrição</label>
                <RichTextEditor
                  id="descricao"
                  value={formData.descricao}
                  onChange={(value) => setFormData({ ...formData, descricao: value })}
                />
              </div>

              {/* Upload de Imagens */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Imagens do Produto</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                        <span>Carregar arquivos</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,image/svg+xml" onChange={handleImageChange} />
                      </label>
                      <p className="pl-1">ou arraste e solte</p>
                    </div>
                    <p className="text-xs text-gray-500">JPG, PNG, WEBP, GIF, HEIC até 10MB</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div key={image} className="relative">
                      <img src={image} alt={`Imagem do produto ${index + 1}`} className="h-24 w-full object-cover rounded-md" />
                      <button onClick={() => removeImage(index)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 text-xs">&times;</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Coluna da Direita */}
            <div>
              {/* Informações Adicionais */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Adicionais</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="material" className="block text-sm font-medium text-gray-700">Material</label>
                    <input type="text" id="material" name="material" value={formData.material} onChange={(e) => setFormData({ ...formData, material: e.target.value })} ref={materialRef} onBlur={() => referenciaRef.current?.focus()} onKeyDown={(e) => { if (e.key === 'Enter') referenciaRef.current?.focus(); }} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  </div>
                  <div>
                    <label htmlFor="referencia" className="block text-sm font-medium text-gray-700">Referência</label>
                    <input type="text" id="referencia" name="referencia" value={formData.referencia} onChange={(e) => setFormData({ ...formData, referencia: e.target.value })} ref={referenciaRef} onBlur={() => pesoRef.current?.focus()} onKeyDown={(e) => { if (e.key === 'Enter') pesoRef.current?.focus(); }} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
                  </div>
                  <div>
                    <label htmlFor="peso" className="block text-sm font-medium text-gray-700">Peso (g)</label>
                    <input type="number" id="peso" name="peso" value={formData.peso} onChange={(e) => setFormData({ ...formData, peso: e.target.value })} ref={pesoRef} onBlur={() => alturaRef.current?.focus()} onKeyDown={(e) => { if (e.key === 'Enter') alturaRef.current?.focus(); }} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
                  </div>
                  <div>
                    <label htmlFor="altura" className="block text-sm font-medium text-gray-700">Altura (cm)</label>
                    <input type="number" id="altura" name="altura" value={formData.altura} onChange={(e) => setFormData({ ...formData, altura: e.target.value })} ref={alturaRef} onBlur={() => larguraRef.current?.focus()} onKeyDown={(e) => { if (e.key === 'Enter') larguraRef.current?.focus(); }} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  </div>
                  <div>
                    <label htmlFor="largura" className="block text-sm font-medium text-gray-700">Largura (cm)</label>
                    <input type="number" id="largura" name="largura" value={formData.largura} onChange={(e) => setFormData({ ...formData, largura: e.target.value })} ref={larguraRef} onBlur={() => profundidadeRef.current?.focus()} onKeyDown={(e) => { if (e.key === 'Enter') profundidadeRef.current?.focus(); }} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  </div>
                  <div>
                    <label htmlFor="profundidade" className="block text-sm font-medium text-gray-700">Profundidade (cm)</label>
                    <input type="number" id="profundidade" name="profundidade" value={formData.profundidade} onChange={(e) => setFormData({ ...formData, profundidade: e.target.value })} ref={profundidadeRef} onBlur={() => document.getElementById('descricao')?.focus()} onKeyDown={(e) => { if (e.key === 'Enter') document.getElementById('descricao')?.focus(); }} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  </div>

                </div>
              </div>

              {/* Status do Produto */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Status do Produto</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Produto Ativo</span>
                  <label htmlFor="ativo" className="inline-flex relative items-center cursor-pointer">
                    <input type="checkbox" id="ativo" name="ativo" checked={formData.ativo} onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm font-medium text-gray-900">Produto em Destaque</span>
                  <label htmlFor="destaque" className="inline-flex relative items-center cursor-pointer">
                    <input type="checkbox" id="destaque" name="destaque" checked={formData.destaque} onChange={(e) => setFormData({ ...formData, destaque: e.target.checked })} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm font-medium text-gray-900">Recém Chegado</span>
                  <label htmlFor="recemChegado" className="inline-flex relative items-center cursor-pointer">
                    <input type="checkbox" id="recemChegado" name="recemChegado" checked={formData.recemChegado} onChange={(e) => setFormData({ ...formData, recemChegado: e.target.checked })} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm font-medium text-gray-900">Invisível</span>
                  <label htmlFor="nomeInvisivel" className="inline-flex relative items-center cursor-pointer">
                    <input type="checkbox" id="nomeInvisivel" name="nomeInvisivel" checked={formData.nomeInvisivel} onChange={(e) => setFormData({ ...formData, nomeInvisivel: e.target.checked })} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Variações do Produto */}
          <div className="bg-gray-50 p-4 rounded-lg mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Variações do Produto</h3>
            {variations.map((variation) => (
              <div key={variation.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 p-4 border rounded-md">
                <div className="md:col-span-2">
                  <label htmlFor={`size-${variation.id}`} className="block text-sm font-medium text-gray-700">Tamanho</label>
                  <select id={`size-${variation.id}`} value={variation.size} onChange={(e) => updateVariation(variation.id, 'size', e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                    {availableSizes.map(size => <option key={size} value={size}>{size}</option>)}
                  </select>
                </div>
                <div className="md:col-span-4">
                  <label htmlFor={`color-${variation.id}`} className="block text-sm font-medium text-gray-700">Cor</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      id={`color-${variation.id}`}
                      value={variation.color}
                      onChange={(e) => updateVariation(variation.id, 'color', e.target.value)}
                      placeholder="Digite o nome da cor"
                      className="mt-1 flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <input type="color" value={variation.colorHex} onChange={(e) => updateVariation(variation.id, 'colorHex', e.target.value)} className="h-8 w-8 rounded-md border-gray-300" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor={`stock-${variation.id}`} className="block text-sm font-medium text-gray-700">Estoque</label>
                  <input
                    type="number"
                    id={`stock-${variation.id}`}
                    value={variation.stock}
                    min={0}
                    onChange={(e) => updateVariation(variation.id, 'stock', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="0"
                  />
                </div>
                <div className="md:col-span-3">
                  <label htmlFor={`sku-${variation.id}`} className="block text-sm font-medium text-gray-700">SKU</label>
                  <input type="text" id={`sku-${variation.id}`} value={variation.sku} onChange={(e) => updateVariation(variation.id, 'sku', e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Opcional" />
                </div>
                <div className="md:col-span-1 flex items-end">
                  <button type="button" onClick={() => removeVariation(variation.id)} className="text-red-500 hover:text-red-700 font-medium">Remover</button>
                </div>
              </div>
            ))}
            <button type="button" onClick={addVariation} className="mt-2 text-indigo-600 hover:text-indigo-900 font-medium">+ Adicionar Variação</button>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end mt-6">
            <button type="button" onClick={() => navigate('/paineladmin/produtos/listar')} className="mr-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:bg-pink-300" disabled={isLoading || isUploading}>
              {isUploading ? 'Enviando imagens...' : isLoading ? 'Salvando...' : 'Salvar Produto'}
            </button>
          </div>
        </form>

        {/* Modal de Confirmação Elegante */}
        {showConfirmationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="text-center">
                {/* Ícone de sucesso */}
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <h3 className="mt-4 text-lg font-medium text-gray-900">Produto cadastrado com sucesso!</h3>
                
                <p className="mt-2 text-sm text-gray-500">
                  O que você gostaria de fazer agora?
                </p>
                
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAddNewProduct}
                    className="w-full sm:w-auto px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors"
                  >
                    Cadastrar outro produto
                  </button>
                  
                  <button
                    onClick={handleGoToList}
                    className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Ver lista de produtos
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default CadastrarProdutoCopy;