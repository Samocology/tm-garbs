import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, Heart, Sparkles, Shirt, Footprints, Watch, Glasses, ShoppingBag, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { PriceTag } from "@/components/PriceTag";

export const Route = createFileRoute("/home")({
  head: () => ({ meta: [{ title: "Shop — TM GARBS" }] }),
  component: HomePage,
});

const iconMap: Record<string, any> = { sparkles: Sparkles, shirt: Shirt, footprints: Footprints, watch: Watch, glasses: Glasses };

const banners = [
  { title: "New Season Drops", body: "Up to 40% off premium tailoring.", color: "from-primary to-amber-700", img: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&q=80" },
  { title: "Signature Watches", body: "Heritage timepieces, modern price.", color: "from-amber-900 to-stone-700", img: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&q=80" },
  { title: "Refined Accessories", body: "Belts, wallets, and more.", color: "from-stone-800 to-stone-600", img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80" },
];

function HomePage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<"new" | "low" | "high" | "rating">("new");
  const [maxPrice, setMaxPrice] = useState<number>(100000);

  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [user, loading, nav]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).single()).data,
  });
  const { data: cats } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });
  const { data: products } = useQuery({
    queryKey: ["products", activeCat, q, sort, maxPrice],
    queryFn: async () => {
      let qy = supabase.from("products").select("*");
      if (activeCat) qy = qy.eq("category_id", activeCat);
      if (q) qy = qy.ilike("name", `%${q}%`);
      if (maxPrice < 100000) qy = qy.lte("price", maxPrice);
      if (sort === "low") qy = qy.order("price", { ascending: true });
      else if (sort === "high") qy = qy.order("price", { ascending: false });
      else if (sort === "rating") qy = qy.order("rating", { ascending: false });
      else qy = qy.order("created_at", { ascending: false });
      return (await qy).data ?? [];
    },
  });
  const { data: wishIds } = useQuery({
    queryKey: ["wishlist-ids", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("wishlist").select("product_id").eq("user_id", user!.id);
      return new Set(data?.map((w) => w.product_id) ?? []);
    },
  });

  const toggleWish = async (pid: string) => {
    if (!user) return;
    if (wishIds?.has(pid)) {
      await supabase.from("wishlist").delete().eq("user_id", user.id).eq("product_id", pid);
    } else {
      await supabase.from("wishlist").insert({ user_id: user.id, product_id: pid });
    }
    qc.invalidateQueries({ queryKey: ["wishlist-ids"] });
    qc.invalidateQueries({ queryKey: ["wishlist"] });
  };

  if (loading || !user) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading...</div>;

  return (
    <AppShell>
      {/* Mobile header */}
      <div className="px-5 pt-6 md:hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <Link to="/profile" className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-sm font-bold text-primary">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : (profile?.full_name?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate font-bold">Hello {(profile?.full_name ?? user.email?.split("@")[0])?.split(" ")[0]}</div>
              <div className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">TM Garbs</div>
            </div>
          </Link>
          <CartIcon />
        </div>
      </div>

      {/* Desktop hero */}
      <div className="mt-2 px-5 md:px-8 md:pt-6">
        <h2 className="mt-6 font-display text-3xl font-extrabold leading-tight md:text-5xl md:mt-2">
          Refined <span className="text-primary italic">menswear</span><br className="hidden md:block" /> made for distinction.
        </h2>

        <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] gap-3 md:max-w-2xl">
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for garments, watches, accessories..."
              className="w-full bg-transparent py-3.5 text-sm outline-none" />
          </div>
          <button onClick={() => setShowFilters(true)} className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-105">
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Banner carousel */}
      <div className="mt-6 overflow-x-auto px-5 md:px-8 no-scrollbar">
        <div className="flex gap-3 pb-2 md:gap-5">
          {banners.map((b, i) => (
            <div key={i} className={`relative flex h-40 w-[85%] shrink-0 overflow-hidden rounded-3xl bg-gradient-to-br ${b.color} p-5 text-white shadow-xl md:h-56 md:w-[40%]`}>
              <div className="flex flex-col justify-between">
                <div>
                  <div className="font-display text-lg font-bold leading-tight md:text-2xl">{b.title}</div>
                  <div className="mt-1 text-xs opacity-90 md:text-sm">{b.body}</div>
                </div>
                <button className="w-fit rounded-full bg-white/95 px-4 py-1.5 text-xs font-bold text-foreground">Shop now</button>
              </div>
              <img src={b.img} alt="" className="absolute -right-4 bottom-0 h-32 w-32 rotate-6 object-cover rounded-2xl opacity-70 md:h-44 md:w-44" />
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="mt-7 px-5 md:px-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold md:text-xl">Categories</h3>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveCat(null)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${!activeCat ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" : "bg-card text-foreground border border-border hover:bg-muted"}`}>
            <Sparkles className="h-4 w-4" />All Items
          </button>
          {cats?.filter((c) => c.name !== "All Items").map((c) => {
            const Icon = iconMap[c.icon ?? "sparkles"] ?? Sparkles;
            const active = activeCat === c.id;
            return (
              <button key={c.id} onClick={() => setActiveCat(c.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${active ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" : "bg-card text-foreground border border-border hover:bg-muted"}`}>
                <Icon className="h-4 w-4" />{c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Products */}
      <div className="mt-7 px-5 md:px-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold md:text-xl">Curated for you</h3>
          <span className="text-xs text-muted-foreground">{products?.length ?? 0} items</span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5 lg:grid-cols-5">
          {products?.map((p) => {
            const wished = wishIds?.has(p.id);
            return (
              <Link key={p.id} to="/product/$id" params={{ id: p.id }} className="group rounded-2xl bg-card transition active:scale-[0.98] hover:shadow-xl hover:shadow-primary/5">
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
                  <img src={p.image_url ?? ""} alt={p.name} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                  <button onClick={(e) => { e.preventDefault(); toggleWish(p.id); }}
                    className={`absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full backdrop-blur transition ${wished ? "bg-primary text-primary-foreground" : "bg-white/90 text-primary hover:bg-white"}`}>
                    <Heart className={`h-4 w-4 ${wished ? "fill-current" : ""}`} />
                  </button>
                </div>
                <div className="px-2 py-3">
                  <div className="truncate text-sm font-bold">{p.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{p.brand}</div>
                  <div className="mt-1"><PriceTag value={p.price as any} size="sm" /></div>
                </div>
              </Link>
            );
          })}
          {products?.length === 0 && (
            <div className="col-span-full py-10 text-center text-sm text-muted-foreground">No products found</div>
          )}
        </div>
      </div>

      {/* Filter sheet */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 backdrop-blur-sm md:items-center" onClick={() => setShowFilters(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl bg-background p-6 pb-8 shadow-2xl md:rounded-3xl">
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-muted md:hidden" />
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Filters & Sort</h3>
              <button onClick={() => setShowFilters(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Sort by</p>
              <div className="grid grid-cols-2 gap-2">
                {([["new","Newest"],["rating","Top rated"],["low","Price: Low to high"],["high","Price: High to low"]] as const).map(([k, l]) => (
                  <button key={k} onClick={() => setSort(k)}
                    className={`rounded-2xl border-2 px-3 py-3 text-xs font-bold transition ${sort === k ? "border-primary bg-primary/5 text-primary" : "border-border bg-card"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <span>Max price</span>
                <span className="text-primary">₦{maxPrice.toLocaleString()}</span>
              </div>
              <input type="range" min={1000} max={100000} step={1000} value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))} className="mt-3 w-full accent-primary" />
            </div>
            <button onClick={() => setShowFilters(false)} className="mt-6 w-full rounded-full bg-primary py-4 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/30">
              Apply
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function CartIcon() {
  const { user } = useAuth();
  const { data: count } = useQuery({
    queryKey: ["cart-count", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("cart_items").select("quantity").eq("user_id", user!.id);
      return data?.reduce((s, c: any) => s + c.quantity, 0) ?? 0;
    },
  });
  return (
    <Link to="/cart" className="relative grid h-11 w-11 place-items-center rounded-full border border-border bg-card transition hover:bg-muted">
      <ShoppingBag className="h-5 w-5" />
      {!!count && count > 0 && (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{count}</span>
      )}
    </Link>
  );
}
