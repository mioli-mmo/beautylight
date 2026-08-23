'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BrandMark } from '@/components/layout/BrandMark'

const LINKS = [
  { href: '/', label: 'Início', icon: '🏠' },
  { href: '/produtos', label: 'Produtos', icon: '📦' },
  { href: '/clientes', label: 'Clientes', icon: '👥' },
  { href: '/vendas', label: 'Vendas', icon: '💰' },
  { href: '/pagamentos', label: 'Pagamentos', icon: '💳' },
  { href: '/boletos', label: 'Boletos', icon: '🧾' },
  { href: '/estoque', label: 'Estoque', icon: '📊' },
]

export function Sidebar() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden md:flex md:w-56 md:flex-col md:justify-between md:border-r md:border-brand-200 md:bg-white md:px-4 md:py-6">
      <div>
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
              <span aria-hidden="true" className="text-base">
                {link.icon}
              </span>
              <span>{link.label}</span>
            </a>
          ))}
        </nav>
      </div>

      <div className="border-t border-brand-200 pt-4">
        <button
          onClick={handleLogout}
          type="button"
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <span aria-hidden="true" className="text-base">
            🚪
          </span>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}