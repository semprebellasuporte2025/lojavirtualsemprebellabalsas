
import { useState, useEffect } from 'react';
import { useNavigate, Link, NavLink } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import type { Categoria } from '../../lib/supabase';
import { filterCategoriesWithProducts } from '../../utils/categoryFilter';
import { generateSlug } from '../../utils/formatters';

export default function Header() {
  // Usa seletor puro para evitar qualquer efeito colateral ao obter a contagem
  const cartItemCount = useCart((state) => state.items.reduce((total, item) => total + item.quantity, 0));
  const navigate = useNavigate();
  const [isMenuOpen] = useState(false);
  const { user, signOut } = useAuth(); // Adicionando signOut do hook useAuth
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriasLoading, setCategoriasLoading] = useState(true);

  useEffect(() => {
    const carregarCategorias = async () => {
      try {
        const { data, error } = await supabase
          .from('categorias')
          .select('*')
          .eq('ativa', true)
          .order('nome', { ascending: true });
        if (error) throw error;
        
        // Filtrar categorias que possuem produtos ativos
        const categoriasComProdutos = await filterCategoriesWithProducts(data || []);
        setCategorias(categoriasComProdutos);
      } catch (err) {
        console.error('Erro ao carregar categorias:', err);
      } finally {
        setCategoriasLoading(false);
      }
    };
    carregarCategorias();
  }, []);

  return (
    <>
      {/* Top Bar */}
      <div className="bg-pink-600 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 text-xs sm:text-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            {/* Contatos */}
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
              <a
                href="https://wa.me/5599991345178?text=Ol%C3%A1%2C%20peguei%20seu%20contato%20no%20site"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 cursor-pointer text-white visited:text-white hover:text-white/90"
              >
                <i className="ri-whatsapp-line"></i>
                <span>(99) 99134-5178</span>
              </a>
              <a
                href="mailto:contato@semprebellabalsas.com.br"
                className="flex items-center gap-2 cursor-pointer text-white visited:text-white hover:text-white/90"
              >
                <i className="ri-mail-line"></i>
                <span>contato@semprebellabalsas.com.br</span>
              </a>
            </div>

            {/* Benefícios e frete */}
            <div className="flex items-start sm:items-center gap-2 sm:justify-end">
              <i className="ri-truck-line"></i>
              <span className="leading-snug">
                Toda loja com 10% de desconto no pagamento via Pix ou Dinheiro e Frete Grátis à partir de R$ 499,00
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <button 
              onClick={() => navigate('/')}
              className="text-3xl font-bold text-pink-600 cursor-pointer"
              style={{ fontFamily: '"Pacifico", serif' }}
            >
              Sempre Bella Balsas
            </button>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  className="w-full px-4 py-2 pr-10 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-pink-600 text-sm"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-600 cursor-pointer">
                  <i className="ri-search-line text-xl"></i>
                </button>
              </div>
            </div>

            {/* Icons */}
            <div className="flex items-center gap-6">
              <button className="text-gray-700 hover:text-pink-600 transition-colors cursor-pointer">
                <i className="ri-heart-line text-2xl"></i>
              </button>
              <Link to="/carrinho" className="relative text-gray-700 hover:text-pink-600 transition-colors cursor-pointer">
                <i className="ri-shopping-cart-line text-2xl"></i>
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-pink-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    {cartItemCount}
                  </span>
                )}
              </Link>
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors cursor-pointer"
                >
                  <i className={`ri-user-line text-2xl`}></i>
                  <span className="hidden md:inline">Conta</span>
                  <i className={`ri-arrow-${isDropdownOpen ? 'up' : 'down'}-s-line`}></i>
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <Link 
                      to="/minha-conta" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Minha Conta
                    </Link>
                    {user && (
                      <button 
                        onClick={async () => {
                          await signOut();
                          setIsDropdownOpen(false);
                          navigate('/');
                        }} 
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sair
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className={`border-t border-gray-200 ${isMenuOpen ? 'block' : 'hidden md:block'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <ul className="flex flex-col md:flex-row md:items-center md:justify-center md:space-x-8 py-4">
            <li>
              <button 
                onClick={() => navigate('/')}
                className="block py-2 text-gray-700 hover:text-pink-600 font-medium cursor-pointer whitespace-nowrap"
              >
                Início
              </button>
            </li>
            {/* Categorias dinâmicas */}
            {!categoriasLoading && categorias.map((cat) => (
              <li key={cat.id || cat.nome}>
                <NavLink
                  to={`/categoria/${cat.slug || generateSlug(cat.nome)}`}
                  className={({ isActive }) =>
                    `block py-2 font-medium cursor-pointer whitespace-nowrap ${
                      isActive ? 'text-pink-600 font-semibold border-b-2 border-pink-600' : 'text-gray-700 hover:text-pink-600'
                    }`
                  }
                >
                  {cat.nome}
                </NavLink>
              </li>
            ))}
            <li>
              <button 
                onClick={() => navigate('/contato')}
                className="block py-2 text-gray-700 hover:text-pink-600 font-medium cursor-pointer whitespace-nowrap"
              >
                Contato
              </button>
            </li>
            <li>
              <a href="#" className="block py-2 text-pink-600 font-bold cursor-pointer whitespace-nowrap">
                <i className="ri-fire-fill mr-1"></i>
                Black Friday
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}