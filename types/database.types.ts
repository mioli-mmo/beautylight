// ============================================================================
// Tipos base espelhando o schema do Supabase (supabase/schema.sql)
//
// TODO: quando o schema estiver rodando no Supabase, o ideal é gerar este
// arquivo automaticamente com:
//   npx supabase gen types typescript --project-id <PROJECT_ID> > types/database.types.ts
// Por enquanto, este arquivo é escrito manualmente como esqueleto.
// ============================================================================

export type MarcaProduto = "boticario" | "natura" | "outro";

export type StatusVenda = "pendente" | "parcial" | "pago" | "cancelado";

export type FormaPagamento =
  | "fiado"
  | "dinheiro"
  | "pix"
  | "debito"
  | "credito_vista"
  | "credito_parcelado";

export type StatusPagamento = "pendente" | "pago" | "cancelado";

export interface Categoria {
  id: string;
  owner_id: string;
  nome: string;
  created_at: string;
}

export interface Produto {
  id: string;
  owner_id: string;
  nome: string;
  marca: MarcaProduto;
  categoria_id: string | null;
  codigo_referencia: string | null;
  descricao: string | null;
  preco_custo: number;
  preco_venda: number;
  estoque_atual: number;
  estoque_minimo: number;
  imagem_url: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Cliente {
  id: string;
  owner_id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Venda {
  id: string;
  owner_id: string;
  cliente_id: string | null;
  data_venda: string;
  status: StatusVenda;
  valor_total: number;
  desconto: number;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VendaItem {
  id: string;
  owner_id: string;
  venda_id: string;
  produto_id: string | null;
  produto_nome: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number; // coluna gerada (quantidade * preco_unitario)
  created_at: string;
}

export interface Pagamento {
  id: string;
  owner_id: string;
  venda_id: string;
  forma: FormaPagamento;
  status: StatusPagamento;
  valor: number;
  parcelas: number;
  data_pagamento: string | null;
  data_vencimento: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EstoqueMovimento {
  id: string;
  owner_id: string;
  produto_id: string;
  tipo: "venda" | "ajuste_manual" | "entrada";
  quantidade: number;
  venda_item_id: string | null;
  observacao: string | null;
  created_at: string;
}

export type CategoriaInsert = Partial<Omit<Categoria, "id" | "owner_id" | "created_at">>;
export type ProdutoInsert = Partial<Omit<Produto, "id" | "owner_id" | "created_at" | "updated_at">>;
export type ClienteInsert = Partial<Omit<Cliente, "id" | "owner_id" | "created_at" | "updated_at">>;
export type VendaInsert = Partial<Omit<Venda, "id" | "owner_id" | "created_at" | "updated_at">>;
export type VendaItemInsert = Partial<Omit<VendaItem, "id" | "owner_id" | "created_at">>;
export type PagamentoInsert = Partial<Omit<Pagamento, "id" | "owner_id" | "created_at" | "updated_at">>;
export type EstoqueMovimentoInsert = Partial<Omit<EstoqueMovimento, "id" | "owner_id" | "created_at">>;

export type CategoriaUpdate = Partial<Omit<Categoria, "id" | "owner_id" | "created_at">>;
export type ProdutoUpdate = Partial<Omit<Produto, "id" | "owner_id" | "created_at" | "updated_at">>;
export type ClienteUpdate = Partial<Omit<Cliente, "id" | "owner_id" | "created_at" | "updated_at">>;
export type VendaUpdate = Partial<Omit<Venda, "id" | "owner_id" | "created_at" | "updated_at">>;
export type VendaItemUpdate = Partial<Omit<VendaItem, "id" | "owner_id" | "created_at">>;
export type PagamentoUpdate = Partial<Omit<Pagamento, "id" | "owner_id" | "created_at" | "updated_at">>;
export type EstoqueMovimentoUpdate = Partial<Omit<EstoqueMovimento, "id" | "owner_id" | "created_at">>;

export interface Database {
  public: {
    Tables: {
      categorias: { Row: Categoria; Insert: CategoriaInsert; Update: CategoriaUpdate };
      produtos: { Row: Produto; Insert: ProdutoInsert; Update: ProdutoUpdate };
      clientes: { Row: Cliente; Insert: ClienteInsert; Update: ClienteUpdate };
      vendas: { Row: Venda; Insert: VendaInsert; Update: VendaUpdate };
      venda_itens: { Row: VendaItem; Insert: VendaItemInsert; Update: VendaItemUpdate };
      pagamentos: { Row: Pagamento; Insert: PagamentoInsert; Update: PagamentoUpdate };
      estoque_movimentos: { Row: EstoqueMovimento; Insert: EstoqueMovimentoInsert; Update: EstoqueMovimentoUpdate };
    };
  };
}
