// Script para ajudar a debugar o problema real do carrinho
// Este script vai capturar informações do carrinho real quando o erro ocorrer

console.log('🛠️  Script de debug para problema de "saldo insuficiente"');
console.log('='.repeat(60));

// Instruções para usar:
console.log('\n📋 INSTRUÇÕES:');
console.log('1. Abra o navegador no checkout onde ocorre o erro');
console.log('2. Abra o DevTools (F12) e vá para o Console');
console.log('3. Cole o código abaixo quando o erro ocorrer:');

const debugCode = `
// Capturar informações do carrinho no momento do erro
const cartState = JSON.parse(localStorage.getItem('cart') || '{}');
const checkoutState = JSON.parse(localStorage.getItem('checkout-state') || '{}');

console.log('🛒 ESTADO DO CARRINHO:', cartState);
console.log('📋 ESTADO DO CHECKOUT:', checkoutState);

// Capturar informações específicas do formulário de pagamento
const paymentForm = document.querySelector('form');
let formData = {};
if (paymentForm) {
  const formElements = paymentForm.elements;
  for (let i = 0; i < formElements.length; i++) {
    const element = formElements[i];
    if (element.name) {
      formData[element.name] = element.value;
    }
  }
}

console.log('📝 DADOS DO FORMULÁRIO:', formData);

// Verificar se há erros na console
console.log('🔍 ÚLTIMOS ERROS NA CONSOLE:');
// Isso vai mostrar os últimos erros que ocorreram
`;

console.log(debugCode);
console.log('\n💡 DICA: Execute este código imediatamente após ver o erro "saldo insuficiente"');
console.log('   Isso vai nos ajudar a entender exatamente quais dados estão sendo enviados');

// Também vou criar uma função que pode ser chamada diretamente
window.debugCartError = function() {
  console.log('🔍 Iniciando debug do erro de carrinho...');
  
  try {
    const cartState = JSON.parse(localStorage.getItem('cart') || '{}');
    const checkoutState = JSON.parse(localStorage.getItem('checkout-state') || '{}');
    
    console.log('📦 Itens do carrinho:', cartState.items || []);
    console.log('💰 Total do carrinho:', cartState.total);
    console.log('🚚 Dados de entrega:', checkoutState.shipping);
    console.log('💳 Dados de pagamento:', checkoutState.payment);
    
    // Calcular totais
    if (cartState.items) {
      const subtotal = cartState.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      console.log('🧮 Subtotal calculado:', subtotal);
    }
    
  } catch (error) {
    console.error('❌ Erro ao fazer debug:', error);
  }
};

console.log('\n🎯 Você também pode chamar debugCartError() diretamente no console');
console.log('   quando o erro ocorrer para obter informações detalhadas.');