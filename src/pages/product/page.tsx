
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import ProductGallery from './components/ProductGallery';
import ProductInfo from './components/ProductInfo';
import ProductTabs from './components/ProductTabs';
import RelatedProducts from './components/RelatedProducts';
import SEOHead from '../../components/feature/SEOHead';
import { supabase } from '../../lib/supabase';
import type { Produto } from '../../lib/supabase';
import ErrorBoundary from '../../components/base/ErrorBoundary';
import { useCart } from '../../hooks/useCart';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const addItem = useCart((state) => state.addItem);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    if (slug) {
      carregarProduto();
    }
  }, [slug]);

  const carregarProduto = async () => {
    try {
      setLoading(true);
      
      // Primeiro tenta buscar por slug
      const { data: dataBySlug, error: errorBySlug } = await supabase
        .from('produtos')
        .select('*, categorias(nome), variantes_produto(*)')
        .eq('slug', slug)
        .maybeSingle();

      if (errorBySlug) {
        console.error('Erro ao carregar produto por slug:', errorBySlug);
      }
      
      if (dataBySlug) {
        setProduto(dataBySlug);
        return;
      }

      // Se não encontrou por slug, verifica se o parâmetro é um UUID
      // e tenta buscar por ID (para compatibilidade com URLs antigas)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (slug && uuidRegex.test(slug)) {
        console.log('Tentando buscar produto por ID (compatibilidade):', slug);
        const { data: dataById, error: errorById } = await supabase
          .from('produtos')
          .select('*, categorias(nome), variantes_produto(*)')
          .eq('id', slug)
          .maybeSingle();

        if (errorById) {
          console.error('Erro ao carregar produto por ID:', errorById);
        }
        
        if (dataById) {
          setProduto(dataById);
          return;
        }
      }

      console.warn('Produto não encontrado com slug/ID:', slug);
      setProduto(null);
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      setProduto(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <i className="ri-loader-4-line text-5xl text-pink-600 animate-spin"></i>
            <p className="mt-4 text-gray-600">Carregando produto...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!produto) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <i className="ri-shopping-bag-line text-5xl text-gray-400 mb-4"></i>
            <p className="text-gray-600">Produto não encontrado</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Bloquear visualização quando o produto estiver inativo
  if (produto.ativo === false) {
    return (
      <>
        <SEOHead
          title={`Produto indisponível - Loja de Moda`}
          description={`Este produto não está disponível no momento.`}
          noIndex={true}
        />
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md">
            <i className="ri-prohibited-line text-5xl text-red-500 mb-4"></i>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Produto indisponível</h2>
            <p className="text-gray-600 mb-6">Este produto foi desativado e não pode ser visualizado ou comprado.</p>
            <div className="space-x-3">
              <a href="/" className="inline-flex items-center px-6 py-3 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 transition-colors cursor-pointer">
                <i className="ri-home-line mr-2"></i>
                Voltar ao Início
              </a>
              <a href="/categoria" className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <i className="ri-list-check mr-2"></i>
                Ver categorias
              </a>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <ErrorBoundary>
      <>
        <SEOHead
          title={`${produto.nome} - Loja de Moda`}
          description={produto.descricao || `Compre ${produto.nome} com o melhor preço e qualidade.`}
        />
        <div className="min-h-screen bg-white overflow-x-hidden" style={{ overscrollBehaviorX: 'none' }}>
          <Header />

          <div className="container mx-auto px-6 sm:px-8 md:px-10 lg:px-12 xl:px-16 2xl:px-24 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Passa sempre um nome e garante imagens válidas para evitar falhas */}
              <ProductGallery 
                images={(produto.imagens && produto.imagens.length > 0) 
                  ? produto.imagens 
                  : (produto.imagem_url ? [produto.imagem_url] : ['/placeholder-large.svg'])}
                productName={produto.nome || 'Produto'}
              />
              {/* Conecta o botão ao carrinho */}
              <ProductInfo produto={produto} onAddToCart={(item) => addItem(item)} />
            </div>

            <ProductTabs produto={produto} />

            <RelatedProducts categoriaId={produto.categoria_id} produtoAtualId={produto.id} />
          </div>

          <Footer />
        </div>
      </>
    </ErrorBoundary>
  );
}
