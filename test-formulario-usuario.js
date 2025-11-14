// Script para testar o formulário de cadastro de usuários
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase (mesmas variáveis do frontend)
const supabaseUrl = "https://cproxdqrraiujnewbsvp.supabase.co";
const supabaseKey = "sb_publishable_rTW_XToE2y-HAx4duwsTtw_lrKt_qhM";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFormularioCompleto() {
  console.log('🚀 Testando formulário de cadastro de usuários...\n');
  
  // Simular dados que seriam preenchidos no formulário
  const dadosFormulario = {
    nome: "João Silva Teste",
    email: "joao.silva.teste@email.com", 
    senha: "123456",
    confirmarSenha: "123456",
    tipo: "admin",
    departamento: "Administração",
    cargo: "Administrador",
    ativo: true
  };
  
  console.log('📋 Dados do formulário:');
  console.log(JSON.stringify(dadosFormulario, null, 2));
  console.log('');
  
  // Testar validações do frontend
  console.log('✅ Testando validações do frontend...');
  
  if (dadosFormulario.senha !== dadosFormulario.confirmarSenha) {
    console.log('❌ ERRO: Senhas não coincidem');
    return;
  }
  
  if (dadosFormulario.senha.length < 6) {
    console.log('❌ ERRO: Senha deve ter pelo menos 6 caracteres');
    return;
  }
  
  console.log('✅ Validações do frontend passaram');
  console.log('');
  
  // Testar chamada para a Edge Function (igual ao formulário)
  console.log('📞 Testando chamada para cadastrar-admin...');
  
  try {
    const { data, error } = await supabase.functions.invoke('cadastrar-admin', {
      body: {
        nome: dadosFormulario.nome,
        email: dadosFormulario.email,
        senha: dadosFormulario.senha,
        tipo: dadosFormulario.tipo,
        departamento: dadosFormulario.departamento,
        cargo: dadosFormulario.cargo
      }
    });
    
    if (error) {
      console.log('❌ ERRO na função:');
      console.log('Mensagem:', error.message);
      console.log('Detalhes:', JSON.stringify(error, null, 2));
      return;
    }
    
    console.log('✅ Resposta da função:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data?.success) {
      console.log('🎉 USUÁRIO CRIADO COM SUCESSO!');
      console.log('ID do usuário:', data.user?.id);
    } else {
      console.log('❌ Falha na criação do usuário');
    }
    
  } catch (error) {
    console.log('❌ ERRO na execução:');
    console.log('Mensagem:', error.message);
    console.log('Stack:', error.stack);
  }
}

// Executar teste
testFormularioCompleto().catch(console.error);