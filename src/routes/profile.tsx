import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { AtmCard, AddCardSheet, AddAddressSheet } from "./checkout";
import {
  ChevronRight, User2, Globe, Bell, MapPin, CreditCard, FileText, History, Truck, LogOut, ShieldCheck,
  Camera, Trash2, Plus, ArrowLeft,
} from "lucide-react";
import { PriceTag } from "@/components/PriceTag";
import { format } from "date-fns";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — TM GARBS" }] }),
  component: ProfilePage,
});

type Panel =
  | "menu" | "personal" | "language" | "notifications"
  | "addresses" | "payments" | "terms" | "orders" | "track";

function ProfilePage() {
  const { user, loading, isAdmin, signOut } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [panel, setPanel] = useState<Panel>("menu");

  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [user, loading, nav]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).single()).data,
  });

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    const reader = new FileReader();
    reader.onload = async () => {
      await supabase.from("profiles").update({ avatar_url: reader.result as string }).eq("id", user.id);
      qc.invalidateQueries({ queryKey: ["profile"] });
    };
    reader.readAsDataURL(file);
  };

  const general: { icon: any; label: string; panel: Panel }[] = [
    { icon: User2, label: "Personal Details", panel: "personal" },
    { icon: Globe, label: "Language", panel: "language" },
    { icon: Bell, label: "Notifications", panel: "notifications" },
    { icon: MapPin, label: "Saved Addresses", panel: "addresses" },
    { icon: CreditCard, label: "Payment Methods", panel: "payments" },
    { icon: FileText, label: "Terms Of Use", panel: "terms" },
  ];
  const account: { icon: any; label: string; panel: Panel }[] = [
    { icon: History, label: "Order History", panel: "orders" },
    { icon: Truck, label: "Track Order", panel: "track" },
  ];

  if (panel !== "menu") {
    return (
      <AppShell>
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-5 pb-2 pt-6 md:px-8">
          <button onClick={() => setPanel("menu")} className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="truncate text-center font-display text-lg font-bold md:text-2xl">{panelTitle(panel)}</h1>
          <div className="h-10 w-10" />
        </div>
        <div className="mx-auto w-full max-w-2xl px-5 pt-3 md:px-8">
          {panel === "personal" && <PersonalPanel />}
          {panel === "language" && <LanguagePanel />}
          {panel === "notifications" && <NotificationsPanel />}
          {panel === "addresses" && <AddressesPanel />}
          {panel === "payments" && <PaymentsPanel />}
          {panel === "terms" && <TermsPanel />}
          {panel === "orders" && <OrdersPanel />}
          {panel === "track" && <OrdersPanel mode="track" />}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-5 pt-6 text-center md:px-8 md:pt-10">
        <h1 className="font-display text-2xl font-bold md:text-3xl">My Profile</h1>
      </div>

      <div className="mt-4 flex flex-col items-center">
        <div className="relative">
          <div className="grid h-28 w-28 place-items-center overflow-hidden rounded-full bg-primary/10 text-3xl font-bold text-primary ring-4 ring-card md:h-32 md:w-32">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : (profile?.full_name?.[0] ?? "U").toUpperCase()}
          </div>
          <label className="absolute bottom-1 right-1 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:scale-110 transition">
            <Camera className="h-4 w-4" />
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
          </label>
        </div>
        <div className="mt-3 font-display text-lg font-bold">{profile?.full_name ?? user?.email}</div>
        <div className="text-xs text-muted-foreground">{user?.email}</div>
      </div>

      <div className="mx-auto w-full max-w-2xl px-5 pt-7 md:px-8">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">General</h3>
        <div className="overflow-hidden rounded-2xl bg-card">
          {general.map((g, i) => (
            <button key={g.label} onClick={() => setPanel(g.panel)}
              className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/40 transition ${i ? "border-t border-border" : ""}`}>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><g.icon className="h-4 w-4" /></div>
              <span className="font-medium">{g.label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl px-5 pt-5 md:px-8">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Account</h3>
        <div className="overflow-hidden rounded-2xl bg-card">
          {account.map((g, i) => (
            <button key={g.label} onClick={() => setPanel(g.panel)}
              className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/40 transition ${i ? "border-t border-border" : ""}`}>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><g.icon className="h-4 w-4" /></div>
              <span className="font-medium">{g.label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
          {isAdmin && (
            <Link to="/admin" className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t border-border px-4 py-3.5 text-left text-primary hover:bg-primary/5 transition">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck className="h-4 w-4" /></div>
              <span className="font-bold">Admin Dashboard</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
          <button onClick={signOut} className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t border-border px-4 py-3.5 text-left text-destructive hover:bg-destructive/5 transition">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-destructive/10"><LogOut className="h-4 w-4" /></div>
            <span className="font-bold">Sign Out</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function panelTitle(p: Panel) {
  return {
    menu: "Profile", personal: "Personal Details", language: "Language",
    notifications: "Notifications", addresses: "Saved Addresses", payments: "Payment Methods",
    terms: "Terms Of Use", orders: "Order History", track: "Track Orders",
  }[p];
}

function PersonalPanel() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).single()).data,
  });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (profile) { setName(profile.full_name ?? ""); setPhone(profile.phone ?? ""); } }, [profile]);

  const save = async () => {
    await supabase.from("profiles").update({ full_name: name, phone }).eq("id", user!.id);
    qc.invalidateQueries({ queryKey: ["profile"] });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="space-y-3">
      <FieldInput label="Full name" value={name} onChange={setName} />
      <FieldInput label="Email" value={user?.email ?? ""} onChange={() => {}} disabled />
      <FieldInput label="Phone" value={phone} onChange={setPhone} placeholder="+234 ..." />
      <button onClick={save} className="mt-3 w-full rounded-full bg-primary py-3.5 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/30">
        {saved ? "Saved ✓" : "Save changes"}
      </button>
    </div>
  );
}

