# Audit Log

Este arquivo registra mudanças relevantes de segurança/integrações.

## 2025-12-10 — Remoção de referências ao n8n no cadastro de produtos
- Escopo: cadastro de produtos apenas.
- Alteração: remoção de menções textuais a n8n nos logs do fluxo de cadastro.
- Arquivo alterado: `src/pages/admin/produtos/cadastrar/page.tsx`.
- Motivo: evitar qualquer indicação de envio ao n8n neste fluxo.
- Validação: busca por `n8n/webhook/callback` no diretório `src/pages/admin/produtos` sem ocorrências; cadastro funciona normalmente (inserção em `produtos` e `variantes_produto`).
- Documentação: `docs/integrations/product-registration-n8n-removal.md`.

