
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase';
import AdminLayout from '../../../../components/feature/AdminLayout';
import AdminFormButtons from '../../../../components/feature/AdminFormButtons/AdminFormButtons';
import { useToast } from '../../../../hooks/useToast';
import { useAuth } from '../../../../hooks/useAuth';

export default function CadastrarUsuarioPage() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const { toast, showToast, hideToast } = useToast();

  // Declarar todos os hooks no topo (regra do React)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    tipo: 'admin',
    departamento: 'Administração',
    cargo: 'Administrador',
    ativo: true
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Removido guarda redundante de permissão aqui; o AdminLayout já
  // restringe acesso ao painel para admins/atendentes e oculta menus
  // para perfis sem acesso. Isso evita redirecionamentos durante o envio.

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  // Não esconder a página aqui para evitar telas em branco em condições de corrida.

  const tiposUsuario = [
    { id: 'admin', nome: 'Administrador' },
    { id: 'atendente', nome: 'Atendente' }
  ];

  const departamentos = [
    'Administração',
    'Vendas',
    'Marketing',
    'Financeiro',
    'Recursos Humanos',
    'TI',
    'Atendimento ao Cliente'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (formData.senha !== formData.confirmarSenha) {
      showToast('As senhas não coincidem', 'error');
      return;
    }

    if (formData.senha.length < 6) {
      showToast('A senha deve ter pelo menos 6 caracteres', 'error');
      return;
    }

    try {
      setIsSaving(true);
      console.log('Enviando cadastro de usuário', {
        nome: formData.nome,
        email: formData.email,
        tipo: formData.tipo || 'admin',
        departamento: formData.departamento || 'Administração',
        cargo: formData.cargo || 'Administrador',
      });
      // Invoca a Edge Function oficial para cadastrar administradores
      const { data, error } = await supabase.functions.invoke('cadastrar-admin', {
        body: {
          nome: formData.nome,
          email: formData.email,
          senha: formData.senha,
          tipo: formData.tipo || 'admin',
          departamento: formData.departamento || 'Administração',
          cargo: formData.cargo || 'Administrador',
        }
      });

      if (error) {
        const errInfo: any = {
          name: (error as any)?.name,
          message: (error as any)?.message,
          context: (error as any)?.context ?? null,
        };
        console.error('Erro na função cadastrar-admin:', errInfo);
        showToast(errInfo.message || 'Erro ao cadastrar usuário', 'error');
        return;
      }

      if (data?.success) {
        showToast('Usuário cadastrado com sucesso!', 'success');
        // Redireciona para a listagem para visualizar o novo usuário
        setTimeout(() => {
          navigate('/paineladmin/usuarios/listar');
        }, 300);
        // Limpar formulário
        setFormData({
          nome: '',
          email: '',
          senha: '',
          confirmarSenha: '',
          tipo: 'admin',
          departamento: 'Administração',
          cargo: 'Administrador',
          ativo: true
        });
      } else {
        showToast('Falha ao cadastrar usuário (resposta inválida)', 'error');
      }
    } catch (error: any) {
      console.error('Erro ao cadastrar usuário:', error);
      showToast(error?.message || 'Erro ao cadastrar usuário', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="p-6">
        <AdminLayout>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cadastrar Usuário</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Adicione um novo usuário ao sistema</p>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Dados Pessoais */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                      <i className="ri-user-line text-pink-600"></i>
                      <span>Dados Pessoais</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          name="nome"
                          value={formData.nome}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="João Silva Santos"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="joao@empresa.com"
                        />
                      </div>

                    </div>
                  </div>

                  {/* Acesso */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                      <i className="ri-lock-line text-pink-600"></i>
                      <span>Dados de Acesso</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Senha *
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="senha"
                            value={formData.senha}
                            onChange={handleInputChange}
                            required
                            minLength={6}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Mínimo 6 caracteres"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                          >
                            <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Confirmar Senha *
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmarSenha"
                            value={formData.confirmarSenha}
                            onChange={handleInputChange}
                            required
                            minLength={6}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Repita a senha"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                          >
                            <i className={showConfirmPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tipo de Usuário *
                        </label>
                        <select
                          name="tipo"
                          value={formData.tipo}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-8"
                        >
                          <option value="">Selecione o tipo</option>
                          {tiposUsuario.map(tipo => (
                            <option key={tipo.id} value={tipo.id}>
                              {tipo.nome}
                            </option>
                          ))}
                        </select>
                      </div>

                    </div>
                  </div>

                  {/* Dados Profissionais */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                      <i className="ri-briefcase-line text-pink-600"></i>
                      <span>Dados Profissionais</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Departamento *
                        </label>
                        <select
                          name="departamento"
                          value={formData.departamento}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-8"
                        >
                          <option value="">Selecione o departamento</option>
                          {departamentos.map(dep => (
                            <option key={dep} value={dep}>{dep}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Cargo *
                        </label>
                        <input
                          type="text"
                          name="cargo"
                          value={formData.cargo}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Ex: Vendedor Sênior"
                        />
                      </div>
                    </div>
                  </div>



                  {/* Configurações */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="ativo"
                        name="ativo"
                        checked={formData.ativo}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 dark:focus:ring-pink-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <label htmlFor="ativo" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                        Usuário ativo
                      </label>
                    </div>

                  </div>

                  {/* Buttons */}
                  <AdminFormButtons
                    onSave={handleSubmit}
                    onBack={() => window.history.back()}
                    saveText={isSaving ? 'Salvando...' : 'Salvar Usuário'}
                    isSaveDisabled={isSaving}
                  />

                </form>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <i className="ri-shield-check-line text-blue-600 dark:text-blue-400"></i>
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-900 dark:text-blue-300">Segurança</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-400">Senha deve ter no mínimo 6 caracteres</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <i className="ri-user-settings-line text-green-600 dark:text-green-400"></i>
                  </div>
                  <div>
                    <h3 className="font-medium text-green-900 dark:text-green-300">Permissões</h3>
                    <p className="text-sm text-green-700 dark:text-green-400">Definidas pelo tipo de usuário</p>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <i className="ri-notification-line text-purple-600 dark:text-purple-400"></i>
                  </div>
                  <div>
                    <h3 className="font-medium text-purple-900 dark:text-purple-300">Notificações</h3>
                    <p className="text-sm text-purple-700 dark:text-purple-400">Configuráveis por usuário</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AdminLayout>
      </div>
    </>
  );
}
