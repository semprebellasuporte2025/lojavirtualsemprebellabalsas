
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import SEOHead from '../../components/feature/SEOHead';

export default function SobreNosPage() {
  return (
    <>
      <SEOHead
        title="Sobre Nós - Sempre Bella Balsas"
        description="Conheça a história da Sempre Bella Balsas, sua loja de moda feminina em Balsas - MA. Qualidade, estilo e atendimento personalizado."
        keywords="sobre nós, sempre bella balsas, moda feminina balsas, loja feminina maranhão"
      />
      <div className="min-h-screen bg-white">
        <Header />
        
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-r from-pink-50 to-purple-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
                Sobre a Sempre Bella
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Sua loja de moda feminina em Balsas - MA, oferecendo estilo, qualidade e elegância 
                para mulheres que valorizam a beleza em cada detalhe.
              </p>
            </div>
          </div>
        </section>

        {/* Nossa História */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Nossa História</h2>
                <div className="space-y-4 text-gray-600 leading-relaxed">
                  <p>
                    A Sempre Bella nasceu com o sonho de trazer para Balsas - MA as últimas tendências da moda feminina, combinando qualidade, estilo e preços acessíveis.
                  </p>
                  <p>
                    Começamos como uma pequena loja no centro da cidade e, ao longo dos anos, conquistamos a confiança de centenas de clientes que buscam peças únicas e atendimento personalizado.
                  </p>
                  <p>
                    Somos uma loja de moda feminina criada para valorizar o estilo e a elegância de cada mulher.
                  </p>
                  <p>
                    Trabalhamos com peças que unem qualidade, conforto e tendência — desde a alfaiataria refinada até looks casuais e modernos.
                  </p>
                  <p>
                    Nosso propósito é fazer você se sentir ainda mais confiante, linda e única em cada ocasião.
                  </p>
                  <p>
                    Hoje, além da nossa loja física, oferecemos uma experiência completa de compras online, levando moda e estilo para toda a região do sul do Maranhão.
                  </p>
                </div>
              </div>
              <div className="relative">
                <img
                  src="https://readdy.ai/api/search-image?query=elegant%20fashion%20boutique%20store%20interior%20with%20beautiful%20clothing%20displays%2C%20modern%20lighting%2C%20pink%20and%20white%20color%20scheme%2C%20professional%20photography%2C%20clean%20and%20sophisticated%20atmosphere&width=600&height=400&seq=sobre-historia&orientation=landscape"
                  alt="Interior da loja Sempre Bella"
                  className="w-full h-96 object-cover object-top rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Missão, Visão e Valores */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">
              Nossos Valores
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-heart-fill text-2xl text-pink-600"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Missão</h3>
                <p className="text-gray-600">
                  Proporcionar às mulheres de Balsas e região uma experiência única de compras, 
                  oferecendo moda de qualidade com atendimento personalizado e carinhoso.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-eye-fill text-2xl text-purple-600"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Visão</h3>
                <p className="text-gray-600">
                  Ser reconhecida como a principal referência em moda feminina no sul do Maranhão, 
                  sempre inovando e surpreendendo nossas clientes.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-star-fill text-2xl text-blue-600"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Valores</h3>
                <p className="text-gray-600">
                  Qualidade, autenticidade, respeito ao cliente, inovação e compromisso com a 
                  satisfação de cada mulher que escolhe a Sempre Bella.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Seção de equipe removida conforme solicitação */}

        {/* Localização */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Visite Nossa Loja</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <i className="ri-map-pin-fill text-pink-600 text-xl mt-1"></i>
                    <div>
                      <p className="font-semibold text-gray-800">Endereço</p>
                      <p className="text-gray-600">Rua Major Felipe, Centro<br />CEP: 65840000, São Raimundo das Mangabeiras/MA</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <i className="ri-time-fill text-pink-600 text-xl mt-1"></i>
                    <div>
                      <p className="font-semibold text-gray-800">Horário de Funcionamento</p>
                      <p className="text-gray-600">
                        Segunda a Sexta: 8h às 18h<br />
                        Sábado: 7h às 12h
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <i className="ri-phone-fill text-pink-600 text-xl mt-1"></i>
                    <div>
                      <p className="font-semibold text-gray-800">Telefone</p>
                      <p className="text-gray-600">(99) 99134-5178<br />(99) 98550-2075</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31780.53533333333!2d-45.50111111111111!3d-7.019722222222222!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x92d8f5a5f5f5f5f5%3A0x4f5f5f5f5f5f5f5f!2sS%C3%A3o%20Raimundo%20das%20Mangabeiras%2C%20MA!5e0!3m2!1sen!2sbr!4v1689280000000"
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-lg shadow-lg"
                ></iframe>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
