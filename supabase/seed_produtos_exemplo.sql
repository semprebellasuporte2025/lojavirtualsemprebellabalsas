-- Seed de produtos de exemplo para testar a dashboard
-- Execute este arquivo no painel do Supabase para adicionar produtos de exemplo

-- Primeiro, garantir que temos categorias
INSERT INTO public.categorias (nome, descricao, ativa)
VALUES 
  ('Vestidos', 'Categoria de vestidos elegantes', true),
  ('Maquiagem', 'Produtos de beleza e maquiagem', true),
  ('Acessórios', 'Acessórios diversos', true)
ON CONFLICT (nome) DO NOTHING;

-- Inserir produtos de exemplo
INSERT INTO public.produtos (nome, descricao, preco, categoria_id, estoque, ativo, destaque)
SELECT 
  'Vestido Floral Primavera',
  'Vestido leve com estampa floral, perfeito para o verão',
  199.90,
  c.id,
  15,
  true,
  true
FROM public.categorias c 
WHERE c.nome = 'Vestidos'
ON CONFLICT DO NOTHING;

INSERT INTO public.produtos (nome, descricao, preco, categoria_id, estoque, ativo)
SELECT 
  'Batom Matte Vermelho',
  'Batom de longa duração com acabamento matte',
  29.90,
  c.id,
  50,
  true
FROM public.categorias c 
WHERE c.nome = 'Maquiagem'
ON CONFLICT DO NOTHING;

INSERT INTO public.produtos (nome, descricao, preco, categoria_id, estoque, ativo)
SELECT 
  'Colar Dourado Delicado',
  'Colar dourado com pingente em formato de coração',
  89.90,
  c.id,
  25,
  true
FROM public.categorias c 
WHERE c.nome = 'Acessórios'
ON CONFLICT DO NOTHING;

INSERT INTO public.produtos (nome, descricao, preco, categoria_id, estoque, ativo)
SELECT 
  'Vestido Midi Preto',
  'Vestido midi elegante para ocasiões especiais',
  299.90,
  c.id,
  8,
  true
FROM public.categorias c 
WHERE c.nome = 'Vestidos'
ON CONFLICT DO NOTHING;

INSERT INTO public.produtos (nome, descricao, preco, categoria_id, estoque, ativo)
SELECT 
  'Base Líquida Natural',
  'Base líquida com cobertura natural e proteção solar',
  79.90,
  c.id,
  30,
  true
FROM public.categorias c 
WHERE c.nome = 'Maquiagem'
ON CONFLICT DO NOTHING;

-- Verificar se os produtos foram inseridos
SELECT 
  p.nome,
  p.preco,
  p.estoque,
  c.nome as categoria
FROM public.produtos p
JOIN public.categorias c ON c.id = p.categoria_id
WHERE p.ativo = true
ORDER BY p.created_at DESC;