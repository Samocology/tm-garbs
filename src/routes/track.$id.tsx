import { createFileRoute, useRouter, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, CheckCircle2, Loader2, Truck, PackageCheck, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, IconButton } from "@/components/AppShell";
import { format } from "date-fns";

export const Route = createFileRoute("/track/$id")({
  head: () => ({ meta: [{ title: "Track Order — TM GARBS" }] }),
  component: TrackPage,
});

const steps = [
  { key: "ordered", label: "Package Ordered", icon: CheckCircle2 },
  { key: "pickup", label: "Pick-up", icon: Loader2 },
  { key: "in_transit", label: "In transit", icon: Truck },
  { key: "delivered", label: "Delivered", icon: PackageCheck },
];

function TrackPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const nav = useNavigate();

  const { data: order } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*, items:order_items(*)").eq("id", id).single();
      return data;
    },
  });

  const cancel = async () => {
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", id);
    nav({ to: "/home" });
  };

  const currentIdx = steps.findIndex((s) => s.key === order?.status);
  const firstItem = order?.items?.[0];

  return (
    <AppShell hideNav>
      <div className="relative">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 bg-surface px-5 pb-2 pt-6">
          <IconButton onClick={() => router.history.back()}><ChevronLeft className="h-5 w-5" /></IconButton>
          <h1 className="text-center font-display text-lg font-bold">Track Order</h1>
          <div className="h-10 w-10" />
        </div>

        <div className="relative h-72 overflow-hidden bg-[linear-gradient(135deg,oklch(0.94_0.01_60),oklch(0.9_0.015_50))]">
          <svg className="absolute inset-0 h-full w-full opacity-40" viewBox="0 0 400 200" preserveAspectRatio="none">
            <path d="M0 60 Q100 20 200 80 T400 100" stroke="oklch(0.85 0.02 50)" strokeWidth="1.5" fill="none" />
            <path d="M0 120 Q150 80 250 140 T400 160" stroke="oklch(0.85 0.02 50)" strokeWidth="1.5" fill="none" />
            <path d="M50 0 L50 200 M150 0 L150 200 M250 0 L250 200 M350 0 L350 200" stroke="oklch(0.88 0.01 60)" strokeWidth="0.5" />
          </svg>
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 200" preserveAspectRatio="none">
            <path d="M80 50 L160 80 L200 130 L260 160" stroke="oklch(0.38 0.09 50)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="6 4" />
          </svg>
          <div className="absolute left-[18%] top-[22%] grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-white shadow-lg">
            <div className="h-2 w-2 rounded-full bg-white" />
          </div>
          <div className="absolute left-[65%] top-[78%] -translate-x-1/2 -translate-y-1/2">
            <div className="absolute inset-0 -m-3 rounded-full bg-primary/30 animate-ping" />
            <div className="relative h-6 w-6 rounded-full bg-primary shadow-lg" />
          </div>
        </div>
      </div>

      <div className="-mt-6 rounded-t-3xl bg-background px-5 pb-8 pt-6 md:mx-auto md:max-w-2xl">
        {firstItem && (
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-border bg-card p-3">
            <div className="h-14 w-14 overflow-hidden rounded-xl bg-muted">
              {firstItem.image_url ? <img src={firstItem.image_url} alt="" className="h-full w-full object-cover" /> : <Package className="m-auto h-6 w-6 text-primary" />}
            </div>
            <div className="min-w-0">
              <div className="truncate font-bold">{firstItem.name}</div>
              <div className="truncate text-xs text-muted-foreground">{firstItem.brand}</div>
            </div>
          </div>
        )}

        <div className="mt-5 space-y-4">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const done = i <= currentIdx;
            const isCurrent = i === currentIdx;
            return (
              <div key={s.key} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
                <div className={`grid h-8 w-8 place-items-center rounded-full ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  <Icon className={`h-4 w-4 ${isCurrent ? "animate-spin" : ""}`} />
                </div>
                <div>
                  <div className={`font-bold ${done ? "" : "text-muted-foreground"}`}>{s.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {order?.created_at && format(new Date(order.created_at), "do MMM, yyyy | hh:mma")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-7 space-y-2">
          <button onClick={cancel} disabled={order?.status === "cancelled" || order?.status === "delivered"}
            className="w-full rounded-full bg-primary py-4 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/30 disabled:opacity-50">
            {order?.status === "cancelled" ? "Order Cancelled" : "Cancel Order"}
          </button>
          <button onClick={() => router.history.back()} className="w-full py-3 text-center text-sm font-bold text-primary">Close</button>
        </div>
      </div>
    </AppShell>
  );
}
