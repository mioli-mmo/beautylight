-- ============================================================================
-- Beauty Light — Schema base (Supabase / Postgres)
-- Projeto pessoal de pequeno porte para revenda de cosméticos
-- (Boticário / Natura / outros)
--
-- Como aplicar:
--   Este arquivo é a REFERÊNCIA COMPLETA do schema (estado atual do banco).
--   - Projeto novo (banco vazio): rode este arquivo inteiro, do jeito que está.
--   - Banco que já rodou uma versão anterior deste arquivo: NÃO rode de novo
--     (vai dar erro de "already exists"). Em vez disso, rode apenas os
--     arquivos novos em supabase/migrations/, em ordem numérica.
--   1. Supabase Dashboard > SQL Editor > cole e rode este arquivo, OU
--   2. supabase db push (usando Supabase CLI), OU
--   3. psql "$DATABASE_URL" -f supabase/schema.sql
--
-- Observações de design:
--   - Aplicação de usuário único (o vendedor). Ainda assim usamos RLS
--     amarrado a auth.uid() por segurança básica e para já deixar o
--     caminho aberto caso um dia vire multiusuário.
--   - Dinheiro é armazenado em NUMERIC(10,2) (evita erro de ponto flutuante).
--   - Todas as tabelas têm created_at/updated_at (updated_at via trigger).
--   - IDs são UUID (default gen_random_uuid()).
-- ============================================================================

-- Extensões necessárias
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ============================================================================
-- ENUMS
-- ============================================================================

create type marca_produto as enum ('boticario', 'natura', 'outro');

create type status_venda as enum ('pendente', 'parcial', 'pago', 'cancelado');

create type forma_pagamento as enum (
  'fiado',
  'dinheiro',
  'pix',
  'debito',
  'credito_vista',
  'credito_parcelado'
);

create type status_pagamento as enum ('pendente', 'pago', 'cancelado');

-- ============================================================================
-- FUNÇÃO utilitária: atualizar updated_at automaticamente
-- ============================================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================================
-- TABELA: categorias
-- (opcional, mas ajuda a organizar os produtos — ex: perfumaria, skincare,
-- maquiagem, corpo e banho, cabelos...)
-- ============================================================================

create table categorias (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null,
  created_at timestamptz not null default now(),

  unique (owner_id, nome)
);

-- ============================================================================
-- TABELA: produtos
-- ============================================================================

create table produtos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,

  nome text not null,
  marca marca_produto not null default 'outro',
  categoria_id uuid references categorias(id) on delete set null,

  codigo_referencia text, -- código do catálogo Boticário/Natura, se houver
  descricao text,

  preco_custo numeric(10,2) not null default 0 check (preco_custo >= 0),
  preco_venda numeric(10,2) not null default 0 check (preco_venda >= 0),

  estoque_atual integer not null default 0 check (estoque_atual >= 0),
  estoque_minimo integer not null default 0 check (estoque_minimo >= 0),

  imagem_url text,
  ativo boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_produtos_owner on produtos(owner_id);
create index idx_produtos_nome on produtos using gin (to_tsvector('portuguese', nome));

create trigger trg_produtos_updated_at
  before update on produtos
  for each row execute function set_updated_at();

-- ============================================================================
-- TABELA: clientes
-- ============================================================================

create table clientes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,

  nome text not null,
  telefone text,
  email text,
  endereco text,
  observacoes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_clientes_owner on clientes(owner_id);
create index idx_clientes_nome on clientes using gin (to_tsvector('portuguese', nome));

create trigger trg_clientes_updated_at
  before update on clientes
  for each row execute function set_updated_at();

-- ============================================================================
-- TABELA: vendas
-- (o cabeçalho da venda; os produtos vendidos ficam em venda_itens)
-- ============================================================================

create table vendas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,

  cliente_id uuid references clientes(id) on delete set null,

  data_venda timestamptz not null default now(),
  status status_venda not null default 'pendente',

  valor_total numeric(10,2) not null default 0 check (valor_total >= 0),
  desconto numeric(10,2) not null default 0 check (desconto >= 0),

  observacoes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_vendas_owner on vendas(owner_id);
create index idx_vendas_cliente on vendas(cliente_id);
create index idx_vendas_status on vendas(status);
create index idx_vendas_data on vendas(data_venda);

create trigger trg_vendas_updated_at
  before update on vendas
  for each row execute function set_updated_at();

-- ============================================================================
-- TABELA: venda_itens
-- (itens/produtos que compõem cada venda — relação N:N entre vendas e
-- produtos, com dados congelados no momento da venda)
-- ============================================================================

create table venda_itens (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,

  venda_id uuid not null references vendas(id) on delete cascade,
  produto_id uuid references produtos(id) on delete set null,

  -- "congelamos" nome/preço no momento da venda, para o histórico não mudar
  -- caso o produto seja editado ou removido depois
  produto_nome text not null,
  quantidade integer not null default 1 check (quantidade > 0),
  preco_unitario numeric(10,2) not null default 0 check (preco_unitario >= 0),
  subtotal numeric(10,2) generated always as (quantidade * preco_unitario) stored,

  created_at timestamptz not null default now()
);

create index idx_venda_itens_owner on venda_itens(owner_id);
create index idx_venda_itens_venda on venda_itens(venda_id);
create index idx_venda_itens_produto on venda_itens(produto_id);

-- ============================================================================
-- TABELA: pagamentos
-- (uma venda pode ter mais de um pagamento — ex: parcelado, ou parte
-- em dinheiro + parte fiado)
-- ============================================================================

