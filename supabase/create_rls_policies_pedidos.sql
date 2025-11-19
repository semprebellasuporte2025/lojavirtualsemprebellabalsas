-- Habilita a RLS para a tabela de pedidos (se ainda não estiver)
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Allow authenticated users to view all orders" ON public.pedidos;
DROP POLICY IF EXISTS "Allow authenticated users to update all orders" ON public.pedidos;
DROP POLICY IF EXISTS "Allow authenticated users to delete all orders" ON public.pedidos;
DROP POLICY IF EXISTS "Allow authenticated users to create their own orders" ON public.pedidos;

-- Política de SELECT: Permite que administradores vejam todos os pedidos
CREATE POLICY "Allow admins to view all orders"
ON public.pedidos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios_admin 
    WHERE id = auth.uid() AND ativo = true
  )
);

-- Política de SELECT: Permite que clientes vejam apenas seus próprios pedidos
CREATE POLICY "Allow customers to view their own orders"
ON public.pedidos
FOR SELECT
TO authenticated
USING (
  cliente_id IN (
    SELECT id FROM public.clientes 
    WHERE user_id = auth.uid()
  )
);

-- Política de UPDATE: Permite que usuários autenticados atualizem qualquer pedido.
-- Necessário para salvar o status e o número de rastreio.
CREATE POLICY "Allow authenticated users to update all orders"
ON public.pedidos
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política de DELETE: Permite que usuários autenticados excluam pedidos.
-- Necessário para remoção de vendas no painel admin.
CREATE POLICY "Allow authenticated users to delete all orders"
ON public.pedidos
FOR DELETE
TO authenticated
USING (true);

-- Política de INSERT: Permite que usuários autenticados criem seus próprios pedidos.
CREATE POLICY "Allow authenticated users to create their own orders"
ON public.pedidos
FOR INSERT
TO authenticated
WITH CHECK (true);