# Remoção de referências ao n8n no cadastro de produtos

Objetivo: remover qualquer configuração/URL relacionada ao n8n no fluxo de cadastro de produtos, mantendo a funcionalidade principal intacta.

## Escopo
- Apenas cadastro de produtos (`src/pages/admin/produtos/cadastrar/page.tsx`).
- Fora de escopo: páginas de contato, newsletter, checkout, pedidos e webhooks de pedidos.

## Situação encontrada
- Não havia chamadas HTTP ou uso de variáveis de ambiente para enviar dados ao n8n no cadastro de produtos.
- Existiam apenas mensagens de log orientativas com o texto “enviando para n8n”.

## Alterações realizadas
- Atualizado os logs no arquivo `src/pages/admin/produtos/cadastrar/page.tsx` para remover referências ao n8n:
  - `[CadastrarProduto] 🚀 handleSubmit chamado - iniciando cadastro de produto`
  - `[CadastrarProduto] 📤 Preparando dados do produto:`
  - `[CadastrarProduto] ❌ Erro no cadastro do produto:`

Nenhuma URL de n8n estava presente no fluxo de cadastro.

## Auditoria
- Registro: Remoção de menções ao n8n em logs do cadastro de produtos.
- Data/Hora: consulte o histórico de commits/PRs desta alteração.
- Arquivo impactado: `src/pages/admin/produtos/cadastrar/page.tsx`.

## Validações pós-remoção
1. Código-fonte (busca por referências):
   - Confirmar ausência de `n8n`, `webhook`, `callback`, `portaln8n` no diretório `src/pages/admin/produtos`.
2. Banco de dados:
   - Não há colunas na tabela `produtos` relacionadas a webhooks/callbacks.
   - Consultas para garantir que campos textuais não armazenem URLs do n8n:
     ```sql
     -- Verificar menções a n8n nas colunas mais comuns
     SELECT id, nome, slug
     FROM public.produtos
     WHERE nome ILIKE '%n8n%' OR slug ILIKE '%n8n%';

     -- Opcional: procurar termos 'portaln8n' em descrições
     SELECT id, nome
     FROM public.produtos
     WHERE descricao ILIKE '%portaln8n%';
     ```
3. Configurações:
   - Verificar `.env` e `vercel.json` para variáveis relacionadas a pedido (ex.: `VITE_ORDER_WEBHOOK_URL`). Não usadas no cadastro de produtos.

## Testes de sanidade (manuais)
- Acessar a página de cadastro de produtos no painel admin.
- Cadastrar um produto com ao menos 1 variação (cor/tamanho) e imagens.
- Validar que:
  - Produto é inserido na tabela `produtos` com `slug` válido.
  - Variações são inseridas na `variantes_produto`.
  - Nenhuma chamada externa (n8n) ocorre durante o cadastro.

## Observações
- Outras partes do projeto podem usar n8n (contato/newsletter/checkout/pedidos). Essas integrações não foram modificadas, pois estão fora do escopo solicitado.

