
import { useState } from 'react';
import AdminLayout from '../../../../components/feature/AdminLayout';
import { useToast } from '../../../../hooks/useToast';

export default function ConfiguracoesIntegracaoPage() {
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    // Pagamentos (apenas Mercado Pago)
    mercadoPagoAtivo: false,
    mercadoPagoPublicKey: '',
    mercadoPagoAccessToken: '',
    mercadoPagoSandbox: true,
    
    // Correios
    correiosAtivo: true,
    correiosUsuario: '',
    correiosSenha: '',
    correiosCodAdmin: '',
    
    // Redes Sociais
    facebookAtivo: false,
    facebookAppId: '',
    facebookAppSecret: '',
    
    instagramAtivo: true,
    instagramToken: '',
    
    whatsappAtivo: true,
    whatsappNumero: '5599999999999',
    whatsappToken: '',
    
    // Analytics
    googleAnalyticsAtivo: false,
    googleAnalyticsId: '',
    
    facebookPixelAtivo: false,
    facebookPixelId: '',
    
    // (Abas Marketing e ERP removidas)
  });

  const [activeTab, setActiveTab] = useState('pagamentos');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Integrações salvas com sucesso!', 'success');
  };

  const testarIntegracao = (tipo: string) => {
    alert(`Testando integração com ${tipo}...`);
  };

  const tabs = [
    { id: 'pagamentos', label: 'Pagamentos', icon: 'ri-bank-card-line' },
    { id: 'correios', label: 'Correios', icon: 'ri-truck-line' },
    { id: 'social', label: 'Redes Sociais', icon: 'ri-share-line' },
    { id: 'analytics', label: 'Analytics', icon: 'ri-bar-chart-line' },
    // abas Marketing e ERP removidas conforme solicitação
  ];

  return (
    <>
      <AdminLayout>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações de Integração</h1>
            <p className="text-gray-600 dark:text-gray-400">Configure integrações com serviços externos</p>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-pink-500 text-pink-600 dark:text-pink-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <i className={tab.icon}></i>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tab Pagamentos */}
            {activeTab === 'pagamentos' && (
              <div className="space-y-6">
                {/* Mercado Pago */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <img src="https://readdy.ai/api/search-image?query=mercado%20pago%20logo%20icon&width=32&height=32&seq=mp1&orientation=squarish" alt="Mercado Pago" className="w-8 h-8 mr-2" />
                      Mercado Pago
                    </h2>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="mercadoPagoAtivo"
                        checked={formData.mercadoPagoAtivo}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
                    </label>
                  </div>
                  {formData.mercadoPagoAtivo && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Public Key
                          </label>
                          <input
                            type="text"
                            name="mercadoPagoPublicKey"
                            value={formData.mercadoPagoPublicKey}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Access Token
                          </label>
                          <input
                            type="password"
                            name="mercadoPagoAccessToken"
                            value={formData.mercadoPagoAccessToken}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ambiente de testes (Sandbox)</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="mercadoPagoSandbox"
                            checked={formData.mercadoPagoSandbox}
                            onChange={handleInputChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Stripe removido conforme solicitação */}
              </div>
            )}

            {/* Tab Correios */}
            {activeTab === 'correios' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <i className="ri-truck-line text-2xl mr-2 text-yellow-600"></i>
                    Correios
                  </h2>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="correiosAtivo"
                      checked={formData.correiosAtivo}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none 
                    peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 
                    rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full 
                    peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
                    after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full 
                    after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
                  </label>
                </div>
                {formData.correiosAtivo && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Usuário
                        </label>
                        <input
                          type="text"
                          name="correiosUsuario"
                          value={formData.correiosUsuario}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                          rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent 
                          dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Senha
                        </label>
                        <input
                          type="password"
                          name="correiosSenha"
                          value={formData.correiosSenha}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                          rounded-lg focus:ring-2 focus:ring-pink-5
                          00 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Código Administrativo
                        </label>
                        <input
                          type="text"
                          name="correiosCodAdmin"
                          value={formData.correiosCodAdmin}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                          rounded-lg focus:ring-2 focus:ring-pink-5
                          00 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => testarIntegracao('Correios')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-7
                      00"
                    >
                      Testar Integração
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab Redes Sociais */}
            {activeTab === 'social' && (
              <div className="space-y-6">
                {/* WhatsApp */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <i className="ri-whatsapp-line text-2xl mr-2 text-green-600"></i>
                      WhatsApp Business
                    </h2>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="whatsappAtivo"
                        checked={formData.whatsappAtivo}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none 
                      peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 
                      rounded-full peer dark:bg-gray-700 
                      peer-checked:after:translate-x-full peer-checked:after:border-white 
                      after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                      after:bg-white after:border-gray-300 after:border after:rounded-full 
                      after:h-5 after:w-5 after:transition-all dark:border-gray-600 
                      peer-checked:bg-pink-600"></div>
                    </label>
                  </div>
                  {formData.whatsappAtivo && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Número do WhatsApp
                        </label>
                        <input
                          type="text"
                          name="whatsappNumero"
                          value={formData.whatsappNumero}
                          onChange={handleInputChange}
                          placeholder="5599999999999"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                          rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent 
                          dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Instagram */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <i className="ri-instagram-line text-2xl mr-2 text-pink-600"></i>
                      Instagram
                    </h2>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="instagramAtivo"
                        checked={formData.instagramAtivo}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none 
                      peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 
                      rounded-full peer dark:bg-gray-700 
                      peer-checked:after:translate-x-full peer-checked:after:border-white 
                      after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                      after:bg-white after:border-gray-300 after:border after:rounded-full 
                      after:h-5 after:w-5 after:transition-all dark:border-gray-600 
                      peer-checked:bg-pink-600"></div>
                    </label>
                  </div>
                  {formData.instagramAtivo && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Access Token
                        </label>
                        <input
                          type="text"
                          name="instagramToken"
                          value={formData.instagramToken}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                          rounded-lg focus:ring-2 focus:ring-pink-5
                          00 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab Analytics */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {/* Google Analytics */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex 
                    items-center">
                      <img src="https://readdy.ai/api/search-image?query=google%20analytics%20logo%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20icon%20ga4&width=32&height=32&seq=ga1&orientation=squarish" 
                      alt="Google Analytics" className="w-8 h-8 mr-2" />
                      Google Analytics
                    </h2>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="googleAnalyticsAtivo"
                        checked={formData.googleAnalyticsAtivo}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none 
                      peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 
                      rounded-full peer dark:bg-gray-700 
                      peer-checked:after:translate-x-full peer-checked:after:border-white 
                      after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                      after:bg-white after:border-gray-300 after:border after:rounded-full 
                      after:h-5 after:w-5 after:transition-all dark:border-gray-600 
                      peer-checked:bg-pink-600"></div>
                    </label>
                  </div>
                  {formData.googleAnalyticsAtivo && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 
                        dark:text-gray-300 mb-2">
                          Measurement ID (GA4)
                        </label>
                        <input
                          type="text"
                          name="googleAnalyticsId"
                          value={formData.googleAnalyticsId}
                          onChange={handleInputChange}
                          placeholder="G-XXXXXXXXXX"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                          rounded-lg focus:ring-2 focus:ring-pink-5
                          00 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Facebook Pixel */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white 
                    flex items-center">
                      <i className="ri-facebook-line text-2xl mr-2 text-blue-600"></i>
                      Facebook Pixel
                    </h2>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="facebookPixelAtivo"
                        checked={formData.facebookPixelAtivo}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none 
                      peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 
                      rounded-full peer dark:bg-gray-700 
                      peer-checked:after:translate-x-full peer-checked:after:border-white 
                      after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                      after:bg-white after:border-gray-300 after:border after:rounded-full 
                      after:h-5 after:w-5 after:transition-all dark:border-gray-600 
                      peer-checked:bg-pink-600"></div>
                    </label>
                  </div>
                  {formData.facebookPixelAtivo && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 
                        dark:text-gray-300 mb-2">
                          Pixel ID
                        </label>
                        <input
                          type="text"
                          name="facebookPixelId"
                          value={formData.facebookPixelId}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                          rounded-lg focus:ring-2 focus:ring-pink-5
                          00 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 whitespace-nowrap"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      </AdminLayout>
    </>
  );
}
