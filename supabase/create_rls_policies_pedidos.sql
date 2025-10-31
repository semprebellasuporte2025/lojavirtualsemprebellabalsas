-- Habilita a RLS para a tabela de pedidos (se ainda não estiver)
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Allow authenticated users to view all orders" ON public.pedidos;
DROP POLICY IF EXISTS "Allow authenticated users to update all orders" ON public.pedidos;

-- Política de SELECT: Permite que usuários autenticados vejam todos os pedidos.
-- Essencial para o painel de admin.
CREATE POLICY "Allow authenticated users to view all orders"
ON public.pedidos
FOR SELECT
TO authenticated
USING (true);

-- Política de UPDATE: Permite que usuários autenticados atualizem qualquer pedido.
-- Necessário para salvar o status e o número de rastreio.
CREATE POLICY "Allow authenticated users to update all orders"
ON public.pedidos
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política de INSERT: Permite que usuários autenticados criem seus próprios pedidos.
CREATE POLICY "Allow authenticated users to create their own orders"
ON public.pedidos
FOR INSERT
TO authenticated
WITH CHECK (true);