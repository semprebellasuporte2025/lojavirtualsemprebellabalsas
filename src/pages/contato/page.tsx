
import { useState } from 'react';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import SEOHead from '../../components/feature/SEOHead';

export default function ContatoPage() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    assunto: '',
    mensagem: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      const response = await fetch('https://readdy.ai/api/form/submit/contato-sempre-bella', {
        method: 'POST',
        body: formDataToSend
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          nome: '',
          email: '',
          telefone: '',
          assunto: '',
          mensagem: ''
        });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Contato - Sempre Bella Balsas"
        description="Entre em contato com a Sempre Bella Balsas. Tire suas dúvidas, faça sugestões ou solicite atendimento personalizado."
        keywords="contato, sempre bella balsas, atendimento, dúvidas, suporte"
      />
      <div className="min-h-screen bg-white">
        <Header />
        
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-r from-pink-50 to-purple-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
                Entre em Contato
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Estamos aqui para ajudar! Tire suas dúvidas, faça sugestões ou solicite 
                atendimento personalizado. Nossa equipe está pronta para atendê-la.
              </p>
            </div>
          </div>
        </section>

        {/* Informações de Contato */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="text-center">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-map-pin-fill text-2xl text-pink-600"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Endereço</h3>
                <p className="text-gray-600">
                  Rua das Flores, 123 - Centro<br />
                  Balsas - MA, 65800-000
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-phone-fill text-2xl text-purple-600"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Telefone</h3>
                <p className="text-gray-600">
                  (99) 3541-2345<br />
                  (99) 99876-5432
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-mail-fill text-2xl text-blue-600"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">E-mail</h3>
                <p className="text-gray-600">
                  contato@semprebella.com.br<br />
                  vendas@semprebella.com.br
                </p>
              </div>
            </div>

            {/* Horários de Atendimento */}
            <div className="bg-gray-50 rounded-lg p-8 mb-16">
              <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
                Horários de Atendimento
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Loja Física</h3>
                  <div className="space-y-2 text-gray-600">
                    <p><span className="font-medium">Segunda a Sexta:</span> 8h às 18h</p>
                    <p><span className="font-medium">Sábado:</span> 8h às 17h</p>
                    <p><span className="font-medium">Domingo:</span> 8h às 12h</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Atendimento Online</h3>
                  <div className="space-y-2 text-gray-600">
                    <p><span className="font-medium">WhatsApp:</span> 8h às 20h</p>
                    <p><span className="font-medium">E-mail:</span> 24h (resposta em até 24h)</p>
                    <p><span className="font-medium">Chat Online:</span> 8h às 18h</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Formulário de Contato */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  Envie sua Mensagem
                </h2>
                <p className="text-gray-600">
                  Preencha o formulário abaixo e entraremos em contato o mais breve possível.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-8">
                <form onSubmit={handleSubmit} data-readdy-form id="contato-sempre-bella">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        id="nome"
                        name="nome"
                        value={formData.nome}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        E-mail *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone
                      </label>
                      <input
                        type="tel"
                        id="telefone"
                        name="telefone"
                        value={formData.telefone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                        placeholder="(99) 99999-9999"
                      />
                    </div>
                    <div>
                      <label htmlFor="assunto" className="block text-sm font-medium text-gray-700 mb-2">
                        Assunto *
                      </label>
                      <select
                        id="assunto"
                        name="assunto"
                        value={formData.assunto}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm pr-8"
                      >
                        <option value="">Selecione um assunto</option>
                        <option value="duvida-produto">Dúvida sobre produto</option>
                        <option value="pedido">Informações sobre pedido</option>
                        <option value="troca-devolucao">Troca ou devolução</option>
                        <option value="sugestao">Sugestão</option>
                        <option value="reclamacao">Reclamação</option>
                        <option value="elogio">Elogio</option>
                        <option value="outros">Outros</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label htmlFor="mensagem" className="block text-sm font-medium text-gray-700 mb-2">
                      Mensagem *
                    </label>
                    <textarea
                      id="mensagem"
                      name="mensagem"
                      value={formData.mensagem}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      maxLength={500}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm resize-none"
                      placeholder="Descreva sua mensagem aqui..."
                    ></textarea>
                    <p className="text-xs text-gray-500 mt-1">
                      Máximo 500 caracteres ({formData.mensagem.length}/500)
                    </p>
                  </div>

                  {submitStatus === 'success' && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <i className="ri-check-circle-fill text-green-600 text-xl mr-3"></i>
                        <p className="text-green-800">
                          Mensagem enviada com sucesso! Entraremos em contato em breve.
                        </p>
                      </div>
                    </div>
                  )}

                  {submitStatus === 'error' && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center">
                        <i className="ri-error-warning-fill text-red-600 text-xl mr-3"></i>
                        <p className="text-red-800">
                          Erro ao enviar mensagem. Tente novamente ou entre em contato por telefone.
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <i className="ri-loader-4-line animate-spin mr-2"></i>
                        Enviando...
                      </span>
                    ) : (
                      'Enviar Mensagem'
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Mapa */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">
              Nossa Localização
            </h2>
            <div className="max-w-4xl mx-auto">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3973.123456789!2d-46.0356789!3d-7.5323456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zN8KwMzEnNTYuNCJTIDQ2wrAwMicwOC40Ilc!5e0!3m2!1spt-BR!2sbr!4v1234567890"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="rounded-lg shadow-lg"
              ></iframe>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
