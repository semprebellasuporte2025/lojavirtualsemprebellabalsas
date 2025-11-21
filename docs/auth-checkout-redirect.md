# Fluxo de Redirecionamento Pós-Login (Checkout)

Este documento descreve o comportamento esperado após o login quando o usuário veio do checkout, bem como as mudanças aplicadas.

## Comportamento Esperado

- Usuários com itens no carrinho que vieram de `/checkout` devem retornar ao `/checkout` após login.
- Usuários sem itens no carrinho são redirecionados para `/minha-conta`.
- Usuários administradores (`isAdmin`, `isAtendente` ou `isUsuario` [staff]) continuam sendo redirecionados para `/paineladmin`.
- Se o usuário veio de `/carrinho`, retorna para `/carrinho` após login.

## Implementação

- Criado util `src/utils/redirect.ts` com a função `determinePostLoginRedirect(params)` que centraliza a decisão de destino pós-login.
- `LoginPage` passou a ler a intenção de origem via `location.state?.from`, query `?from=...` e, como fallback, `localStorage.postLoginFrom`.
- `LoginPage` agora usa `useCart` para verificar se há itens no carrinho, e decide o destino com base em perfil e intenção.
- Adicionados logs estruturados em `LoginPage` e `CheckoutPage` para diagnosticar o fluxo de redirecionamento e o estado do carrinho.

## Testes

- `src/utils/redirect.test.ts`: cobre cenários de admin, retorno ao checkout com itens, retorno à conta sem itens, e retorno ao carrinho.
- `src/hooks/useCart.test.ts`: valida que o store mantém o total de itens durante o processo (garantindo que o carrinho não é limpo).
- Configurado `vitest.config.ts` para ambiente `jsdom`.

## Observabilidade

- Logs em `LoginPage`:
  - origem (`fromPath`), quantidade de itens no carrinho, caminho atual e destino.
- Logs em `CheckoutPage`:
  - intenção de redirecionamento para login com `from=/checkout` e quantidade de itens.

## Arquivos Alterados

- `src/utils/redirect.ts` (novo)
- `src/pages/auth/login/page.tsx` (ajuste de redirecionamento)
- `src/pages/checkout/page.tsx` (logs)
- `src/utils/redirect.test.ts` (novo)
- `src/hooks/useCart.test.ts` (novo)
- `vitest.config.ts` (novo)

## Notas

- O carrinho é persistido via `zustand` com `persist` (`name: 'cart-storage'`), garantindo que o contexto do carrinho se mantenha durante a autenticação.
- Testes existentes relacionados a serviços externos podem falhar independentemente destas mudanças; não foram alterados.