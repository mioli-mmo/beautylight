-- Migration 004: suporte a parcelas para boletos
-- Adiciona coluna 'parcelas' em boletos e cria tabela boleto_parcelas

alter table boletos
  add column parcelas integer not null default 1 check (parcelas >= 1);

create table boleto_parcelas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,

  boleto_id uuid not null references boletos(id) on delete cascade,
  numero integer not null check (numero >= 1),
  valor numeric(10,2) not null check (valor > 0),
  data_vencimento date,
  data_pagamento timestamptz,
  status status_pagamento not null default 'pendente',

  created_at timestamptz not null default now()
);

create index idx_boleto_parcelas_owner on boleto_parcelas(owner_id);
create index idx_boleto_parcelas_boleto on boleto_parcelas(boleto_id);
create index idx_boleto_parcelas_status on boleto_parcelas(status);

alter table boleto_parcelas enable row level security;

create policy "boleto_parcelas_owner_all" on boleto_parcelas
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
