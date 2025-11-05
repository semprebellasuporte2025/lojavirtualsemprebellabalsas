// Página temporária para diagnóstico de estoque
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ProdutoInfo {
  id: string;
  nome: string;
  estoque: number;
  ativo: boolean;
  variantes?: any[];
  total_estoque_variantes?: number;
}

export default function DebugEstoquePage() {
  const [produtos, setProdutos] = useState<ProdutoInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Buscar produtos
      const { data: produtosData, error: produtosError } = await supabase
        .from('produtos')
        .select('id, nome, estoque, ativo')
        .order('nome');

      if (produtosError) throw produtosError;

      // Para cada produto, buscar variantes
      const produtosComVariantes = await Promise.all(
        produtosData.map(async (produto) => {
          const { data: variantes, error: varError } = await supabase
            .from('variantes_produto')
            .select('id, tamanho, cor, estoque')
            .eq('produto_id', produto.id);

          if (!varError && variantes) {
            const totalEstoqueVariantes = variantes.reduce((sum, v) => sum + (v.estoque || 0), 0);
            return {
              ...produto,
              variantes,
              total_estoque_variantes: totalEstoqueVariantes
            };
          }
          
          return produto;
        })
      );

      setProdutos(produtosComVariantes);
      
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const produtosComEstoque = produtos.filter(p => p.estoque > 0);
  const produtosSemEstoque = produtos.filter(p => p.estoque === 0);
  const produtosComVariantesComEstoque = produtos.filter(p => 
    p.total_estoque_variantes > 0 && p.estoque === 0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">🔍 Diagnóstico de Estoque</h1>
          <div className="text-center">
            <div className="animate-spin text-4xl text-blue-600 mb-4">⏳</div>
            <p>Carregando dados de estoque...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">🔍 Diagnóstico de Estoque</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Erro:</p>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">🔍 Diagnóstico de Estoque</h1>
        
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Total de Produtos</h3>
            <p className="text-3xl font-bold text-gray-800">{produtos.length}</p>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Com Estoque</h3>
            <p className="text-3xl font-bold text-green-600">{produtosComEstoque.length}</p>
          </div>
          
          <div className="bg-red-50 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Sem Estoque</h3>
            <p className="text-3xl font-bold text-red-600">{produtosSemEstoque.length}</p>
          </div>
        </div>

        {/* Produtos com variantes mas sem estoque principal */}
        {produtosComVariantesComEstoque.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              ⚠️ Atenção: {produtosComVariantesComEstoque.length} produtos têm variantes com estoque mas estoque principal = 0
            </h3>
            <p className="text-yellow-700">
              Estes produtos podem aparecer como "esgotados" mesmo tendo estoque nas variantes.
            </p>
          </div>
        )}

        {/* Lista de produtos sem estoque */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">📋 Produtos Sem Estoque</h3>
          
          {produtosSemEstoque.length === 0 ? (
            <p className="text-gray-600">Nenhum produto sem estoque encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Nome</th>
                    <th className="text-left py-2">Estoque</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Variantes</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosSemEstoque.map((produto) => (
                    <tr key={produto.id} className="border-b">
                      <td className="py-2">{produto.nome}</td>
                      <td className="py-2">{produto.estoque}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          produto.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {produto.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="py-2">
                        {produto.variantes && produto.variantes.length > 0 ? (
                          <span className="text-blue-600">
                            {produto.variantes.length} variantes
                            {produto.total_estoque_variantes > 0 && (
                              <span className="text-green-600 ml-2">
                                (+{produto.total_estoque_variantes} estoque)
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-500">Nenhuma</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Instruções */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">💡 O que fazer?</h3>
          <ul className="list-disc list-inside text-blue-700 space-y-1">
            <li>Verifique se os produtos que deveriam ter estoque estão listados acima</li>
            <li>Produtos com variantes podem ter estoque apenas nas variantes</li>
            <li>Atualize o campo <code>estoque</code> na tabela <code>produtos</code></li>
            <li>Verifique também o estoque nas variantes (<code>variantes_produto</code>)</li>
            <li>O componente ProductInfo.tsx usa a lógica: variante selecionada OU estoque principal</li>
          </ul>
        </div>
      </div>
    </div>
  );
}