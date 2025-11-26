require('dotenv').config();

const SUPABASE_URL = process.env.VITE_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('❌ Defina VITE_PUBLIC_SUPABASE_URL e VITE_PUBLIC_SUPABASE_ANON_KEY no ambiente');
  process.exit(1);
}

console.log('URL:', SUPABASE_URL);
console.log('Chave Anônima:', ANON_KEY);

// Testar a chave anônima com uma chamada simples à API
async function testAnonKey() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      }
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (response.ok) {
      console.log('✅ Chave anônima válida!');
    } else {
      const text = await response.text();
      console.log('❌ Erro:', text);
    }
    
  } catch (error) {
    console.error('Erro ao testar chave:', error);
  }
}

testAnonKey();