import { createFileRoute, useRouter, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronLeft, MapPin, Plus, CheckCircle2, Wifi } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppShell, IconButton } from "@/components/AppShell";
import { PriceTag } from "@/components/PriceTag";
import { formatTotal } from "@/lib/format";

const VAT = 350;
const DELIVERY = 150;

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — TM GARBS" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const router = useRouter();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { user, loading } = useAuth();
  const [addressId, setAddressId] = useState<string | null>(null);
  const [cardId, setCardId] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddAddr, setShowAddAddr] = useState(false);

  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [user, loading, nav]);

  const { data: items } = useQuery({
    queryKey: ["cart", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("cart_items").select("*, product:products(*)").eq("user_id", user!.id)).data ?? [],
  });
  const { data: addresses } = useQuery({
    queryKey: ["addresses", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("addresses").select("*").eq("user_id", user!.id).order("created_at")).data ?? [],
  });
  const { data: cards } = useQuery({
    queryKey: ["cards", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("payment_methods").select("*").eq("user_id", user!.id).order("created_at")).data ?? [],
  });

  useEffect(() => {
    if (!addressId && addresses?.length) setAddressId(addresses.find((a) => a.is_default)?.id ?? addresses[0].id);
    if (!cardId && cards?.length) setCardId(cards.find((c) => c.is_default)?.id ?? cards[0].id);
  }, [addresses, cards, addressId, cardId]);

  const subtotal = items?.reduce((s, it: any) => s + Number(it.product?.price ?? 0) * it.quantity, 0) ?? 0;
  const total = subtotal + (items?.length ? VAT + DELIVERY : 0);
  const selectedAddr = addresses?.find((a) => a.id === addressId);
  const selectedCard = cards?.find((c) => c.id === cardId);

  const placeOrder = async () => {
    setErr(null);
    if (!user || !items?.length) return;
    if (!selectedAddr) { setErr("Please add a delivery address."); return; }
    if (!selectedCard) { setErr("Please add a payment card."); return; }
    setPlacing(true);
    try {
      const { data: order, error } = await supabase
        .from("orders").insert({
          user_id: user.id, subtotal, vat: VAT, delivery_fee: DELIVERY, total,
          delivery_address: selectedAddr.address, payment_method: `card •••• ${selectedCard.last4}`, status: "ordered",
        }).select().single();
      if (error || !order) throw error;
      const rows = items.map((it: any) => ({
        order_id: order.id, product_id: it.product?.id, name: it.product?.name,
        brand: it.product?.brand, image_url: it.product?.image_url,
        price: it.product?.price, quantity: it.quantity, size: it.size,
      }));
      const { error: e2 } = await supabase.from("order_items").insert(rows);
      if (e2) throw e2;
      await supabase.from("cart_items").delete().eq("user_id", user.id);
      qc.invalidateQueries({ queryKey: ["cart-count"] });
      nav({ to: "/order-success/$id", params: { id: order.id } });
    } catch (e: any) {
      setErr(e.message);
    } finally { setPlacing(false); }
  };

  return (
    <AppShell hideNav>
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-5 pb-2 pt-6 md:px-8">
        <IconButton onClick={() => router.history.back()}><ChevronLeft className="h-5 w-5" /></IconButton>
        <h1 className="text-center font-display text-lg font-bold md:text-2xl">Checkout</h1>
        <div className="h-10 w-10" />
      </div>

      <div className="md:grid md:grid-cols-[1fr_400px] md:gap-8 md:px-8">
        <div className="space-y-5 px-5 pt-3 md:px-0">
          {/* Delivery Address */}
          <Section title="Delivery Address" action={<button onClick={() => setShowAddAddr(true)} className="flex items-center gap-1 text-xs font-bold text-primary"><Plus className="h-3 w-3" /> Add</button>}>
            {!addresses?.length ? (
              <button onClick={() => setShowAddAddr(true)} className="grid w-full place-items-center rounded-2xl border-2 border-dashed border-border py-8 text-sm text-muted-foreground hover:border-primary hover:text-primary">
                <MapPin className="h-6 w-6" />
                <span className="mt-1">Add a delivery address</span>
              </button>
            ) : addresses.map((a) => (
              <button key={a.id} onClick={() => setAddressId(a.id)}
                className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border-2 bg-card p-4 text-left transition ${addressId === a.id ? "border-primary" : "border-transparent hover:border-border"}`}>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><MapPin className="h-5 w-5" /></div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">{a.label ?? "Address"}</div>
                  <div className="truncate text-xs text-muted-foreground">{a.address}</div>
                </div>
                {addressId === a.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
              </button>
            ))}
          </Section>

          {/* Payment Card */}
          <Section title="Payment Method" action={<button onClick={() => setShowAddCard(true)} className="flex items-center gap-1 text-xs font-bold text-primary"><Plus className="h-3 w-3" /> Add card</button>}>
            {!cards?.length ? (
              <button onClick={() => setShowAddCard(true)} className="grid w-full place-items-center rounded-2xl border-2 border-dashed border-border py-8 text-sm text-muted-foreground hover:border-primary hover:text-primary">
                <Plus className="h-6 w-6" />
                <span className="mt-1">Add a payment card</span>
              </button>
            ) : (
              <div className="space-y-3">
                <AtmCard card={selectedCard ?? cards[0]} />
                {cards.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {cards.map((c) => (
                      <button key={c.id} onClick={() => setCardId(c.id)}
                        className={`shrink-0 rounded-full border-2 px-4 py-2 text-xs font-bold transition ${cardId === c.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>
                        •••• {c.last4}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* Items */}
          <Section title={`Order Items (${items?.length ?? 0})`}>
            <div className="space-y-2">
              {items?.map((it: any) => (
                <div key={it.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-card p-3">
                  <div className="h-14 w-14 overflow-hidden rounded-xl bg-muted"><img src={it.product?.image_url ?? ""} alt="" className="h-full w-full object-cover" /></div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold">{it.product?.name}</div>
                    <div className="text-xs text-muted-foreground">Size {it.size} · Qty {it.quantity}</div>
                  </div>
                  <PriceTag value={Number(it.product?.price ?? 0) * it.quantity} size="sm" />
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Summary sidebar */}
        <div className="px-5 pt-5 md:sticky md:top-24 md:h-fit md:px-0">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-display text-lg font-bold">Summary</h3>
            <div className="mt-4 space-y-2 text-sm">
              <Row label="Subtotal" value={<PriceTag value={subtotal} />} />
              <Row label="VAT" value={<PriceTag value={VAT} />} />
              <Row label="Delivery" value={<PriceTag value={DELIVERY} />} />
            </div>
            <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center border-t border-border pt-4">
              <span className="font-display font-bold">Total</span>
              <PriceTag value={total} size="lg" />
            </div>
            {err && <div className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{err}</div>}
            <button disabled={placing || !items?.length} onClick={placeOrder}
              className="mt-5 w-full rounded-full bg-primary py-4 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/30 disabled:opacity-60 hover:shadow-xl transition">
              {placing ? "Placing order..." : `Pay ${formatTotal(total)}`}
            </button>
            <p className="mt-3 text-center text-[10px] text-muted-foreground">Secure checkout · 256-bit encryption</p>
          </div>
        </div>
      </div>

      {showAddCard && <AddCardSheet onClose={() => setShowAddCard(false)} />}
      {showAddAddr && <AddAddressSheet onClose={() => setShowAddAddr(false)} />}
    </AppShell>
  );
}

function Section({ title, action, children }: any) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
        {action}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center">
      <span className="text-muted-foreground">{label}</span>
      <div>{value}</div>
    </div>
  );
}

export function AtmCard({ card }: { card: any }) {
  return (
    <div className="atm-card relative h-52 w-full overflow-hidden rounded-3xl p-6 shadow-2xl shadow-primary/30">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-[0.3em] text-white/70">TM Garbs</div>
        <Wifi className="h-5 w-5 rotate-90 text-white/80" />
      </div>
      <div className="mt-6 h-10 w-12 rounded-md bg-gradient-to-br from-amber-300 to-amber-500" />
      <div className="mt-4 font-mono text-xl tracking-[0.25em] text-white">
        ••••  ••••  ••••  {card?.last4 ?? "0000"}
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto] items-end">
        <div>
          <div className="text-[9px] uppercase tracking-widest text-white/60">Cardholder</div>
          <div className="text-sm font-bold uppercase text-white">{card?.cardholder ?? "Your name"}</div>
        </div>
        <div className="text-right">
          <div className="text-[9px] uppercase tracking-widest text-white/60">Expires</div>
          <div className="text-sm font-bold text-white">{String(card?.exp_month ?? 12).padStart(2, "0")}/{String(card?.exp_year ?? 28).slice(-2)}</div>
        </div>
      </div>
      <div className="absolute -bottom-6 -right-6 text-3xl font-black italic text-white/30">{card?.brand ?? "VISA"}</div>
    </div>
  );
}

export function AddCardSheet({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [exp, setExp] = useState("");
  const [cvv, setCvv] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const last4 = number.replace(/\s/g, "").slice(-4);
  const [m, y] = exp.split("/");

  const save = async () => {
    setErr(null);
    if (last4.length !== 4) { setErr("Enter a valid card number"); return; }
    if (!name || !exp || !cvv) { setErr("Please fill all fields"); return; }
    const brand = number.startsWith("4") ? "VISA" : number.startsWith("5") ? "MASTERCARD" : "CARD";
    await supabase.from("payment_methods").insert({
      user_id: user!.id, cardholder: name, last4, brand,
      exp_month: Number(m) || 12, exp_year: 2000 + (Number(y) || 28),
      is_default: true,
    });
    qc.invalidateQueries({ queryKey: ["cards"] });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-foreground/40 backdrop-blur-sm md:place-items-center" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl bg-background p-6 pb-8 shadow-2xl md:rounded-3xl">
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-muted md:hidden" />
        <h3 className="font-display text-xl font-bold">Add Payment Card</h3>
        <div className="mt-4">
          <AtmCard card={{ cardholder: name || "YOUR NAME", last4: last4 || "0000", exp_month: m || 12, exp_year: y ? 2000 + Number(y) : 2028, brand: number.startsWith("4") ? "VISA" : "CARD" }} />
        </div>
        <div className="mt-5 space-y-3">
          <Input label="Card number" value={number} onChange={(v) => setNumber(v.replace(/[^\d ]/g, "").slice(0, 19))} placeholder="4242 4242 4242 4242" />
          <Input label="Cardholder name" value={name} onChange={setName} placeholder="John Doe" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Expiry (MM/YY)" value={exp} onChange={(v) => setExp(v.slice(0, 5))} placeholder="12/28" />
            <Input label="CVV" value={cvv} onChange={(v) => setCvv(v.slice(0, 4))} placeholder="123" />
          </div>
        </div>
        {err && <div className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</div>}
        <button onClick={save} className="mt-5 w-full rounded-full bg-primary py-4 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/30">
          Save Card
        </button>
      </div>
    </div>
  );
}

export function AddAddressSheet({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [label, setLabel] = useState("Home");
  const [address, setAddress] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    setErr(null);
    if (!address.trim()) { setErr("Please enter an address"); return; }
    await supabase.from("addresses").insert({ user_id: user!.id, label, address, is_default: true });
    qc.invalidateQueries({ queryKey: ["addresses"] });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-foreground/40 backdrop-blur-sm md:place-items-center" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl bg-background p-6 pb-8 shadow-2xl md:rounded-3xl">
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-muted md:hidden" />
        <h3 className="font-display text-xl font-bold">Add Address</h3>
        <div className="mt-5 space-y-3">
          <Input label="Label" value={label} onChange={setLabel} placeholder="Home / Work" />
          <div>
            <label className="text-xs font-bold text-muted-foreground">Full Address</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} placeholder="Street, city, country"
              className="mt-1 w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none focus:border-primary" />
          </div>
        </div>
        {err && <div className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</div>}
        <button onClick={save} className="mt-5 w-full rounded-full bg-primary py-4 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/30">
          Save Address
        </button>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="text-xs font-bold text-muted-foreground">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none focus:border-primary" />
    </div>
  );
}
