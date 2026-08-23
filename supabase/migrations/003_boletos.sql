-- ============================================================================
-- Migration 003: boletos de compra para reposicao de estoque
-- Cria tabelas de boletos + itens e integra com estoque_movimentos
-- ============================================================================

create type status_boleto as enum ('aberto', 'parcial', 'pago', 'vencido', 'cancelado');

create table boletos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,

  fornecedor text not null,
  descricao text,

  linha_digitavel text,
  codigo_barras text,

  data_emissao date not null default current_date,
  data_vencimento date not null,
  data_pagamento timestamptz,

  valor_total numeric(10,2) not null check (valor_total > 0),
  valor_pago numeric(10,2) not null default 0 check (valor_pago >= 0),

  status status_boleto not null default 'aberto',
  observacoes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (valor_pago <= valor_total)
);

create index idx_boletos_owner on boletos(owner_id);
create index idx_boletos_status on boletos(status);
create index idx_boletos_vencimento on boletos(data_vencimento);
create index idx_boletos_fornecedor on boletos using gin (to_tsvector('portuguese', fornecedor));

create trigger trg_boletos_updated_at
  before update on boletos
  for each row execute function set_updated_at();

create table boleto_itens (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,

  boleto_id uuid not null references boletos(id) on delete cascade,
  produto_id uuid references produtos(id) on delete set null,

  produto_nome text not null,
  quantidade integer not null check (quantidade > 0),
  custo_unitario numeric(10,2) not null check (custo_unitario >= 0),
  subtotal numeric(10,2) generated always as (quantidade * custo_unitario) stored,

  aplica_estoque boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_boleto_itens_owner on boleto_itens(owner_id);
create index idx_boleto_itens_boleto on boleto_itens(boleto_id);
create index idx_boleto_itens_produto on boleto_itens(produto_id);

alter table estoque_movimentos
  add column boleto_item_id uuid references boleto_itens(id) on delete set null;

create index idx_estoque_movimentos_boleto_item on estoque_movimentos(boleto_item_id);

create or replace function boleto_item_entrada_estoque_se_pago()
returns trigger as $$
begin
  if new.aplica_estoque
     and new.produto_id is not null
     and exists (
       select 1
       from boletos b
       where b.id = new.boleto_id
         and b.status = 'pago'
     ) then
    insert into estoque_movimentos (
      owner_id, produto_id, tipo, quantidade, boleto_item_id, observacao
    )
    values (
      new.owner_id,
      new.produto_id,
      'entrada',
      new.quantidade,
      new.id,
      'entrada automatica por item de boleto'
    );
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_boleto_itens_entrada_estoque
  after insert on boleto_itens
  for each row execute function boleto_item_entrada_estoque_se_pago();

create or replace function boleto_pago_aplica_entradas_estoque()
returns trigger as $$
begin
  if old.status <> 'pago' and new.status = 'pago' then
    insert into estoque_movimentos (
      owner_id, produto_id, tipo, quantidade, boleto_item_id, observacao
    )
    select
      bi.owner_id,
      bi.produto_id,
      'entrada',
      bi.quantidade,
      bi.id,
      'entrada automatica por quitacao de boleto'
    from boleto_itens bi
    where bi.boleto_id = new.id
      and bi.aplica_estoque
      and bi.produto_id is not null
      and not exists (
        select 1
        from estoque_movimentos em
        where em.boleto_item_id = bi.id
      );
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_boletos_pago_aplica_estoque
  after update of status on boletos
  for each row execute function boleto_pago_aplica_entradas_estoque();

alter table boletos enable row level security;
alter table boleto_itens enable row level security;

create policy "boletos_owner_all" on boletos
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "boleto_itens_owner_all" on boleto_itens
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
