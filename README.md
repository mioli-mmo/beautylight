# Beauty Light

Base do projeto (fundação) para um pequeno sistema de controle de vendas de
cosméticos (revenda Boticário/Natura), uso pessoal por um único vendedor.

**Stack:** Next.js (App Router) + TypeScript + Tailwind CSS + Supabase.

> Esta entrega contém apenas a base: schema de dados para o Supabase e os
> esqueletos das páginas do frontend. Não há lógica de CRUD, autenticação
> nem busca de dados implementada ainda — isso fica para as próximas etapas.

## Estrutura

```
beauty-light/
├── supabase/
│   └── schema.sql          # schema completo (tabelas, enums, RLS)
├── types/
│   └── database.types.ts   # tipos TS espelhando o schema
├── lib/supabase/
│   ├── client.ts           # cliente Supabase (browser)
│   └── server.ts           # cliente Supabase (server)
├── app/
│   ├── layout.tsx          # layout raiz (sidebar + navegação mobile)
│   ├── page.tsx            # dashboard (skeleton)
│   ├── produtos/page.tsx   # skeleton CRUD produtos
│   ├── clientes/page.tsx   # skeleton CRUD clientes
│   ├── vendas/page.tsx     # skeleton CRUD vendas
│   └── pagamentos/page.tsx # skeleton CRUD pagamentos
└── components/
    ├── layout/              # Sidebar (desktop) e BottomNav (mobile)
    └── ui/                  # PageHeader, EmptyState (reutilizáveis)
```

## Modelo de dados

Entidades principais: `produtos`, `clientes`, `vendas`, `pagamentos`.
Entidades de apoio adicionadas: `venda_itens` (itens de cada venda) e
`categorias` (organização opcional dos produtos).

- Uma **venda** tem vários **venda_itens** (produtos vendidos) e pode ter
  vários **pagamentos** (ex: parte em dinheiro + parte fiado, ou parcelado).
- `venda_itens` "congela" nome e preço do produto no momento da venda, para
  o histórico não mudar se o produto for editado depois.
- Formas de pagamento cobertas: `fiado`, `dinheiro`, `pix`, `debito`,
  `credito_vista`, `credito_parcelado`.
- Todas as tabelas têm `owner_id` + Row Level Security (RLS) amarrados a
  `auth.uid()` — mesmo sendo uso de um único usuário, é uma prática de
  segurança básica e mínima do Supabase.

Veja `supabase/schema.sql` para o detalhamento completo (comentado).

## Como rodar (quando quiser avançar)

1. Criar um projeto no [Supabase](https://supabase.com).
2. Rodar `supabase/schema.sql` no SQL Editor do projeto.
3. Copiar `.env.local.example` para `.env.local` e preencher com a URL e a
   chave anônima do projeto (Project Settings > API).
4. `npm install`
5. `npm run dev`

## Decisões tomadas (e por quê)

- **Next.js + Vercel + Supabase**: combinação natural pedida no briefing,
  com deploy simples e camada de auth/DB pronta.
- **UUID + RLS por owner_id**: mesmo para um usuário só, evita retrabalho
  caso o projeto cresça, e é o padrão recomendado pelo Supabase.
- **Mobile-first**: navegação inferior em telas pequenas, sidebar em telas
  maiores, já que o uso real tende a ser no celular no balcão/entrega.
- **NUMERIC(10,2) para dinheiro**: evita problemas de arredondamento comuns
  com float.

## Dúvidas em aberto (não bloqueantes, mas vale decidir depois)

- Controle de estoque será baixado automaticamente ao registrar uma venda,
  ou o vendedor ajusta manualmente?
- Vale ter tela de login (Supabase Auth) ou o app fica "aberto" mesmo,
  já que é uso pessoal em dispositivo próprio?
