
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import SEOHead from '../../components/feature/SEOHead';

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
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Frete Grátis em Balsas - MA</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Para toda Balsas - MA, oferecemos frete grátis com entrega em 1 dia útil.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
                  <div className="bg-white rounded-lg p-6 shadow-md">
                    <p className="font-semibold text-gray-800">Entrega Rápida</p>
                    <p className="text-sm text-gray-600">1 dia útil</p>
                  </div>
                  <div className="bg-white rounded-lg p-6 shadow-md">
                    <p className="font-semibold text-gray-800">Área de Cobertura</p>
                    <p className="text-sm text-gray-600">Toda Balsas - MA</p>
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
        
        {/* Opções de Frete */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-10 sm:px-14 lg:px-20 xl:px-28 2xl:px-36">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">
              Opções de Frete
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <div className="text-center mb-4">
                  <i className="ri-home-fill text-3xl text-pink-600 mb-3"></i>
                  <h3 className="text-xl font-semibold text-gray-800">Entrega Local</h3>
                  <p className="text-sm text-gray-600">Balsas - MA</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor:</span>
                    <span className="font-semibold text-green-600">Grátis</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Prazo:</span>
                    <span className="font-semibold">1 dia útil</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rastreamento:</span>
                    <span className="font-semibold">Disponível</span>
                  </div>
                </div>
              </div>
              {/* ... existing cards ... */}
            </div>
          </div>
        </section>
        
        {/* Prazos por Região */}
        <section className="py-16">
          <div className="container mx-auto px-10 sm:px-14 lg:px-20 xl:px-28 2xl:px-36">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">
              Prazos de Entrega por Região
            </h2>
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Região</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-800">PAC</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-800">SEDEX</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-800">Valor Médio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* ... existing rows ... */}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Informações Importantes */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-10 sm:px-14 lg:px-20 xl:px-28 2xl:px-36">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">
              Informações Importantes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <i className="ri-shield-check-line text-2xl text-green-600 mr-2"></i>
                  Segurança
                </h3>
                <p className="text-gray-600">
                  Utilizamos embalagens seguras para proteger seus produtos durante o transporte.
                </p>
              </div>
              {/* ... other info cards ... */}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
