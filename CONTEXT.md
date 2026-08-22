# Beauty Light — Contexto do Projeto

> Documento de contexto para agentes de IA trabalharem neste projeto.
> Leia isto antes de qualquer alteração. Mantenha-o atualizado conforme
> decisões novas forem tomadas.

## OBJETIVO

Sistema web simples de controle de vendas para um pequeno revendedor de
cosméticos (Boticário/Natura). Projeto **pessoal, não profissional**,
escopo enxuto. Uso por **um único usuário** (o próprio vendedor).

## STACK

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend/DB:** Supabase (Postgres + Auth + RLS)
- **Deploy:** Vercel (frontend) + Supabase (infra de dados)

## ESTADO ATUAL

Apenas a **fundação** foi criada. CRUD de produtos já está funcional; os
demais CRUDs ainda não foram implementados.

- [x] Schema completo do banco (`supabase/schema.sql`), já aplicado no
      Supabase do usuário
- [x] Migration incremental aplicada (`supabase/migrations/002_estoque_movimentos.sql`)
      — controle de estoque com baixa automática
- [x] Tipos TypeScript espelhando o schema (`types/database.types.ts`)
      — escritos manualmente; idealmente regenerar com
      `supabase gen types typescript` quando possível
- [x] Clientes Supabase base (`lib/supabase/client.ts` browser,
      `lib/supabase/server.ts` server)
- [x] Esqueletos de página (App Router): dashboard (`/`), `/produtos`,
      `/clientes`, `/vendas`, `/pagamentos` — apenas layout/placeholder,
      **sem** busca de dados, sem formulários funcionais, sem mutações
- [x] Layout base: Sidebar (desktop) + BottomNav (mobile), mobile-first
- [x] CRUD de produtos — funcional
- [ ] CRUD de clientes — **não implementado**
- [ ] CRUD de vendas (com itens) — **não implementado**
- [ ] CRUD de pagamentos — **não implementado**
- [ ] Tela de ajuste manual de estoque — **não implementado**
- [ ] Dashboard com dados reais — **não implementado** (hoje são placeholders "—")
- [x] Autenticação — **email+password** (decisão tomada)

**Ordem sugerida de implementação:** produtos → clientes → vendas → pagamentos
→ ajuste manual de estoque → dashboard.

## MODELO DE DADOS (resumo)

Tabelas: `produtos`, `clientes`, `vendas`, `venda_itens`, `pagamentos`,
`estoque_movimentos`, `categorias` (opcional/apoio).

- `vendas` 1:N `venda_itens` (itens da venda); `venda_itens` referencia
  `produtos` mas **congela** nome/preço no momento da venda (histórico não
  muda se o produto for editado depois)
- `vendas` 1:N `pagamentos` (uma venda pode ter mais de um pagamento —
  ex: parte em dinheiro + parte fiado, ou parcelado)
- `estoque_movimentos`: histórico de toda alteração de estoque (`tipo`:
  `venda` | `ajuste_manual` | `entrada`). Trigger em `venda_itens`
  (insert/delete) gera movimentos automaticamente; ajustes manuais são
  inseridos diretamente nessa tabela pelo front-end
- Enums: `marca_produto`, `status_venda`, `forma_pagamento` (fiado,
  dinheiro, pix, debito, credito_vista, credito_parcelado),
  `status_pagamento`, `tipo_movimento_estoque`
- Toda tabela tem `owner_id` + RLS (`owner_id = auth.uid()`)

Schema completo e comentado em `supabase/schema.sql`
(+ `supabase/migrations/` para mudanças incrementais já aplicadas).

## DECISÕES TOMADAS

| Decisão | Motivo |
|---|---|
| Next.js + Vercel + Supabase | Pedido no briefing original; combinação simples de manter |
| UUID + RLS por `owner_id` em todas as tabelas | Padrão recomendado pelo Supabase; não custa manter mesmo com 1 usuário só |
| `NUMERIC(10,2)` para valores monetários | Evita erro de arredondamento de float |
| Estoque baixa **automaticamente** ao registrar venda (via trigger em `venda_itens`), **e também** permite ajuste manual (inserindo em `estoque_movimentos`) | Decisão explícita do usuário |
| Autenticação: email + password | Decisão: fluxo mais simples com Supabase Auth (email/senha, um usuário) |
| Mobile-first (BottomNav em telas pequenas, Sidebar em telas grandes) | Uso real tende a ser no celular |
| `venda_itens` congela nome/preço do produto | Preservar histórico de vendas mesmo se o produto mudar depois |

## CONVENÇÕES DO PROJETO

- Nomes de tabelas/colunas em **português**, snake_case
- Comentários e strings de UI em **português**
- Componentes de UI reutilizáveis ficam em `components/ui/`
  (`PageHeader`, `EmptyState`); layout global em `components/layout/`
- Cliente Supabase: usar `lib/supabase/server.ts` em Server Components/Actions
  e `lib/supabase/client.ts` apenas quando precisar de interatividade no browser
- `.env.local` (não versionado) precisa de `NEXT_PUBLIC_SUPABASE_URL` e
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` — ver `.env.local.example`

## PONTOS EM ABERTO / A DEFINIR

- Editar quantidade de um item de venda já lançado: hoje não há trigger de
  `UPDATE` em `venda_itens` para recalcular estoque — a correção prevista é
  excluir e recriar o item (isso já dispara baixa/estorno corretamente)
- Sem view/consulta pronta ainda para: saldo em aberto por cliente (fiado),
  produtos com estoque baixo, resumo de vendas do mês — necessárias para o
  dashboard
- Sem seed de dados de desenvolvimento