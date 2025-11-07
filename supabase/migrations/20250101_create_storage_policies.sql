-- Políticas RLS para buckets de armazenamento
-- Permite acesso público às imagens de categorias e produtos

-- Política para bucket 'categorias': acesso público de leitura
CREATE POLICY IF NOT EXISTS "Permitir acesso público às imagens de categorias" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'categorias');

-- Política para bucket 'imagens-produtos': acesso público de leitura  
CREATE POLICY IF NOT EXISTS "Permitir acesso público às imagens de produtos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'imagens-produtos');

-- Política para upload de imagens de categorias (apenas usuários autenticados)
CREATE POLICY IF NOT EXISTS "Permitir upload de imagens de categorias" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'categorias');

-- Política para upload de imagens de produtos (apenas usuários autenticados)
CREATE POLICY IF NOT EXISTS "Permitir upload de imagens de produtos" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'imagens-produtos');

-- Política para exclusão de imagens (apenas usuários autenticados)
CREATE POLICY IF NOT EXISTS "Permitir exclusão de imagens" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id IN ('categorias', 'imagens-produtos'));