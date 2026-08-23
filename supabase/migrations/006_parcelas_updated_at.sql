-- Migration 006: garantir updated_at nas parcelas para suportar edição individual

alter table pagamento_parcelas
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists trg_pagamento_parcelas_updated_at on pagamento_parcelas;
create trigger trg_pagamento_parcelas_updated_at
  before update on pagamento_parcelas
  for each row execute function set_updated_at();

alter table boleto_parcelas
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists trg_boleto_parcelas_updated_at on boleto_parcelas;
create trigger trg_boleto_parcelas_updated_at
  before update on boleto_parcelas
  for each row execute function set_updated_at();
