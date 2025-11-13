import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/feature/AdminLayout';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';
import ConfirmationModal from '@/components/feature/modal/ConfirmationModal';

type CupomStatus = 'ativo' | 'inativo';

interface Cupom {
  id: string;
  nome: string;
  desconto_percentual: number;
  inicio_em: string | null;
  fim_em: string | null;
  status: CupomStatus;
  quantidade_uso: number;
  created_at?: string;
  updated_at?: string;
}

const formatDateTime = (iso: string | null) => {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso ?? '-';
  }
};

export default function AdminCuponsListarPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cupomToDelete, setCupomToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchCupons = async () => {
      try {
        const { data, error } = await supabase
          .from('cupons')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) {
          console.error('Erro ao carregar cupons:', error);
          showToast('Erro ao carregar cupons', 'error');
        } else {
          setCupons(data || []);
        }
      } catch (err) {
        console.error('Erro inesperado ao carregar cupons:', err);
        showToast('Erro inesperado ao carregar cupons', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchCupons();
  }, [showToast]);

  const filtered = cupons.filter((c) =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleStatus = async (id: string, current: CupomStatus) => {
    try {
      const next: CupomStatus = current === 'ativo' ? 'inativo' : 'ativo';
      const { error } = await supabase
        .from('cupons')
        .update({ status: next })
        .eq('id', id);
      if (error) {
        console.error('Erro ao alterar status do cupom:', error);
        showToast('Erro ao alterar status', 'error');
        return;
      }
      setCupons((prev) => prev.map((c) => (c.id === id ? { ...c, status: next } : c)));
      showToast('Status alterado com sucesso!', 'success');
    } catch (err) {
      console.error('Erro inesperado ao alterar status:', err);
      showToast('Erro inesperado ao alterar status', 'error');
    }
  };

  const handleDelete = (id: string) => {
    setCupomToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!cupomToDelete) return;
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('cupons')
        .delete()
        .eq('id', cupomToDelete);
      if (error) {
        console.error('Erro ao excluir cupom:', error);
        showToast('Erro ao excluir cupom', 'error');
        return;
      }
      setCupons((prev) => prev.filter((c) => c.id !== cupomToDelete));
      showToast('Cupom excluído com sucesso!', 'success');
    } catch (err) {
      console.error('Erro inesperado ao excluir cupom:', err);
      showToast('Erro inesperado ao excluir cupom', 'error');
    } finally {
      setShowDeleteModal(false);
      setCupomToDelete(null);
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 text-center">
          <p>Carregando cupons...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Cupons</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie os cupons de desconto</p>
          </div>
          <button
            onClick={() => navigate('/paineladmin/cupons/cadastrar')}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors whitespace-nowrap"
          >
            <i className="ri-add-line mr-2"></i>
            Novo Cupom
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="mb-4">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Buscar por nome..."
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
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Nome</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Desconto (%)</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Período</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Usos</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">{c.nome}</td>
                    <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">{c.desconto_percentual?.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatDateTime(c.inicio_em)}
                      <span className="mx-1">→</span>
                      {formatDateTime(c.fim_em)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${
                          c.status === 'ativo'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                        onClick={() => toggleStatus(c.id, c.status)}
                      >
                        {c.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">{c.quantidade_uso ?? 0}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/paineladmin/cupons/editar/${c.id}`)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                          title="Editar"
                        >
                          <i className="ri-pencil-line"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1"
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

            {filtered.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <i className="ri-ticket-line text-4xl mb-2"></i>
                <p>Nenhum cupom encontrado</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <ConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        body="Tem certeza que deseja excluir este cupom? Esta ação não pode ser desfeita."
      />
    </AdminLayout>
  );
}