-- Tabela simples de cupons
-- Campos: nome, desconto (%), datas de início/fim, status, criação/alteração

create extension if not exists pgcrypto;

create table if not exists public.cupons (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  desconto_percentual numeric(5,2) not null check (desconto_percentual >= 0 and desconto_percentual <= 100),
  inicio_em timestamptz,
  fim_em timestamptz,
  status text not null default 'ativo' check (status in ('ativo','inativo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (inicio_em is null or fim_em is null or inicio_em < fim_em)
);

-- Trigger para manter updated_at automaticamente
drop trigger if exists cupons_set_updated_at on public.cupons;
create trigger cupons_set_updated_at
before update on public.cupons
for each row execute function public.set_updated_at();

-- Comentários
comment on table public.cupons is 'Tabela simples de cupons: nome, % desconto, período e status';
comment on column public.cupons.desconto_percentual is 'Percentual de desconto (0 a 100)';