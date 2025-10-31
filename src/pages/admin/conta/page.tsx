import { useState } from 'react';
import AdminLayout from '../../../components/feature/AdminLayout';

export default function MinhaConta() {
  const [formData, setFormData] = useState({
    nome: 'Kalina Arruda',
    email: 'kalina.arruda@semprebellabalsas.com.br',
    telefone: '(99) 98888-7777',
    cpf: '123.456.789-00',
    dataNascimento: '1990-05-15',
    cargo: 'Administradora',
    departamento: 'Gestão',
    dataAdmissao: '2020-01-10'
  });

  const [senhaData, setsenhaData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });

  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [activeTab, setActiveTab] = useState('dados');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Dados atualizados com sucesso!');
  };

  const handleSenhaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (senhaData.novaSenha !== senhaData.confirmarSenha) {
      alert('As senhas não coincidem!');
      return;
    }
    alert('Senha alterada com sucesso!');
    setsenhaData({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Minha Conta</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie suas informações pessoais e configurações de conta</p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('dados')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${
                  activeTab === 'dados'
                    ? 'border-pink-600 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <i className="ri-user-line mr-2"></i>
                Dados Pessoais
              </button>
              <button
                onClick={() => setActiveTab('senha')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${
                  activeTab === 'senha'
                    ? 'border-pink-600 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <i className="ri-lock-line mr-2"></i>
                Segurança
              </button>
              <button
                onClick={() => setActiveTab('atividades')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${
                  activeTab === 'atividades'
                    ? 'border-pink-600 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <i className="ri-history-line mr-2"></i>
                Atividades Recentes
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Dados Pessoais */}
            {activeTab === 'dados' && (
              <form onSubmit={handleSubmit}>
                <div className="flex items-center mb-8">
                  <div className="w-24 h-24 bg-pink-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mr-6">
                    {formData.nome.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <button
                      type="button"
                      className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-upload-line mr-2"></i>
                      Alterar Foto
                    </button>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">JPG, PNG ou GIF. Máximo 2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Telefone *
                    </label>
                    <input
                      type="tel"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      CPF *
                    </label>
                    <input
                      type="text"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data de Nascimento
                    </label>
                    <input
                      type="date"
                      value={formData.dataNascimento}
                      onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cargo
                    </label>
                    <input
                      type="text"
                      value={formData.cargo}
                      onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Departamento
                    </label>
                    <input
                      type="text"
                      value={formData.departamento}
                      onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data de Admissão
                    </label>
                    <input
                      type="date"
                      value={formData.dataAdmissao}
                      onChange={(e) => setFormData({ ...formData, dataAdmissao: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-save-line mr-2"></i>
                    Salvar Alterações
                  </button>
                </div>
              </form>
            )}

            {/* Segurança */}
            {activeTab === 'senha' && (
              <div>
                <form onSubmit={handleSenhaSubmit} className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Alterar Senha</h3>
                  
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Senha Atual *
                      </label>
                      <div className="relative">
                        <input
                          type={showSenhaAtual ? 'text' : 'password'}
                          value={senhaData.senhaAtual}
                          onChange={(e) => setsenhaData({ ...senhaData, senhaAtual: e.target.value })}
                          className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowSenhaAtual(!showSenhaAtual)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          <i className={`${showSenhaAtual ? 'ri-eye-off-line' : 'ri-eye-line'} text-lg`}></i>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nova Senha *
                      </label>
                      <div className="relative">
                        <input
                          type={showNovaSenha ? 'text' : 'password'}
                          value={senhaData.novaSenha}
                          onChange={(e) => setsenhaData({ ...senhaData, novaSenha: e.target.value })}
                          className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNovaSenha(!showNovaSenha)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          <i className={`${showNovaSenha ? 'ri-eye-off-line' : 'ri-eye-line'} text-lg`}></i>
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Mínimo de 8 caracteres, incluindo letras e números
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirmar Nova Senha *
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmarSenha ? 'text' : 'password'}
                          value={senhaData.confirmarSenha}
                          onChange={(e) => setsenhaData({ ...senhaData, confirmarSenha: e.target.value })}
                          className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          <i className={`${showConfirmarSenha ? 'ri-eye-off-line' : 'ri-eye-line'} text-lg`}></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="mt-6 px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-lock-line mr-2"></i>
                    Alterar Senha
                  </button>
                </form>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Autenticação em Duas Etapas</h3>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Autenticação em Duas Etapas (2FA)</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Adicione uma camada extra de segurança à sua conta
                      </p>
                    </div>
                    <button className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors cursor-pointer whitespace-nowrap">
                      Ativar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Atividades Recentes */}
            {activeTab === 'atividades' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Atividades Recentes</h3>
                <div className="space-y-4">
                  {[
                    { acao: 'Login realizado', dispositivo: 'Chrome - Windows', ip: '192.168.1.100', data: '2024-01-15 14:30', icon: 'ri-login-circle-line', color: 'text-green-600' },
                    { acao: 'Senha alterada', dispositivo: 'Chrome - Windows', ip: '192.168.1.100', data: '2024-01-14 10:15', icon: 'ri-lock-line', color: 'text-blue-600' },
                    { acao: 'Dados atualizados', dispositivo: 'Chrome - Windows', ip: '192.168.1.100', data: '2024-01-13 16:45', icon: 'ri-edit-line', color: 'text-purple-600' },
                    { acao: 'Login realizado', dispositivo: 'Safari - iPhone', ip: '192.168.1.105', data: '2024-01-12 09:20', icon: 'ri-login-circle-line', color: 'text-green-600' },
                    { acao: 'Tentativa de login falhou', dispositivo: 'Chrome - Windows', ip: '192.168.1.100', data: '2024-01-11 18:30', icon: 'ri-error-warning-line', color: 'text-red-600' }
                  ].map((atividade, index) => (
                    <div key={index} className="flex items-start p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className={`w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-gray-600 ${atividade.color} mr-4`}>
                        <i className={`${atividade.icon} text-xl`}></i>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{atividade.acao}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {atividade.dispositivo} • IP: {atividade.ip}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          <i className="ri-time-line mr-1"></i>
                          {atividade.data}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
