-- Adicionar a coluna texto_botao à tabela de banners
ALTER TABLE public.banners
ADD COLUMN texto_botao VARCHAR(100);

-- Adicionar um comentário à nova coluna
COMMENT ON COLUMN public.banners.texto_botao IS 'Texto customizado para o botão do banner (ex: "Compre Agora", "Ver Coleção"). Se nulo, o botão pode não ser exibido ou ter um texto padrão.';

-- Opcional: Preencher valores padrão para banners existentes que têm um link
UPDATE public.banners
SET texto_botao = 'Saiba Mais'
WHERE link_destino IS NOT NULL AND texto_botao IS NULL;