import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../../components/feature/AdminLayout';
import AdminFormButtons from '../../../../components/feature/AdminFormButtons/AdminFormButtons';
import { useToast } from '../../../../hooks/useToast';
import Toast from '../../../../components/base/Toast';
import { supabase } from '../../../../lib/supabase';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  data_nascimento?: string;
  endereco?: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
  };
  cidade: string;
  estado: string;
  cep: string;
  ativo: boolean;
}

interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export default function EditarClientePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [formData, setFormData] = useState<Cliente>({
    id: '',
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    data_nascimento: '',
    endereco: {
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
      cep: ''
    },
    cidade: '',
    estado: '',
    cep: '',
    ativo: true
  });

  useEffect(() => {
    if (id) {
      fetchCliente();
    }
  }, [id]);

  const fetchCliente = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar cliente:', error);
        showToast('Erro ao carregar dados do cliente', 'error');
        navigate('/paineladmin/clientes/listar');
        return;
      }

      setFormData({
        ...data,
        data_nascimento: data.data_nascimento ? new Date(data.data_nascimento).toISOString().split('T')[0] : ''
      });
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      showToast('Erro ao carregar dados do cliente', 'error');
      navigate('/paineladmin/clientes/listar');
    } finally {
      setLoading(false);
    }
  };

  // Função para formatar CEP
  const formatCep = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 5) {
      return cleanValue;
    }
    return cleanValue.replace(/(\d{5})(\d{1,3})/, '$1-$2');
  };

  // Função para buscar CEP na API ViaCEP
  const buscarCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      return;
    }

    try {
      setLoadingCep(true);
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data: ViaCEPResponse = await response.json();

      if (data.erro) {
        showToast('CEP não encontrado', 'error');
        return;
      }

      // Atualizar os campos de endereço com os dados do ViaCEP
      setFormData(prev => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          logradouro: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          uf: data.uf,
          cep: data.cep
        },
        cidade: data.localidade,
        estado: data.uf,
        cep: data.cep
      }));

      showToast('CEP encontrado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      showToast('Erro ao buscar CEP', 'error');
    } finally {
      setLoadingCep(false);
    }
  };

  // Função para lidar com mudança no CEP
  const handleCepChange = (value: string) => {
    const formattedCep = formatCep(value);
    setFormData(prev => ({
      ...prev,
      cep: formattedCep,
      endereco: {
        ...prev.endereco,
        cep: formattedCep
      }
    }));

    // Buscar automaticamente quando CEP estiver completo
    const cleanCep = value.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      buscarCep(formattedCep);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      const updateData = {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        cpf: formData.cpf,
        data_nascimento: formData.data_nascimento || null,
        endereco: formData.endereco,
        cidade: formData.cidade,
        estado: formData.estado,
        cep: formData.cep,
        ativo: formData.ativo,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('clientes')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar cliente:', error);
        showToast('Erro ao atualizar cliente', 'error');
        return;
      }

      showToast('Cliente atualizado com sucesso!', 'success');
      navigate('/paineladmin/clientes/listar');
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      showToast('Erro ao atualizar cliente', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof Cliente, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <i className="ri-loader-4-line text-5xl text-pink-600 animate-spin"></i>
            <p className="mt-4 text-gray-600">Carregando dados do cliente...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Editar Cliente</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Atualize as informações do cliente</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Dados Pessoais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => handleInputChange('nome', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Ex: Maria Silva Santos"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      E-mail *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="exemplo@email.com"
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
                      onChange={(e) => handleInputChange('telefone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="(99) 99999-9999"
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
                      onChange={(e) => handleInputChange('cpf', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="000.000.000-00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data de Nascimento
                    </label>
                    <input
                      type="date"
                      value={formData.data_nascimento}
                      onChange={(e) => handleInputChange('data_nascimento', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      CEP
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.cep}
                        onChange={(e) => handleCepChange(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="00000-000"
                        maxLength={9}
                      />
                      {loadingCep && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <i className="ri-loader-4-line animate-spin text-pink-600"></i>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Logradouro
                    </label>
                    <input
                      type="text"
                      value={formData.endereco?.logradouro || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        endereco: { ...prev.endereco, logradouro: e.target.value }
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Rua, Avenida..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Número
                    </label>
                    <input
                      type="text"
                      value={formData.endereco?.numero || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        endereco: { ...prev.endereco, numero: e.target.value }
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="123"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={formData.endereco?.complemento || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        endereco: { ...prev.endereco, complemento: e.target.value }
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Apartamento, Bloco, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bairro
                    </label>
                    <input
                      type="text"
                      value={formData.endereco?.bairro || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        endereco: { ...prev.endereco, bairro: e.target.value }
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Centro"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      value={formData.cidade}
                      onChange={(e) => handleInputChange('cidade', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="São Paulo"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estado *
                    </label>
                    <select
                      value={formData.estado}
                      onChange={(e) => handleInputChange('estado', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">Selecione...</option>
                      <option value="AC">Acre</option>
                      <option value="AL">Alagoas</option>
                      <option value="AP">Amapá</option>
                      <option value="AM">Amazonas</option>
                      <option value="BA">Bahia</option>
                      <option value="CE">Ceará</option>
                      <option value="DF">Distrito Federal</option>
                      <option value="ES">Espírito Santo</option>
                      <option value="GO">Goiás</option>
                      <option value="MA">Maranhão</option>
                      <option value="MT">Mato Grosso</option>
                      <option value="MS">Mato Grosso do Sul</option>
                      <option value="MG">Minas Gerais</option>
                      <option value="PA">Pará</option>
                      <option value="PB">Paraíba</option>
                      <option value="PR">Paraná</option>
                      <option value="PE">Pernambuco</option>
                      <option value="PI">Piauí</option>
                      <option value="RJ">Rio de Janeiro</option>
                      <option value="RN">Rio Grande do Norte</option>
                      <option value="RS">Rio Grande do Sul</option>
                      <option value="RO">Rondônia</option>
                      <option value="RR">Roraima</option>
                      <option value="SC">Santa Catarina</option>
                      <option value="SP">São Paulo</option>
                      <option value="SE">Sergipe</option>
                      <option value="TO">Tocantins</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={(e) => handleInputChange('ativo', e.target.checked)}
                    className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500 cursor-pointer"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cliente Ativo
                  </span>
                </label>
              </div>
            </div>

            <AdminFormButtons
              onSave={handleSubmit}
              onBack={() => navigate('/paineladmin/clientes/listar')}
              saveText={saving ? "Salvando..." : "Salvar Alterações"}
              disabled={saving}
            />
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}