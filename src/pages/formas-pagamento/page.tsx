
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import SEOHead from '../../components/feature/SEOHead';

export default function FormasPagamentoPage() {
  return (
    <>
      <SEOHead
        title="Formas de Pagamento - Sempre Bella Balsas"
        description="Conheça todas as formas de pagamento aceitas na Sempre Bella Balsas. PIX, cartões, boleto e parcelamento sem juros."
        keywords="formas de pagamento, pix, cartão de crédito, boleto, parcelamento, sempre bella"
      />
      <div className="min-h-screen bg-white">
        <Header />
        
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-r from-pink-50 to-purple-50">
          <div className="container mx-auto px-10 sm:px-14 lg:px-20 xl:px-28 2xl:px-36">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
                Formas de Pagamento
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Oferecemos diversas opções de pagamento para facilitar sua compra. 
                Escolha a forma que mais se adequa ao seu perfil.
              </p>
            </div>
          </div>
        </section>

        {/* PIX em Destaque */}
        <section className="py-16">
          <div className="container mx-auto px-10 sm:px-14 lg:px-20 xl:px-28 2xl:px-36">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-8 mb-16">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="ri-qr-code-fill text-3xl text-green-600"></i>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  PIX - Desconto de até 20%
                </h2>
                <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                  Pague com PIX e ganhe até 20% de desconto em toda sua compra! 
                  Aprovação instantânea e produto enviado no mesmo dia.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                  <div className="text-center">
                    <i className="ri-flashlight-fill text-2xl text-green-600 mb-2"></i>
                    <p className="font-semibold text-gray-800">Instantâneo</p>
                    <p className="text-sm text-gray-600">Aprovação imediata</p>
                  </div>
                  <div className="text-center">
                    <i className="ri-percent-fill text-2xl text-green-600 mb-2"></i>
                    <p className="font-semibold text-gray-800">Até 20% de Desconto</p>
                    <p className="text-sm text-gray-600">Em toda sua compra</p>
                  </div>
                  <div className="text-center">
                    <i className="ri-shield-check-fill text-2xl text-green-600 mb-2"></i>
                    <p className="font-semibold text-gray-800">Seguro</p>
                    <p className="text-sm text-gray-600">Transação protegida</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Formas de Pagamento */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-10 sm:px-14 lg:px-20 xl:px-28 2xl:px-36">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">
              Todas as Formas de Pagamento
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              
              {/* PIX */}
              <div className="bg-white rounded-lg p-6 shadow-lg border-2 border-green-200">
                <div className="text-center mb-4">
                  <i className="ri-qr-code-fill text-4xl text-green-600 mb-3"></i>
                  <h3 className="text-xl font-semibold text-gray-800">PIX</h3>
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mt-2">
                    Até 20% de desconto
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Aprovação:</span>
                    <span className="font-semibold text-green-600">Instantânea</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Desconto:</span>
                    <span className="font-semibold text-green-600">Até 20%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Disponível:</span>
                    <span className="font-semibold">24h por dia</span>
                  </div>
                </div>
              </div>

              {/* Cartão de Crédito */}
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <div className="text-center mb-4">
                  <i className="ri-bank-card-fill text-4xl text-blue-600 mb-3"></i>
                  <h3 className="text-xl font-semibold text-gray-800">Cartão de Crédito</h3>
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-2">
                    Até 6x sem juros
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Parcelamento:</span>
                    <span className="font-semibold">Até 6x sem juros</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Aprovação:</span>
                    <span className="font-semibold">Até 2 horas</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bandeiras:</span>
                    <span className="font-semibold">Todas aceitas</span>
                  </div>
                </div>
              </div>

              {/* Cartão de Débito */}
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <div className="text-center mb-4">
                  <i className="ri-bank-card-2-fill text-4xl text-purple-600 mb-3"></i>
                  <h3 className="text-xl font-semibold text-gray-800">Cartão de Débito</h3>
                  <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full mt-2">
                    À vista
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Aprovação:</span>
                    <span className="font-semibold">Instantânea</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Desconto:</span>
                    <span className="font-semibold text-purple-600">2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bandeiras:</span>
                    <span className="font-semibold">Visa, Master</span>
                  </div>
                </div>
              </div>

              {/* Dinheiro (Loja Física) */}
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <div className="text-center mb-4">
                  <i className="ri-money-dollar-circle-fill text-4xl text-green-600 mb-3"></i>
                  <h3 className="text-xl font-semibold text-gray-800">Dinheiro</h3>
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mt-2">
                    Loja física
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Local:</span>
                    <span className="font-semibold">Loja física</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Desconto:</span>
                    <span className="font-semibold text-green-600">7%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Horário:</span>
                    <span className="font-semibold">8h às 18h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bandeiras Aceitas */}
        <section className="py-16">
          <div className="container mx-auto px-10 sm:px-14 lg:px-20 xl:px-28 2xl:px-36">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">
              Bandeiras de Cartão Aceitas
            </h2>
            <div className="flex flex-wrap justify-center items-center gap-8 max-w-4xl mx-auto">
              <div className="bg-white rounded-lg p-4 shadow-lg">
                <img
                  src="https://readdy.ai/api/search-image?query=visa%20credit%20card%20logo%20official%20brand%20identity%20blue%20and%20white%20colors%20clean%20background&width=120&height=80&seq=visa-logo&orientation=landscape"
                  alt="Visa"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <div className="bg-white rounded-lg p-4 shadow-lg">
                <img
                  src="https://readdy.ai/api/search-image?query=mastercard%20logo%20official%20brand%20identity%20red%20and%20yellow%20circles%20clean%20background&width=120&height=80&seq=master-logo&orientation=landscape"
                  alt="Mastercard"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <div className="bg-white rounded-lg p-4 shadow-lg">
                <img
                  src="https://readdy.ai/api/search-image?query=american%20express%20logo%20official%20brand%20identity%20blue%20color%20clean%20background&width=120&height=80&seq=amex-logo&orientation=landscape"
                  alt="American Express"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <div className="bg-white rounded-lg p-4 shadow-lg">
                <img
                  src="https://readdy.ai/api/search-image?query=elo%20card%20logo%20official%20brand%20identity%20yellow%20and%20blue%20colors%20clean%20background&width=120&height=80&seq=elo-logo&orientation=landscape"
                  alt="Elo"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <div className="bg-white rounded-lg p-4 shadow-lg">
                <img
                  src="https://readdy.ai/api/search-image?query=hipercard%20logo%20official%20brand%20identity%20red%20color%20clean%20background&width=120&height=80&seq=hiper-logo&orientation=landscape"
                  alt="Hipercard"
                  className="h-12 w-auto object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Segurança */}
        <section className="py-16">
          <div className="container mx-auto px-10 sm:px-14 lg:px-20 xl:px-28 2xl:px-36">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">
              Segurança em Primeiro Lugar
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-shield-check-fill text-2xl text-green-600"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">SSL Certificado</h3>
                <p className="text-gray-600 text-sm">
                  Todas as transações são protegidas por certificado SSL de 256 bits, 
                  garantindo total segurança dos seus dados.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-lock-fill text-2xl text-blue-600"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Dados Protegidos</h3>
                <p className="text-gray-600 text-sm">
                  Não armazenamos dados do seu cartão. Todas as informações são 
                  processadas diretamente pelas operadoras.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-verified-badge-fill text-2xl text-purple-600"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Loja Verificada</h3>
                <p className="text-gray-600 text-sm">
                  Somos uma loja verificada e certificada, com anos de experiência 
                  no mercado de moda feminina.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
