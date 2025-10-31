-- Função para obter rating médio e contagem de reviews para um produto
CREATE OR REPLACE FUNCTION get_product_ratings(produto_id UUID)
RETURNS TABLE (
  average_rating DOUBLE PRECISION,
  review_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    AVG(rating)::DOUBLE PRECISION AS average_rating,
    COUNT(*) AS review_count
  FROM public.reviews
  WHERE reviews.produto_id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários
COMMENT ON FUNCTION get_product_ratings IS 'Retorna o rating médio e contagem de reviews para um produto específico';