import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { z } from "zod";
import { BrandLogo } from "@/components/BrandLogo";

const search = z.object({ mode: z.enum(["login", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Sign in — TM GARBS" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { mode: m } = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">(m ?? "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const nav = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => { if (!loading && user) nav({ to: "/home" }); }, [user, loading, nav]);
  useEffect(() => { if (m) setMode(m); }, [m]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (password.length < 6) { setErr("Password must be at least 6 characters."); return; }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/home` },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      nav({ to: "/home" });
    } catch (e: any) {
      setErr(e.message ?? "Auth failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-5 py-10">
      <div className="w-full max-w-md rounded-3xl bg-background p-8 shadow-xl">
        <Link to="/" className="flex items-center gap-2">
          <BrandLogo className="h-28 w-28" />
          <div className="leading-tight">
            <div className="font-display text-xl font-extrabold tracking-wider text-primary">TM GARBS</div>
            <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Men Clothing & Accessories</div>
          </div>
        </Link>
        <h1 className="mt-6 font-display text-2xl font-extrabold">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signup" ? "Refined menswear, made for you." : "Sign in to continue shopping."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "signup" && (
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
              className="w-full rounded-2xl border border-input bg-card px-5 py-4 text-sm outline-none focus:border-primary" />
          )}
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
            className="w-full rounded-2xl border border-input bg-card px-5 py-4 text-sm outline-none focus:border-primary" />
          <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min. 6 characters)"
            className="w-full rounded-2xl border border-input bg-card px-5 py-4 text-sm outline-none focus:border-primary" />
          {err && <div className="rounded-xl bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive">{err}</div>}
          <button disabled={busy}
            className="mt-2 w-full rounded-full bg-primary py-4 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/30 disabled:opacity-60">
            {busy ? "Please wait..." : mode === "signup" ? "Get Started" : "Log In"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-foreground">
          {mode === "signup" ? "Already have an account?" : "New to TM Garbs?"}{" "}
          <button onClick={() => setMode(mode === "signup" ? "login" : "signup")} className="font-bold text-primary underline underline-offset-2">
            {mode === "signup" ? "Log In" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}
