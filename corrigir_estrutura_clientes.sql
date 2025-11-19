-- Script para corrigir a estrutura da tabela clientes
-- Adiciona a coluna user_id para vincular clientes aos usuários do auth

-- 1. Verificar se a coluna user_id já existe
SELECT 
    EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clientes' 
        AND column_name = 'user_id'
    ) as user_id_existe;

-- 2. Adicionar a coluna user_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clientes' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.clientes 
        ADD COLUMN user_id UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Coluna user_id adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna user_id já existe';
    END IF;
END $$;

-- 3. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON public.clientes(user_id);

-- 4. Atualizar políticas RLS da tabela clientes
-- Remover políticas antigas
DROP POLICY IF EXISTS "Allow authenticated users to view all clients" ON public.clientes;
DROP POLICY IF EXISTS "Allow authenticated users to create clients" ON public.clientes;
DROP POLICY IF EXISTS "Allow authenticated users to update clients" ON public.clientes;

-- Nova política: Clientes só podem ver seus próprios dados
CREATE POLICY "Allow customers to view their own data"
ON public.clientes
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Nova política: Clientes podem atualizar apenas seus próprios dados
CREATE POLICY "Allow customers to update their own data"
ON public.clientes
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Nova política: Clientes podem criar seus próprios registros
CREATE POLICY "Allow customers to create their own data"
ON public.clientes
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Política para administradores: Podem ver todos os clientes
CREATE POLICY "Allow admins to view all clients"
ON public.clientes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios_admin 
    WHERE id = auth.uid() AND ativo = true
  )
);

-- 5. Verificar a estrutura atualizada
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_name = 'clientes'
ORDER BY 
    ordinal_position;

-- 6. Verificar quantos clientes já têm user_id preenchido
SELECT 
    COUNT(*) as total_clientes,
    COUNT(user_id) as clientes_com_user_id,
    COUNT(*) - COUNT(user_id) as clientes_sem_user_id
FROM 
    public.clientes;