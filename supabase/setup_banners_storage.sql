-- Script para configurar o Supabase Storage para banners
-- Execute este script no Supabase SQL Editor

-- Criar bucket para banners (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Remover políticas existentes se houver (para recriar)
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de banners" ON storage.objects;
DROP POLICY IF EXISTS "Imagens de banners são públicas" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar banners" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir banners" ON storage.objects;
DROP POLICY IF EXISTS "Administradores podem fazer upload de banners" ON storage.objects;
DROP POLICY IF EXISTS "Administradores podem atualizar banners" ON storage.objects;
DROP POLICY IF EXISTS "Administradores podem excluir banners" ON storage.objects;

-- Política para permitir upload de imagens (qualquer usuário autenticado)
CREATE POLICY "Usuários autenticados podem fazer upload de banners" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'banners' 
  AND auth.role() = 'authenticated'
);

-- Política para permitir visualização pública das imagens
CREATE POLICY "Imagens de banners são públicas" ON storage.objects
FOR SELECT USING (bucket_id = 'banners');

-- Política para permitir atualização de banners (qualquer usuário autenticado)
CREATE POLICY "Usuários autenticados podem atualizar banners" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'banners' 
  AND auth.role() = 'authenticated'
);

-- Política para permitir exclusão de banners (qualquer usuário autenticado)
CREATE POLICY "Usuários autenticados podem excluir banners" ON storage.objects
FOR DELETE USING (
  bucket_id = 'banners' 
  AND auth.role() = 'authenticated'
);

-- Verificar se o bucket foi criado
SELECT * FROM storage.buckets WHERE id = 'banners';

-- Verificar as políticas criadas
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%banners%';