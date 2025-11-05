-- Script para verificar dados na tabela usuarios_admin
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a tabela existe e sua estrutura
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_name = 'usuarios_admin'
ORDER BY 
    ordinal_position;

-- 2. Verificar quantos registros existem na tabela
SELECT 
    COUNT(*) as total_usuarios_admin
FROM 
    public.usuarios_admin;

-- 3. Verificar políticas RLS da tabela
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual
FROM 
    pg_policies 
WHERE 
    tablename = 'usuarios_admin';

-- 4. Verificar se há usuários administradores ativos
SELECT 
    id, 
    nome, 
    email, 
    tipo, 
    ativo,
    created_at
FROM 
    public.usuarios_admin 
WHERE 
    ativo = true
ORDER BY 
    created_at DESC;

-- 5. Verificar se o usuário atual está na tabela (substitua pelo ID do seu usuário)
-- SELECT 
--     id, 
--     nome, 
--     email, 
--     tipo, 
--     ativo
-- FROM 
--     public.usuarios_admin 
-- WHERE 
--     email = 'seu-email@exemplo.com';

-- 6. Verificar permissões da tabela
SELECT 
    table_schema,
    table_name, 
    privilege_type,
    grantee
FROM 
    information_schema.role_table_grants 
WHERE 
    table_name = 'usuarios_admin';