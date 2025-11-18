# Ponto de Restauração — Backup02

Este ponto documenta alterações recentes em autenticação (Cadastro) e no fluxo de pagamento (Mercado Pago — Checkout Pro), além de pequenos ajustes de qualidade de código.

## Resumo do Estado
- Servidor de desenvolvimento ativo em `http://localhost:5174/` (Vite).
- Página de cadastro criada em `/auth/register`, com todos os campos obrigatórios.
- Validações de formato aplicadas: Telefone (DDD + 8/9 dígitos) e CPF (dígitos verificadores).
- Máscaras de entrada adicionadas: Telefone `("(DD) 99999-9999")` e CPF `("999.999.999-99")`.
- Rótulos dos campos obrigatórios exibem asterisco vermelho.
- Checkout Pro ajustado para sempre usar `sandbox_init_point` em ambiente de desenvolvimento e logging do ID/links da preferência.
- Avisos TypeScript removidos (TS6133 em cadastro e carrinho).

## Arquivos Impactados
- `src/pages/auth/register/page.tsx`
  - Implementa formulário completo de cadastro: Nome, Email, Senha, Confirmar senha, Telefone, CPF.
  - Validações de obrigatoriedade, de senha (>= 6), confirmação de senha, telefone BR e CPF.
  - Máscaras de Telefone e CPF no `onChange` com `maxLength` apropriado.
  - Asteriscos em todos os campos obrigatórios.
  - Integração com `useAuth.signUp` e redirecionamento para `/auth/login` após sucesso.
- `src/router/config.tsx`
  - Rota adicionada: `/auth/register` com importação lazy e `Suspense`.
- `src/pages/checkout/components/CheckoutForm.tsx`
  - Em dev (`import.meta.env.DEV`), força uso de `sandbox_init_point`.
  - Logs: ID da preferência e links sandbox/prod.
- `src/pages/checkout/components/CheckoutFormV3.tsx`
  - Mesmo ajuste de sandbox e logs.
- `src/pages/carrinho/components/CartSummary.tsx`
  - Mesmo ajuste de sandbox e logs.
  - Remoção de leitura da variável não usada para eliminar TS6133.

## Como Restaurar Este Estado
1. Funções Edge (Supabase):
   - Deploy: `supabase functions deploy mercado-pago-checkout-pro --no-verify-jwt`
   - Segredos necessários:
     - `MERCADOPAGO_ACCESS_TOKEN` (de teste, prefixo `TEST-...`).
     - `SITE_URL` (HTTPS; usado para `back_urls` e webhook de fallback).
     - Opcional: `MERCADOPAGO_NOTIFICATION_URL` (HTTPS).
2. Frontend:
   - Variáveis `.env` (Vite): `VITE_PUBLIC_SUPABASE_URL`, `VITE_PUBLIC_SUPABASE_ANON_KEY` válidas.
   - Iniciar: `npm run dev -- --port 5174`.
   - Cadastro: acesse `/auth/register`, valide máscaras/formatos e faça um teste de criação de conta.
3. Pagamento (Sandbox):
   - Inicie um checkout a partir do carrinho/checkout e confirme no console os logs: ID da preferência e links (`sandbox_init_point` deve ser usado em dev).

## Checklist de Validação (OK)
- Home carrega e navegação básica funciona.
- `/auth/register` renderiza com todos os campos obrigatórios e asteriscos.
- Máscaras: Telefone e CPF formatam corretamente durante a digitação.
- Validações rejeitam formatos inválidos com mensagens claras.
- Cadastro bem-sucedido redireciona para `/auth/login`.
- Checkout Pro abre o link do sandbox e limpa o carrinho.
- Sem avisos TS6133 nos arquivos alterados.

## Observações
- Em desenvolvimento, o sistema força sandbox para evitar redirecionamentos indevidos à produção.
- Bloqueadores de anúncios/anti-tracking podem causar 404 em scripts de fingerprinting do checkout; desativar extensões ao testar.
- Em produção, troque credenciais para o token de produção e utilize `init_point`.

## Comandos Úteis (PowerShell)
- Criar backup zip do projeto:
  `Compress-Archive -Path * -DestinationPath backup02.zip -Force`
- Calcular hash SHA-256:
  `Get-FileHash -Algorithm SHA256 .\backup02.zip | Select-Object -ExpandProperty Hash`
- Verificar tamanho e data:
  `(Get-Item .\backup02.zip | Select-Object Name, Length, LastWriteTime)`