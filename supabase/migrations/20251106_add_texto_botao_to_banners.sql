-- Migration: adiciona a coluna texto_botao à tabela public.banners
-- Uso: executar no Supabase SQL editor ou via CLI

ALTER TABLE public.banners
ADD COLUMN IF NOT EXISTS texto_botao VARCHAR(255);

COMMENT ON COLUMN public.banners.texto_botao IS 'Texto opcional exibido no botão do banner';