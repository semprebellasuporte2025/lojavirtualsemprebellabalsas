
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import SEOHead from '../../components/feature/SEOHead';
import Newsletter from '../../components/feature/Newsletter';

export default function FreteEntregaPage() {
  return (
    <>
      <SEOHead
        title="Frete e Entrega - Sempre Bella Balsas"
        description="Conheça nossas opções de frete e entrega. Frete grátis para Balsas - MA e entrega rápida para todo o Brasil."
        keywords="frete, entrega, frete grátis balsas, entrega rápida, correios"
      />
      <div className="min-h-screen bg-white">
        <Header />
        
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-r from-pink-50 to-purple-50">
          <div className="container mx-auto px-10 sm:px-14 lg:px-20 xl:px-28 2xl:px-36">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
                Frete e Entrega
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Entregamos suas peças favoritas com segurança e rapidez. 
                Confira nossas opções de frete e prazos de entrega.
              </p>
            </div>
          </div>
        </section>
        
        {/* Frete Grátis */}
        <section className="py-16">
          <div className="container mx-auto px-10 sm:px-14 lg:px-20 xl:px-28 2xl:px-36">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-8 mb-16">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="ri-truck-line text-3xl text-green-600"></i>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Frete Grátis em Balsas e Mangabeiras - MA</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Entregamos para todo Brasil, oferecemos frete grátis para Balsas e Mangabeiras MA com entrega em 1 dia útil e frete grátis nas compras acima de R$ 499,00.
                  </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
                  <div className="bg-white rounded-lg p-6 shadow-md">
                    <p className="font-semibold text-gray-800">Entrega Rápida</p>
                    <p className="text-sm text-gray-600">até 1 dia útil para Balsas e Mangabeiras - MA</p>
                  </div>
                  <div className="bg-white rounded-lg p-6 shadow-md">
                    <p className="font-semibold text-gray-800">Área de Cobertura</p>
                    <p className="text-sm text-gray-600">Entregamos para todo o Brasil</p>
                  </div>
                  <div className="bg-white rounded-lg p-6 shadow-md">
                    <p className="font-semibold text-gray-800">Rastreamento</p>
                    <p className="text-sm text-gray-600">Entrega garantida</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <Newsletter />

        <Footer />
      </div>
    </>
  );
}
