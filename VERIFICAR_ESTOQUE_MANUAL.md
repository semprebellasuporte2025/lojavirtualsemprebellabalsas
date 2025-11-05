# Instruções para Verificar Estoque Manualmente

## Problema
Os produtos estão mostrando "Produto esgotado" mesmo quando há estoque disponível.

## Como Verificar

### 1. Acesse o Supabase Studio
1. Acesse: https://app.supabase.com
2. Selecione seu projeto "Sempre Bella Balsas"
3. Vá para "SQL Editor"

### 2. Execute o Script de Verificação
Cole e execute o seguinte SQL:

```sql
-- Script para verificar produtos e estoques
SELECT 
    p.id,
    p.nome,
    p.estoque as estoque_produto,
    p.ativo,
    COUNT(v.id) as total_variantes,
    SUM(v.estoque) as total_estoque_variantes,
    STRING_AGG(CONCAT(v.tamanho, ' (', v.cor, '): ', v.estoque), ', ') as variantes_info
FROM public.produtos p
LEFT JOIN public.variantes_produto v ON p.id = v.produto_id
WHERE p.nome ILIKE '%jeans%' OR p.nome ILIKE '%wide leg%' OR p.nome ILIKE '%calça%'
GROUP BY p.id, p.nome, p.estoque, p.ativo
ORDER BY p.nome;

-- Verificar também produtos com estoque zerado
SELECT 
    id,
    nome,
    estoque,
    ativo
FROM public.produtos 
WHERE estoque = 0 AND ativo = true
ORDER BY nome;
```

### 3. Analise os Resultados
- Verifique se os produtos realmente têm estoque > 0
- Confirme se o campo `ativo` está como `true`
- Verifique se há variantes com estoque disponível

### 4. Possíveis Causas
1. **Estoque zerado no banco**: Campo `estoque` = 0
2. **Produto inativo**: Campo `ativo` = false
3. **Problema na lógica de variantes**: O estoque pode estar nas variantes, não no produto principal
4. **Cache da aplicação**: Pode estar mostrando dados antigos

### 5. Soluções
1. **Atualizar estoque no banco**:
   ```sql
   UPDATE public.produtos 
   SET estoque = 10 
   WHERE id = 'id-do-produto' AND ativo = true;
   ```

2. **Verificar variantes**:
   ```sql
   SELECT * FROM public.variantes_produto 
   WHERE produto_id = 'id-do-produto';
   ```

3. **Limpar cache do navegador** se necessário

## Arquivos Relacionados
- `src/pages/product/components/ProductInfo.tsx` - Lógica de exibição de estoque
- `scripts/check-produtos-estoque.sql` - Script de verificação
- `src/lib/supabase.ts` - Configuração do banco

## Próximos Passos
1. Execute o script acima no Supabase
2. Identifique quais produtos estão com estoque incorreto
3. Corrija os valores de estoque no banco
4. Teste a página de produto novamente