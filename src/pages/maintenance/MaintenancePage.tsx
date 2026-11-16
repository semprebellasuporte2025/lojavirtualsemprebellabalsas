import React from 'react';
import { Wrench, Clock, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MaintenancePageProps {
  customMessage?: string;
  estimatedReturnTime?: string;
}

export default function MaintenancePage({
  customMessage = 'Estamos realizando melhorias programadas em nosso sistema para proporcionar uma experiência ainda melhor. Voltaremos em breve!',
  estimatedReturnTime,
}: MaintenancePageProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 via-pink-50/30 to-gray-100 p-4 sm:p-6 lg:p-8">
      {/* Card Principal */}
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sm:p-10 text-center relative overflow-hidden">
        {/* Detalhe estético no topo */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600" />

        {/* Ícone de Ferramenta / Construção */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center mb-6 shadow-sm border border-pink-100/80">
          <Wrench className="w-10 h-10 animate-bounce" strokeWidth={1.8} />
        </div>

        {/* Título Principal */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-3">
          Site em Manutenção
        </h1>

        {/* Texto Explicativo */}
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6">
          {customMessage}
        </p>

        {/* Tempo estimado (opcional) */}
        {estimatedReturnTime && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-700 text-xs sm:text-sm font-medium mb-6">
            <Clock className="w-4 h-4 text-pink-600" />
            <span>Previsão de retorno: <strong>{estimatedReturnTime}</strong></span>
          </div>
        )}

        {/* Rodapé / Acesso Administrativo */}
        <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-gray-400" />
            Sempre Bella Balsas • Proteção Ativa
          </span>

          <Link
            to="/auth/login"
            className="text-pink-600 hover:text-pink-700 font-medium hover:underline transition-colors"
          >
            Acesso Restrito (Admin)
          </Link>
        </div>
      </div>
    </div>
  );
}