function LanguagePanel() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).single()).data,
  });
  const langs = ["English", "French", "Spanish", "Portuguese", "Yoruba", "Igbo", "Hausa"];
  const set = async (l: string) => {
    await supabase.from("profiles").update({ language: l }).eq("id", user!.id);
    qc.invalidateQueries({ queryKey: ["profile"] });
  };
  return (
    <div className="overflow-hidden rounded-2xl bg-card">
      {langs.map((l, i) => (
        <button key={l} onClick={() => set(l)}
          className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/40 ${i ? "border-t border-border" : ""}`}>
          <Globe className="h-4 w-4 text-primary" />
          <span className="font-medium">{l}</span>
          {profile?.language === l && <div className="h-2 w-2 rounded-full bg-primary" />}
        </button>
      ))}
    </div>
  );
}

function NotificationsPanel() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).single()).data,
  });
  const toggle = async () => {
    await supabase.from("profiles").update({ notifications_enabled: !profile?.notifications_enabled }).eq("id", user!.id);
    qc.invalidateQueries({ queryKey: ["profile"] });
  };
  const on = !!profile?.notifications_enabled;
  return (
    <div className="rounded-2xl bg-card p-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div>
          <div className="font-bold">Push Notifications</div>
          <div className="text-xs text-muted-foreground">Order updates, drops & promotions</div>
        </div>
        <button onClick={toggle} className={`relative h-7 w-12 rounded-full transition ${on ? "bg-primary" : "bg-muted"}`}>
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${on ? "left-6" : "left-1"}`} />
        </button>
      </div>
    </div>
  );
}

function AddressesPanel() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const { data } = useQuery({
    queryKey: ["addresses", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("addresses").select("*").eq("user_id", user!.id).order("created_at")).data ?? [],
  });
  const del = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["addresses"] });
  };
  return (
    <div className="space-y-3">
      {!data?.length && <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground">No saved addresses</p>}
      {data?.map((a: any) => (
        <div key={a.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-card p-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><MapPin className="h-5 w-5" /></div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">{a.label}</div>
            <div className="truncate text-xs text-muted-foreground">{a.address}</div>
          </div>
          <button onClick={() => del(a.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      <button onClick={() => setAdding(true)} className="grid w-full place-items-center rounded-2xl border-2 border-dashed border-border py-6 text-sm font-bold text-primary hover:border-primary">
        <Plus className="h-5 w-5" />
        <span className="mt-1">Add New Address</span>
      </button>
      {adding && <AddAddressSheet onClose={() => setAdding(false)} />}
    </div>
  );
}

function PaymentsPanel() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const { data } = useQuery({
    queryKey: ["cards", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("payment_methods").select("*").eq("user_id", user!.id).order("created_at")).data ?? [],
  });
  const del = async (id: string) => {
    await supabase.from("payment_methods").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["cards"] });
  };
  return (
    <div className="space-y-4">
      {!data?.length && <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground">No cards saved</p>}
      {data?.map((c: any) => (
        <div key={c.id} className="space-y-2">
          <AtmCard card={c} />
          <button onClick={() => del(c.id)} className="flex items-center gap-2 text-xs font-bold text-destructive">
            <Trash2 className="h-3 w-3" /> Remove card
          </button>
        </div>
      ))}
      <button onClick={() => setAdding(true)} className="grid w-full place-items-center rounded-2xl border-2 border-dashed border-border py-6 text-sm font-bold text-primary hover:border-primary">
        <Plus className="h-5 w-5" />
        <span className="mt-1">Add New Card</span>
      </button>
      {adding && <AddCardSheet onClose={() => setAdding(false)} />}
    </div>
  );
}

function TermsPanel() {
  return (
    <div className="space-y-4 rounded-2xl bg-card p-6 text-sm leading-relaxed text-muted-foreground">
      <p><strong className="text-foreground">Welcome to TM Garbs.</strong> By using our store you agree to the following terms.</p>
      <p><strong className="text-foreground">Orders.</strong> All orders are subject to availability and acceptance. We reserve the right to refuse or cancel any order at our discretion.</p>
      <p><strong className="text-foreground">Returns.</strong> Eligible items may be returned within 7 days of delivery in original condition with tags attached.</p>
      <p><strong className="text-foreground">Privacy.</strong> Your data is stored securely and never shared with third parties without consent.</p>
      <p><strong className="text-foreground">Payments.</strong> All transactions are encrypted and processed via our trusted payment partners.</p>
      <p>For full terms, contact support@tmgarbs.com.</p>
    </div>
  );
}

const statusColors: Record<string, string> = {
  ordered: "bg-blue-100 text-blue-700",
  pickup: "bg-amber-100 text-amber-700",
  in_transit: "bg-indigo-100 text-indigo-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
};

function OrdersPanel({ mode }: { mode?: "track" }) {
  const { user } = useAuth();
  const { data: orders } = useQuery({
    queryKey: ["orders", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("orders").select("*, items:order_items(*)").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });
  const list = mode === "track" ? orders?.filter((o: any) => o.status !== "delivered" && o.status !== "cancelled") : orders;

  if (!list?.length) return <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground">{mode === "track" ? "No active orders" : "No orders yet"}</p>;
  return (
    <div className="space-y-3">
      {list.map((o: any) => (
        <Link key={o.id} to="/track/$id" params={{ id: o.id }}
          className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-card p-3 hover:shadow-md transition">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
            {o.items?.[0]?.image_url && <img src={o.items[0].image_url} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">Order #{o.id.slice(0, 8)}</div>
            <div className="text-xs text-muted-foreground">{format(new Date(o.created_at), "dd MMM yyyy")} • {o.items?.length ?? 0} items</div>
            <div className="mt-1 flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${statusColors[o.status] ?? "bg-muted"}`}>{o.status.replace("_", " ")}</span>
              <PriceTag value={o.total} size="sm" />
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      ))}
    </div>
  );
}

function FieldInput({ label, value, onChange, disabled, placeholder }: any) {
  return (
    <div>
      <label className="text-xs font-bold text-muted-foreground">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder={placeholder}
        className="mt-1 w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none focus:border-primary disabled:opacity-60" />
    </div>
  );
}
