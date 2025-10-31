
import { useState } from 'react';
import AdminLayout from '../../../../components/feature/AdminLayout';
import { useToast } from '../../../../hooks/useToast';

interface Banner {
  id: number;
  titulo: string;
  subtitulo: string;
  imagem: string;
  link: string;
  ordem: number;
  ativo: boolean;
}

export default function ListarBannersPage() {
  const { showToast } = useToast();

  const [banners, setBanners] = useState<Banner[]>([
    {
      id: 1,
      titulo: 'Promoção de Verão',
      subtitulo: 'Até 50% de desconto',
      imagem: 'https://readdy.ai/api/search-image?query=Summer%20sale%20banner%20with%20vibrant%20colors%2C%20beach%20theme%2C%20tropical%20elements%2C%20modern%20e-commerce%20design%2C%20clean%20background%20with%20product%20highlights%2C%20professional%20marketing%20banner&width=400&height=150&seq=banner1&orientation=landscape',
      link: '/promocao-verao',
      ordem: 1,
      ativo: true
    },
    {
      id: 2,
      titulo: 'Novos Produtos',
      subtitulo: 'Confira as novidades',
      imagem: 'https://readdy.ai/api/search-image?query=New%20products%20banner%20with%20modern%20minimalist%20design%2C%20elegant%20product%20showcase%2C%20clean%20white%20background%2C%20professional%20e-commerce%20banner%2C%20fresh%20and%20contemporary%20style&width=400&height=150&seq=banner2&orientation=landscape',
      link: '/novidades',
      ordem: 2,
      ativo: true
    },
    {
      id: 3,
      titulo: 'Frete Grátis',
      subtitulo: 'Em compras acima de R$ 200',
      imagem: 'https://readdy.ai/api/search-image?query=Free%20shipping%20banner%20with%20delivery%20truck%20icon%2C%20modern%20e-commerce%20design%2C%20clean%20background%2C%20professional%20marketing%20banner%2C%20blue%20and%20white%20color%20scheme&width=400&height=150&seq=banner3&orientation=landscape',
      link: '/frete-gratis',
      ordem: 3,
      ativo: false
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredBanners = banners.filter(banner =>
    banner.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    banner.subtitulo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este banner?')) {
      setBanners(banners.filter(b => b.id !== id));
      showToast('Banner excluído com sucesso!', 'success');
    }
  };

  const toggleStatus = (id: number) => {
    setBanners(banners.map(banner => 
      banner.id === id ? { ...banner, ativo: !banner.ativo } : banner
    ));
    showToast('Status alterado com sucesso!', 'success');
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Banners</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie os banners da loja</p>
          </div>
          <button
            onClick={() => window.REACT_APP_NAVIGATE('/paineladmin/banners/cadastrar')}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors whitespace-nowrap"
          >
            <i className="ri-add-line mr-2"></i>
            Novo Banner
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="mb-4">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Buscar banners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Imagem</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Título</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Subtítulo</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Ordem</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredBanners.map((banner) => (
                  <tr key={banner.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-4">
                      <img src={banner.imagem} alt={banner.titulo} className="w-24 h-16 object-cover rounded" />
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">{banner.titulo}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{banner.subtitulo}</td>
                    <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">{banner.ordem}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleStatus(banner.id)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer ${
                          banner.ativo
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {banner.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => console.log('Editar banner:', banner.id)}
                          className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded cursor-pointer"
                          title="Editar"
                        >
                          <i className="ri-edit-line"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded cursor-pointer"
                          title="Excluir"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredBanners.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <i className="ri-image-line text-4xl mb-2"></i>
                <p>Nenhum banner encontrado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
