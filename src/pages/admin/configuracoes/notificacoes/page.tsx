
import { useState } from 'react';
import AdminLayout from '../../../../components/feature/AdminLayout';
import { useToast } from '../../../../hooks/useToast';

export default function ConfiguracoesNotificacoesPage() {
  const [formData, setFormData] = useState({
    // Notificações por Email
    emailNovaVenda: true,
    emailEstoqueBaixo: true,
    emailNovoCliente: false,
    emailBackup: true,
    emailErroSistema: true,
    emailRelatorios: false,
    
    // Notificações por SMS
    smsNovaVenda: false,
    smsEstoqueBaixo: true,
    smsErroSistema: false,
    
    // Notificações Push
    pushNovaVenda: true,
    pushEstoqueBaixo: true,
    pushNovoCliente: true,
    
    // Configurações de Email
    servidorEmail: 'smtp.gmail.com',
    portaEmail: '587',
    emailRemetente: 'sistema@semprebellabalsas.com.br',
    nomeRemetente: 'Sempre Bella Balsas',
    usuarioEmail: '',
    senhaEmail: '',
    criptografiaEmail: 'tls',
    
    // Configurações de SMS
    provedorSms: 'twilio',
    apiKeySms: '',
    numeroRemetenteSms: '',
    
    // Configurações Gerais
    horarioSilencioso: true,
    inicioSilencio: '22:00',
    fimSilencio: '08:00',
    limiteDiario: '50',
    templatePersonalizado: false
  });

  const [testEmail, setTestEmail] = useState('');
  const [testSms, setTestSms] = useState('');

  const { toast, showToast, hideToast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Configurações de notificações salvas com sucesso!', 'success');
  };

  const enviarTesteEmail = () => {
    if (!testEmail) {
      alert('Digite um email para teste');
      return;
    }
    alert(`Email de teste enviado para: ${testEmail}`);
    setTestEmail('');
  };

  const enviarTesteSms = () => {
    if (!testSms) {
      alert('Digite um número para teste');
      return;
    }
    alert(`SMS de teste enviado para: ${testSms}`);
    setTestSms('');
  };

  return (
      <AdminLayout>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações de Notificações</h1>
            <p className="text-gray-600 dark:text-gray-400">Configure quando e como receber notificações</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Notificações por Email */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <i className="ri-mail-line mr-2"></i>
                Notificações por Email
              </h2>
              <div className="space-y-3">
                {[
                  { key: 'emailNovaVenda', label: 'Nova Venda Realizada', desc: 'Receber email quando uma nova venda for realizada' },
                  { key: 'emailEstoqueBaixo', label: 'Estoque Baixo', desc: 'Alertas quando produtos estiverem com estoque baixo' },
                  { key: 'emailNovoCliente', label: 'Novo Cliente Cadastrado', desc: 'Notificação de novos cadastros de clientes' },
                  { key: 'emailBackup', label: 'Backup Concluído', desc: 'Confirmação quando backup for realizado' },
                  { key: 'emailErroSistema', label: 'Erros do Sistema', desc: 'Alertas críticos de funcionamento do sistema' },
                  { key: 'emailRelatorios', label: 'Relatórios Automáticos', desc: 'Envio automático de relatórios periódicos' }
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-2">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {item.label}
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name={item.key}
                        checked={formData[item.key as keyof typeof formData] as boolean}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Notificações por SMS */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <i className="ri-message-3-line mr-2"></i>
                Notificações por SMS
              </h2>
              <div className="space-y-3">
                {[
                  { key: 'smsNovaVenda', label: 'Nova Venda Realizada', desc: 'SMS imediato para vendas importantes' },
                  { key: 'smsEstoqueBaixo', label: 'Estoque Crítico', desc: 'Alertas urgentes de estoque zerado' },
                  { key: 'smsErroSistema', label: 'Erros Críticos', desc: 'Falhas graves que precisam atenção imediata' }
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-2">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {item.label}
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name={item.key}
                        checked={formData[item.key as keyof typeof formData] as boolean}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Notificações Push */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <i className="ri-notification-3-line mr-2"></i>
                Notificações Push (Navegador)
              </h2>
              <div className="space-y-3">
                {[
                  { key: 'pushNovaVenda', label: 'Nova Venda', desc: 'Notificação instantânea no navegador' },
                  { key: 'pushEstoqueBaixo', label: 'Estoque Baixo', desc: 'Alertas visuais no painel' },
                  { key: 'pushNovoCliente', label: 'Novo Cliente', desc: 'Notificação de novos cadastros' }
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-2">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {item.label}
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name={item.key}
                        checked={formData[item.key as keyof typeof formData] as boolean}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Configurações de Email */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Configurações de Email</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Servidor SMTP
                  </label>
                  <input
                    type="text"
                    name="servidorEmail"
                    value={formData.servidorEmail}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Porta
                  </label>
                  <input
                    type="text"
                    name="portaEmail"
                    value={formData.portaEmail}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Remetente
                  </label>
                  <input
                    type="email"
                    name="emailRemetente"
                    value={formData.emailRemetente}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome do Remetente
                  </label>
                  <input
                    type="text"
                    name="nomeRemetente"
                    value={formData.nomeRemetente}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Usuário
                  </label>
                  <input
                    type="text"
                    name="usuarioEmail"
                    value={formData.usuarioEmail}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Senha
                  </label>
                  <input
                    type="password"
                    name="senhaEmail"
                    value={formData.senhaEmail}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="mt-4 flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Digite um email para teste"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={enviarTesteEmail}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
                >
                  Testar Email
                </button>
              </div>
            </div>

            {/* Configurações Gerais */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Configurações Gerais</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Horário Silencioso
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Não enviar notificações em horários específicos
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="horarioSilencioso"
                      checked={formData.horarioSilencioso}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
                  </label>
                </div>

                {formData.horarioSilencioso && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Início do Silêncio
                      </label>
                      <input
                        type="time"
                        name="inicioSilencio"
                        value={formData.inicioSilencio}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fim do Silêncio
                      </label>
                      <input
                        type="time"
                        name="fimSilencio"
                        value={formData.fimSilencio}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Limite Diário
                      </label>
                      <input
                        type="number"
                        name="limiteDiario"
                        value={formData.limiteDiario}
                        onChange={handleInputChange}
                        min="1"
                        max="200"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

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
  );
}
