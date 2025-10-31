import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);

    try {
      const response = await fetch('https://portaln8n.semprebellabalsas.com.br/webhook/captura_email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        navigate('/obrigado-inscricao');
      } else {
        // Tratar erro, talvez com um toast
        console.error('Erro ao inscrever e-mail');
      }
    } catch (error) {
      console.error('Erro ao se comunicar com o webhook:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 bg-pink-600">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Inscreva-se e Ganhe 10% OFF
        </h2>
        <p className="text-white/90 mb-8 max-w-2xl mx-auto">
          Receba em primeira mão nossas novidades, promoções exclusivas e dicas de moda
        </p>
        <form onSubmit={handleSubmit} className="max-w-md mx-auto flex gap-2">
          <input
            type="email"
            placeholder="Seu melhor e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
            required
            disabled={loading}
          />
          <button 
            type="submit"
            className="px-6 py-3 bg-white text-pink-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Inscrever'}
          </button>
        </form>
      </div>
    </section>
  );
}