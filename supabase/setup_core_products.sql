-- Setup de catálogo de produtos e políticas básicas de RLS
-- Observação: CORS do Supabase é configurado no painel (Settings > API), não via SQL.

-- Extensão para gerar UUIDs
create extension if not exists pgcrypto;

-- Tabela de Categorias
create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  imagem_url text,
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists categorias_nome_unique on public.categorias(lower(nome));

-- Tabela de Produtos
create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  preco numeric(10,2) not null,
  preco_promocional numeric(10,2),
  categoria_id uuid references public.categorias(id) on delete set null,
  estoque integer not null default 0,
  estoque_minimo integer not null default 0,
  referencia text,
  peso numeric(10,3),
  altura numeric(10,2),
  largura numeric(10,2),
  profundidade numeric(10,2),
  dimensoes jsonb,
  imagens text[] default '{}',
  ativo boolean not null default true,
  destaque boolean not null default false,
  average_rating numeric(3,2) default 0,
  review_count integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_produtos_ativo on public.produtos(ativo);
create index if not exists idx_produtos_created_at on public.produtos(created_at desc);

-- Tabela de Variantes do Produto
create table if not exists public.variantes_produto (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos(id) on delete cascade,
  cor text,
  cor_hex text,
  tamanho text,
  estoque integer not null default 0,
  sku text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_variantes_produto_produto_id on public.variantes_produto(produto_id);

-- Função e triggers para updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists categorias_set_updated_at on public.categorias;
create trigger categorias_set_updated_at
before update on public.categorias
for each row execute function public.set_updated_at();

drop trigger if exists produtos_set_updated_at on public.produtos;
create trigger produtos_set_updated_at
before update on public.produtos
for each row execute function public.set_updated_at();

drop trigger if exists variantes_produto_set_updated_at on public.variantes_produto;
create trigger variantes_produto_set_updated_at
before update on public.variantes_produto
for each row execute function public.set_updated_at();

-- RLS e políticas
alter table public.categorias enable row level security;
alter table public.produtos enable row level security;
alter table public.variantes_produto enable row level security;

-- Leitura pública (anon + authenticated)
create policy if not exists "Public read categorias"
  on public.categorias for select to anon, authenticated using (true);

create policy if not exists "Public read produtos"
  on public.produtos for select using (ativo = true);

create policy if not exists "Public read variantes_produto"
  on public.variantes_produto for select using (ativo = true);

-- Escrita para usuários autenticados
create policy if not exists "Authenticated insert categorias"
  on public.categorias for insert to authenticated with check (true);
create policy if not exists "Authenticated update categorias"
  on public.categorias for update to authenticated using (true) with check (true);
create policy if not exists "Authenticated delete categorias"
  on public.categorias for delete to authenticated using (true);

create policy if not exists "Authenticated insert produtos"
  on public.produtos for insert to authenticated with check (true);
create policy if not exists "Authenticated update produtos"
  on public.produtos for update to authenticated using (true) with check (true);
create policy if not exists "Authenticated delete produtos"
  on public.produtos for delete to authenticated using (true);

create policy if not exists "Authenticated insert variantes_produto"
  on public.variantes_produto for insert to authenticated with check (true);
create policy if not exists "Authenticated update variantes_produto"
  on public.variantes_produto for update to authenticated using (true) with check (true);
create policy if not exists "Authenticated delete variantes_produto"
  on public.variantes_produto for delete to authenticated using (true);

-- Grants (opcional, para compatibilidade)
grant select on public.categorias, public.produtos, public.variantes_produto to anon, authenticated;
grant insert, update, delete on public.categorias, public.produtos, public.variantes_produto to authenticated;

-- Dados exemplo (opcional) - remova se não desejar
insert into public.categorias (nome, descricao)
values ('Vestidos', 'Categoria de vestidos')
on conflict do nothing;

insert into public.produtos (nome, descricao, preco, categoria_id, ativo, destaque, imagens)
select 'Vestido Floral', 'Vestido leve com estampa floral', 199.90, c.id, true, true, array['https://via.placeholder.com/400x500']
from public.categorias c where lower(c.nome) = 'vestidos'
on conflict do nothing;

insert into public.variantes_produto (produto_id, cor, cor_hex, tamanho, estoque, ativo)
select p.id, 'Rosa', '#FFC0CB', 'M', 10, true
from public.produtos p where lower(p.nome) = 'vestido floral'
on conflict do nothing;