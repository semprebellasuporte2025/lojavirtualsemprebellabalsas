import 'dotenv/config';
import { supabase } from './src/lib/supabase.ts';

async function testPagarMPWithAuth() {
  console.log('Testando pagar-mp com autenticação...');
  
  try {
    // Primeiro, fazer login para obter um JWT válido
    console.log('Fazendo login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'everaldozs@gmail.com',
      password: '1234567'
    });
    
    if (authError) {
      console.error('Erro no login:', authError.message);
      return;
    }
    
    console.log('Login bem-sucedido!');
    console.log('User ID:', authData.user.id);
    
    // Agora testar a função pagar-mp
    console.log('\n=== Testando pagar-mp ===');
    const { data, error } = await supabase.functions.invoke('pagar-mp', {
      body: {
        method: 'pix',
        amount: 10.50,
        description: 'Teste de pagamento com auth',
        payer: {
          email: 'everaldozs@gmail.com'
        }
      }
    });
    
    if (error) {
      console.error('Erro na função pagar-mp:', error.message);
      console.log('Detalhes do erro:', error);
    } else {
      console.log('Sucesso! Resposta:', data);
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

testPagarMPWithAuth();