import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-toastify';

const EnderecoModal = ({ showModal, setShowModal, enderecoEdit, clienteId, onSave }) => {
  const [formData, setFormData] = useState({
    nome: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    tipo: 'Residencial',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (enderecoEdit) {
      setFormData({
        nome: enderecoEdit.nome || '',
        cep: enderecoEdit.cep || '',
        endereco: enderecoEdit.endereco || '',
        numero: enderecoEdit.numero || '',
        complemento: enderecoEdit.complemento || '',
        bairro: enderecoEdit.bairro || '',
        cidade: enderecoEdit.cidade || '',
        estado: enderecoEdit.estado || '',
        tipo: enderecoEdit.tipo || 'Residencial',
      });
    } else {
      resetForm();
    }
  }, [enderecoEdit, showModal]);

  const resetForm = () => {
    setFormData({
      nome: '',
      cep: '',
      endereco: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      tipo: 'Residencial',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCepChange = async (e) => {
    const cep = e.target.value.replace(/\D/g, '');
    setFormData((prev) => ({ ...prev, cep }));

    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            endereco: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf,
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const formatCEP = (value: string) => {
    const numbers = (value || '').replace(/\D/g, '').slice(0, 8);
    if (numbers.length <= 5) return numbers;
    return numbers.replace(/(\d{5})(\d{1,3})/, '$1-$2');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const enderecoData = {
      ...formData,
      cliente_id: clienteId,
    };

    try {
      let response;
      if (enderecoEdit) {
        response = await supabase
          .from('enderecos')
          .update(enderecoData)
          .eq('id', enderecoEdit.id)
          .select();
      } else {
        response = await supabase
          .from('enderecos')
          .insert(enderecoData)
          .select();
      }

      const { data, error } = response;

      if (error) {
        throw error;
      }

      if (data) {
        onSave(data[0], !enderecoEdit);
        toast.success(`Endereço ${enderecoEdit ? 'atualizado' : 'salvo'} com sucesso!`);
        setShowModal(false);
      }
    } catch (error) {
      console.error('Erro ao salvar endereço:', error);
      toast.error('Erro ao salvar endereço. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{enderecoEdit ? 'Editar Endereço' : 'Novo Endereço'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome do Endereço */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Endereço (ex: Casa, Trabalho)
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent text-sm"
                required
              />
            </div>

            {/* CEP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
              <input
                type="text"
                name="cep"
                value={formatCEP(formData.cep)}
                onChange={handleCepChange}
                maxLength={9}
                placeholder="00000-000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent text-sm"
                required
              />
            </div>

            {/* Endereço */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
              <input
                type="text"
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent text-sm"
                required
              />
            </div>

            {/* Número e Complemento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Número</label>
              <input
                type="text"
                name="numero"
                value={formData.numero}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Complemento</label>
              <input
                type="text"
                name="complemento"
                value={formData.complemento}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent text-sm"
              />
            </div>

            {/* Bairro, Cidade, Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bairro</label>
              <input
                type="text"
                name="bairro"
                value={formData.bairro}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
              <input
                type="text"
                name="cidade"
                value={formData.cidade}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <input
                type="text"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent text-sm"
                required
              />
            </div>
          </div>

          <div className="flex justify-end mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-6 py-2 text-sm font-medium text-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-sm font-medium text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors disabled:bg-pink-300"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Endereço'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnderecoModal;