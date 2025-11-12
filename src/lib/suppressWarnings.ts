// Suprime apenas o aviso específico do Supabase sobre múltiplas instâncias do GoTrueClient.
// Mantém todos os demais avisos intactos.
// Executado no bootstrap da aplicação.

declare global {
  // eslint-disable-next-line no-var
  var __semprebella_warn_filter_installed__: boolean | undefined;
}

(() => {
  if (typeof window === 'undefined') return;
  if (globalThis.__semprebella_warn_filter_installed__) return;

  const originalWarn = window.console.warn?.bind(window.console) ?? ((..._args: any[]) => {});

  window.console.warn = (...args: any[]) => {
    try {
      const first = args[0];
      const isSupabaseGoTrueMessage = typeof first === 'string' && first.includes('Multiple GoTrueClient instances detected');
      if (isSupabaseGoTrueMessage) {
        // Ignora somente este aviso específico.
        return;
      }
    } catch (_) {
      // Se algo falhar, não interrompe outros avisos.
    }
    originalWarn(...args);
  };

  globalThis.__semprebella_warn_filter_installed__ = true;
})();