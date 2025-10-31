-- Primeiro, precisamos encontrar todos os produtos associados a categoria.
-- Em seguida, para cada produto, precisamos encontrar todas as suas imagens e excluí-las do armazenamento.
-- Finalmente, podemos excluir os produtos e, em seguida, a categoria.

CREATE OR REPLACE FUNCTION delete_category_cascade(category_id_to_delete uuid)
RETURNS void AS $$
DECLARE
    product_record RECORD;
    image_url_to_delete TEXT;
BEGIN
    -- 1. Encontre todos os produtos na categoria e faça um loop sobre eles.
    FOR product_record IN SELECT id FROM produtos WHERE categoria_id = category_id_to_delete
    LOOP
        -- 2. Para cada produto, encontre suas URLs de imagem e exclua-as do armazenamento.
        -- Supondo que a tabela `produtos` tenha uma coluna `image_urls` do tipo array de texto.
        FOR image_url_to_delete IN SELECT unnest(image_urls) FROM produtos WHERE id = product_record.id
        LOOP
            -- O caminho do arquivo no armazenamento pode ser derivado da URL.
            -- Isso pressupõe que a URL da imagem esteja em um formato como:
            -- https://<project_ref>.supabase.co/storage/v1/object/public/product-images/<image_file_name>
            -- e precisamos extrair o <image_file_name>.
            -- A função `storage.delete_object` espera o nome do bucket e o caminho do objeto.
            PERFORM storage.delete_object('imagens-produtos', substring(image_url_to_delete from '/imagens-produtos/(.*)'));
        END LOOP;

        -- 3. Exclua as variantes de produto associadas ao produto.
        DELETE FROM variantes_produto WHERE produto_id = product_record.id;
    END LOOP;

    -- 4. Depois de lidar com as imagens e variantes, exclua os produtos.
    DELETE FROM produtos WHERE categoria_id = category_id_to_delete;

    -- 5. Finalmente, exclua a própria categoria.
    DELETE FROM categorias WHERE id = category_id_to_delete;
END;
$$ LANGUAGE plpgsql;

-- Grant para permitir execução da função por usuários autenticados
GRANT EXECUTE ON FUNCTION public.delete_category_cascade TO authenticated;

-- Para funções RPC no Supabase, também é necessário garantir que a função seja exposta à API
-- Isso é feito através das configurações do Supabase, mas o GRANT EXECUTE é essencial

-- Políticas RLS para buckets de armazenamento
-- Permite acesso público às imagens de categorias e produtos

-- Política para bucket 'categorias': acesso público de leitura
CREATE POLICY "Permitir acesso público às imagens de categorias" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'categorias');

-- Política para bucket 'imagens-produtos': acesso público de leitura  
CREATE POLICY "Permitir acesso público às imagens de produtos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'imagens-produtos');

-- Política para upload de imagens de categorias (apenas usuários autenticados)
CREATE POLICY "Permitir upload de imagens de categorias" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'categorias');

-- Política para upload de imagens de produtos (apenas usuários autenticados)
CREATE POLICY "Permitir upload de imagens de produtos" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'imagens-produtos');

-- Política para exclusão de imagens (apenas usuários autenticados)
CREATE POLICY "Permitir exclusão de imagens" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id IN ('categorias', 'imagens-produtos'));