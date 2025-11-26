-- Função RPC para criar pedido com todos os dados necessários
CREATE OR REPLACE FUNCTION public.criar_pedido(
  p_cliente_id UUID DEFAULT NULL,
  p_numero_pedido TEXT,
  p_subtotal NUMERIC,
  p_desconto NUMERIC DEFAULT 0,
  p_frete NUMERIC DEFAULT 0,
  p_total NUMERIC,
  p_forma_pagamento TEXT,
  p_status TEXT DEFAULT 'pendente',
  p_endereco_entrega TEXT DEFAULT NULL,
  p_cidade_entrega TEXT DEFAULT NULL,
  p_estado_entrega TEXT DEFAULT NULL,
  p_cep_entrega TEXT DEFAULT NULL,
  p_itens JSONB[] DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pedido_id UUID;
BEGIN
  -- Validar dados obrigatórios
  IF p_numero_pedido IS NULL THEN
    RAISE EXCEPTION 'Número do pedido é obrigatório';
  END IF;
  
  IF p_total IS NULL OR p_total <= 0 THEN
    RAISE EXCEPTION 'Total do pedido deve ser maior que zero';
  END IF;

  -- Criar o pedido
  INSERT INTO public.pedidos (
    cliente_id,
    numero_pedido,
    subtotal,
    desconto,
    frete,
    total,
    forma_pagamento,
    status,
    endereco_entrega,
    cidade_entrega,
    estado_entrega,
    cep_entrega
  ) VALUES (
    p_cliente_id,
    p_numero_pedido,
    p_subtotal,
    p_desconto,
    p_frete,
    p_total,
    p_forma_pagamento,
    p_status,
    p_endereco_entrega,
    p_cidade_entrega,
    p_estado_entrega,
    p_cep_entrega
  ) RETURNING id INTO v_pedido_id;

  -- Inserir itens do pedido se fornecidos
  IF p_itens IS NOT NULL AND array_length(p_itens, 1) > 0 THEN
    -- Anexar pedido_id a cada item e delegar para função de inserção
    DECLARE v_itens_com_pedido JSONB[];
    BEGIN
      SELECT array_agg(it || jsonb_build_object('pedido_id', v_pedido_id::text))
        INTO v_itens_com_pedido
      FROM unnest(p_itens) AS it;
      PERFORM public.inserir_itens_pedido(v_itens_com_pedido);
    END;
  END IF;

  RETURN v_pedido_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Número de pedido já existe: %', p_numero_pedido;
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- Conceder permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION public.criar_pedido TO authenticated;
-- Permitir execução pela role anon para checkouts sem login
GRANT EXECUTE ON FUNCTION public.criar_pedido TO anon;