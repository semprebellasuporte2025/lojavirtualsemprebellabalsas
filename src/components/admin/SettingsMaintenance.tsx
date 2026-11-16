import React, { useState, useEffect } from 'react';
import { Power, CheckCircle2, ShieldAlert } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SettingsMaintenanceProps {
  onToggle?: (newState: boolean) => void;
}

export default function SettingsMaintenance({ onToggle }: SettingsMaintenanceProps) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    async function loadMaintenanceStatus() {
      try {
        setLoading(true);

        // Consulta status diretamente do Supabase
        const { data } = await supabase
          .from('configuracoes_sistema')
          .select('valor')
          .eq('chave', 'modo_manutencao')
          .maybeSingle();

        if (data) {
          setIsMaintenanceMode(data.valor === 'true');
        } else {
          const saved = localStorage.getItem('site_maintenance_mode') === 'true';
          setIsMaintenanceMode(saved);
        }
      } catch (err) {
        console.error('Erro ao carregar status do modo de manutenção:', err);
      } finally {
        setLoading(false);
      }
    }

    loadMaintenanceStatus();
  }, []);

  const handleToggle = async () => {
    const nextState = !isMaintenanceMode;
    setSaving(true);

    try {
      // 1. Grava no banco de dados para sincronizar imediatamente com guia anônima e outros dispositivos
      const { error } = await supabase
        .from('configuracoes_sistema')
        .upsert(
          {
            chave: 'modo_manutencao',
            valor: String(nextState),
            descricao: 'Modo de Manutenção do Site',
            updated_at: new Date().toISOString()
          },
          { onConflict: 'chave' }
        );

      if (error) {
        console.warn('Erro ao salvar no banco, mantendo localmente:', error);
      }

      // 2. Grava no localStorage para cache rápido
      localStorage.setItem('site_maintenance_mode', String(nextState));
      window.dispatchEvent(new Event('maintenance_mode_changed'));

      setIsMaintenanceMode(nextState);
      if (onToggle) onToggle(nextState);
    } catch (err) {
      console.error('Erro ao salvar alteração do modo de manutenção:', err);
      alert('Falha ao atualizar o modo de manutenção.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-bold text-gray-900">Modo de Manutenção</h3>
            
            {/* Indicador Visual Claro (Verde / Vermelho) */}
            {isMaintenanceMode ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-red-100 text-red-700 border border-red-200">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                ATIVO (SITE BLOQUEADO)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-emerald-100 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                DESATIVADO (SITE ONLINE)
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Quando ativado, apenas administradores autenticados conseguem acessar a loja. Visitantes e clientes verão a tela de manutenção.
          </p>
        </div>

        {/* Botão Switch / Toggle */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {isMaintenanceMode ? 'Ligado' : 'Desligado'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isMaintenanceMode}
            disabled={loading || saving}
            onClick={handleToggle}
            className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              isMaintenanceMode ? 'bg-red-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                isMaintenanceMode ? 'translate-x-7' : 'translate-x-0'
              }`}
            >
              <Power
                className={`w-3.5 h-3.5 ${
                  isMaintenanceMode ? 'text-red-600' : 'text-gray-400'
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Caixa de Alerta Contextual */}
      <div className="mt-6">
        {isMaintenanceMode ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-red-800">
              <strong className="block font-bold mb-0.5">Atenção: Acesso público interrompido!</strong>
              Nenhum cliente ou visitante consegue visualizar produtos ou finalizar compras neste momento. Apenas a equipe com perfil de Administrador tem permissão para navegar.
            </div>
          </div>
        ) : (
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-emerald-800">
              <strong className="block font-bold mb-0.5">Tudo funcionando normalmente</strong>
              Sua loja virtual está acessível publicamente para todos os visitantes e clientes.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
