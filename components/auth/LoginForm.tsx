"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserEmail(data?.user?.email ?? null);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await supabase.auth.signInWithPassword({ email, password });
      if (res.error) alert(res.error.message);
      else window.location.href = "/";
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await supabase.auth.signUp({ email, password });
      if (res.error) alert(res.error.message);
      else {
        // after signup, try to sign in automatically
        const r2 = await supabase.auth.signInWithPassword({ email, password });
        if (r2.error) alert(r2.error.message);
        else window.location.href = "/";
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      window.location.href = "/login";
    } finally {
      setLoading(false);
    }
  }

  if (userEmail) {
    return (
      <div className="space-y-2">
        <p>Conectado como <strong>{userEmail}</strong></p>
        <button className="rounded bg-red-100 px-3 py-2" onClick={handleSignOut} disabled={loading}>
          Sair
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-sm">
      <h2 className="mb-3 text-lg font-semibold text-ink">{mode === "signin" ? "Entrar" : "Criar conta"}</h2>
      {loading && mode === "signup" && (
        <p className="mb-2 text-sm text-ink/70">Criando conta... por favor aguarde.</p>
      )}
      <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="space-y-3">
      <div>
        <label className="block text-sm text-ink/80">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded border px-2 py-2"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm text-ink/80">Senha</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded border px-2 py-2"
          disabled={loading}
        />
      </div>

      <div className="flex items-center gap-2">
        <button type="submit" disabled={loading} className="rounded bg-brand-600 px-4 py-2 text-white">
          {loading ? (mode === "signin" ? "Entrando..." : "Criando conta...") : mode === "signin" ? "Entrar" : "Criar conta"}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="text-sm text-ink/70 underline"
        >
          {mode === "signin" ? "Criar conta" : "Já tenho conta"}
        </button>
      </div>
      </form>
    </div>
  );
}

export default LoginForm;
