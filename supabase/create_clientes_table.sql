-- Criação da tabela clientes
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefone TEXT,
  cpf TEXT UNIQUE,
  data_nascimento DATE,
  endereco JSONB,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON public.clientes(cpf);
CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON public.clientes(ativo);
CREATE INDEX IF NOT EXISTS idx_clientes_created_at ON public.clientes(created_at DESC);

-- Políticas RLS (Row Level Security)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários autenticados vejam todos os clientes (para admin)
CREATE POLICY "Allow authenticated users to view all clients"
ON public.clientes
FOR SELECT
TO authenticated
USING (true);

-- Política para permitir que usuários autenticados criem clientes
CREATE POLICY "Allow authenticated users to create clients"
ON public.clientes
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para permitir que usuários autenticados atualizem clientes
CREATE POLICY "Allow authenticated users to update clients"
ON public.clientes
FOR UPDATE
TO authenticated
USING (true);

-- Comentários para documentação
COMMENT ON TABLE public.clientes IS 'Tabela de clientes da loja';
COMMENT ON COLUMN public.clientes.id IS 'Identificador único do cliente';
COMMENT ON COLUMN public.clientes.nome IS 'Nome completo do cliente';
COMMENT ON COLUMN public.clientes.email IS 'Email do cliente (único)';
COMMENT ON COLUMN public.clientes.telefone IS 'Telefone de contato do cliente';
COMMENT ON COLUMN public.clientes.cpf IS 'CPF do cliente (único)';
COMMENT ON COLUMN public.clientes.endereco IS 'Dados de endereço em formato JSON';
COMMENT ON COLUMN public.clientes.ativo IS 'Indica se o cliente está ativo no sistema';