create table pagamentos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,

  venda_id uuid not null references vendas(id) on delete cascade,

  forma forma_pagamento not null,
  status status_pagamento not null default 'pendente',

  valor numeric(10,2) not null check (valor > 0),
  parcelas integer not null default 1 check (parcelas >= 1),

  data_pagamento timestamptz,       -- quando foi efetivamente pago
  data_vencimento timestamptz,      -- prazo (útil p/ fiado e parcelado)

  observacoes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_pagamentos_owner on pagamentos(owner_id);
create index idx_pagamentos_venda on pagamentos(venda_id);
create index idx_pagamentos_status on pagamentos(status);

create trigger trg_pagamentos_updated_at
  before update on pagamentos
  for each row execute function set_updated_at();

-- ============================================================================
-- TABELA: estoque_movimentos
-- Histórico de toda alteração de estoque — seja automática (gerada por uma
-- venda) ou manual (ajuste feito diretamente pelo vendedor: perda, quebra,
-- reposição, contagem, correção etc).
-- ============================================================================

create type tipo_movimento_estoque as enum ('venda', 'ajuste_manual', 'entrada');

create table estoque_movimentos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,

  produto_id uuid not null references produtos(id) on delete cascade,
  tipo tipo_movimento_estoque not null,

  -- negativo = saída (venda, perda...), positivo = entrada (reposição,
  -- correção de contagem para mais...)
  quantidade integer not null check (quantidade <> 0),

  -- preenchido apenas quando o movimento vem de uma venda (tipo = 'venda'),
  -- permite rastrear a origem e reverter corretamente se o item for excluído
  venda_item_id uuid references venda_itens(id) on delete set null,

  observacao text,

  created_at timestamptz not null default now()
);

create index idx_estoque_movimentos_owner on estoque_movimentos(owner_id);
create index idx_estoque_movimentos_produto on estoque_movimentos(produto_id);
create index idx_estoque_movimentos_venda_item on estoque_movimentos(venda_item_id);

-- ----------------------------------------------------------------------------
-- Baixa automática de estoque ao registrar/editar/excluir um item de venda.
-- O vendedor NÃO precisa mexer no estoque manualmente ao vender — isso
-- acontece sozinho via trigger. Ajustes manuais continuam possíveis
-- inserindo diretamente em estoque_movimentos (tipo 'ajuste_manual' ou
-- 'entrada'), que também dispara a atualização do saldo em produtos.
-- ----------------------------------------------------------------------------

create or replace function aplicar_movimento_estoque()
returns trigger as $$
begin
  update produtos
    set estoque_atual = estoque_atual + new.quantidade
    where id = new.produto_id;
  return new;
end;
$$ language plpgsql;

create trigger trg_estoque_movimentos_aplicar
  after insert on estoque_movimentos
  for each row execute function aplicar_movimento_estoque();

-- Quando um item de venda é criado, gera automaticamente um movimento de
-- saída (quantidade negativa) em estoque_movimentos.
create or replace function venda_item_baixa_estoque()
returns trigger as $$
begin
  if new.produto_id is not null then
    insert into estoque_movimentos (owner_id, produto_id, tipo, quantidade, venda_item_id)
    values (new.owner_id, new.produto_id, 'venda', -new.quantidade, new.id);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_venda_itens_baixa_estoque
  after insert on venda_itens
  for each row execute function venda_item_baixa_estoque();

-- Se um item de venda for excluído (ex: venda cancelada/corrigida), devolve
-- a quantidade ao estoque automaticamente.
create or replace function venda_item_estorna_estoque()
returns trigger as $$
begin
  if old.produto_id is not null then
    insert into estoque_movimentos (owner_id, produto_id, tipo, quantidade, venda_item_id, observacao)
    values (old.owner_id, old.produto_id, 'venda', old.quantidade, null, 'estorno automático: item de venda excluído (id original ' || old.id || ')');
  end if;
  return old;
end;
$$ language plpgsql;

create trigger trg_venda_itens_estorna_estoque
  after delete on venda_itens
  for each row execute function venda_item_estorna_estoque();

-- Nota: se quiser permitir EDITAR a quantidade de um item de venda já
-- lançado, adicionar um trigger AFTER UPDATE que gere um movimento com o
-- delta (nova quantidade - quantidade antiga). Deixado de fora por ora
-- para manter o escopo enxuto — hoje a correção é feita excluindo e
-- recriando o item, o que já dispara a baixa/estorno corretamente.

-- ============================================================================
-- ROW LEVEL SECURITY
-- Cada usuário só vê/edita seus próprios dados (owner_id = auth.uid()).
-- Como o app é de usuário único, na prática sempre será o mesmo vendedor,
-- mas manter RLS é uma boa prática de segurança básica no Supabase.
-- ============================================================================

alter table categorias   enable row level security;
alter table produtos     enable row level security;
alter table clientes     enable row level security;
alter table vendas       enable row level security;
alter table venda_itens  enable row level security;
alter table pagamentos   enable row level security;
alter table estoque_movimentos enable row level security;

-- Política genérica reaplicada por tabela: dono só mexe no que é seu.
create policy "categorias_owner_all" on categorias
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "produtos_owner_all" on produtos
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "clientes_owner_all" on clientes
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "vendas_owner_all" on vendas
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "venda_itens_owner_all" on venda_itens
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "pagamentos_owner_all" on pagamentos
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "estoque_movimentos_owner_all" on estoque_movimentos
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ============================================================================
-- FIM
-- Próximos passos sugeridos (fora do escopo desta entrega):
--   - Views/consultas prontas (ex: saldo em aberto por cliente,
--     produtos com estoque baixo, resumo de vendas do mês)
--   - Seed de dados de exemplo para desenvolvimento
--   - Tela de "ajuste de estoque" no front-end (insere em
--     estoque_movimentos com tipo 'ajuste_manual' ou 'entrada')
-- ============================================================================