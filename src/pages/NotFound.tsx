import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { buildProductUrl } from '@/utils/productUrl';

interface Product {
  id: string;
  nome: string;
  preco: number;
  imagem_url: string | null;
  categoria_nome: string;
}

const NotFound: React.FC = () => {
  const location = useLocation();
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mensagens dinâmicas de erro
  const errorMessages = [
    "Ops! Parece que você se perdeu no universo da beleza...",
    "Página não encontrada - mas temos muitas belezas para descobrir!",
    "404 - Esta página fugiu para um spa day!",
    "Parece que esta página está de folga... que tal explorar nossas novidades?",
    "Ah não! Esta página foi para o salão e ainda não voltou!"
  ];

  const randomMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];

  // Carregar produtos recentes
  useEffect(() => {
    const fetchRecentProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('produtos')
          .select(`
            id,
            nome,
            preco,
            imagem_url,
            categorias:nome
          `)
          .eq('ativo', true)
          .order('created_at', { ascending: false })
          .limit(4);

        if (error) {
          console.error('Erro ao carregar produtos:', error);
        } else {
          setRecentProducts(data || []);
        }
      } catch (error) {
        console.error('Erro:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentProducts();

    // Atualizar horário a cada minuto
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Contatos do WhatsApp
  const whatsappContacts = [
    {
      nome: "Suporte Sempre Bela",
      numero: "559999999999",
      mensagem: "Olá! Preciso de ajuda com o site Sempre Bela.",
      horario: "Seg a Sex: 8h-18h, Sáb: 9h-13h"
    },
    {
      nome: "Vendas Sempre Bela", 
      numero: "559988888888",
      mensagem: "Olá! Gostaria de informações sobre produtos.",
      horario: "Seg a Dom: 8h-22h"
    }
  ];

  const openWhatsApp = (numero: string, mensagem: string) => {
    const text = encodeURIComponent(mensagem);
    window.open(`https://wa.me/${numero}?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white dark:bg-gray-800 rounded-full shadow-lg mb-6">
            <span className="text-4xl font-bold text-pink-600">404</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
            {randomMessage}
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            A página <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{location.pathname}</code> 
            não foi encontrada. Mas não se preocupe, temos muitas opções incríveis para você!
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Link
              to="/"
              className="px-8 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-semibold"
            >
              🏠 Ir para Home
            </Link>
            
            <Link
              to="/product"
              className="px-8 py-3 border-2 border-pink-600 text-pink-600 dark:text-pink-400 rounded-lg hover:bg-pink-600 hover:text-white transition-colors font-semibold"
            >
              💄 Ver Produtos
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="px-8 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold"
            >
              ↩️ Voltar
            </button>
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            📍 {currentTime.toLocaleString('pt-BR')}
          </div>
        </div>

        {/* Seção de Contatos WhatsApp */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
            💬 Precisa de Ajuda?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {whatsappContacts.map((contact, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📱</span>
                </div>
                
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                  {contact.nome}
                </h3>
                
                <p className="text-green-600 dark:text-green-400 font-medium mb-3">
                  {contact.horario}
                </p>
                
                <button
                  onClick={() => openWhatsApp(contact.numero, contact.mensagem)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <span>💬 WhatsApp</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Seção de Produtos Recentes */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
            🌟 Produtos em Destaque
          </h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Carregando produtos...</p>
            </div>
          ) : recentProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentProducts.map((product) => (
                <Link
                  key={product.id}
                  to={buildProductUrl({ id: product.id, nome: product.nome, slug: (product as any).slug })}
                  className="group block bg-gray-50 dark:bg-gray-700 rounded-xl p-4 hover:shadow-lg transition-all duration-300"
                >
                  <div className="aspect-square bg-gray-200 dark:bg-gray-600 rounded-lg mb-4 overflow-hidden">
                    {product.imagem_url ? (
                      <img
                        src={product.imagem_url}
                        alt={product.nome}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-2xl">💄</span>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors">
                    {product.nome}
                  </h3>
                  
                  <p className="text-pink-600 dark:text-pink-400 font-bold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(product.preco)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <span className="text-4xl mb-4">😴</span>
              <p className="text-gray-600 dark:text-gray-400">Nenhum produto disponível no momento</p>
            </div>
          )}
          
          <div className="text-center mt-8">
            <Link
              to="/product"
              className="inline-flex items-center px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-semibold"
            >
              👀 Ver Todos os Produtos
              <span className="ml-2">→</span>
            </Link>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-lg">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">🚚</span>
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Entrega Rápida</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Entregamos para todo o Brasil</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-lg">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">💳</span>
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Pagamento Seguro</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Diversas formas de pagamento</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-lg">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">⭐</span>
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Qualidade Garantida</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Produtos de alta qualidade</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;