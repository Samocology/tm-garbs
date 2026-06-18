import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/order-success/$id")({
  head: () => ({ meta: [{ title: "Order Confirmed — TM GARBS" }] }),
  component: SuccessPage,
});

function SuccessPage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  return (
    <AppShell hideNav>
      <div className="flex min-h-[85vh] flex-col items-center justify-center px-8 text-center">
        <div className="relative">
          <div className="absolute -inset-12 bg-[radial-gradient(circle,oklch(0.55_0.13_50_/_0.2),transparent_60%)]" />
          <div className="grid h-32 w-32 place-items-center rounded-full bg-success/15">
            <div className="grid h-24 w-24 place-items-center rounded-full bg-success text-success-foreground">
              <CheckCircle2 className="h-14 w-14 text-white" strokeWidth={2.5} />
            </div>
          </div>
        </div>
        <h2 className="mt-8 font-display text-2xl font-extrabold">Your Order is on its way</h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Your order has been placed successfully and will arrive within 5 working days.
        </p>
        <div className="mt-8 w-full max-w-md space-y-3">
          <button onClick={() => nav({ to: "/track/$id", params: { id } })}
            className="w-full rounded-full bg-primary py-4 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/30">
            Track Order
          </button>
          <Link to="/home" className="block w-full rounded-full py-4 text-center text-sm font-bold text-primary">
            Back to Shop
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
