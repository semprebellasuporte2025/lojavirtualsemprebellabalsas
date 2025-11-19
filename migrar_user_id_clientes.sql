-- Script para migrar e preencher a coluna user_id na tabela clientes
-- Este script ajuda a associar clientes existentes aos usuários do auth

-- 1. Verificar se há clientes sem user_id
SELECT 
    COUNT(*) as total_clientes,
    COUNT(user_id) as clientes_com_user_id,
    COUNT(*) - COUNT(user_id) as clientes_sem_user_id
FROM 
    public.clientes;

-- 2. Listar clientes sem user_id (para referência)
SELECT 
    id, 
    nome, 
    email,
    created_at
FROM 
    public.clientes
WHERE 
    user_id IS NULL
ORDER BY 
    created_at DESC
LIMIT 10;

-- 3. Tentar associar automaticamente clientes aos usuários do auth pelo email
-- ATENÇÃO: Execute esta etapa com cuidado e verifique os resultados antes de confirmar
DO $$
DECLARE
    cliente_record RECORD;
    auth_user_id UUID;
    updated_count INTEGER := 0;
BEGIN
    -- Para cada cliente sem user_id, tentar encontrar um usuário auth com o mesmo email
    FOR cliente_record IN 
        SELECT id, email 
        FROM public.clientes 
        WHERE user_id IS NULL
    LOOP
        -- Buscar o ID do usuário auth pelo email
        SELECT id INTO auth_user_id 
        FROM auth.users 
        WHERE email = cliente_record.email;
        
        -- Se encontrou um usuário auth, atualizar o cliente
        IF auth_user_id IS NOT NULL THEN
            UPDATE public.clientes 
            SET user_id = auth_user_id
            WHERE id = cliente_record.id;
            
            updated_count := updated_count + 1;
            RAISE NOTICE 'Cliente % (%) associado ao usuário auth %', cliente_record.id, cliente_record.email, auth_user_id;
        ELSE
            RAISE NOTICE 'Nenhum usuário auth encontrado para o email: %', cliente_record.email;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Total de clientes atualizados: %', updated_count;
END $$;

-- 4. Verificar o resultado da migração
SELECT 
    COUNT(*) as total_clientes,
    COUNT(user_id) as clientes_com_user_id,
    COUNT(*) - COUNT(user_id) as clientes_sem_user_id
FROM 
    public.clientes;

-- 5. Para clientes que ainda não têm user_id, será necessário criar manualmente
-- a associação ou criar usuários auth correspondentes

-- 6. Verificar se há pedidos que não estão associados a clientes com user_id
SELECT 
    COUNT(*) as total_pedidos,
    COUNT(p.id) as pedidos_com_cliente,
    COUNT(CASE WHEN c.user_id IS NOT NULL THEN 1 END) as pedidos_com_cliente_com_user_id,
    COUNT(CASE WHEN c.user_id IS NULL THEN 1 END) as pedidos_com_cliente_sem_user_id
FROM 
    public.pedidos p
LEFT JOIN 
    public.clientes c ON p.cliente_id = c.id;

-- 7. Listar pedidos que podem ter problemas de acesso (cliente sem user_id)
SELECT 
    p.id as pedido_id,
    p.numero_pedido,
    p.cliente_id,
    p.status,
    p.created_at,
    c.nome as cliente_nome,
    c.email as cliente_email,
    c.user_id as cliente_user_id
FROM 
    public.pedidos p
LEFT JOIN 
    public.clientes c ON p.cliente_id = c.id
WHERE 
    c.user_id IS NULL
ORDER BY 
    p.created_at DESC
LIMIT 10;