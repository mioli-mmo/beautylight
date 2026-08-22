// Navegação lateral — visível em telas médias/grandes (desktop/tablet).
// Skeleton: apenas estrutura e links, sem estado de rota ativa ainda.
// TODO: destacar item ativo com usePathname()

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/produtos", label: "Produtos" },
  { href: "/clientes", label: "Clientes" },
  { href: "/vendas", label: "Vendas" },
  { href: "/pagamentos", label: "Pagamentos" },
  { href: "/estoque", label: "Estoque" },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-56 md:flex-col md:border-r md:border-brand-200 md:bg-white md:px-4 md:py-6">
      <div className="mb-8 px-2">
        <span className="font-display text-lg font-semibold text-brand-700">
          Beauty Light
        </span>
      </div>

      <nav className="flex flex-col gap-1">
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="rounded-md px-3 py-2 text-sm font-medium text-ink/80 hover:bg-brand-100 hover:text-brand-700"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
