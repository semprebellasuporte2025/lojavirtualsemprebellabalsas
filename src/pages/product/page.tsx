
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

  return (
    <ErrorBoundary>
      <>
        <SEOHead
          title={`${produto.nome} - Loja de Moda`}
          description={produto.descricao || `Compre ${produto.nome} com o melhor preço e qualidade.`}
        />
        <div className="min-h-screen bg-white">
          <Header />

          <div className="container mx-auto px-4 sm:px-6 md:px-10 lg:px-20 xl:px-36 2xl:px-56 py-8">
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
