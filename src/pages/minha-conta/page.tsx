
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { supabase } from '../../lib/supabase';
import Footer from '../../components/feature/Footer';
import Header from '../../components/feature/Header';
import SEOHead from '../../components/feature/SEOHead';
import EnderecoModal from './components/EnderecoModal';

// Tipagens
type Endereco = {
  id: number;
  nome: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  tipo: string;
  cliente_id: string;
};
type Pedido = any;
type Favorito = any;

export default function MinhaContaPage() {
    const auth = useAuth();
    const { user, signOut } = auth;
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('pedidos');
    const [loading, setLoading] = useState(true);

    // States
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [orderItems, setOrderItems] = useState<any[]>([]);
    const [deliveryAddress, setDeliveryAddress] = useState<any | null>(null);
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        telefone: '',
        cpf: '',
        dataNascimento: '',
        genero: '',
    });
    const [enderecos, setEnderecos] = useState<Endereco[]>([]);
    const [favoritos, setFavoritos] = useState<Favorito[]>([]);
    const [favoritosDisponiveis, setFavoritosDisponiveis] = useState(true);
    const [senhaData, setSenhaData] = useState({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });

    // UI States
    const [showSenhaAtual, setShowSenhaAtual] = useState(false);
    const [showNovaSenha, setShowNovaSenha] = useState(false);
    const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
    const [showEnderecoModal, setShowEnderecoModal] = useState(false);
    const [isSavingData, setIsSavingData] = useState(false);
    const [enderecoEdit, setEnderecoEdit] = useState<Endereco | null>(null);
    const [clienteIdDb, setClienteIdDb] = useState<string | null>(null);

    const fetchAllData = async (userId: string) => {
        setLoading(true);
        try {
            // Client data
            const { data: clientData, error: clientError } = await supabase
                .from('clientes')
                .select('id, nome, telefone, cpf, data_nascimento, genero')
                .eq('user_id', userId)
                .single();
            if (clientError && clientError.code !== 'PGRST116') throw clientError;
            if (clientData) {
                setFormData({
                    nome: clientData.nome || '',
                    email: auth.user?.email || '',
                    telefone: clientData.telefone || '',
                    cpf: clientData.cpf || '',
                    dataNascimento: clientData.data_nascimento || '',
                    genero: clientData.genero || 'Prefiro não informar',
                });
                setClienteIdDb(clientData.id);
            } else if (auth.user) {
                 setFormData(prev => ({...prev, email: auth.user.email || ''}));
                 setClienteIdDb(null);
            }

            // Endereços (alguns registros usam clientes.id, outros auth.user.id)
            let enderecosList: Endereco[] = [];
            {
                const enderecoIds = [userId, clientData?.id].filter(Boolean) as string[];
                let enderecosQuery = supabase
                    .from('enderecos')
                    .select('*');

                enderecosQuery = enderecoIds.length > 1
                    ? enderecosQuery.in('cliente_id', enderecoIds)
                    : enderecosQuery.eq('cliente_id', enderecoIds[0]);

                const { data: enderecosData, error: enderError } = await enderecosQuery;
                if (enderError) throw enderError;
                enderecosList = (enderecosData || []) as Endereco[];
            }

            // Pedidos (considera possíveis inserções com clientes.id ou auth user.id)
            {
                const filterIds = [userId, clientData?.id].filter(Boolean) as string[];
                let pedidosQuery = supabase
                    .from('pedidos')
                    .select('id, numero_pedido, created_at, status, total, cliente_id, endereco_entrega');

                pedidosQuery = filterIds.length > 1
                    ? pedidosQuery.in('cliente_id', filterIds)
                    : pedidosQuery.eq('cliente_id', filterIds[0]);

                const { data: pedidosData, error: pedidosError } = await pedidosQuery
                    .order('created_at', { ascending: false });
                if (pedidosError) throw pedidosError;
                setPedidos(pedidosData || []);

                // Fallback: se não há endereços salvos, derivar dos pedidos
                if ((!enderecosList || enderecosList.length === 0) && (pedidosData && pedidosData.length > 0)) {
                    const dedup = new Map<string, Endereco>();
                    for (const p of pedidosData) {
                        const a = (p as any)?.endereco_entrega;
                        if (!a) continue;
                        const key = [a.cep, a.endereco, a.numero, a.cidade, a.estado].map((v: any) => String(v || '')).join('|');
                        if (!dedup.has(key)) {
                            dedup.set(key, {
                                id: 0 as any,
                                nome: a.nome || 'Endereço',
                                cep: a.cep || '',
                                endereco: a.endereco || '',
                                numero: String(a.numero ?? ''),
                                complemento: a.complemento || '',
                                bairro: a.bairro || '',
                                cidade: a.cidade || '',
                                estado: a.estado || '',
                                tipo: 'Residencial',
                                cliente_id: (p as any)?.cliente_id || userId,
                            });
                        }
                    }
                    enderecosList = Array.from(dedup.values());
                }
                setEnderecos(enderecosList || []);
            }

            // Favoritos (fallback sem relacionamento: busca IDs e depois os produtos)
            try {
                const { data: favIdsData, error: favIdsError } = await supabase
                    .from('favoritos')
                    .select('produto_id')
                    .eq('cliente_id', userId);
                if (favIdsError) {
                    setFavoritosDisponiveis(false);
                    console.warn('Erro ao buscar favoritos:', favIdsError.message);
                } else {
                    const ids = (favIdsData || []).map((f: any) => f.produto_id).filter(Boolean);
                    if (ids.length === 0) {
                        setFavoritos([]);
                    } else {
                        const { data: prodsData, error: prodsError } = await supabase
                            .from('produtos')
                            .select('id, nome, preco, preco_promocional, imagens')
                            .in('id', ids);
                        if (prodsError) {
                            setFavoritosDisponiveis(false);
                            console.warn('Erro ao carregar produtos favoritados:', prodsError.message);
                        } else {
                            setFavoritos(prodsData || []);
                        }
                    }
                }
            } catch (error) {
                setFavoritosDisponiveis(false);
            }

        } catch (error: any) {
            console.error("Erro ao carregar dados da conta:", error.message);
            showToast('Não foi possível carregar todos os seus dados.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!auth.loading && auth.user) {
            fetchAllData(auth.user.id);
        } else if (!auth.loading && !auth.user) {
            setLoading(false);
        }
    }, [auth.loading, auth.user]);

    useEffect(() => {
        const fetchOrderItems = async () => {
            if (selectedOrder) {
                const { data, error } = await supabase
                    .from('itens_pedido')
                    .select('nome, imagem, quantidade, preco_unitario, subtotal, tamanho, cor')
                    .eq('pedido_id', selectedOrder.id);
                if (error) {
                    console.error('Erro ao buscar itens do pedido:', error);
                    setOrderItems([]);
                } else {
                    setOrderItems(data || []);
                }
            }
        };
        fetchOrderItems();
    }, [selectedOrder]);

    const handleOpenOrderDetails = async (pedido: any) => {
        try {
            const { data, error } = await supabase
                .from('pedidos')
                .select('id, numero_pedido, created_at, status, subtotal, desconto, frete, total, forma_pagamento, endereco_entrega, observacoes, cliente_id')
                .eq('id', pedido.id)
                .single();
            if (error) throw error;
            setSelectedOrder(data);
            setOrderItems([]);
            setIsDetailsModalOpen(true);
        } catch (err) {
            console.error('Falha ao carregar detalhes do pedido:', err);
            // fallback: usa o objeto existente
            setSelectedOrder(pedido);
            setOrderItems([]);
            setIsDetailsModalOpen(true);
        }
    };

    useEffect(() => {
        const fetchFallbackAddress = async () => {
            if (!selectedOrder) return;
            if (selectedOrder.endereco_entrega) {
                setDeliveryAddress(null);
                return;
            }
            try {
                const clienteId = selectedOrder.cliente_id || user?.id;
                if (!clienteId) return;
                const { data, error } = await supabase
                    .from('enderecos')
                    .select('nome, endereco, numero, complemento, bairro, cidade, estado, cep')
                    .eq('cliente_id', clienteId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                if (error) {
                    setDeliveryAddress(null);
                } else {
                    setDeliveryAddress(data);
                }
            } catch {
                setDeliveryAddress(null);
            }
        };
        fetchFallbackAddress();
    }, [selectedOrder, user]);

    // Helpers: máscaras e validações
    const formatCPF = (value: string) => {
        const numbers = (value || '').replace(/\D/g, '').slice(0, 11);
        return numbers
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    };

    const formatPhone = (value: string) => {
        const numbers = (value || '').replace(/\D/g, '').slice(0, 11);
        if (numbers.length <= 10) {
            return numbers
                .replace(/(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{4})(\d)/, '$1-$2');
        }
        return numbers
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2');
    };

    const validateCPF = (cpf: string) => {
        const numbers = (cpf || '').replace(/\D/g, '');
        if (!numbers || numbers.length !== 11) return false;
        if (/^(\d)\1{10}$/.test(numbers)) return false; // todos iguais
        let sum = 0;
        for (let i = 0; i < 9; i++) sum += parseInt(numbers.charAt(i)) * (10 - i);
        let check1 = 11 - (sum % 11);
        if (check1 >= 10) check1 = 0;
        if (check1 !== parseInt(numbers.charAt(9))) return false;
        sum = 0;
        for (let i = 0; i < 10; i++) sum += parseInt(numbers.charAt(i)) * (11 - i);
        let check2 = 11 - (sum % 11);
        if (check2 >= 10) check2 = 0;
        return check2 === parseInt(numbers.charAt(10));
    };

    // Handlers
    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const handleUpdateData = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        // Validação de CPF (rigorosa)
        const cpfDigits = (formData.cpf || '').replace(/\D/g, '');
        if (cpfDigits && !validateCPF(cpfDigits)) {
            showToast('CPF inválido. Verifique e tente novamente.', 'error');
            return;
        }

        setIsSavingData(true);
        const { error } = await supabase
            .from('clientes')
            .update({
                nome: formData.nome,
                telefone: formData.telefone,
                cpf: formData.cpf,
                data_nascimento: formData.dataNascimento,
                genero: formData.genero,
            })
            .eq('user_id', user.id);
        if (error) {
            showToast('Erro ao atualizar dados.', 'error');
        } else {
            showToast('Dados atualizados com sucesso!', 'success');
        }
        setIsSavingData(false);
    };

    const handleSenhaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (senhaData.novaSenha !== senhaData.confirmarSenha) {
            showToast('As novas senhas não coincidem.', 'error');
            return;
        }
        if (senhaData.novaSenha.length < 6) {
            showToast('A nova senha deve ter no mínimo 6 caracteres.', 'error');
            return;
        }
        const { error } = await supabase.auth.updateUser({ password: senhaData.novaSenha });
        if (error) {
            showToast(`Erro ao alterar senha: ${error.message}`, 'error');
        } else {
            showToast('Senha alterada com sucesso!', 'success');
            setSenhaData({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
        }
    };

    const handleSaveEndereco = async (endereco: Endereco) => {
        if (!user) return;
        const { id, ...enderecoData } = endereco;
        enderecoData.cliente_id = clienteIdDb ?? user.id;

        const { data, error } = id
            ? await supabase.from('enderecos').update(enderecoData).eq('id', id).select().single()
            : await supabase.from('enderecos').insert(enderecoData).select().single();

        if (error) {
            showToast('Erro ao salvar endereço', 'error');
        } else if (data) {
            showToast('Endereço salvo com sucesso!', 'success');
            setEnderecos(prev => id ? prev.map(e => e.id === id ? data : e) : [data, ...prev]);
            setShowEnderecoModal(false);
            setEnderecoEdit(null);
        }
    };

    const handleDeletarEndereco = async (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir este endereço?')) {
            const { error } = await supabase.from('enderecos').delete().eq('id', id);
            if (error) {
                showToast('Erro ao excluir endereço.', 'error');
            } else {
                setEnderecos(enderecos.filter(e => e.id !== id));
                showToast('Endereço excluído com sucesso!', 'success');
            }
        }
    };

    const handleRemoveFavorito = async (produto_id: number) => {
        if (!user) return;
        const { error } = await supabase.from('favoritos').delete().match({ cliente_id: user.id, produto_id });
        if (error) {
            showToast('Erro ao remover favorito.', 'error');
        } else {
            setFavoritos(favoritos.filter(f => f.id !== produto_id));
            showToast('Favorito removido!', 'success');
        }
    };

    // Computa metadados para sidebar (informações reais)
    const dadosObrigatorios = ['nome', 'telefone', 'cpf', 'dataNascimento', 'genero'] as const;
    const dadosPendentes = dadosObrigatorios.filter((campo) => !String((formData as any)[campo] || '').trim()).length;
    const dadosStatusLabel = dadosPendentes === 0 ? 'Completo' : `${dadosPendentes} pendente(s)`;

    // Funções de formatação
    const formatCurrency = (value: number) => value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' });
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pendente': return 'bg-yellow-100 text-yellow-800';
            case 'Pago': case 'Processando': return 'bg-green-100 text-green-800';
            case 'Enviado': return 'bg-blue-100 text-blue-800';
            case 'Entregue': return 'bg-gray-100 text-gray-800';
            case 'Cancelado': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p>Carregando...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <>
                <Header />
                <div className="text-center p-10 pt-32">
                    <p className="mb-4">Você precisa estar logado para acessar esta página.</p>
                    <Link to="/auth/login" className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700">
                        Fazer Login
                    </Link>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <SEOHead title="Minha Conta" />
            <Header />
            <div className="bg-gray-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-20">
                    <div className="lg:flex lg:space-x-12">
                        {/* Sidebar */}
                        <aside className="lg:w-1/4 mb-6 lg:mb-0">
                            <div className="p-4 md:p-6 bg-white rounded-lg shadow-sm">
                                <div className="flex items-center space-x-3 md:space-x-4 mb-4 md:mb-6">
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xl md:text-2xl font-bold">
                                        {formData.nome?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-base md:text-lg text-gray-800">{formData.nome}</h2>
                                        <p className="text-xs md:text-sm text-gray-500">{formData.email}</p>
                                    </div>
                                </div>
                                <nav className="grid grid-cols-2 gap-2 md:block md:space-y-2">
                                    {[
                                        { id: 'pedidos', label: 'Pedidos', icon: 'ri-file-list-3-line' },
                                        { id: 'dados', label: 'Meus Dados', icon: 'ri-user-line' },
                                        { id: 'enderecos', label: 'Endereços', icon: 'ri-map-pin-line' },
                                        { id: 'senha', label: 'Segurança', icon: 'ri-lock-line' },
                                        { id: 'favoritos', label: 'Favoritos', icon: 'ri-heart-line' },
                                    ].map(item => (
                                        <a key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center justify-between md:justify-start px-3 md:px-4 py-2 md:py-3 text-sm md:text-base rounded-lg cursor-pointer transition-colors ${activeTab === item.id ? 'bg-pink-50 text-pink-600 font-medium' : 'hover:bg-gray-100'}`}>
                                            <span className="flex items-center">
                                                <i className={`${item.icon} mr-2 md:mr-3`}></i> {item.label}
                                            </span>
                                            {item.id === 'pedidos' && (
                                                <span className="ml-3 md:ml-auto px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">{pedidos.length}</span>
                                            )}
                                            {item.id === 'enderecos' && (
                                                <span className="ml-3 md:ml-auto px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">{enderecos.length}</span>
                                            )}
                                            {item.id === 'dados' && (
                                                <span className={`ml-3 md:ml-auto px-2 py-1 rounded-full text-xs ${dadosPendentes === 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'}`}>{dadosStatusLabel}</span>
                                            )}
                                        </a>
                                    ))}
                                </nav>
                                <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t">
                                    <button onClick={handleLogout} className="w-full flex items-center justify-center px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
                                        <i className="ri-logout-box-r-line mr-2 md:mr-3"></i> Sair
                                    </button>
                                </div>
                            </div>
                        </aside>

                        {/* Main Content */}
                        <main className="lg:w-3/4">
                            <div className="p-4 md:p-8 bg-white rounded-lg shadow-sm min-h-[500px]">
                                {activeTab === 'pedidos' && (
                                    <div>
                                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Meus Pedidos</h2>
                                        {pedidos.length > 0 ? (
                                            <div className="space-y-3 md:space-y-4">
                                                {pedidos.map(pedido => (
                                                    <div key={pedido.id} className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                                        <div className="min-w-0">
                                                            <p className="font-semibold truncate">Pedido #{pedido.numero_pedido || pedido.id.slice(0, 8)}</p>
                                                            <p className="text-xs md:text-sm text-gray-600">Data: {formatDate(pedido.created_at)}</p>
                                                            <p className="text-xs md:text-sm text-gray-600">Status: <span className={`font-medium px-2 py-1 text-xs rounded-full ${getStatusColor(pedido.status)}`}>{pedido.status}</span></p>
                                                        </div>
                                                        <div className="text-left sm:text-right">
                                                            <p className="font-semibold text-base md:text-lg">{formatCurrency(pedido.total)}</p>
                                                            <button type="button" onClick={() => handleOpenOrderDetails(pedido)} className="text-sm text-pink-600 hover:underline">Ver Detalhes</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <p>Você ainda não fez nenhum pedido.</p>}
                                    </div>
                                )}
                                {activeTab === 'dados' && (
                                    <div>
                                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Meus Dados</h2>
                                        <form onSubmit={handleUpdateData} className="max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                                                <input type="text" value={formData.nome} onChange={(e) => setFormData(prev => ({...prev, nome: e.target.value}))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent text-sm" required />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                                <input type="email" value={formData.email} disabled className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm" />
                                            </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                                            <input type="text" maxLength={15} value={formatPhone(formData.telefone)} onChange={(e) => setFormData(prev => ({...prev, telefone: formatPhone(e.target.value)}))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent text-sm" placeholder="(99) 99999-9999" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
                                            <input type="text" maxLength={14} value={formatCPF(formData.cpf)} onChange={(e) => setFormData(prev => ({...prev, cpf: formatCPF(e.target.value)}))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent text-sm" placeholder="000.000.000-00" />
                                        </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Data de Nascimento</label>
                                                <input type="date" value={formData.dataNascimento || ''} onChange={(e) => setFormData(prev => ({...prev, dataNascimento: e.target.value}))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Gênero</label>
                                                <select value={formData.genero} onChange={(e) => setFormData(prev => ({...prev, genero: e.target.value}))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent text-sm">
                                                    <option value="Masculino">Masculino</option>
                                                    <option value="Feminino">Feminino</option>
                                                    <option value="Prefiro não informar">Prefiro não informar</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <button type="submit" disabled={isSavingData} className="mt-2 md:mt-4 px-8 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:bg-pink-300">{isSavingData ? 'Salvando...' : 'Salvar Alterações'}</button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            {activeTab === 'enderecos' && (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl font-semibold">Meus Endereços</h3>
                                        <button onClick={() => { setEnderecoEdit(null); setShowEnderecoModal(true); }} className="btn-primary">
                                            Adicionar Endereço
                                        </button>
                                    </div>
                                    {enderecos.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {enderecos.map((end, idx) => (
                                                <div key={(end as any)?.id || `${end.cliente_id}-${end.cep}-${end.endereco}-${end.numero}-${idx}`} className="border p-4 rounded-lg">
                                                    <p className="font-semibold">{end.nome}</p>
                                                    <p>{end.endereco}, {end.numero}{end.complemento ? `, ${end.complemento}` : ''}</p>
                                                    <p>{end.bairro}, {end.cidade} - {end.estado}</p>
                                                    <p>{end.cep}</p>
                                                    <div className="mt-4 flex gap-2">
                                                        <button onClick={() => { setEnderecoEdit(end); setShowEnderecoModal(true); }} className="btn-secondary" disabled={!((end as any)?.id)}>
                                                            Editar
                                                        </button>
                                                        <button onClick={() => handleDeletarEndereco((end as any)?.id)} className="btn-danger" disabled={!((end as any)?.id)}>
                                                            Excluir
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p>Nenhum endereço cadastrado.</p>
                                    )}
                                </div>
                            )}
                                {activeTab === 'seguranca' && (
                                    <div>
                                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Segurança</h2>
                                        <form onSubmit={handleSenhaSubmit} className="max-w-md space-y-4">
                                            {/* Campos de senha */}
                                            <button type="submit" className="mt-6 px-8 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">Alterar Senha</button>
                                        </form>
                                    </div>
                                )}
                                {activeTab === 'favoritos' && (
                                    <div>
                                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Meus Favoritos</h2>
                                        {favoritos.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                                                {favoritos.map((prod: any) => (
                                                    <div key={prod.id} className="border rounded-lg">
                                                        {/* Card de favorito */}
                                                        <button onClick={() => handleRemoveFavorito(prod.id)}>Remover</button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <p>{favoritosDisponiveis ? 'Você ainda não tem favoritos.' : 'Favoritos indisponíveis.'}</p>}
                                    </div>
                                )}
                            </div>
                        </main>
                    </div>
                </div>
            </div>
            <Footer />

            {/* Modals */}
            {isDetailsModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-end md:items-center z-50">
                    <div role="dialog" aria-modal="true" className="bg-white rounded-t-2xl md:rounded-lg shadow-xl p-4 md:p-8 w-full max-w-full md:max-w-3xl mx-2 md:mx-0 max-h-[85vh] md:max-h-none overflow-y-auto">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Detalhes do Pedido #{selectedOrder.numero_pedido || (selectedOrder.id || '').slice(0, 8)}</h2>

                        {/* Resumo superior */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
                            <div className="p-3 md:p-4 border rounded-lg">
                                <div className="text-sm text-gray-600">Data</div>
                                <div className="font-semibold">{selectedOrder.created_at ? formatDate(selectedOrder.created_at) : '-'}</div>
                            </div>
                            <div className="p-3 md:p-4 border rounded-lg">
                                <div className="text-sm text-gray-600">Status</div>
                                <div className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${getStatusColor((selectedOrder.status || '').charAt(0).toUpperCase() + (selectedOrder.status || '').slice(1))}`}>{(selectedOrder.status || '').charAt(0).toUpperCase() + (selectedOrder.status || '').slice(1)}</div>
                            </div>
                            <div className="p-3 md:p-4 border rounded-lg">
                                <div className="text-sm text-gray-600">Total</div>
                                <div className="font-semibold text-pink-600">{formatCurrency(selectedOrder.total)}</div>
                            </div>
                        </div>

                        {/* Endereço e pagamento */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
                            <div className="p-3 md:p-4 border rounded-lg">
                                <div className="font-semibold mb-2">Endereço de Entrega</div>
                                {selectedOrder.endereco_entrega ? (
                                    <div className="text-sm text-gray-700 space-y-1">
                                        <div>{selectedOrder.endereco_entrega.nome}</div>
                                        <div>{selectedOrder.endereco_entrega.endereco}, {selectedOrder.endereco_entrega.numero}{selectedOrder.endereco_entrega.complemento ? `, ${selectedOrder.endereco_entrega.complemento}` : ''}</div>
                                        <div>{selectedOrder.endereco_entrega.bairro} • {selectedOrder.endereco_entrega.cidade}/{selectedOrder.endereco_entrega.estado}</div>
                                        <div>CEP: {selectedOrder.endereco_entrega.cep}</div>
                                    </div>
                                ) : deliveryAddress ? (
                                    <div className="text-sm text-gray-700 space-y-1">
                                        <div>{deliveryAddress.nome}</div>
                                        <div>{deliveryAddress.endereco}, {deliveryAddress.numero}{deliveryAddress.complemento ? `, ${deliveryAddress.complemento}` : ''}</div>
                                        <div>{deliveryAddress.bairro} • {deliveryAddress.cidade}/{deliveryAddress.estado}</div>
                                        <div>CEP: {deliveryAddress.cep}</div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-500">Endereço não disponível.</div>
                                )}
                            </div>
                            <div className="p-3 md:p-4 border rounded-lg">
                                <div className="font-semibold mb-2">Pagamento</div>
                                <div className="text-sm text-gray-700">{selectedOrder.forma_pagamento === 'credit' ? 'Cartão de Crédito' : selectedOrder.forma_pagamento === 'pix' ? 'PIX' : selectedOrder.forma_pagamento === 'dinheiro' ? 'Dinheiro' : selectedOrder.forma_pagamento || '-'}</div>
                                {(() => {
                                    const subtotalCalc = typeof selectedOrder.subtotal === 'number' && selectedOrder.subtotal > 0
                                        ? selectedOrder.subtotal
                                        : orderItems.reduce((sum, it) => sum + (Number(it.subtotal) || 0), 0);
                                    const freteCalc = typeof selectedOrder.frete === 'number' ? selectedOrder.frete : 0;
                                    const descontoCalc = typeof selectedOrder.desconto === 'number' ? selectedOrder.desconto : 0;
                                    const totalCalc = typeof selectedOrder.total === 'number' && selectedOrder.total > 0
                                        ? selectedOrder.total
                                        : subtotalCalc + freteCalc - descontoCalc;
                                    return (
                                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                            <div className="text-gray-600">Subtotal</div>
                                            <div className="text-right">{formatCurrency(subtotalCalc)}</div>
                                            <div className="text-gray-600">Frete</div>
                                            <div className="text-right">{formatCurrency(freteCalc)}</div>
                                            <div className="text-gray-600">Desconto</div>
                                            <div className="text-right">{formatCurrency(descontoCalc)}</div>
                                            <div className="font-medium">Total</div>
                                            <div className="text-right font-semibold text-pink-600">{formatCurrency(totalCalc)}</div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Itens do pedido */}
                        <div className="mb-4 md:mb-6">
                            <div className="font-semibold mb-3">Itens</div>
                            {orderItems.length > 0 ? (
                                <div className="space-y-2 md:space-y-3">
                                    {orderItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 border rounded-lg p-3">
                                            {item.imagem ? (
                                                <img src={item.imagem} alt={item.nome} className="w-12 h-12 md:w-16 md:h-16 object-cover rounded" />
                                            ) : (
                                                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                                                    <i className="ri-image-line"></i>
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate text-sm md:text-base">{item.nome}</div>
                                                <div className="text-xs text-gray-600">{[item.tamanho, item.cor].filter(Boolean).join(' • ')}</div>
                                            </div>
                                            <div className="text-right text-sm">
                                                <div className="text-gray-600">{item.quantidade}x • {formatCurrency(item.preco_unitario)}</div>
                                                <div className="font-semibold">{formatCurrency(item.subtotal)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500">Nenhum item encontrado para este pedido.</div>
                            )}
                        </div>

                        {/* Ações */}
                        <div className="flex flex-col md:flex-row md:justify-end gap-2 md:gap-3">
                            <button onClick={() => window.print()} className="w-full md:w-auto px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50">Imprimir</button>
                            <button onClick={() => setIsDetailsModalOpen(false)} className="w-full md:w-auto px-6 py-2 text-sm font-medium text-white bg-pink-600 rounded-lg">Fechar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Endereço Modal */}
            <EnderecoModal
                showModal={showEnderecoModal}
                setShowModal={setShowEnderecoModal}
                enderecoEdit={enderecoEdit}
                clienteId={clienteIdDb ?? user?.id}
                onSave={handleSaveEndereco}
            />
        </>
    );
}
