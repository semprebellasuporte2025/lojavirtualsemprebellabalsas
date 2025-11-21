import { useState } from 'react';
import type { CustomerData } from '../types.ts';
import { maskCPF, maskPhone, validateCPF, validateEmail, validatePhone } from '@/utils/validation';

interface CustomerDataFormProps {
  data: CustomerData;
  onChange: (data: Partial<CustomerData>) => void;
  onNext: () => void;
}

export default function CustomerDataForm({ data, onChange, onNext }: CustomerDataFormProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof CustomerData, boolean>>>({});

  const validateField = (field: keyof CustomerData, value: string): string => {
    switch (field) {
      case 'nome':
        if (!value.trim()) return 'Nome é obrigatório';
        if (value.trim().length < 3) return 'Nome deve ter pelo menos 3 caracteres';
        return '';
      case 'cpf':
        if (!value.trim()) return 'CPF é obrigatório';
        if (!validateCPF(value)) return 'CPF inválido';
        return '';
      case 'email':
        if (!value.trim()) return 'E-mail é obrigatório';
        if (!validateEmail(value)) return 'E-mail inválido';
        return '';
      case 'telefone':
        if (!value.trim()) return 'WhatsApp é obrigatório';
        if (!validatePhone(value)) return 'WhatsApp inválido';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (field: keyof CustomerData, value: string) => {
    let v = value;
    if (field === 'cpf') v = maskCPF(value);
    if (field === 'telefone') v = maskPhone(value);
    onChange({ [field]: v });
    if (touched[field]) setErrors(prev => ({ ...prev, [field]: validateField(field, v) }));
  };

  const handleBlur = (field: keyof CustomerData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validateField(field, (data as any)[field]) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fields: (keyof CustomerData)[] = ['nome', 'cpf', 'email', 'telefone'];
    const newTouched: Partial<Record<keyof CustomerData, boolean>> = {};
    const newErrors: Partial<Record<keyof CustomerData, string>> = {};
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
      data.nome.trim().length >= 3 &&
      validateCPF(data.cpf) &&
      validateEmail(data.email) &&
      validatePhone(data.telefone)
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Dados do Cliente</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">Nome completo *</label>
          <input
            id="nome"
            type="text"
            value={data.nome}
            onChange={(e) => handleChange('nome', e.target.value)}
            onBlur={() => handleBlur('nome')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${errors.nome ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Seu nome"
          />
          {errors.nome && <p className="mt-1 text-sm text-red-600">{errors.nome}</p>}
        </div>

        <div>
          <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-2">CPF *</label>
          <input
            id="cpf"
            type="text"
            value={data.cpf}
            onChange={(e) => handleChange('cpf', e.target.value)}
            onBlur={() => handleBlur('cpf')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${errors.cpf ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="000.000.000-00"
          />
          {errors.cpf && <p className="mt-1 text-sm text-red-600">{errors.cpf}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">E-mail *</label>
          <input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="seu@email.com"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-2">WhatsApp *</label>
          <input
            id="telefone"
            type="text"
            value={data.telefone}
            onChange={(e) => handleChange('telefone', e.target.value)}
            onBlur={() => handleBlur('telefone')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${errors.telefone ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="(00) 00000-0000"
          />
          {errors.telefone && <p className="mt-1 text-sm text-red-600">{errors.telefone}</p>}
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button
          type="submit"
          disabled={!isValid()}
          className="bg-pink-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-pink-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Continuar
        </button>
      </div>
    </form>
  );
}