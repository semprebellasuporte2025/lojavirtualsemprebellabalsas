-- ==============================================================================
-- Migração: Criação das 9 Views do Sistema adaptadas para o novo banco
-- Data: 2026-11-12
-- ==============================================================================

-- 1. Clientes Ativos
CREATE OR REPLACE VIEW public.view_clientes_ativos AS
SELECT 
    c.id,
    c.nome AS nome_completo,
    c.nome,
    c.email,
    c.created_at AS data_criacao,
    c.created_at,
    count(p.id) AS total_pedidos,
    COALESCE(sum(p.total), (0)::numeric) AS valor_total_compras,
    max(p.created_at) AS ultima_compra
FROM public.clientes c
LEFT JOIN public.pedidos p ON (c.id = p.cliente_id AND (p.status)::text <> 'cancelado'::text)
WHERE c.ativo = true
GROUP BY c.id, c.nome, c.email, c.created_at
ORDER BY COALESCE(sum(p.total), (0)::numeric) DESC;

-- 2. Avaliações Recentes
CREATE OR REPLACE VIEW public.vw_avaliacoes_recentes AS
SELECT 
    r.id,
    r.rating AS nota,
    r.rating,
    NULL::text AS titulo,
    r.comentario,
    r.created_at AS data_criacao,
    r.created_at,
    pr.nome AS produto_nome,
    c.nome AS cliente_nome
FROM public.reviews r
JOIN public.produtos pr ON (r.produto_id = pr.id)
LEFT JOIN public.clientes c ON (r.cliente_id = c.id)
ORDER BY r.created_at DESC
LIMIT 10;

-- 3. Estatísticas do Dashboard
CREATE OR REPLACE VIEW public.vw_dashboard_stats AS
SELECT 
    COALESCE(sum(
        CASE
            WHEN (p.created_at >= (CURRENT_DATE - '30 days'::interval)) THEN p.total
            ELSE (0)::numeric
        END), (0)::numeric) AS total_vendas,
    count(
        CASE
            WHEN (p.created_at >= (CURRENT_DATE - '30 days'::interval)) THEN p.id
            ELSE NULL::uuid
        END) AS total_pedidos,
    (SELECT count(*) FROM public.produtos WHERE ativo = true) AS total_produtos,
    (SELECT count(*) FROM public.usuarios_admin WHERE ativo = true) AS total_usuarios,
    0::numeric AS meta_mensal,
    COALESCE(sum(
        CASE
            WHEN (p.created_at >= date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone)) THEN p.total
            ELSE (0)::numeric
        END), (0)::numeric) AS vendas_mes_atual
FROM public.pedidos p
WHERE ((p.status)::text <> 'cancelado'::text);

-- 4. Métricas de Produtos
CREATE OR REPLACE VIEW public.vw_metricas_produtos AS
SELECT 
    pr.id,
    pr.nome,
    pr.preco,
    COALESCE(sum(ip.quantidade), (0)::bigint) AS total_vendido,
    COALESCE(avg(r.rating), (0)::numeric) AS media_avaliacoes,
    count(DISTINCT r.id) AS total_avaliacoes,
    COALESCE((
        SELECT sum(vp.estoque)
        FROM public.variantes_produto vp
        WHERE vp.produto_id = pr.id AND vp.ativo = true
    ), (0)::bigint) AS estoque_atual
FROM public.produtos pr
LEFT JOIN public.itens_pedido ip ON (pr.id = ip.produto_id)
LEFT JOIN public.pedidos p ON (ip.pedido_id = p.id AND (p.status)::text <> 'cancelado'::text)
LEFT JOIN public.reviews r ON (pr.id = r.produto_id)
WHERE pr.ativo = true
GROUP BY pr.id, pr.nome, pr.preco
ORDER BY COALESCE(sum(ip.quantidade), (0)::bigint) DESC;

-- 5. Performance por Categorias
CREATE OR REPLACE VIEW public.vw_performance_categorias AS
SELECT 
    c.id,
    c.nome AS categoria_nome,
    count(DISTINCT pr.id) AS total_produtos,
    COALESCE(sum(ip.quantidade), (0)::bigint) AS produtos_vendidos,
    COALESCE(sum(ip.subtotal), (0)::numeric) AS receita_total,
    COALESCE(avg(r.rating), (0)::numeric) AS media_avaliacoes
