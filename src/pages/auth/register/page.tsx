import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SEOHead from '../../../components/feature/SEOHead';
import Footer from '../../../components/feature/Footer';
import { useAuth } from '../../../hooks/useAuth';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [form, setForm] = useState({
    nome: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefone: '',
    cpf: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onlyDigits = (s: string) => s.replace(/\D/g, '');
  const isValidPhoneBR = (phone: string) => {
    const d = onlyDigits(phone);
    if (d.length < 10 || d.length > 11) return false; // DDD (2) + 8/9 dígitos
    if (/^(\d)\1{9,10}$/.test(d)) return false; // evita todos dígitos iguais
    if (d.slice(0, 2).startsWith('0')) return false; // DDD não pode começar com 0
    return true;
  };

  const isValidCPF = (cpfStr: string) => {
    const cpf = onlyDigits(cpfStr);
    if (!cpf || cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false; // todos dígitos iguais inválido

    const calcDV = (slice: number) => {
      let sum = 0;
      let weight = slice + 1;
      for (let i = 0; i < slice; i++) {
        sum += parseInt(cpf[i], 10) * (weight - i);
      }
      const mod = sum % 11;
      return mod < 2 ? 0 : 11 - mod;
    };

    const dv1 = calcDV(9);
    if (dv1 !== parseInt(cpf[9], 10)) return false;
    const dv2 = calcDV(10);
    if (dv2 !== parseInt(cpf[10], 10)) return false;
    return true;
  };

  const formatPhoneBR = (input: string) => {
    const d = onlyDigits(input).slice(0, 11);
    if (d.length === 0) return '';
    const ddd = d.slice(0, 2);
    if (d.length <= 2) return `(${ddd}`;
    if (d.length <= 6) return `(${ddd}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${ddd}) ${d.slice(2, d.length - 4)}-${d.slice(d.length - 4)}`;
    return `(${ddd}) ${d.slice(2, 7)}-${d.slice(7)}`; // 11 dígitos
  };

  const formatCPF = (input: string) => {
    const d = onlyDigits(input).slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.nome || !form.email || !form.password || !form.confirmPassword || !form.telefone || !form.cpf) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    if (form.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('A confirmação de senha não confere.');
      return;
    }

    if (!isValidPhoneBR(form.telefone)) {
      setError('Telefone inválido. Informe DDD + 8/9 dígitos.');
      return;
    }

    if (!isValidCPF(form.cpf)) {
      setError('CPF inválido. Verifique os dígitos.');
      return;
    }

    setSubmitting(true);
    try {
      const telefoneDigits = onlyDigits(form.telefone);
      const cpfDigits = onlyDigits(form.cpf);
      const { error } = await signUp(form.email, form.password, {
        nome: form.nome,
        telefone: telefoneDigits,
        cpf: cpfDigits,
      });
      if (error) {
        setError(error.message || 'Falha ao criar conta.');
        return;
      }
      // Supabase pode exigir verificação de email; direciona para login
      setSuccess('Cadastro realizado! Verifique seu email se necessário.');
      setTimeout(() => navigate('/auth/login'), 1200);
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado no cadastro.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SEOHead title="Criar Conta" />
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
          <div className="max-w-md mx-auto bg-white shadow-sm rounded-lg p-6 border border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Criar Conta</h1>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm" role="alert">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg text-sm" role="status">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome <span className="text-red-600">*</span></label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                  placeholder="Seu nome"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-600">*</span></label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha <span className="text-red-600">*</span></label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                  placeholder="••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha <span className="text-red-600">*</span></label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                  placeholder="••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone <span className="text-red-600">*</span></label>
                <input
                  type="tel"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: formatPhoneBR(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                  placeholder="(99) 99999-9999"
                  required
                  inputMode="numeric"
                  maxLength={16}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF <span className="text-red-600">*</span></label>
                <input
                  type="text"
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: formatCPF(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                  placeholder="000.000.000-00"
                  required
                  inputMode="numeric"
                  maxLength={14}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full px-4 py-2 rounded-lg font-medium ${submitting ? 'bg-gray-300 text-gray-600' : 'bg-pink-600 text-white hover:bg-pink-700'} transition-colors`}
              >
                {submitting ? 'Criando conta...' : 'Criar conta'}
              </button>
            </form>

            <p className="text-sm text-gray-600 mt-4">
              Já tem conta? <Link to="/auth/login" className="text-pink-600 hover:text-pink-700 font-medium">Entrar</Link>
            </p>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}