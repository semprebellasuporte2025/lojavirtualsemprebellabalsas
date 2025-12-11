# Normalização de Slugs de Produtos

Este documento descreve como normalizamos slugs de produtos e como corrigir dados existentes. O objetivo é garantir URLs estáveis, legíveis e compatíveis.

## Política de Normalização
- Minúsculas: todo texto é convertido para `lowercase`.
- Acentos: removidos (ex.: `á, é, í, ó, ú, Ã, Ü`).
- `ç`: convertido para `c`.
- Espaços e separadores: substituídos por hífens `-`.
- Caracteres inválidos: removidos (ficam apenas `a–z`, `0–9` e hífen).
- Hífens consecutivos: colapsados em um único `-`.
- Sem hífen inicial ou final.

## Implementação no Código
- Função principal: `normalizeProductSlug(name: string): string` em `src/utils/productSlug.ts`.
- Uso em geração de URLs: `buildProductUrl` em `src/utils/productUrl.ts`.
- Interfaces administrativas: cadastro/edição/ajuda usam `normalizeProductSlug` para sugerir slugs.
- Validação: `isValidProductSlug` garante formato `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- Unicidade: `ensureUniqueProductSlug` anexa sufixos incrementais quando necessário.

## Exemplos
- `Vestido Midi Alfaiataria Cinto Lenço` → `vestido-midi-alfaiataria-cinto-lenco`
- `Calça & Camiseta – Edição Especial!` → `calca-camiseta-edicao-especial`
- `BLUSA 100% ALGODÃO` → `blusa-100-algodao`

## Correção de Dados Existentes (SQL)
- Script: `scripts/fix-product-slugs.sql`.
- Estratégias:
  - Preferir `UNACCENT` se disponível; caso contrário usar `TRANSLATE` + `REGEXP_REPLACE`.
  - Opcionalmente resolver duplicidades com sufixos `-2`, `-3`, ... via CTE.

### Passos sugeridos
1. Fazer backup da tabela `produtos`.
2. Executar a atualização principal de slug.
3. Validar contagens e duplicidades.
4. Se necessário, executar o bloco para sufixos incrementais.
5. Testar URLs e páginas de produto.

## Testes Automatizados
- Local: `src/utils/__tests__/productSlug.test.ts`.
- Coberturas:
  - Normalização: acentos, `ç`, minúsculas, separadores e remoção de especiais.
  - Validação de formato de slug.
  - Geração de URLs (`/produto/<slug>` apenas com slug).
  - Unicidade com mocks do cliente de banco.

## Operação e Manutenção
- Novos fluxos que criem/alterem slugs devem reutilizar `normalizeProductSlug`.
- Ao migrar dados, sempre validar com `isValidProductSlug` e checar duplicidades.
- Evitar dependência de IDs em URLs de produto; usar exclusivamente slugs.

