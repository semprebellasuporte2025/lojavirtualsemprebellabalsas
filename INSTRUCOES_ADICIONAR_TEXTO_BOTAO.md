# Script para Adicionar Coluna texto_botao à Tabela de Banners

## Problema Identificado
O erro 400 ao tentar atualizar banners ocorre porque a tabela `banners` não possui a coluna `texto_botao` que está sendo tentada atualizar na página de edição.

## Solução
Execute o seguinte script SQL no Supabase Studio para adicionar a coluna necessária:

### Passo a Passo:
1. Acesse o **Supabase Studio**: https://app.supabase.com
2. Selecione seu projeto
3. Vá para **SQL Editor**
4. Cole o seguinte código SQL:

```sql
-- Adicionar a coluna texto_botao à tabela de banners
ALTER TABLE public.banners
ADD COLUMN texto_botao VARCHAR(100);

-- Adicionar um comentário à nova coluna
COMMENT ON COLUMN public.banners.texto_botao IS 'Texto customizado para o botão do banner (ex: "Compre Agora", "Ver Coleção"). Se nulo, o botão pode não ser exibido ou ter um texto padrão.';

-- Opcional: Preencher valores padrão para banners existentes que têm um link
UPDATE public.banners
SET texto_botao = 'Saiba Mais'
WHERE link_destino IS NOT NULL AND texto_botao IS NULL;
```

5. Clique em **Run** para executar o script

### Verificação
Após executar o script, verifique se a coluna foi adicionada corretamente:

```sql
-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns 
WHERE table_name = 'banners' AND table_schema = 'public'
ORDER BY ordinal_position;
```

## Resultado Esperado
Após executar o script SQL, a página de edição de banners deve funcionar corretamente sem o erro 400, pois a coluna `texto_botao` estará disponível na tabela.

## Observações
- A coluna `texto_botao` é opcional (permite valores NULL)
- Banners existentes com `link_destino` preenchido receberão o valor padrão "Saiba Mais"
- Novos banners podem ter texto customizado para o botão ou deixar em branco para usar o padrão