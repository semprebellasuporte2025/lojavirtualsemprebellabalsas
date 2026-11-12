import React from 'react';

interface AdminPreloaderProps {
  title?: string;
  subtitle?: string;
  message?: string;
}

export default function AdminPreloader({
  title = 'Sempre Bella Balsas',
  subtitle = 'PAINEL ADMINISTRATIVO',
  message = 'Carregando módulos e permissões...',
}: AdminPreloaderProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pink-50/70 via-white to-rose-50/70 backdrop-blur-sm">
      {/* Círculos decorativos de iluminação ao fundo */}
      <div className="absolute w-72 h-72 rounded-full bg-pink-300/20 blur-3xl -top-10 -left-10 animate-pulse pointer-events-none" />
      <div className="absolute w-80 h-80 rounded-full bg-rose-300/20 blur-3xl -bottom-10 -right-10 animate-pulse pointer-events-none" />

      {/* Card Central */}
      <div className="relative z-10 w-full max-w-sm mx-4 bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-pink-100/80 text-center flex flex-col items-center">
        {/* Ícone com animação de pulso */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-2xl bg-pink-500 blur-lg opacity-30 animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/30">
            <i className="ri-shield-keyhole-line text-3xl animate-bounce" />
          </div>
        </div>

        {/* Nome da Marca e Tag */}
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
          {title}
        </h2>
        <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-widest text-pink-600 bg-pink-50 border border-pink-200">
          <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" />
          {subtitle}
        </span>

        {/* Barra de progresso animada */}
        <div className="w-full mt-6 mb-3">
          <div className="h-1.5 w-full bg-pink-100 rounded-full overflow-hidden relative">
            <div className="absolute top-0 bottom-0 left-0 h-full w-1/2 bg-gradient-to-r from-pink-500 via-rose-400 to-pink-600 rounded-full animate-shimmer" />
          </div>
        </div>

        {/* Texto de status */}
        <p className="text-xs font-medium text-gray-500 flex items-center justify-center gap-2">
          <i className="ri-loader-4-line animate-spin text-pink-600 text-sm" />
          {message}
        </p>
      </div>
    </div>
  );
}
