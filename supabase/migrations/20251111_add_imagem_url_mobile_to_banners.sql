-- Adiciona coluna opcional para imagem específica de mobile nos banners
ALTER TABLE public.banners
ADD COLUMN IF NOT EXISTS imagem_url_mobile VARCHAR(255);

-- Nota: coluna é opcional (permite NULL). Atualizações do app usarão fallback
-- para `imagem_url` quando `imagem_url_mobile` estiver ausente.