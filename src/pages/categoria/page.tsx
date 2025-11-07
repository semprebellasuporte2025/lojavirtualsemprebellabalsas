
import { useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import SEOHead from '../../components/feature/SEOHead';
import HeroSlider from '../../components/feature/HeroSlider';
import { supabase } from '../../lib/supabase';
import type { Produto } from '../../lib/supabase';
import Newsletter from '../../components/feature/Newsletter';

export default function CategoriaPage() {
  const { categoria: categoriaParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const categoria = categoriaParam || searchParams.get('cat') || '';

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordenacao, setOrdenacao] = useState('relevancia');
  const [filtroPreco, setFiltroPreco] = useState('todos');
  const [filtroTamanho, setFiltroTamanho] = useState<string[]>([]);
  const [filtroCor, setFiltroCor] = useState<string[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState<string[]>([]);

  const [categorias, setCategorias] = useState<{ id: string; nome: string }[]>([]);
  const [cores, setCores] = useState<{ nome: string; hex: string }[]>([]);
  const [tamanhos, setTamanhos] = useState<string[]>([]);

  useEffect(() => {
    carregarFiltros();
  }, []);

  useEffect(() => {
    carregarProdutos();
  }, [categoria, searchParams]);

  const carregarFiltros = async () => {
    try {
      // Carregar categorias
      const { data: categoriasData, error: categoriasError } = await supabase
        .from('categorias')
        .select('id, nome');
      if (categoriasError) throw categoriasError;
      setCategorias(categoriasData || []);

      // Carregar cores a partir das variantes
      const { data: variantesCorData, error: variantesCorError } = await supabase
        .from('variantes_produto')
        .select('cor, cor_hex');

      if (variantesCorError) {
        console.error('Erro ao buscar cores das variantes:', variantesCorError);
        throw variantesCorError;
      }

      const coresMap = new Map();
      variantesCorData.forEach(variante => {
        if (variante.cor && variante.cor_hex) {
          coresMap.set(variante.cor, { nome: variante.cor, hex: variante.cor_hex });
        }
      });
      const coresUnicas = Array.from(coresMap.values());
      setCores(coresUnicas);

      // Carregar tamanhos (exemplo, idealmente viria de uma tabela de variantes)
      const { data: variantesData, error: variantesError } = await supabase
        .from('variantes_produto')
        .select('tamanho');
      if (variantesError) throw variantesError;

      const tamanhosUnicos = [...new Set(variantesData.map(v => v.tamanho).filter(Boolean))] as string[];
      setTamanhos(tamanhosUnicos);

    } catch (error) {
      console.error('Erro ao carregar filtros:', error);
    }
  };



  const carregarProdutos = async () => {
    try {
      setLoading(true);

      // Verificar se é uma busca por produtos em destaque
      const isDestaque = searchParams.get('destaque') === 'true';

      // Descobrir ID da categoria, se houver nome informado
      let categoriaId: string | null = null;
      if (categoria && !isDestaque) {
        const { data: catRows, error: catErr } = await supabase
          .from('categorias')
          .select('id')
          .eq('nome', categoria)
          .order('created_at', { ascending: false })
          .limit(1);
        if (!catErr) {
          const first = Array.isArray(catRows) ? catRows[0] : null;
          categoriaId = first?.id ?? null;
        } else {
          categoriaId = null;
        }
      }

      // Query principal
      let query = supabase
        .from('products_with_ratings')
        .select(`*, categorias(nome), variantes_produto(cor, cor_hex, tamanho)`)
        .eq('ativo', true);
      
      if (isDestaque) {
        query = query.eq('destaque', true);
      } else if (categoriaId) {
        query = query.eq('categoria_id', categoriaId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(24);

      // Fallback caso a view falhe
      let result = data as Produto[] | null;
      if (error) {
        let fallback = supabase
          .from('produtos')
          .select(`*, categorias(nome), variantes_produto(cor, cor_hex, tamanho)`)
          .eq('ativo', true);
        
        if (isDestaque) {
          fallback = fallback.eq('destaque', true);
        } else if (categoriaId) {
          fallback = fallback.eq('categoria_id', categoriaId);
        }
        
        const { data: fallbackData, error: fallbackError } = await fallback
          .order('created_at', { ascending: false })
          .limit(24);
        if (fallbackError) throw fallbackError;
        result = fallbackData as Produto[];
      }

      setProdutos(result || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const produtosFiltrados = produtos.filter(produto => {
    // Filtro de Preço
    if (filtroPreco === 'ate-100' && produto.preco > 100) return false;
    if (filtroPreco === '100-200' && (produto.preco <= 100 || produto.preco > 200)) return false;
    if (filtroPreco === 'acima-200' && produto.preco <= 200) return false;

    // Filtro de Categoria
    if (filtroCategoria.length > 0 && !filtroCategoria.includes(produto.categoria_id)) {
      return false;
    }

    // Filtro de Cor
    if (filtroCor.length > 0) {
      const produtoCores = produto.variantes_produto?.map(v => v.cor) || [];
      if (!filtroCor.some(c => produtoCores.includes(c))) {
        return false;
      }
    }

    // Filtro de Tamanho
    if (filtroTamanho.length > 0) {
      const produtoTamanhos = produto.variantes_produto?.map(v => v.tamanho) || [];
      if (!filtroTamanho.some(t => produtoTamanhos.includes(t))) {
        return false;
      }
    }

    return true;
  });

  const produtosOrdenados = [...produtosFiltrados].sort((a, b) => {
    if (ordenacao === 'menor-preco') {
      const precoA = a.preco_promocional || a.preco;
      const precoB = b.preco_promocional || b.preco;
      return precoA - precoB;
    }
    if (ordenacao === 'maior-preco') {
      const precoA = a.preco_promocional || a.preco;
      const precoB = b.preco_promocional || b.preco;
      return precoB - precoA;
    }
    // Ordenação padrão: mais recente primeiro (created_at DESC)
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    return dateB - dateA;
  });

  const handleProductClick = (produto: Produto) => {
    navigate(`/produto/${produto.slug || produto.id}`);
  };

  const handleFiltroChange = (filtro: 'tamanho' | 'cor' | 'categoria', valor: string) => {
    const setter = {
      tamanho: setFiltroTamanho,
      cor: setFiltroCor,
      categoria: setFiltroCategoria,
    }[filtro];

    const state = {
      tamanho: filtroTamanho,
      cor: filtroCor,
      categoria: filtroCategoria,
    }[filtro];

    setter((prev: string[]) => 
      prev.includes(valor) 
        ? prev.filter(item => item !== valor)
        : [...prev, valor]
    );
  };

  return (
    <>
      <SEOHead
        title={categoria ? `${categoria} - Loja de Moda` : 'Todos os Produtos - Loja de Moda'}
        description={`Confira nossa coleção completa de ${categoria || 'produtos'}. Qualidade e estilo com os melhores preços.`}
      />
      <div className="min-h-screen bg-white">
        <Header />

        <HeroSlider />


        <div className="container mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 2xl:px-10 py-8">
          <div className="flex flex-col md:flex-row gap-4">
            <aside className="w-full md:w-64 flex-shrink-0 -ml-2 sm:-ml-3 md:-ml-4 lg:-ml-6 xl:-ml-8 2xl:-ml-10">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Filtros</h3>

                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-3">Ordenar por</h4>
                  <div className="space-y-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="ordenacao"
                        value="relevancia"
                        checked={ordenacao === 'relevancia'}
                        onChange={(e) => setOrdenacao(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">Relevância</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="ordenacao"
                        value="menor-preco"
                        checked={ordenacao === 'menor-preco'}
                        onChange={(e) => setOrdenacao(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">Menor Preço</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="ordenacao"
                        value="maior-preco"
                        checked={ordenacao === 'maior-preco'}
                        onChange={(e) => setOrdenacao(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">Maior Preço</span>
                    </label>
                  </div>
                </div>

                {/* Filtro de Categoria */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-3">Categorias</h4>
                  <div className="space-y-2">
                    {categorias.map(cat => (
                      <label key={cat.id} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filtroCategoria.includes(cat.id)}
                          onChange={() => handleFiltroChange('categoria', cat.id)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-600">{cat.nome}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Filtro de Tamanho */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-3">Tamanhos</h4>
                  <div className="space-y-2">
                    {tamanhos.map(tamanho => (
                      <label key={tamanho} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filtroTamanho.includes(tamanho)}
                          onChange={() => handleFiltroChange('tamanho', tamanho)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-600">{tamanho}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Filtro de Cor */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-3">Cores</h4>
                  <div className="flex flex-wrap gap-3">
                    {cores.map(cor => (
                      <div key={cor.nome} className="relative group">
                        <button
                          onClick={() => handleFiltroChange('cor', cor.nome)}
                          className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${filtroCor.includes(cor.nome) ? 'border-pink-500 ring-2 ring-pink-200' : 'border-gray-300'}`}
                          style={{ backgroundColor: cor.hex }}
                        />
                        <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none left-1/2 -translate-x-1/2">
                          {cor.nome}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-3">Faixa de Preço</h4>
                  <div className="space-y-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="preco"
                        value="todos"
                        checked={filtroPreco === 'todos'}
                        onChange={(e) => setFiltroPreco(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">Todos</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="preco"
                        value="ate-100"
                        checked={filtroPreco === 'ate-100'}
                        onChange={(e) => setFiltroPreco(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">Até R$ 100</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="preco"
                        value="100-200"
                        checked={filtroPreco === '100-200'}
                        onChange={(e) => setFiltroPreco(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">R$ 100 - R$ 200</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="preco"
                        value="acima-200"
                        checked={filtroPreco === 'acima-200'}
                        onChange={(e) => setFiltroPreco(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">Acima de R$ 200</span>
                    </label>
                  </div>
                </div>
              </div>
            </aside>

            <main className="flex-1">
              {loading ? (
                <div className="text-center py-12">
                  <i className="ri-loader-4-line text-5xl text-pink-600 animate-spin"></i>
                  <p className="mt-4 text-gray-600">Carregando produtos...</p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <p className="text-gray-600">
                      {produtosOrdenados.length} {produtosOrdenados.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
                    </p>
                  </div>

                  {produtosOrdenados.length === 0 ? (
                    <div className="text-center py-12">
                      <i className="ri-shopping-bag-line text-5xl text-gray-400 mb-4"></i>
                      <p className="text-gray-600">Nenhum produto encontrado</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-product-shop>
                      {produtosOrdenados.map((produto) => (
                        <div
                          key={produto.id}
                          onClick={() => handleProductClick(produto)}
                          className="bg-white rounded-lg overflow-hidden hover:shadow-xl transition-shadow group border border-gray-200 cursor-pointer"
                        >
                          <div className="relative overflow-hidden bg-gray-50">
                            {produto.preco_promocional && (
                              <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold z-10">
                                -{Math.round(((produto.preco - produto.preco_promocional) / produto.preco) * 100)}%
                              </div>
                            )}
                            <img
                              src={produto.imagens?.[0] || '/placeholder-product.svg'}
                              alt={produto.nome}
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                const img = e.currentTarget as HTMLImageElement;
                                img.onerror = null;
                                img.src = '/placeholder-product.svg';
                              }}
                              className="w-full h-96 object-contain object-top group-hover:scale-105 transition-transform duration-300 bg-gray-50"
                            />
                          </div>

                          <div className="p-4">
                            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">{produto.categorias?.nome || categoria}</p>
                            
                            <h3 className="text-sm font-medium text-gray-800 mb-1 line-clamp-2">
                              {produto.nome}
                            </h3>

                            <div className="flex items-center gap-1 mb-1">
                              <div className="flex text-yellow-400">
                                {[...Array(Math.round(produto.average_rating || 0))].map((_, i) => (
                                  <i key={i} className="ri-star-fill text-xs"></i>
                                ))}
                                {[...Array(5 - Math.round(produto.average_rating || 0))].map((_, i) => (
                                  <i key={i} className="ri-star-line text-xs"></i>
                                ))}
                              </div>
                              <span className="text-xs text-gray-500 ml-1">({produto.review_count || 0})</span>
                            </div>

                            <p className="text-xs text-gray-600 mb-1">Cores disponíveis:</p>
                            <div className="flex gap-2 mb-4">
                              {produto.variantes_produto && produto.variantes_produto.length > 0 ? (
                                produto.variantes_produto.map((variante, index) => (
                                  <div 
                                    key={index}
                                    className="w-5 h-5 rounded-full border border-gray-300 cursor-pointer"
                                    style={{ backgroundColor: variante.cor_hex }}
                                    title={variante.cor}
                                  ></div>
                                ))
                              ) : (
                                <div className="text-xs text-gray-400">N/A</div>
                              )}
                            </div>

                            <div className="mb-2">
                              {produto.preco_promocional ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400 line-through text-sm">
                                    R$ {produto.preco.toFixed(2)}
                                  </span>
                                  <span className="text-xl font-bold text-pink-600">
                                    R$ {produto.preco_promocional.toFixed(2)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xl font-bold text-gray-800">
                                  R$ {produto.preco.toFixed(2)}
                                </span>
                              )}
                            </div>

                            <Link
                              to={`/produto/${produto.slug || produto.id}`}
                              onClick={(e) => { e.stopPropagation(); }}
                              className="w-full block text-center py-2.5 bg-pink-600 text-white text-sm font-semibold rounded hover:bg-pink-700 transition-colors whitespace-nowrap"
                            >
                              Ver Detalhes
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>

        <Newsletter />

        <Footer />
      </div>
    </>
  );
}
