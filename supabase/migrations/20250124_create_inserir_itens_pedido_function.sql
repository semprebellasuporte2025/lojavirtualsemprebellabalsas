-- Função RPC para inserir itens do pedido sem problemas de column filtering
CREATE OR REPLACE FUNCTION public.inserir_itens_pedido(itens JSONB[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inserir cada item do array
  FOR i IN 1..array_length(itens, 1) LOOP
    INSERT INTO public.itens_pedido (
      pedido_id,
      produto_id,
      nome,
      quantidade,
      preco_unitario,
      subtotal,
      tamanho,
      cor,
      imagem
    ) VALUES (
      (itens[i]->>'pedido_id')::uuid,
      itens[i]->>'produto_id',
      itens[i]->>'nome',
      (itens[i]->>'quantidade')::integer,
      (itens[i]->>'preco_unitario')::numeric,
      (itens[i]->>'subtotal')::numeric,
      CASE WHEN itens[i]->>'tamanho' = 'null' THEN NULL ELSE itens[i]->>'tamanho' END,
      CASE WHEN itens[i]->>'cor' = 'null' THEN NULL ELSE itens[i]->>'cor' END,
      CASE WHEN itens[i]->>'imagem' = 'null' THEN NULL ELSE itens[i]->>'imagem' END
    );
  END LOOP;
END;
$$;

-- Conceder permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION public.inserir_itens_pedido TO authenticated;