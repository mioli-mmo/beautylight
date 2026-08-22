"use client";

// Cliente Supabase para uso em Client Components (navegador).
// TODO: instalar dependência -> npm install @supabase/ssr @supabase/supabase-js

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
