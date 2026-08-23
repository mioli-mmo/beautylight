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
- **Backend/DB:** Supabase (Postgres + Auth) — RLS desativado (decisão do usuário)
- **Deploy:** Vercel (frontend) + Supabase (infra de dados)

## ESTADO ATUAL

Fundação do projeto concluída e módulos principais já funcionais no app.

- [x] Schema completo do banco (`supabase/schema.sql`), já aplicado no
      Supabase do usuário
- [x] Migration incremental de boletos criada (`supabase/migrations/003_boletos.sql`)
  — tabelas `boletos` e `boleto_itens`, com integração opcional ao estoque
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
- [x] CRUD de clientes — funcional (rotas: `app/api/clientes/*`; componentes: `components/clients/*`; página: `app/clientes/page.tsx`)
- [x] CRUD de vendas (com itens) — funcional (rotas: `app/api/vendas/*`; componentes: `components/vendas/*`; páginas: `app/vendas/*`).
  - Observações: edição de venda abre `/vendas/[id]` e ao salvar redireciona para `/vendas`.
  - Campos numéricos no formulário aceitam vírgula ou ponto como separador decimal.
- [x] CRUD de pagamentos — funcional (rotas: `app/api/pagamentos/*`; componentes: `components/pagamentos/*`; páginas: `app/pagamentos/*`).
  - Observações: a listagem exibe `data_vencimento` e usa rótulos amigáveis para `forma`/`status`.
- [x] Tela de ajuste manual de estoque — funcional (rotas: `app/api/estoque/*`; componentes: `components/estoque/*`; página: `app/estoque/page.tsx`).
  - Observações: o formulário usa quantidade livre, com botões de acréscimo e diminuição; o movimento é registrado como `ajuste_manual` e atualiza `produtos.estoque_atual` via trigger.
- [x] Entidade `boletos` no banco — implementada em schema/migration (tabelas `boletos` e `boleto_itens`, com integração opcional ao estoque quando boleto é marcado como `pago`).
- [ ] CRUD de boletos no app (rotas/pages/componentes) — **não implementado ainda**
- [ ] Dashboard com dados reais — **não implementado** (hoje são placeholders "—")
- [x] Autenticação — **email+password** (decisão tomada)

**Ordem sugerida de implementação:** produtos → clientes → vendas → pagamentos
→ ajuste manual de estoque → dashboard.

**Status atual da implementação:** produtos, clientes, vendas, pagamentos e
ajuste manual de estoque já estão funcionalmente implementados no app;
boletos já existem no banco, faltando implementação de UI/API no app e o
dashboard com dados reais.

## MODELO DE DADOS (resumo)

Tabelas: `produtos`, `clientes`, `vendas`, `venda_itens`, `pagamentos`,
`boletos`, `boleto_itens`, `estoque_movimentos`, `categorias` (opcional/apoio).

- `vendas` 1:N `venda_itens` (itens da venda); `venda_itens` referencia
  `produtos` mas **congela** nome/preço no momento da venda (histórico não
  muda se o produto for editado depois)
- `vendas` 1:N `pagamentos` (uma venda pode ter mais de um pagamento —
  ex: parte em dinheiro + parte fiado, ou parcelado)
- `boletos` 1:N `boleto_itens` (compra para reposição); itens podem virar
  `estoque_movimentos` do tipo `entrada` quando o boleto muda para `pago`
  (ou quando item é inserido em boleto já pago)
- `estoque_movimentos`: histórico de toda alteração de estoque (`tipo`:
  `venda` | `ajuste_manual` | `entrada`). Trigger em `venda_itens`
  (insert/delete) gera movimentos automaticamente; ajustes manuais são
  inseridos diretamente nessa tabela pelo front-end e atualizam o saldo de
  `produtos.estoque_atual` por trigger. O ajuste manual usa quantidade livre,
  com sinal positivo para acréscimo e negativo para diminuição.
- Enums: `marca_produto`, `status_venda`, `forma_pagamento` (fiado,
  dinheiro, pix, debito, credito_vista, credito_parcelado),
  `status_pagamento`, `status_boleto`, `tipo_movimento_estoque`
- Toda tabela tem `owner_id` + RLS (`owner_id = auth.uid()`)

Schema completo e comentado em `supabase/schema.sql`
(+ `supabase/migrations/` para mudanças incrementais já aplicadas).

## DECISÕES TOMADAS

| Decisão | Motivo |
|---|---|
| Next.js + Vercel + Supabase | Pedido no briefing original; combinação simples de manter |
| UUID + owner_id em todas as tabelas | Mantido; RLS está desativado por decisão do usuário (único usuário) |
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
- Testes manuais para o CRUD de clientes — pendente (RLS desativado)
- Definir fluxo no app para boletos: cadastro, itens, quitação parcial/total,
  e visualização de impacto no estoque