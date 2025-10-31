-- Seed inicial de categorias (executado com privilégios do serviço, ignora RLS)
DO $$
BEGIN
  -- Vestidos
  IF NOT EXISTS (SELECT 1 FROM public.categorias WHERE nome = 'Vestidos') THEN
    INSERT INTO public.categorias (nome, descricao, ativa)
    VALUES ('Vestidos', 'Categoria de vestidos', true);
  END IF;

  -- Maquiagem
  IF NOT EXISTS (SELECT 1 FROM public.categorias WHERE nome = 'Maquiagem') THEN
    INSERT INTO public.categorias (nome, descricao, ativa)
    VALUES ('Maquiagem', 'Categoria de maquiagens', true);
  END IF;

  -- Acessórios
  IF NOT EXISTS (SELECT 1 FROM public.categorias WHERE nome = 'Acessórios') THEN
    INSERT INTO public.categorias (nome, descricao, ativa)
    VALUES ('Acessórios', 'Categoria de acessórios', true);
  END IF;
END $$;