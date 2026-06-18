import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Heart, User, ShoppingBag, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { ReactNode } from "react";
import { BrandLogo } from "./BrandLogo";

const tabs = [
  { to: "/home", icon: Home, label: "Home" },
  { to: "/wishlist", icon: Heart, label: "Wishlist" },
  { to: "/profile", icon: User, label: "Profile" },
];

function useCartCount() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["cart-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("cart_items").select("quantity").eq("user_id", user!.id);
      return data?.reduce((s, c: any) => s + c.quantity, 0) ?? 0;
    },
  });
  return data ?? 0;
}

export function AppShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const cartCount = useCartCount();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop top nav */}
      {!hideNav && (
        <header className="sticky top-0 z-40 hidden border-b border-border bg-background/80 backdrop-blur-xl md:block">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-8 py-4">
            <Link to="/home" className="flex items-center gap-3">
              <BrandLogo className="h-10 w-10" />
              <div className="leading-tight">
                <div className="font-display text-lg font-extrabold tracking-wider text-primary">TM GARBS</div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Men Clothing & Accessories</div>
              </div>
            </Link>
            <nav className="flex items-center gap-1 rounded-full border border-border bg-card/60 p-1">
              {tabs.map(({ to, label }) => {
                const active = pathname === to;
                return (
                  <Link key={to} to={to}
                    className={`rounded-full px-5 py-2 text-sm font-semibold transition ${active ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "text-foreground/70 hover:text-foreground"}`}>
                    {label}
                  </Link>
                );
              })}
            </nav>
            <Link to="/cart" className="relative grid h-11 w-11 place-items-center rounded-full border border-border bg-card hover:bg-muted transition">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{cartCount}</span>
              )}
            </Link>
          </div>
        </header>
      )}

      <div className="mx-auto w-full max-w-md md:max-w-7xl">
        <div className={hideNav ? "pb-6" : "pb-28 md:pb-12"}>{children}</div>
      </div>

      {/* Mobile bottom nav */}
      {!hideNav && (
        <nav className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 md:hidden">
          <div className="flex items-center gap-1 rounded-full border border-border bg-card/95 px-2 py-2 shadow-2xl shadow-primary/10 backdrop-blur-xl">
            {tabs.map(({ to, icon: Icon, label }) => {
              const active = pathname === to;
              return (
                <Link key={to} to={to}
                  className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold transition ${active ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "text-muted-foreground"}`}>
                  <Icon className="h-4 w-4" strokeWidth={2.4} />
                  {active && <span>{label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

export function PageHeader({ title, left, right }: { title: string; left?: ReactNode; right?: ReactNode }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-5 pb-2 pt-6 md:pt-8">
      <div className="flex h-10 w-10 items-center justify-center">{left}</div>
      <h1 className="truncate text-center font-display text-lg font-bold md:text-2xl">{title}</h1>
      <div className="flex h-10 w-10 items-center justify-center">{right}</div>
    </div>
  );
}

export function IconButton({ children, onClick, className = "" }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:bg-muted ${className}`}
    >
      {children}
    </button>
  );
}

export { Search };
