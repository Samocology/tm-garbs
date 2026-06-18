import { createFileRoute, useRouter, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { ChevronLeft, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppShell, IconButton } from "@/components/AppShell";
import { PriceTag } from "@/components/PriceTag";
import { formatTotal } from "@/lib/format";

const VAT = 350;
const DELIVERY = 150;

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — TM GARBS" }] }),
  component: CartPage,
});

function CartPage() {
  const router = useRouter();
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const qc = useQueryClient();

  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [user, loading, nav]);

  const { data: items, isLoading } = useQuery({
    queryKey: ["cart", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("cart_items")
        .select("*, product:products(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["cart"] });
    qc.invalidateQueries({ queryKey: ["cart-count"] });
  };

  const update = async (id: string, qty: number) => {
    if (qty < 1) return remove(id);
    await supabase.from("cart_items").update({ quantity: qty }).eq("id", id);
    invalidate();
  };
  const remove = async (id: string) => {
    await supabase.from("cart_items").delete().eq("id", id);
    invalidate();
  };

  const subtotal = items?.reduce((s, it: any) => s + Number(it.product?.price ?? 0) * it.quantity, 0) ?? 0;
  const total = subtotal + (items?.length ? VAT + DELIVERY : 0);

  return (
    <AppShell>
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-5 pb-2 pt-6 md:px-8">
        <IconButton onClick={() => router.history.back()}><ChevronLeft className="h-5 w-5" /></IconButton>
        <h1 className="text-center font-display text-lg font-bold md:text-2xl">Shopping Cart</h1>
        <div className="h-10 w-10" />
      </div>

      {isLoading ? (
        <div className="grid h-[40vh] place-items-center text-muted-foreground">Loading...</div>
      ) : !items?.length ? (
        <div className="grid h-[50vh] place-items-center px-8 text-center">
          <div>
            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 font-bold">Your cart is empty</p>
            <Link to="/home" className="mt-4 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground">Start shopping</Link>
          </div>
        </div>
      ) : (
        <div className="md:grid md:grid-cols-[1fr_360px] md:gap-8 md:px-8">
          <div className="space-y-3 px-5 pt-2 md:px-0">
            {items.map((it: any) => (
              <div key={it.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-card p-3 transition hover:shadow-md">
                <Link to="/product/$id" params={{ id: it.product?.id }} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted md:h-24 md:w-24">
                  <img src={it.product?.image_url ?? ""} alt="" className="h-full w-full object-cover" />
                </Link>
                <div className="min-w-0">
                  <Link to="/product/$id" params={{ id: it.product?.id }} className="truncate text-sm font-bold hover:text-primary md:text-base">{it.product?.name}</Link>
                  <div className="text-xs text-muted-foreground">{it.product?.brand} · Size {it.size}</div>
                  <div className="mt-1"><PriceTag value={Number(it.product?.price ?? 0) * it.quantity} /></div>
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-border p-0.5">
                    <button onClick={() => update(it.id, it.quantity - 1)} className="grid h-7 w-7 place-items-center rounded-full bg-muted">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-7 text-center text-sm font-bold">{it.quantity}</span>
                    <button onClick={() => update(it.id, it.quantity + 1)} className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <button onClick={() => remove(it.id)} className="self-start text-muted-foreground hover:text-destructive transition">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="px-5 pt-5 md:sticky md:top-24 md:h-fit md:px-0 md:pt-2">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-display text-lg font-bold">Order Summary</h3>
              <div className="mt-4 space-y-2">
                <Row label="Subtotal" value={<PriceTag value={subtotal} />} />
                <Row label="VAT" value={<PriceTag value={VAT} />} />
                <Row label="Delivery" value={<PriceTag value={DELIVERY} />} />
              </div>
              <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center border-t border-border pt-4">
                <span className="font-display font-bold">Total</span>
                <PriceTag value={total} size="lg" />
              </div>
              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground">Promo code</p>
                <input placeholder="Enter code" className="mt-2 w-full rounded-full border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
              <button onClick={() => nav({ to: "/checkout" })}
                className="mt-5 w-full rounded-full bg-primary py-4 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl transition">
                Checkout · {formatTotal(total)}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div>{value}</div>
    </div>
  );
}
