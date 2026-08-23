-- Migration 005: pagamento_parcelas
-- Cria tabela de parcelas individuais para pagamentos de clientes

create table pagamento_parcelas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,

  pagamento_id uuid not null references pagamentos(id) on delete cascade,
  numero integer not null check (numero >= 1),
  valor numeric(10,2) not null check (valor > 0),
  data_vencimento date,
  data_pagamento timestamptz,
  status status_pagamento not null default 'pendente',

  created_at timestamptz not null default now()
);

create index idx_pagamento_parcelas_owner on pagamento_parcelas(owner_id);
create index idx_pagamento_parcelas_pagamento on pagamento_parcelas(pagamento_id);
create index idx_pagamento_parcelas_status on pagamento_parcelas(status);

alter table pagamento_parcelas enable row level security;

create policy "pagamento_parcelas_owner_all" on pagamento_parcelas
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
