CREATE OR REPLACE VIEW public.products_with_ratings AS
SELECT 
  p.*,
  COALESCE(AVG(r.rating), 0)::DOUBLE PRECISION AS average_rating,
  COUNT(r.id) AS review_count
FROM public.produtos p
LEFT JOIN public.reviews r ON p.id = r.produto_id
GROUP BY p.id;

-- Comentários
COMMENT ON VIEW public.products_with_ratings IS 'View de produtos com rating médio e contagem de reviews';