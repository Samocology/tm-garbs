import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, Heart, Star, Tag, ShoppingCart, Plus, Minus, Truck, Shield, RotateCcw, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppShell, IconButton } from "@/components/AppShell";
import { PriceTag } from "@/components/PriceTag";

export const Route = createFileRoute("/product/$id")({
  head: () => ({ meta: [{ title: "Product — TM GARBS" }] }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const nav = useNavigate();
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [size, setSize] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [qty, setQty] = useState(1);
  const [expanded, setExpanded] = useState(false);

  const { data: p, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => (await supabase.from("products").select("*").eq("id", id).single()).data,
  });

  const { data: related } = useQuery({
    queryKey: ["related", p?.category_id, id], enabled: !!p?.category_id,
    queryFn: async () => (await supabase.from("products").select("*").eq("category_id", p!.category_id!).neq("id", id).limit(8)).data ?? [],
  });

  const { data: wished } = useQuery({
    queryKey: ["wish", user?.id, id], enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("wishlist").select("id").eq("user_id", user!.id).eq("product_id", id).maybeSingle();
      return !!data;
    },
  });

  const toggleWish = async () => {
    if (!user || !p) return;
    if (wished) await supabase.from("wishlist").delete().eq("user_id", user.id).eq("product_id", p.id);
    else await supabase.from("wishlist").insert({ user_id: user.id, product_id: p.id });
    qc.invalidateQueries({ queryKey: ["wish"] });
    qc.invalidateQueries({ queryKey: ["wishlist-ids"] });
    qc.invalidateQueries({ queryKey: ["wishlist"] });
  };

  const addToCart = async (then?: "cart" | "checkout") => {
    if (!user) return nav({ to: "/auth" });
    if (!p) return;
    const chosen = size ?? p.sizes?.[0] ?? "M";
    const { data: existing } = await supabase.from("cart_items").select("*").eq("user_id", user.id).eq("product_id", p.id).eq("size", chosen).maybeSingle();
    if (existing) {
      await supabase.from("cart_items").update({ quantity: existing.quantity + qty }).eq("id", existing.id);
    } else {
      await supabase.from("cart_items").insert({ user_id: user.id, product_id: p.id, size: chosen, quantity: qty });
    }
    qc.invalidateQueries({ queryKey: ["cart"] });
    qc.invalidateQueries({ queryKey: ["cart-count"] });
    if (then === "checkout") nav({ to: "/checkout" });
    else if (then === "cart") nav({ to: "/cart" });
  };

  return (
    <AppShell>
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-5 pb-2 pt-6 md:px-8">
        <IconButton onClick={() => router.history.back()}><ChevronLeft className="h-5 w-5" /></IconButton>
        <h1 className="truncate text-center font-display text-base font-bold md:text-xl">Product Details</h1>
        {isAdmin ? (
          <div className="flex gap-1">
            <IconButton onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /></IconButton>
            <IconButton onClick={() => setConfirmDelete(true)} className="border-destructive/30 text-destructive"><Trash2 className="h-4 w-4" /></IconButton>
          </div>
        ) : (
          <IconButton onClick={toggleWish} className={wished ? "border-primary text-primary" : ""}>
            <Heart className={`h-5 w-5 ${wished ? "fill-current" : ""}`} />
          </IconButton>
        )}
      </div>

      {isLoading || !p ? (
        <div className="grid h-[60vh] place-items-center text-muted-foreground">Loading...</div>
      ) : (
        <>
          <div className="md:grid md:grid-cols-2 md:gap-12 md:px-8">
            <div className="px-5 md:px-0">
              <div className="relative mt-2 aspect-square overflow-hidden rounded-3xl bg-muted">
                <img src={p.image_url ?? ""} alt={p.name} className="h-full w-full object-cover" />
              </div>
            </div>

            <div className="px-5 pt-5 md:px-0 md:pt-2">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <h2 className="font-display text-2xl font-extrabold md:text-4xl">{p.name}</h2>
                <PriceTag value={p.price as any} size="lg" />
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Tag className="h-3.5 w-3.5" /> {p.brand}
                <span>|</span>
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {p.rating}
                <span>|</span>
                <span>{p.stock} in stock</span>
              </div>

              <div className="mt-5">
                <h3 className="font-bold">Details</h3>
                <p className={`mt-2 text-sm leading-relaxed text-muted-foreground ${!expanded ? "line-clamp-4" : ""}`}>{p.description}</p>
                <button onClick={() => setExpanded((v) => !v)} className="mt-1 text-xs font-semibold text-primary underline underline-offset-2">
                  {expanded ? "Show less" : "Read more..."}
                </button>
              </div>

              <div className="mt-5">
                <h3 className="font-bold">Size</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(p.sizes ?? ["S","M","L","XL"]).map((s) => {
                    const active = (size ?? p.sizes?.[0]) === s;
                    return (
                      <button key={s} onClick={() => setSize(s)}
                        className={`min-w-[3rem] rounded-full px-4 py-2.5 text-sm font-bold transition ${active ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" : "bg-card border border-border text-foreground hover:border-primary"}`}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5">
                <h3 className="font-bold">Quantity</h3>
                <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-10 w-10 place-items-center rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center text-lg font-extrabold">{qty}</span>
                  <button onClick={() => setQty((q) => q + 1)} className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground hover:scale-105 transition">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <Perk icon={Truck} label="Free shipping" />
                <Perk icon={Shield} label="Authentic" />
                <Perk icon={RotateCcw} label="7-day return" />
              </div>

              <div className="mt-8 flex items-center gap-3 pb-4">
                <button onClick={() => addToCart("cart")} className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-border bg-card text-primary hover:bg-primary hover:text-primary-foreground transition">
                  <ShoppingCart className="h-5 w-5" />
                </button>
                <button onClick={() => addToCart("checkout")} className="flex-1 rounded-full bg-primary py-4 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition">
                  Buy Now · <PriceTagInline value={Number(p.price) * qty} />
                </button>
              </div>
            </div>
          </div>

          {/* More like this */}
          {related && related.length > 0 && (
            <div className="mt-10 px-5 md:px-8">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-xl font-bold">More like this</h3>
                <Link to="/home" className="text-xs font-semibold text-primary">View all</Link>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
                {related.map((r) => (
                  <Link key={r.id} to="/product/$id" params={{ id: r.id }} className="group rounded-2xl bg-card transition hover:shadow-lg active:scale-[0.98]">
                    <div className="aspect-square overflow-hidden rounded-2xl bg-muted">
                      <img src={r.image_url ?? ""} alt={r.name} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                    </div>
                    <div className="px-2 py-3">
                      <div className="truncate text-sm font-bold">{r.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{r.brand}</div>
                      <div className="mt-1"><PriceTag value={r.price as any} size="sm" /></div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {editing && p && (
        <ProductEditor
          product={p}
          onClose={() => {
            setEditing(false);
            qc.invalidateQueries({ queryKey: ["product", id] });
            qc.invalidateQueries({ queryKey: ["admin-products"] });
          }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={() => setConfirmDelete(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl">
            <h3 className="font-display text-lg font-extrabold">Delete Product?</h3>
            <p className="mt-2 text-sm text-muted-foreground">This action cannot be undone.</p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 rounded-full bg-muted py-3 text-sm font-bold">Cancel</button>
              <button
                onClick={async () => {
                  await supabase.from("products").delete().eq("id", id);
                  qc.invalidateQueries({ queryKey: ["admin-products"] });
                  router.history.back();
                }}
                className="flex-1 rounded-full bg-destructive py-3 text-sm font-bold text-white">Delete</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Perk({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="grid place-items-center gap-1 rounded-2xl border border-border bg-card p-3 text-center">
      <Icon className="h-4 w-4 text-primary" />
      <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>
    </div>
  );
}

function PriceTagInline({ value }: { value: number }) {
  return <span>₦{value.toLocaleString()}</span>;
}

function ProductEditor({ product, onClose }: { product: any; onClose: () => void }) {
  const [form, setForm] = useState({
    name: product.name ?? "",
    brand: product.brand ?? "",
    description: product.description ?? "",
    price: product.price ?? 0,
    image_url: product.image_url ?? "",
    stock: product.stock ?? 0,
    is_featured: product.is_featured ?? false,
  });
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    setErr(null);
    const { error } = await supabase.from("products").update(form).eq("id", product.id);
    if (error) return setErr(error.message);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-background p-6 shadow-2xl">
        <h3 className="font-display text-xl font-extrabold">Edit Product</h3>
        <div className="mt-4 space-y-3">
          <EditorInput label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <EditorInput label="Brand" value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} />
          <EditorInput label="Image URL" value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} />
          <div className="grid grid-cols-2 gap-3">
            <EditorInput label="Price" type="number" value={String(form.price)} onChange={(v) => setForm({ ...form, price: Number(v) })} />
            <EditorInput label="Stock" type="number" value={String(form.stock)} onChange={(v) => setForm({ ...form, stock: Number(v) })} />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
              className="mt-1 w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
            Featured
          </label>
        </div>
        {err && <div className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</div>}
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-full bg-muted py-3 text-sm font-bold">Cancel</button>
          <button onClick={save} className="flex-1 rounded-full bg-primary py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/30">Save</button>
        </div>
      </div>
    </div>
  );
}

function EditorInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs font-bold text-muted-foreground">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none focus:border-primary" />
    </div>
  );
}
