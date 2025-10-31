
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';

interface LoginModalProps {
  onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const { user, signOut, signIn } = useAuth();
  const { showToast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setProfileLoading(true);
      try {
        const { data: clientData } = await supabase
          .from('clientes')
          .select('nome, telefone')
          .eq('user_id', user.id)
          .maybeSingle();

        setFormData((prev) => ({
          ...prev,
          email: user.email || prev.email,
          name: clientData?.nome || prev.name,
          phone: clientData?.telefone || prev.phone,
        }));
      } catch (err) {
        // Silently ignore profile errors
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!user && isLogin) {
      const savedRemember = localStorage.getItem('rememberMe') === 'true';
      const savedEmail = localStorage.getItem('rememberEmail') || '';
      if (savedRemember) {
        setRememberMe(true);
        if (savedEmail) {
          setFormData((prev) => ({ ...prev, email: savedEmail }));
        }
      }
    }
  }, [user, isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Iniciando handleSubmit - isLogin:', isLogin, 'formData:', formData);
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        console.log('Tentando login com email:', formData.email);
        const { error } = await signIn(formData.email, formData.password);

        if (error) {
          console.error('Erro no signInWithPassword:', error);
          throw error;
        }
        console.log('Login bem-sucedido');
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('rememberEmail', formData.email);
        } else {
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('rememberEmail');
        }
        showToast('Login realizado com sucesso!', 'success');
        onClose(); // Fechar modal e deixar o estado atualizar naturalmente
      } else {
        console.log('Tentando cadastro com email:', formData.email);
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          console.error('Erro no signUp:', error);
          throw error;
        }

        if (data.user) {
          console.log('Usuário cadastrado, inserindo em clientes');
          const { error: insertError } = await supabase
            .from('clientes')
            .insert([
              {
                nome: formData.name,
                email: formData.email,
                telefone: formData.phone,
                user_id: data.user.id,
                ativo: true
              }
            ]);

          if (insertError) {
            console.error('Erro ao inserir cliente:', insertError);
            throw insertError;
          }
          console.log('Cadastro completo');
          onClose();
          setIsLogin(true); // Alternar para login sem reload
        }
      }
    } catch (err: any) {
      console.error('Exceção em handleSubmit:', err);
      setError(err.message || 'Erro ao processar solicitação');
    } finally {
      console.log('Finalizando handleSubmit - setLoading(false)');
      setLoading(false);
    }
  };

  const initials = (nameOrEmail: string) => {
    if (!nameOrEmail) return 'U';
    const parts = nameOrEmail.trim().split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return nameOrEmail[0].toUpperCase();
  };

  // Estado: Usuário já logado
  if (user) {
    const displayName = formData.name || (user.email ? user.email.split('@')[0] : 'Usuário');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Você já está logado</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
              type="button"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center bg-pink-600 text-white rounded-full text-2xl font-bold">
              {initials(displayName)}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{displayName}</h3>
            <p className="text-sm text-gray-600">{user.email}</p>
            {profileLoading ? (
              <p className="mt-2 text-gray-500 text-sm">Carregando informações...</p>
            ) : (
              formData.phone && (
                <p className="mt-2 text-gray-500 text-sm">Telefone: {formData.phone}</p>
              )
            )}

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => { onClose(); window.location.href = '/minha-conta'; }}
                className="px-5 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors whitespace-nowrap cursor-pointer font-medium"
              >
                Ir para Minha Conta
              </button>
              <button
                type="button"
                onClick={async () => { await signOut(); onClose(); }}
                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer font-medium"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estado: Usuário não logado (form padrão)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isLogin ? 'Entrar' : 'Criar Conta'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
            type="button"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm pr-10"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700 cursor-pointer"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <i className={showPassword ? 'ri-eye-off-line text-lg' : 'ri-eye-line text-lg'}></i>
              </button>
            </div>
          </div>

          {isLogin && (
            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                />
                Lembrar-me
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-600 text-white py-3 rounded-lg font-medium hover:bg-pink-700 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processando...
              </div>
            ) : (
              isLogin ? 'Entrar' : 'Criar Conta'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setFormData({ email: '', password: '', name: '', phone: '' });
              }}
              className="text-pink-600 hover:text-pink-700 font-medium ml-1 cursor-pointer"
            >
              {isLogin ? 'Criar conta' : 'Fazer login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
