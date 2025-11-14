// Script para debug do formulário - simula exatamente o que o frontend faz
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase (mesmas variáveis do frontend)
const supabaseUrl = "https://cproxdqrraiujnewbsvp.supabase.co";
const supabaseKey = "sb_publishable_rTW_XToE2y-HAx4duwsTtw_lrKt_qhM";

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugFormulario() {
  console.log('🔍 Debug do formulário de cadastro...\n');
  
  // Simular dados do formulário
  const formData = {
    nome: "Maria Silva Teste",
    email: "maria.silva.teste@email.com", 
    senha: "123456",
    confirmarSenha: "123456",
    tipo: "admin",
    departamento: "Administração",
    cargo: "Administrador",
    ativo: true
  };
  
  console.log('📋 Dados simulados do formulário:');
  console.log(JSON.stringify(formData, null, 2));
  console.log('');
  
  // Simular validações do frontend
  console.log('✅ Simulando validações do frontend...');
  
  if (formData.senha !== formData.confirmarSenha) {
    console.log('❌ ERRO: Senhas não coincidem');
    return;
  }
  
  if (formData.senha.length < 6) {
    console.log('❌ ERRO: Senha deve ter pelo menos 6 caracteres');
    return;
  }
  
  console.log('✅ Validações passaram');
  console.log('');
  
  // Simular a chamada EXATA que o formulário faz
  console.log('📞 Simulando chamada do formulário para cadastrar-admin...');
  
  try {
    const { data, error } = await supabase.functions.invoke('cadastrar-admin', {
      body: {
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha,
        tipo: formData.tipo || 'admin',
        departamento: formData.departamento || 'Administração',
        cargo: formData.cargo || 'Administrador',
      }
    });
    
    console.log('📊 Resposta da função:');
    console.log('Data:', JSON.stringify(data, null, 2));
    console.log('Error:', error);
    console.log('');
    
    if (error) {
      console.log('❌ ERRO na função:');
      console.log('Mensagem:', error.message);
      console.log('Detalhes:', JSON.stringify(error, null, 2));
      return;
    }
    
    if (data?.success) {
      console.log('🎉 SUCESSO: Usuário criado!');
      console.log('ID:', data.user?.id);
      console.log('Nome:', data.user?.nome);
      console.log('Email:', data.user?.email);
    } else {
      console.log('❌ Falha na criação (resposta sem success: true)');
      console.log('Resposta completa:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.log('❌ ERRO na execução:');
    console.log('Mensagem:', error.message);
    console.log('Stack:', error.stack);
  }
}

// Executar debug
debugFormulario().catch(console.error);