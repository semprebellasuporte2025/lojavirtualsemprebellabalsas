-- Tabela de Movimentações de Estoque
create table if not exists public.movimentacoes_estoque (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid references public.produtos(id) on delete cascade,
  tipo text not null check (tipo in ('entrada', 'saida', 'ajuste')),
  quantidade integer not null,
  valor_unitario numeric(10,2) not null default 0,
  valor_total numeric(10,2) not null default 0,
  fornecedor_id uuid references public.fornecedores(id) on delete set null,
  fornecedor_nome text, -- Para casos onde não há fornecedor cadastrado
  numero_nota text,
  motivo text, -- Para saídas e ajustes
  observacoes text,
  usuario_id uuid references auth.users(id) on delete set null,
  usuario_nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para melhor performance
create index if not exists idx_movimentacoes_produto_id on public.movimentacoes_estoque(produto_id);
create index if not exists idx_movimentacoes_tipo on public.movimentacoes_estoque(tipo);
create index if not exists idx_movimentacoes_created_at on public.movimentacoes_estoque(created_at desc);
create index if not exists idx_movimentacoes_usuario_id on public.movimentacoes_estoque(usuario_id);

-- Trigger para atualizar updated_at
create or replace function update_movimentacoes_estoque_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_movimentacoes_estoque_updated_at
  before update on public.movimentacoes_estoque
  for each row execute function update_movimentacoes_estoque_updated_at();

-- Função para atualizar estoque automaticamente
create or replace function atualizar_estoque_produto()
returns trigger as $$
begin
  -- Para entrada: somar ao estoque
  if new.tipo = 'entrada' then
    update public.produtos 
    set estoque = estoque + new.quantidade,
        updated_at = now()
    where id = new.produto_id;
  
  -- Para saída: subtrair do estoque
  elsif new.tipo = 'saida' then
    update public.produtos 
    set estoque = estoque - new.quantidade,
        updated_at = now()
    where id = new.produto_id;
  
  -- Para ajuste: aplicar a quantidade (pode ser positiva ou negativa)
  elsif new.tipo = 'ajuste' then
    update public.produtos 
    set estoque = estoque + new.quantidade,
        updated_at = now()
    where id = new.produto_id;
  end if;
  
  return new;
end;
$$ language plpgsql;

create trigger trigger_atualizar_estoque_produto
  after insert on public.movimentacoes_estoque
  for each row execute function atualizar_estoque_produto();

-- RLS (Row Level Security)
alter table public.movimentacoes_estoque enable row level security;

-- Política para permitir leitura para usuários autenticados
create policy "Permitir leitura de movimentações para usuários autenticados"
  on public.movimentacoes_estoque for select
  using (auth.role() = 'authenticated');

-- Política para permitir inserção para usuários autenticados
create policy "Permitir inserção de movimentações para usuários autenticados"
  on public.movimentacoes_estoque for insert
  with check (auth.role() = 'authenticated');

-- Política para permitir atualização para usuários autenticados
create policy "Permitir atualização de movimentações para usuários autenticados"
  on public.movimentacoes_estoque for update
  using (auth.role() = 'authenticated');

-- Inserir alguns dados de exemplo
insert into public.movimentacoes_estoque (
  produto_id,
  tipo,
  quantidade,
  valor_unitario,
  valor_total,
  fornecedor_nome,
  numero_nota,
  usuario_nome,
  observacoes
) values 
(
  (select id from public.produtos limit 1),
  'entrada',
  50,
  25.90,
  1295.00,
  'Beleza & Cia Ltda',
  '123456',
  'Karina Arruda',
  'Entrada inicial de estoque'
),
(
  (select id from public.produtos limit 1),
  'saida',
  3,
  25.90,
  77.70,
  null,
  null,
  'Sistema',
  'Venda online #VD001'
);