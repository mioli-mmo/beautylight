// Navegação inferior — visível apenas em telas pequenas (foco mobile-first).
// Skeleton: apenas estrutura e links, sem ícones nem estado ativo ainda.
// TODO: adicionar ícones (ex: lucide-react) e destaque de rota ativa

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/produtos", label: "Produtos" },
  { href: "/vendas", label: "Vendas" },
  { href: "/clientes", label: "Clientes" },
  { href: "/pagamentos", label: "Pagtos" },
  { href: "/estoque", label: "Estq" },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 flex border-t border-brand-200 bg-white md:hidden">
      {LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="flex-1 py-3 text-center text-xs font-medium text-ink/70 hover:text-brand-700"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
