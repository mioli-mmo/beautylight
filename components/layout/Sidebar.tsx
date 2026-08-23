import { BrandMark } from "@/components/layout/BrandMark";

// Navegação lateral — visível em telas médias/grandes (desktop/tablet).
// Skeleton: apenas estrutura e links, sem estado de rota ativa ainda.
// TODO: destacar item ativo com usePathname()

const LINKS = [
  { href: "/", label: "Início", icon: "🏠" },
  { href: "/produtos", label: "Produtos", icon: "📦" },
  { href: "/clientes", label: "Clientes", icon: "👥" },
  { href: "/vendas", label: "Vendas", icon: "💰" },
  { href: "/pagamentos", label: "Pagamentos", icon: "💳" },
  { href: "/boletos", label: "Boletos", icon: "🧾" },
  { href: "/estoque", label: "Estoque", icon: "📊" },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-56 md:flex-col md:border-r md:border-brand-200 md:bg-white md:px-4 md:py-6">
      <div className="mb-8 px-2">
        <BrandMark />
      </div>

      <nav className="flex flex-col gap-1">
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-ink/80 hover:bg-brand-100 hover:text-brand-700"
          >
            <span aria-hidden="true" className="text-base">{link.icon}</span>
            <span>{link.label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}
