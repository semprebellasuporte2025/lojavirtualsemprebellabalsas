import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface Address {
  id?: string;
  cliente_id?: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  created_at?: string;
}

export const useAddress = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserAddresses = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    console.log('Buscando endereços para usuário:', user.id, 'email:', user.email);
    
    try {
      // Primeiro tenta buscar por cliente_id vinculado ao email
      const { data: clienteData } = await supabase
        .from('clientes')
        .select('id')
        .eq('email', user.email || '')
        .maybeSingle();

      let addressesData: Address[] = [];

      if (clienteData?.id) {
        const { data: addressesByCliente, error: clienteError } = await supabase
          .from('enderecos')
          .select('*')
          .eq('cliente_id', clienteData.id);

        if (!clienteError && addressesByCliente) {
          addressesData = [...addressesData, ...addressesByCliente];
        }
      }

      // Também busca por auth.uid (fallback)
      const { data: addressesByAuth, error: authError } = await supabase
        .from('enderecos')
        .select('*')
        .eq('cliente_id', user.id);

      if (!authError && addressesByAuth) {
        // Filtra endereços duplicados
        const uniqueAddresses = addressesByAuth.filter(authAddr => 
          !addressesData.some(clienteAddr => 
            clienteAddr.cep === authAddr.cep &&
            clienteAddr.endereco === authAddr.endereco &&
            clienteAddr.numero === authAddr.numero
          )
        );
        addressesData = [...addressesData, ...uniqueAddresses];
      }

      setAddresses(addressesData);
    } catch (err) {
      console.error('Erro ao buscar endereços:', err);
      setError('Erro ao carregar endereços');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingAddress = async (address: Omit<Address, 'id' | 'cliente_id' | 'created_at'>): Promise<Address | null> => {
    if (!user) return null;

    try {
      // Busca endereços existentes com critérios flexíveis
      const { data: existingAddresses, error } = await supabase
        .from('enderecos')
        .select('*')
        .or(`cliente_id.eq.${user.id},cliente_id.in.(${await getClientIds()})`)
        .eq('cep', address.cep.replace(/\D/g, ''))
        .eq('endereco', address.endereco.trim())
        .eq('numero', address.numero.trim())
        .eq('bairro', address.bairro.trim())
        .limit(1);

      if (!error && existingAddresses && existingAddresses.length > 0) {
        return existingAddresses[0];
      }

      return null;
    } catch (err) {
      console.error('Erro ao verificar endereço existente:', err);
      return null;
    }
  };

  const getClientIds = async (): Promise<string> => {
    if (!user) return '';
    
    const { data: clientes } = await supabase
      .from('clientes')
      .select('id')
      .eq('email', user.email || '');
    
    return clientes?.map(c => c.id).join(',') || '';
  };

  const saveAddress = async (address: Omit<Address, 'id' | 'created_at'>): Promise<Address> => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      // Primeiro tenta usar cliente_id vinculado ao email
      const { data: clienteData } = await supabase
        .from('clientes')
        .select('id')
        .eq('email', user.email || '')
        .maybeSingle();

      const clienteId = clienteData?.id || user.id;

      const { data: newAddress, error } = await supabase
        .from('enderecos')
        .insert([{ ...address, cliente_id: clienteId }])
        .select()
        .single();

      if (error) throw error;

      // Atualiza a lista local
      setAddresses(prev => [...prev, newAddress]);
      return newAddress;
    } catch (err) {
      console.error('Erro ao salvar endereço:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchUserAddresses();
  }, [user]);

  return {
    addresses,
    loading,
    error,
    fetchUserAddresses,
    checkExistingAddress,
    saveAddress,
  };
};