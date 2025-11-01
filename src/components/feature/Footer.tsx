
import { Link } from 'react-router-dom';

export default function Footer() {
  const handleNavigation = (path: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      window.REACT_APP_NAVIGATE(path);
    }, 100);
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6">
          {/* Logo e Descrição */}
          <div className="col-span-1 md:col-span-2 text-center md:text-left">
            <h3 className="text-2xl font-bold mb-4 md:mb-3" style={{ fontFamily: '"Pacifico", serif' }}>
              Sempre Bella Balsas
            </h3>
            <p className="text-gray-300 mb-6 md:mb-4 max-w-md mx-auto md:mx-0">
              Sua loja de moda feminina em Balsas. Oferecemos as últimas tendências em roupas e acessórios 
              com qualidade e estilo únicos.
            </p>
            <div className="flex justify-center md:justify-start space-x-4">
              <a href="https://www.facebook.com/profile.php?id=100081123083548" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-pink-400 transition-colors">
                <i className="ri-facebook-fill text-xl"></i>
              </a>
              <a href="https://www.instagram.com/semprebella.balsas/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-pink-400 transition-colors">
                <i className="ri-instagram-line text-xl"></i>
              </a>
              <a href="https://wa.me/5599991345178?text=Ol%C3%A1%2C%20peguei%20seu%20contato%20no%20site" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-pink-400 transition-colors">
                <i className="ri-whatsapp-line text-xl"></i>
              </a>
            </div>
            
          </div>

          {/* Links Rápidos */}
          <div className="text-center md:text-left">
            <h4 className="text-lg font-semibold mb-4 md:mb-3">Links Rápidos</h4>
            <ul className="space-y-2 md:space-y-1">
              <li>
                <Link 
                  to="/"
                  className="text-gray-300 hover:text-pink-400 transition-colors cursor-pointer"
                >
                  Início
                </Link>
              </li>
              <li>
                <Link 
                  to="/categoria"
                  className="text-gray-300 hover:text-pink-400 transition-colors cursor-pointer"
                >
                  Categorias
                </Link>
              </li>
              <li>
                <Link 
                  to="/sobre-nos"
                  className="text-gray-300 hover:text-pink-400 transition-colors cursor-pointer"
                >
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link 
                  to="/contato"
                  className="text-gray-300 hover:text-pink-400 transition-colors cursor-pointer"
                >
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          {/* Atendimento */}
          <div className="text-center md:text-left">
            <h4 className="text-lg font-semibold mb-4 md:mb-3">Atendimento</h4>
            <ul className="space-y-2 md:space-y-1">
              <li>
                <Link 
                  to="/contato"
                  className="text-gray-300 hover:text-pink-400 transition-colors cursor-pointer"
                >
                  Central de Ajuda
                </Link>
              </li>
              <li>
                <Link 
                  to="/frete-entrega"
                  className="text-gray-300 hover:text-pink-400 transition-colors cursor-pointer"
                >
                  Frete e Entrega
                </Link>
              </li>
              <li>
                <Link 
                  to="/formas-pagamento"
                  className="text-gray-300 hover:text-pink-400 transition-colors cursor-pointer"
                >
                  Formas de Pagamento
                </Link>
              </li>
              <li>
                <Link 
                  to="/privacidade"
                  className="text-gray-300 hover:text-pink-400 transition-colors cursor-pointer"
                >
                  Privacidade
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 md:mt-6 md:pt-6 flex flex-col md:flex-row items-center md:justify-between">
          <p className="text-gray-400 text-sm text-center md:text-left">
            © 2025/2026 Sempre Bella Balsas. Todos os direitos reservados.
          </p>
          <span className="text-gray-400 text-sm mt-4 md:mt-0 text-center md:text-left">
            Powered by ES Solution
          </span>
        </div>
      </div>
    </footer>
  );
}
