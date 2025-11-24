// Teste simples do fluxo PIX
console.log('🧪 Iniciando teste PIX simples...');

// Verificar se as variáveis de ambiente estão carregadas
console.log('Variáveis de ambiente:');
console.log('SUPABASE_URL:', process.env.VITE_PUBLIC_SUPABASE_URL || 'Não definido');
console.log('SUPABASE_ANON_KEY:', process.env.VITE_PUBLIC_SUPABASE_ANON_KEY ? 'Definido' : 'Não definido');

console.log('✅ Teste básico concluído');