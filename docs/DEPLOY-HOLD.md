# Hold de Deploy

Este repositório está com deploy para produção em HOLD até solicitação explícita do usuário.

- Não criar Pull Request para `main`/`master`.
- Não fazer merge na `main`/`master`.
- Revisão deve ocorrer na branch de feature e/ou ambiente de staging local.

Workflow atual:
- O GitHub Actions está configurado para disparar em `push` e `pull_request` direcionados a `main`/`master`.
- Como trabalharemos apenas em branch de feature sem abrir PR, nenhum deploy será acionado.

Quando for autorizado:
- Abriremos PR para `main`, validaremos o pipeline e realizaremos o deploy na Vercel.