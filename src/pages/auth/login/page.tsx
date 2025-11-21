import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Footer from '../../../components/feature/Footer';
import SEOHead from '../../../components/feature/SEOHead';
import { useAuth } from '../../../hooks/useAuth';
import { useCart } from '../../../hooks/useCart';
import { determinePostLoginRedirect, shouldRedirect } from '../../../utils/redirect';

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, loading, isAdmin, isAtendente, isUsuario, signIn, signOut, clearAdminCache, refreshAdminStatus } = useAuth();
  const location = useLocation();
  const { items } = useCart();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Fallback robusto para redirecionamento
  const forceRedirect = (path: string) => {
    try {
      console.log('[Login] Tentando redirecionar com useNavigate para:', path);
      navigate(path, { replace: true });
      // Verifica rapidamente se a navegação ocorreu; se não, usa fallbacks
      setTimeout(() => {
        const current = window.location.pathname;
        if (current !== path) {
          if (typeof window.REACT_APP_NAVIGATE === 'function') {
            console.log('[Login] Fallback via window.REACT_APP_NAVIGATE para:', path);
            try {
              window.REACT_APP_NAVIGATE(path);
            } catch (err) {
              console.warn('[Login] Falha no REACT_APP_NAVIGATE, usando location.assign:', err);
              window.location.assign(path);
            }
          } else {
            console.log('[Login] Fallback via window.location.assign para:', path);
            window.location.assign(path);
          }
        }
      }, 0);
    } catch (err) {
      console.error('[Login] Erro no redirecionamento, usando window.location.assign:', err);
      window.location.assign(path);
    }
  };

  useEffect(() => {
    const savedRemember = localStorage.getItem('rememberMe') === 'true';
    const savedEmail = localStorage.getItem('rememberEmail') || '';
    if (savedRemember && savedEmail) {
      setRememberMe(true);
      setFormData((prev) => ({ ...prev, email: savedEmail }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      console.log('[Login] Tentando fazer login...');
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        console.error('[Login] Erro no login:', error);
        setError(error.message || 'Falha ao fazer login');
        return;
      }
      
      console.log('[Login] Login realizado com sucesso');

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('rememberEmail', formData.email);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberEmail');
      }

      // Persistir intenção de retorno (from) para casos de refresh
      try {
        const fromState = (location.state as any)?.from as string | undefined;
        const searchFrom = new URLSearchParams(location.search).get('from') || undefined;
        const fromPath = fromState || searchFrom || undefined;
        if (fromPath) localStorage.setItem('postLoginFrom', fromPath);
      } catch {}
    } catch (err: any) {
      console.error('[Login] Erro inesperado:', err);
      setError(err?.message || 'Erro inesperado ao fazer login');
    } finally {
      setSubmitting(false);
    }
  };

  // Se já estiver logado, decidir destino considerando origem e carrinho
  useEffect(() => {
    if (!loading && user) {
      const currentPath = window.location.pathname;
      const fromState = (location.state as any)?.from as string | undefined;
      const searchFrom = new URLSearchParams(location.search).get('from') || undefined;
      const storedFrom = localStorage.getItem('postLoginFrom') || undefined;
      const fromPath = fromState || searchFrom || storedFrom;

      const target = determinePostLoginRedirect({
        isAdmin,
        isAtendente,
        isUsuario,
        fromPath,
        cartHasItems: items.length > 0,
        currentPath,
      });

      console.log('[Login] Redirecionamento decidido:', {
        email: user.email,
        isAdmin,
        isAtendente,
        isUsuario,
        fromPath,
        cartItems: items.length,
        currentPath,
        target,
      });

      if (shouldRedirect(currentPath, target)) {
        forceRedirect(target!);
      }
    }
  }, [user, loading, isAdmin, isAtendente, isUsuario, navigate, location, items]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead title="Fazer Login" />
      <div className="bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
          {/* Cabeçalho da página */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-pink-600" style={{ fontFamily: '"Pacifico", serif' }}>Sempre Bella Balsas</h1>
            <p className="text-sm text-gray-600 mt-1">Acesse sua conta para acompanhar pedidos e ofertas.</p>
          </div>

          {/* Layout com grid: texto/benefícios + formulário */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Lateral com benefícios/branding */}
            <div className="hidden lg:block">
              <div className="rounded-lg shadow-sm p-6 border border-pink-100 bg-gradient-to-br from-pink-50 to-white">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Bem-vindo de volta</h2>
                  <p className="text-gray-600 mt-2">Entre para finalizar compras rapidamente e acessar atendimento exclusivo.</p>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <i className="ri-check-line text-pink-600 mt-0.5"></i>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Compra ágil</p>
                      <p className="text-sm text-gray-600">Suas informações ficam salvas para compras futuras.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <i className="ri-check-line text-pink-600 mt-0.5"></i>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Pedidos e devoluções</p>
                      <p className="text-sm text-gray-600">Acompanhe seu pedido e gerencie trocas com facilidade.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <i className="ri-check-line text-pink-600 mt-0.5"></i>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Ofertas exclusivas</p>
                      <p className="text-sm text-gray-600">Receba descontos e novidades primeiro.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Formulário */}
            <div>
              {user ? (
                <div className="max-w-md mx-auto bg-white shadow-sm rounded-lg p-6 text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Você já está logado</h2>
                  <p className="text-gray-600 mb-6">Escolha acessar sua conta ou o painel administrativo.</p>
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => navigate((isAdmin || isAtendente || isUsuario) ? '/paineladmin' : '/minha-conta')}
                        className="px-5 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors whitespace-nowrap cursor-pointer font-medium"
                      >
                        {(isAdmin || isAtendente || isUsuario) ? 'Ir para Painel Admin' : 'Ir para Minha Conta'}
                      </button>
                      <button
                        type="button"
                        onClick={async () => { await signOut(); navigate('/auth/login'); }}
                        className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer font-medium"
                      >
                        Sair
                      </button>
                    </div>
                    {!(isAdmin || isAtendente || isUsuario) && (
                      <button
                        type="button"
                        onClick={() => {
                          clearAdminCache();
                          refreshAdminStatus();
                          console.log('Cache de admin limpo e status atualizado');
                        }}
                        className="px-4 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        Atualizar status de administrador
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="max-w-md mx-auto bg-white shadow-sm rounded-lg p-6 border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Entrar</h2>

                  {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm" role="alert" aria-live="polite">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        id="login-email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                        placeholder="seu@email.com"
                        autoComplete="email"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="login-password"
                          name="password"
                          required
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm pr-10"
                          placeholder="Mínimo 6 caracteres"
                          minLength={6}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700 cursor-pointer"
                          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                          aria-pressed={showPassword}
                        >
                          <i className={showPassword ? 'ri-eye-off-line text-lg' : 'ri-eye-line text-lg'}></i>
                        </button>
                      </div>
                    </div>

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

                      <button type="button" className="text-sm text-pink-600 hover:text-pink-700">
                        Esqueceu a senha?
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-pink-600 text-white py-3 rounded-lg font-medium hover:bg-pink-700 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
                    >
                      {submitting ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Processando...
                        </div>
                      ) : (
                        'Entrar'
                      )}
                    </button>

                    <p className="text-sm text-center text-gray-600">
                      Não tem uma conta?{' '}
                      <Link to="/auth/register" className="text-pink-600 hover:text-pink-700 font-medium">Criar conta</Link>
                    </p>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}