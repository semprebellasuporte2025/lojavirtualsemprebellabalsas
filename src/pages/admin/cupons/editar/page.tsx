import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../../../components/feature/AdminLayout';
import AdminFormButtons from '../../../../components/feature/AdminFormButtons/AdminFormButtons';
import { useToast } from '../../../../hooks/useToast';
import { supabaseWithAuth } from '../../../../lib/supabaseAuth';

type CupomStatus = 'ativo' | 'inativo';

export default function AdminCuponsEditarPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nome, setNome] = useState('');
  const [descontoPercentual, setDescontoPercentual] = useState('');
  const [inicioEm, setInicioEm] = useState('');
  const [fimEm, setFimEm] = useState('');
  const [status, setStatus] = useState<CupomStatus>('ativo');

  useEffect(() => {
    if (id) {
      loadCupom(id);
    }
  }, [id]);

  const toLocalDateTimeInput = (iso: string | null) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  const toIsoOrNull = (value: string) => {
    if (!value) return null;
    const date = new Date(value);
    return date.toISOString();
  };

  const loadCupom = async (cupomId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabaseWithAuth
        .from('cupons')
        .select('*')
        .eq('id', cupomId)
        .single();
      if (error) throw error;
      if (data) {
        setNome(data.nome || '');
        setDescontoPercentual((data.desconto_percentual ?? '').toString());
        setInicioEm(toLocalDateTimeInput(data.inicio_em));
        setFimEm(toLocalDateTimeInput(data.fim_em));
        setStatus((data.status as CupomStatus) ?? 'ativo');
      }
    } catch (err) {
      console.error('Erro ao carregar cupom:', err);
      showToast('Erro ao carregar cupom', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!nome.trim()) {
      showToast('Informe o nome do cupom', 'error');
      return false;
    }
    const pct = parseFloat(descontoPercentual);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      showToast('Desconto deve estar entre 0 e 100%', 'error');
      return false;
    }
    if (inicioEm && fimEm) {
      const start = new Date(inicioEm).getTime();
      const end = new Date(fimEm).getTime();
      if (start >= end) {
        showToast('Data de início deve ser antes da data de término', 'error');
        return false;
      }
    }
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!validateForm()) return;
    try {
      setSaving(true);
      const { error } = await supabaseWithAuth
        .from('cupons')
        .update({
          nome: nome.trim(),
          desconto_percentual: parseFloat(descontoPercentual),
          inicio_em: toIsoOrNull(inicioEm),
          fim_em: toIsoOrNull(fimEm),
          status,
        })
        .eq('id', id);
      if (error) {
        console.error('Erro ao atualizar cupom:', error);
        showToast(`Erro ao atualizar cupom: ${error.message}`, 'error');
        return;
      }
      showToast('Cupom atualizado com sucesso!', 'success');
      navigate('/paineladmin/cupons/listar');
    } catch (err: any) {
      console.error('Erro inesperado ao atualizar cupom:', err);
      showToast('Erro inesperado ao atualizar cupom', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/paineladmin/cupons/listar');
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Editar Cupom</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Atualize os dados do cupom</p>
        </div>

        {loading ? (
          <div className="p-6 text-center">Carregando cupom...</div>
        ) : (
          <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="nome">Nome</label>
                <input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="desconto">Desconto (%)</label>
                <input
                  id="desconto"
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  value={descontoPercentual}
                  onChange={(e) => setDescontoPercentual(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="inicio_em">Data de Início</label>
                <input
                  id="inicio_em"
                  type="datetime-local"
                  value={inicioEm}
                  onChange={(e) => setInicioEm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="fim_em">Data de Término</label>
                <input
                  id="fim_em"
                  type="datetime-local"
                  value={fimEm}
                  onChange={(e) => setFimEm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="status">Status</label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CupomStatus)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white cursor-pointer"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>

            <AdminFormButtons onSave={handleSave} onBack={handleBack} saveText={saving ? 'Salvando...' : 'Salvar'} isSaveDisabled={saving} />
          </form>
        )}
      </div>
    </AdminLayout>
  );
}