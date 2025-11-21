import { useEffect, useState } from 'react';
import type { ShippingData, ViaCEPResponse } from '../types.ts';
import { maskCEP, unmask, validateCEP } from '@/utils/validation';

interface ShippingFormProps {
  data: ShippingData;
  onChange: (data: Partial<ShippingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ShippingForm({ data, onChange, onNext, onBack }: ShippingFormProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ShippingData, boolean>>>({});
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [cepError, setCepError] = useState<string>('');

  const validateField = (field: keyof ShippingData, value: string): string => {
    switch (field) {
      case 'cep':
        if (!value.trim()) return 'CEP é obrigatório';
        if (!validateCEP(value)) return 'CEP inválido';
        return '';
      case 'logradouro':
        return value.trim() ? '' : 'Logradouro é obrigatório';
      case 'numero':
        return value.trim() ? '' : 'Número é obrigatório';
      case 'bairro':
        return value.trim() ? '' : 'Bairro é obrigatório';
      case 'cidade':
        return value.trim() ? '' : 'Cidade é obrigatória';
      case 'estado':
        return value.trim() ? '' : 'Estado é obrigatório';
      default:
        return '';
    }
  };

  const handleChange = (field: keyof ShippingData, value: string) => {
    let v = value;
    if (field === 'cep') v = maskCEP(value);
    onChange({ [field]: v });
    if (touched[field]) setErrors(prev => ({ ...prev, [field]: validateField(field, v) }));
  };

  const handleBlur = (field: keyof ShippingData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validateField(field, (data as any)[field]) }));
  };

  const fetchCEP = async (cepMasked: string) => {
    const cepClean = unmask(cepMasked);
    if (!validateCEP(cepMasked)) return;
    setLoadingCEP(true);
    setCepError('');
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
      const json = (await resp.json()) as ViaCEPResponse;
      if (json.erro) {
        setCepError('CEP não encontrado');
        return;
      }
      onChange({
        logradouro: json.logradouro || '',
        bairro: json.bairro || '',
        cidade: json.localidade || '',
        estado: json.uf || '',
      });
    } catch (e) {
      setCepError('Erro ao consultar CEP');
    } finally {
      setLoadingCEP(false);
    }
  };

  useEffect(() => {
    const clean = unmask(data.cep);
    if (clean.length === 8) fetchCEP(data.cep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.cep]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fields: (keyof ShippingData)[] = ['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'];
    const newTouched: Partial<Record<keyof ShippingData, boolean>> = {};
    const newErrors: Partial<Record<keyof ShippingData, string>> = {};
    fields.forEach(f => {
      newTouched[f] = true;
      newErrors[f] = validateField(f, (data as any)[f]);
    });
    setTouched(newTouched);
    setErrors(newErrors);
    const hasErrors = Object.values(newErrors).some(Boolean);
    if (!hasErrors) onNext();
  };

  const isValid = () => {
    return (
      validateCEP(data.cep) &&
      !!data.logradouro.trim() &&
      !!data.numero.trim() &&
      !!data.bairro.trim() &&
      !!data.cidade.trim() &&
      !!data.estado.trim()
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Endereço de Entrega</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="cep" className="block text-sm font-medium text-gray-700 mb-2">CEP *</label>
          <div className="relative">
            <input
              id="cep"
              type="text"
              value={data.cep}
              onChange={(e) => handleChange('cep', e.target.value)}
              onBlur={() => handleBlur('cep')}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${errors.cep ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="00000-000"
            />
            {loadingCEP && <span className="absolute right-3 top-3 text-gray-400">...</span>}
          </div>
          {(errors.cep || cepError) && <p className="mt-1 text-sm text-red-600">{errors.cep || cepError}</p>}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="logradouro" className="block text-sm font-medium text-gray-700 mb-2">Logradouro *</label>
          <input
            id="logradouro"
            type="text"
            value={data.logradouro}
            onChange={(e) => handleChange('logradouro', e.target.value)}
            onBlur={() => handleBlur('logradouro')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${errors.logradouro ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Rua, Avenida..."
          />
          {errors.logradouro && <p className="mt-1 text-sm text-red-600">{errors.logradouro}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="numero" className="block text-sm font-medium text-gray-700 mb-2">Número *</label>
          <input
            id="numero"
            type="text"
            value={data.numero}
            onChange={(e) => handleChange('numero', e.target.value)}
            onBlur={() => handleBlur('numero')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${errors.numero ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="123"
          />
          {errors.numero && <p className="mt-1 text-sm text-red-600">{errors.numero}</p>}
        </div>

        <div>
          <label htmlFor="complemento" className="block text-sm font-medium text-gray-700 mb-2">Complemento</label>
          <input
            id="complemento"
            type="text"
            value={data.complemento || ''}
            onChange={(e) => handleChange('complemento', e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent border-gray-300"
            placeholder="Apartamento, bloco..."
          />
        </div>

        <div>
          <label htmlFor="bairro" className="block text-sm font-medium text-gray-700 mb-2">Bairro *</label>
          <input
            id="bairro"
            type="text"
            value={data.bairro}
            onChange={(e) => handleChange('bairro', e.target.value)}
            onBlur={() => handleBlur('bairro')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${errors.bairro ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Bairro"
          />
          {errors.bairro && <p className="mt-1 text-sm text-red-600">{errors.bairro}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="cidade" className="block text-sm font-medium text-gray-700 mb-2">Cidade *</label>
          <input
            id="cidade"
            type="text"
            value={data.cidade}
            onChange={(e) => handleChange('cidade', e.target.value)}
            onBlur={() => handleBlur('cidade')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${errors.cidade ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Cidade"
          />
          {errors.cidade && <p className="mt-1 text-sm text-red-600">{errors.cidade}</p>}
        </div>

        <div>
          <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">Estado *</label>
          <input
            id="estado"
            type="text"
            value={data.estado}
            onChange={(e) => handleChange('estado', e.target.value)}
            onBlur={() => handleBlur('estado')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${errors.estado ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="UF"
          />
          {errors.estado && <p className="mt-1 text-sm text-red-600">{errors.estado}</p>}
        </div>
      </div>

      <div className="flex flex-col-reverse md:flex-row md:justify-between gap-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onBack}
          className="w-full md:w-auto px-6 py-3 rounded-lg bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200"
        >
          Voltar
        </button>
        <button
          type="submit"
          disabled={!isValid()}
          className="w-full md:w-auto bg-pink-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-pink-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Continuar
        </button>
      </div>
    </form>
  );
}