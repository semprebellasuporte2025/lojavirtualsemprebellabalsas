
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

interface ProductTabsProps {
  produto: any;
}

export default function ProductTabs({ produto }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState('description');
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const [stats, setStats] = useState<{ average: number; count: number; distribution: Record<number, number>}>({
    average: 0,
    count: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  // Derivar dados reais do produto (categoria, tamanhos, cores) a partir das variantes
  const variantes: any[] = Array.isArray(produto?.variantes_produto) ? produto?.variantes_produto : [];
  const coresFromVariantes = (() => {
    const map = new Map<string, { name: string; hex: string }>();
    variantes.forEach(v => {
      const hex = (v?.cor_hex || '').toLowerCase();
      const name = v?.cor || '';
      if (hex) {
        if (!map.has(hex)) {
          map.set(hex, { name, hex });
        }
      }
    });
    return Array.from(map.values());
  })();

  const sizesFromVariantes = (() => {
    const set = new Set<string>();
    variantes.forEach(v => { if (v?.tamanho) set.add(String(v.tamanho)); });
    return Array.from(set.values());
  })();

  // Mapear dados do Supabase para o formato esperado (sem valores falsos)
  const product = {
    description: produto?.descricao || 'Descrição não disponível',
    category: produto?.categorias?.nome || produto?.categoria || 'Categoria não informada',
    material: (produto?.material && String(produto.material).trim()) || '',
    sizes: sizesFromVariantes,
    colors: coresFromVariantes,
    rating: produto?.avaliacao || 0,
    reviews: produto?.total_avaliacoes || 0
  };

  useEffect(() => {
    const loadReviews = async () => {
      if (!produto?.id) return;
      setLoadingReviews(true);
      setReviewsError('');
      try {
        // Busca avaliações reais do produto
        const { data, error } = await supabase
          .from('reviews')
          .select('id, rating, comentario, created_at, cliente_id, clientes(nome)')
          .eq('produto_id', produto.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        const list = Array.isArray(data) ? data : [];
        setReviews(list);

        // Calcula estatísticas
        const count = list.length;
        const average = count > 0 ? (list.reduce((acc, r) => acc + (r?.rating || 0), 0) / count) : 0;
        const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        list.forEach((r) => {
          const s = Number(r?.rating || 0);
          if (s >= 1 && s <= 5) distribution[s] += 1;
        });
        setStats({ average, count, distribution });
      } catch (err) {
        console.error('Erro ao carregar avaliações:', err);
        setReviewsError('Erro ao carregar avaliações');
      } finally {
        setLoadingReviews(false);
      }
    };
    loadReviews();
  }, [produto?.id]);

  return (
    <div className="border-t border-gray-200 pt-12">
      {/* Tab Navigation */}
      <div className="flex space-x-8 border-b border-gray-200 mb-8">
        <button
          onClick={() => setActiveTab('description')}
          className={`pb-4 px-1 font-semibold cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'description'
              ? 'text-pink-600 border-b-2 border-pink-600'
              : 'text-gray-600 hover:text-pink-600'
          }`}
        >
          Descrição
        </button>
        <button
          onClick={() => setActiveTab('details')}
          className={`pb-4 px-1 font-semibold cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'details'
              ? 'text-pink-600 border-b-2 border-pink-600'
              : 'text-gray-600 hover:text-pink-600'
          }`}
        >
          Detalhes do Produto
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-4 px-1 font-semibold cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'reviews'
              ? 'text-pink-600 border-b-2 border-pink-600'
              : 'text-gray-600 hover:text-pink-600'
          }`}
        >
          Avaliações ({stats.count})
        </button>
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl">
        {activeTab === 'description' && (
          <div className="prose prose-pink max-w-none">
            {typeof product.description === 'string' && product.description.trim().length > 0 ? (
              <div
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            ) : (
              <p className="text-gray-700 leading-relaxed">Descrição não disponível</p>
            )}
          </div>
        )}

        {activeTab === 'details' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Categoria</p>
                <p className="font-semibold text-gray-900">{product.category}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Material</p>
                <p className="font-semibold text-gray-900">{product.material || 'Não informado'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Tamanhos Disponíveis</p>
                <p className="font-semibold text-gray-900">{product.sizes.length > 0 ? product.sizes.join(', ') : 'Não informado'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Cores Disponíveis</p>
                <p className="font-semibold text-gray-900">{product.colors.length > 0 ? `${product.colors.length} opções` : 'Não informado'}</p>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <h4 className="font-semibold text-gray-900 mb-2">Cuidados com o Produto:</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Lavar à mão ou na máquina em ciclo delicado</li>
                <li>• Usar água fria</li>
                <li>• Não usar alvejante</li>
                <li>• Secar à sombra</li>
                <li>• Passar em temperatura baixa se necessário</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Rating Summary */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center space-x-8">
                <div className="text-center">
                  <div className="text-5xl font-bold text-gray-900 mb-2">{stats.average.toFixed(1)}</div>
                  <div className="flex items-center justify-center mb-1">
                    {[...Array(5)].map((_, i) => (
                      <i
                        key={i}
                        className={`${i < Math.floor(stats.average) ? 'ri-star-fill text-yellow-400' : 'ri-star-line text-gray-300'} text-lg`}
                      ></i>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">{stats.count} avaliações</p>
                </div>

                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const percent = stats.count > 0 ? Math.round((stats.distribution[stars] / stats.count) * 100) : 0;
                    return (
                      <div key={stars} className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600 w-12">{stars} <i className="ri-star-fill text-yellow-400"></i></span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full"
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-12">{percent}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Individual Reviews */}
            <div className="space-y-6">
              {loadingReviews && (
                <div className="text-gray-600">Carregando avaliações...</div>
              )}
              {reviewsError && (
                <div className="text-red-600">{reviewsError}</div>
              )}
              {!loadingReviews && !reviewsError && reviews.length === 0 && (
                <div className="text-gray-600">Ainda não há avaliações para este produto.</div>
              )}
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                          <span className="text-pink-600 font-semibold">
                            {(review?.clientes?.nome || 'Cliente').charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{review?.clientes?.nome || 'Cliente'}</p>
                          <p className="text-sm text-gray-500">{new Date(review.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="flex items-center ml-13">
                        {[...Array(5)].map((_, i) => (
                          <i
                            key={i}
                            className={`${i < (review.rating || 0) ? 'ri-star-fill text-yellow-400' : 'ri-star-line text-gray-300'}`}
                          ></i>
                        ))}
                      </div>
                    </div>
                  </div>
                  {review?.comentario && (
                    <p className="text-gray-700 mb-3 ml-13">{review.comentario}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