FROM public.categorias c
LEFT JOIN public.produtos pr ON (c.id = pr.categoria_id AND pr.ativo = true)
LEFT JOIN public.itens_pedido ip ON (pr.id = ip.produto_id)
LEFT JOIN public.pedidos p ON (ip.pedido_id = p.id AND (p.status)::text <> 'cancelado'::text)
LEFT JOIN public.reviews r ON (pr.id = r.produto_id)
WHERE c.ativa = true
GROUP BY c.id, c.nome
ORDER BY COALESCE(sum(ip.subtotal), (0)::numeric) DESC;

-- 6. Produtos com Estoque Baixo (estoque total <= 5)
CREATE OR REPLACE VIEW public.vw_produtos_estoque_baixo AS
SELECT 
    pr.id,
    pr.nome,
    COALESCE(pr.referencia, pr.sku) AS sku,
    COALESCE(sum(vp.estoque), (0)::bigint) AS quantidade_atual,
    5::bigint AS quantidade_minima,
    pr.preco
FROM public.produtos pr
JOIN public.variantes_produto vp ON (pr.id = vp.produto_id)
WHERE pr.ativo = true AND vp.ativo = true
GROUP BY pr.id, pr.nome, pr.referencia, pr.sku, pr.preco
HAVING COALESCE(sum(vp.estoque), 0) <= 5
ORDER BY quantidade_atual ASC;

-- 7. Produtos Mais Vendidos (últimos 30 dias)
CREATE OR REPLACE VIEW public.vw_produtos_mais_vendidos AS
SELECT 
    pr.id,
    pr.nome,
    pr.preco,
    pr.imagens,
    sum(ip.quantidade) AS quantidade_vendida,
    sum(ip.subtotal) AS valor_total_vendido
FROM public.produtos pr
JOIN public.itens_pedido ip ON (pr.id = ip.produto_id)
JOIN public.pedidos p ON (ip.pedido_id = p.id)
WHERE ((p.status)::text <> 'cancelado'::text) 
  AND (p.created_at >= (CURRENT_DATE - '30 days'::interval))
GROUP BY pr.id, pr.nome, pr.preco, pr.imagens
ORDER BY sum(ip.quantidade) DESC
LIMIT 10;

-- 8. Vendas por Dia (últimos 30 dias)
CREATE OR REPLACE VIEW public.vw_vendas_por_dia AS
SELECT 
    date(p.created_at) AS data_venda,
    count(p.id) AS quantidade_pedidos,
    sum(p.total) AS valor_total,
    avg(p.total) AS ticket_medio
FROM public.pedidos p
WHERE ((p.status)::text <> 'cancelado'::text) 
  AND (p.created_at >= (CURRENT_DATE - '30 days'::interval))
GROUP BY date(p.created_at)
ORDER BY date(p.created_at) DESC;

-- 9. Vendas Recentes (últimos 10 pedidos)
CREATE OR REPLACE VIEW public.vw_vendas_recentes AS
SELECT 
    p.id,
    p.numero_pedido,
    p.total AS valor_total,
    p.total,
    p.status,
    p.created_at AS data_criacao,
    p.created_at,
    c.nome AS cliente_nome,
    c.email AS cliente_email
FROM public.pedidos p
LEFT JOIN public.clientes c ON (p.cliente_id = c.id)
ORDER BY p.created_at DESC
LIMIT 10;

-- ==============================================================================
-- Permissões de Leitura para a API
-- ==============================================================================
GRANT SELECT ON public.view_clientes_ativos TO authenticated, anon, service_role;
GRANT SELECT ON public.vw_avaliacoes_recentes TO authenticated, anon, service_role;
GRANT SELECT ON public.vw_dashboard_stats TO authenticated, anon, service_role;
GRANT SELECT ON public.vw_metricas_produtos TO authenticated, anon, service_role;
GRANT SELECT ON public.vw_performance_categorias TO authenticated, anon, service_role;
GRANT SELECT ON public.vw_produtos_estoque_baixo TO authenticated, anon, service_role;
GRANT SELECT ON public.vw_produtos_mais_vendidos TO authenticated, anon, service_role;
GRANT SELECT ON public.vw_vendas_por_dia TO authenticated, anon, service_role;
GRANT SELECT ON public.vw_vendas_recentes TO authenticated, anon, service_role;

-- Recarregar cache de schema do PostgREST
NOTIFY pgrst, 'reload schema';
