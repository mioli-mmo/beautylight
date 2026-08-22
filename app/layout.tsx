import type { Metadata } from "next";
import "./globals.css";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Beauty Light",
  description: "Controle de vendas de cosméticos",
};

// Layout raiz — esqueleto.
// TODO: adicionar verificação de sessão (usuário único / login) quando a
// autenticação com Supabase for implementada.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="min-h-screen flex flex-col md:flex-row">
          {/* Navegação lateral em telas maiores */}
          <Sidebar />

          <main className="flex-1 pb-20 md:pb-0">{children}</main>

          {/* Navegação inferior em telas pequenas (mobile-first) */}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
