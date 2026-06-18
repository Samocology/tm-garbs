import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  Package, ShoppingBag, Users, Plus, Pencil, Trash2,
  ArrowLeft, LayoutDashboard, Boxes, ScrollText, LogOut, TrendingUp,
  Search, AlertTriangle, BarChart3, CheckCircle2, Star,
  XCircle, Truck, ArrowUpRight, ArrowDownRight, ShoppingCart,
  ImagePlus, X, Settings, User, Save, Mail, Phone, MapPin,
  Camera, Upload, Globe, Bell, Shield, Lock,
} from "lucide-react";
import { PriceTag } from "@/components/PriceTag";
import { formatTotal } from "@/lib/format";
import { BrandLogo } from "@/components/BrandLogo";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — TM GARBS" }] }),
  component: AdminPage,
});

type Tab = "overview" | "products" | "orders" | "customers" | "settings";

function AdminPage() {
  const { user, signOut } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState<any>(null);
  const [productSearch, setProductSearch] = useState("");
  const [productCatFilter, setProductCatFilter] = useState("all");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const { data: products } = useQuery({
    queryKey: ["admin-products"], enabled: true,
    queryFn: async () => (await supabase.from("products").select("*, category:categories(name)").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: orders } = useQuery({
    queryKey: ["admin-orders"], enabled: true,
    queryFn: async () => (await supabase.from("orders").select("*, items:order_items(*), profile:profiles(full_name)").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: cats } = useQuery({
    queryKey: ["admin-cats"], enabled: true,
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });
  const { data: customers } = useQuery({
    queryKey: ["admin-customers"], enabled: true,
    queryFn: async () => (await supabase.from("profiles").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const revenue = orders?.filter((o: any) => o.status !== "cancelled").reduce((s: number, o: any) => s + Number(o.total), 0) ?? 0;
  const active = orders?.filter((o: any) => o.status !== "delivered" && o.status !== "cancelled").length ?? 0;

  const trendData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthOrders = orders?.filter((o: any) => {
      const d = new Date(o.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }) ?? [];
    const prevMonthOrders = orders?.filter((o: any) => {
      const d = new Date(o.created_at);
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    }) ?? [];

    const currentRevenue = currentMonthOrders.filter((o: any) => o.status !== "cancelled").reduce((s: number, o: any) => s + Number(o.total), 0);
    const prevRevenue = prevMonthOrders.filter((o: any) => o.status !== "cancelled").reduce((s: number, o: any) => s + Number(o.total), 0);
    
    const revTrend = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue * 100) : currentRevenue > 0 ? 100 : 0;
    const orderTrend = prevMonthOrders.length > 0 ? ((currentMonthOrders.length - prevMonthOrders.length) / prevMonthOrders.length * 100) : currentMonthOrders.length > 0 ? 100 : 0;

    const currentActive = currentMonthOrders.filter((o: any) => o.status !== "delivered" && o.status !== "cancelled").length;
    const prevActive = prevMonthOrders.filter((o: any) => o.status !== "delivered" && o.status !== "cancelled").length;
    const activeTrend = prevActive > 0 ? ((currentActive - prevActive) / prevActive * 100) : currentActive > 0 ? 100 : 0;

    return { revenue: revTrend, orders: orderTrend, active: activeTrend };
  }, [orders]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products?.forEach((p: any) => {
      const catName = p.category?.name ?? "Uncategorized";
      counts[catName] = (counts[catName] || 0) + 1;
    });
    return counts;
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = products ?? [];
    if (productCatFilter !== "all") list = list.filter((p: any) => p.category?.name === productCatFilter);
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      list = list.filter((p: any) =>
        p.name.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q) || p.category?.name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, productSearch, productCatFilter]);

  const weeklyRevenue = useMemo(() => {
    const weeks: { label: string; revenue: number }[] = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const weekStart = new Date(d);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekOrders = orders?.filter((o: any) => {
        const od = new Date(o.created_at);
        return od >= weekStart && od <= weekEnd && o.status !== "cancelled";
      }) ?? [];
      
      weeks.push({ label: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`, revenue: weekOrders.reduce((s: number, o: any) => s + Number(o.total), 0) });
    }
    return weeks;
  }, [orders]);

  const maxWeeklyRevenue = Math.max(...weeklyRevenue.map(w => w.revenue), 1);

  const navItems = [
    { id: "overview" as const, icon: LayoutDashboard, label: "Overview" },
    { id: "products" as const, icon: Boxes, label: "Products" },
    { id: "orders" as const, icon: ScrollText, label: "Orders" },
    { id: "customers" as const, icon: Users, label: "Customers" },
    { id: "settings" as const, icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-surface font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important; }
        .font-display { font-family: 'Inter', sans-serif !important; }
      `}</style>
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-background md:flex fixed top-0 left-0 h-screen z-40">
          <Link to="/home" className="flex items-center gap-3 border-b border-border px-6 py-5">
            <BrandLogo className="h-9 w-9" />
            <div className="leading-tight">
              <div className="text-sm font-extrabold tracking-wider text-primary">TM GARBS</div>
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Administration</div>
            </div>
          </Link>
          <nav className="flex-1 space-y-1 p-3">
            {navItems.map((n) => (
              <button key={n.id} onClick={() => setTab(n.id)}
                className={`grid w-full grid-cols-[auto_1fr] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  tab === n.id 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                }`}>
                <n.icon className="h-4 w-4" />
                <span className="text-left">{n.label}</span>
              </button>
            ))}
          </nav>
          <div className="border-t border-border p-3 space-y-1">
            <Link to="/home" className="grid w-full grid-cols-[auto_1fr] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground/70 hover:bg-muted">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-left">Back to shop</span>
            </Link>
            <button onClick={signOut} className="grid w-full grid-cols-[auto_1fr] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10">
              <LogOut className="h-4 w-4" />
              <span className="text-left">Sign out</span>
            </button>
          </div>
        </aside>

        <div className="flex-1 md:ml-64">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-5 py-3 backdrop-blur md:px-8 md:py-5">
            <div className="flex items-center gap-3 md:hidden">
              <Link to="/home" className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card"><ArrowLeft className="h-4 w-4" /></Link>
              <BrandLogo className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold md:text-2xl capitalize tracking-tight">{tab}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{tabDescription(tab)}</p>
            </div>
            <div className="md:hidden">
              <select value={tab} onChange={(e) => setTab(e.target.value as Tab)} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold capitalize">
                {navItems.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
              </select>
            </div>
          </header>

          <main className="px-5 py-6 md:px-8 md:py-8">
            {tab === "overview" && <OverviewTab revenue={revenue} orders={orders} products={products} customers={customers} active={active} trendData={trendData} weeklyRevenue={weeklyRevenue} maxWeeklyRevenue={maxWeeklyRevenue} categoryCounts={categoryCounts} setTab={setTab} setEditing={setEditing} />}
            {tab === "products" && <ProductsTab products={products} cats={cats} filteredProducts={filteredProducts} productSearch={productSearch} setProductSearch={setProductSearch} productCatFilter={productCatFilter} setProductCatFilter={setProductCatFilter} categoryCounts={categoryCounts} setEditing={setEditing} setConfirmDelete={setConfirmDelete} />}
            {tab === "orders" && <OrdersTab orders={orders} orderSearch={orderSearch} setOrderSearch={setOrderSearch} orderStatusFilter={orderStatusFilter} setOrderStatusFilter={setOrderStatusFilter} expandedOrder={expandedOrder} setExpandedOrder={setExpandedOrder} qc={qc} />}
            {tab === "customers" && <CustomersTab customers={customers} />}
            {tab === "settings" && <SettingsTab user={user} />}
          </main>
        </div>
      </div>

      {editing && <ProductEditor product={editing} cats={cats ?? []} onClose={() => { setEditing(null); qc.invalidateQueries(); }} />}
      {confirmDelete && <DeleteConfirm confirmDelete={confirmDelete} setConfirmDelete={setConfirmDelete} qc={qc} />}
    </div>
  );
}

// Overview Tab
function OverviewTab({ revenue, orders, products, customers, active, trendData, weeklyRevenue, maxWeeklyRevenue, categoryCounts, setTab, setEditing }: any) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={NairaIcon} label="Total Revenue" value={formatTotal(revenue)} trend={trendData.revenue} sub="versus previous month" color="emerald" />
        <StatCard icon={ShoppingBag} label="Total Orders" value={String(orders?.length ?? 0)} trend={trendData.orders} sub="versus previous month" color="blue" />
        <StatCard icon={Users} label="Customers" value={String(customers?.length ?? 0)} trend={null} sub="registered accounts" color="violet" />
        <StatCard icon={TrendingUp} label="Active Orders" value={String(active)} trend={trendData.active} sub="versus previous month" color="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="text-base font-extrabold tracking-tight">Weekly Revenue</h3>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Last 8 weeks · Total: {formatTotal(weeklyRevenue.reduce((s: number, w: any) => s + w.revenue, 0))}</p>
            </div>
          </div>
          {weeklyRevenue.every((w: any) => w.revenue === 0) ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl bg-muted/40">
              <BarChart3 className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-semibold text-muted-foreground">No revenue data yet</p>
              <p className="text-xs text-muted-foreground/60">Revenue will appear here once orders are placed</p>
            </div>
          ) : (
            <RevenueChart weeklyRevenue={weeklyRevenue} maxWeeklyRevenue={maxWeeklyRevenue} />
          )}
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-base font-extrabold tracking-tight mb-5">Order Status</h3>
          <OrderStatusBreakdown orders={orders ?? []} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <RecentOrders orders={orders} setTab={setTab} />
        <QuickActionsPanel products={products} setTab={setTab} setEditing={setEditing} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TopProducts products={products} setTab={setTab} />
        <CategoryBreakdown categoryCounts={categoryCounts} products={products} />
      </div>
    </div>
  );
}

function RevenueChart({ weeklyRevenue, maxWeeklyRevenue }: any) {
  return (
    <>
      <div className="mt-5 flex gap-3">
        <div className="flex flex-col justify-between pb-5 text-right" style={{ minWidth: 44 }}>
          {[maxWeeklyRevenue, maxWeeklyRevenue * 0.75, maxWeeklyRevenue * 0.5, maxWeeklyRevenue * 0.25, 0].map((v, i) => (
            <span key={i} className="text-[9px] font-semibold text-muted-foreground/70 leading-none">
              {v === 0 ? "₦0" : v >= 1000 ? `₦${(v / 1000).toFixed(0)}k` : `₦${v.toFixed(0)}`}
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          {[100, 75, 50, 25, 0].map((pct) => (
            <div key={pct} className="pointer-events-none absolute left-0 right-0" style={{ bottom: `calc(${pct * 0.82}% + 20px)` }}>
              <div className={`h-px w-full ${pct === 0 ? "bg-border" : "bg-border/40"}`} />
            </div>
          ))}
          <div className="flex h-44 items-end gap-1.5 pb-5">
            {weeklyRevenue.map((w: any, i: number) => {
              const pct = maxWeeklyRevenue > 0 ? (w.revenue / maxWeeklyRevenue) * 82 : 0;
              const isLatest = i === weeklyRevenue.length - 1;
              const isHighest = w.revenue > 0 && w.revenue === maxWeeklyRevenue;
              const isEmpty = w.revenue === 0;
              return (
                <div key={i} className="group relative flex flex-1 flex-col items-center gap-1 h-full justify-end">
                  <div className="absolute bottom-full mb-1.5 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                    <div className="rounded-xl bg-foreground px-3 py-2 text-center shadow-xl">
                      <div className="text-[11px] font-extrabold text-background whitespace-nowrap">{isEmpty ? "No sales" : formatTotal(w.revenue)}</div>
                      <div className="text-[9px] text-background/60 mt-0.5">Week of {w.label}</div>
                    </div>
                    <div className="h-2 w-2 rotate-45 bg-foreground -mt-1" />
                  </div>
                  <div className={`w-full rounded-t-lg transition-all duration-700 ${isEmpty ? "bg-muted" : isLatest ? "bg-primary shadow-lg shadow-primary/25" : isHighest ? "bg-primary/85" : "bg-primary/45 group-hover:bg-primary/70"}`} style={{ height: `${Math.max(pct, isEmpty ? 4 : 6)}%` }} />
                  <span className="text-[8px] font-medium text-muted-foreground whitespace-nowrap">{w.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border">
        <div className="px-4 py-3 text-center"><div className="text-xs font-extrabold">{formatTotal(maxWeeklyRevenue)}</div><div className="text-[10px] text-muted-foreground mt-0.5">Best week</div></div>
        <div className="px-4 py-3 text-center"><div className="text-xs font-extrabold">{formatTotal(weeklyRevenue.reduce((s: number, w: any) => s + w.revenue, 0) / Math.max(weeklyRevenue.filter((w: any) => w.revenue > 0).length, 1))}</div><div className="text-[10px] text-muted-foreground mt-0.5">Average / week</div></div>
        <div className="px-4 py-3 text-center"><div className="text-xs font-extrabold">{formatTotal(weeklyRevenue.reduce((s: number, w: any) => s + w.revenue, 0))}</div><div className="text-[10px] text-muted-foreground mt-0.5">8-week total</div></div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-3.5 rounded-sm bg-primary shadow-sm shadow-primary/30" /> This week</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-3.5 rounded-sm bg-primary/45" /> Past weeks</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-3.5 rounded-sm bg-muted border border-border" /> No sales</span>
      </div>
    </>
  );
}

function RecentOrders({ orders, setTab }: any) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-extrabold tracking-tight">Recent Orders</h3>
        <button onClick={() => setTab("orders")} className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
          View all <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>
      <div className="space-y-2">
        {orders?.slice(0, 6).map((o: any) => (
          <div key={o.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-2xl bg-muted/40 px-3 py-2.5 hover:bg-muted/70 transition">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary text-xs font-extrabold shrink-0">{(o.profile?.full_name?.[0] ?? "?").toUpperCase()}</div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">{o.profile?.full_name ?? "Customer"}</div>
              <div className="text-[10px] text-muted-foreground">#{o.id.slice(0, 8)} · {o.items?.length ?? 0} item{o.items?.length !== 1 ? "s" : ""} · {new Date(o.created_at).toLocaleDateString()}</div>
            </div>
            <OrderStatusBadge status={o.status} />
            <div className="text-sm font-extrabold text-primary shrink-0">{formatTotal(Number(o.total))}</div>
          </div>
        ))}
        {!orders?.length && <p className="py-6 text-center text-sm text-muted-foreground">No orders yet</p>}
      </div>
    </div>
  );
}

function QuickActionsPanel({ products, setTab, setEditing }: any) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-base font-extrabold tracking-tight mb-4">Quick Actions</h3>
      <div className="space-y-2">
        <QuickAction icon={Plus} label="Add new product" onClick={() => { setTab("products"); setEditing({}); }} color="primary" />
        <QuickAction icon={ScrollText} label="View all orders" onClick={() => setTab("orders")} color="blue" />
        <QuickAction icon={Users} label="Browse customers" onClick={() => setTab("customers")} color="violet" />
        <QuickAction icon={Boxes} label="Manage catalog" onClick={() => setTab("products")} color="amber" />
      </div>
      {(products?.filter((p: any) => p.stock <= 5).length ?? 0) > 0 && (
        <div className="mt-5 rounded-2xl bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-extrabold text-amber-700">Low Stock Alert</span>
          </div>
          <div className="space-y-1.5">
            {products?.filter((p: any) => p.stock <= 5).slice(0, 3).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between text-xs">
                <span className="truncate font-semibold text-amber-800">{p.name}</span>
                <span className="ml-2 shrink-0 font-bold text-amber-600">{p.stock} left</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TopProducts({ products, setTab }: any) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-extrabold tracking-tight">Top Products</h3>
        <button onClick={() => setTab("products")} className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">Manage <ArrowUpRight className="h-3 w-3" /></button>
      </div>
      <div className="space-y-3">
        {products?.slice(0, 6).map((p: any, i: number) => (
          <div key={p.id} className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3">
            <span className="text-xs font-extrabold text-muted-foreground w-4">{i + 1}</span>
            <div className="h-10 w-10 overflow-hidden rounded-xl bg-muted shrink-0"><img src={p.image_url ?? ""} alt="" className="h-full w-full object-cover" /></div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">{p.name}</div>
              <div className="mt-0.5 flex items-center gap-1">
                <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${p.stock <= 5 ? "bg-red-500" : p.stock <= 20 ? "bg-amber-400" : "bg-emerald-500"}`} style={{ width: `${Math.min((p.stock / 100) * 100, 100)}%` }} />
                </div>
                <span className={`text-[10px] font-bold shrink-0 ${p.stock <= 5 ? "text-red-600" : p.stock <= 20 ? "text-amber-600" : "text-emerald-600"}`}>{p.stock}</span>
              </div>
            </div>
            <PriceTag value={p.price} size="sm" />
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryBreakdown({ categoryCounts, products }: any) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-base font-extrabold tracking-tight mb-4">Products by Category</h3>
      <div className="space-y-3">
        {Object.entries(categoryCounts).sort(([, a]: any, [, b]: any) => b - a).map(([cat, count]: any) => {
          const total = products?.length ?? 1;
          const pct = Math.round((count / total) * 100);
          return (
            <div key={cat}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold">{cat}</span>
                <span className="text-xs text-muted-foreground">{count} · {pct}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
        {Object.keys(categoryCounts).length === 0 && <p className="text-sm text-muted-foreground">No categories yet</p>}
      </div>
    </div>
  );
}

// Products Tab
function ProductsTab({ products, cats, filteredProducts, productSearch, setProductSearch, productCatFilter, setProductCatFilter, categoryCounts, setEditing, setConfirmDelete }: any) {
  const total = products?.length ?? 0;
  const lowStock = products?.filter((p: any) => p.stock > 0 && p.stock <= 10).length ?? 0;
  const outOfStock = products?.filter((p: any) => p.stock === 0).length ?? 0;
  const featured = products?.filter((p: any) => p.is_featured).length ?? 0;
  
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[{ icon: Boxes, label: "Total Products", value: total, sub: "in catalog", accent: "bg-primary", iconBg: "bg-primary/10", iconColor: "text-primary", bar: "bg-primary", pct: 100 },
          { icon: AlertTriangle, label: "Low Stock", value: lowStock, sub: total ? `${Math.round((lowStock/total)*100)}% of catalog` : "—", accent: "bg-amber-400", iconBg: "bg-amber-50", iconColor: "text-amber-600", bar: "bg-amber-400", pct: total ? (lowStock/total)*100 : 0 },
          { icon: XCircle, label: "Out of Stock", value: outOfStock, sub: total ? `${Math.round((outOfStock/total)*100)}% of catalog` : "—", accent: "bg-red-500", iconBg: "bg-red-50", iconColor: "text-red-500", bar: "bg-red-500", pct: total ? (outOfStock/total)*100 : 0 },
          { icon: Star, label: "Featured", value: featured, sub: total ? `${Math.round((featured/total)*100)}% of catalog` : "—", accent: "bg-violet-500", iconBg: "bg-violet-50", iconColor: "text-violet-600", bar: "bg-violet-500", pct: total ? (featured/total)*100 : 0 }
        ].map((s) => (
          <div key={s.label} className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className={`absolute inset-x-0 top-0 h-1 ${s.accent}`} />
            <div className="flex items-start justify-between">
              <div className={`grid h-9 w-9 place-items-center rounded-xl ${s.iconBg}`}><s.icon className={`h-4 w-4 ${s.iconColor}`} /></div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.iconBg} ${s.iconColor}`}>{s.value}</span>
            </div>
            <div className="mt-3 text-3xl font-extrabold tracking-tight">{s.value}</div>
            <div className="mt-0.5 text-xs font-semibold text-foreground/80">{s.label}</div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">{s.sub}</div>
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full transition-all duration-700 ${s.bar}`} style={{ width: `${Math.min(s.pct, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search by name, brand or category…" value={productSearch} onChange={(e) => setProductSearch(e.target.value)}
            className="w-full rounded-full border border-input bg-card pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary transition" />
        </div>
        <button onClick={() => setEditing({})} className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl transition whitespace-nowrap">
          <Plus className="h-4 w-4" /> New Product
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setProductCatFilter("all")} className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${productCatFilter === "all" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>All ({products?.length ?? 0})</button>
        {Object.entries(categoryCounts).sort(([,a]: any,[,b]: any) => b - a).map(([cat, count]: any) => (
          <button key={cat} onClick={() => setProductCatFilter(productCatFilter === cat ? "all" : cat)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${productCatFilter === cat ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{cat} ({count})</button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">Showing {filteredProducts?.length ?? 0} of {products?.length ?? 0} products{productSearch && ` · "${productSearch}"`}{productCatFilter !== "all" && ` · ${productCatFilter}`}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts?.map((p: any) => (
          <div key={p.id} className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition hover:shadow-xl hover:-translate-y-0.5">
            <div className="relative aspect-square overflow-hidden bg-muted">
              <img src={p.image_url} alt={p.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {p.is_featured && <span className="flex items-center gap-1 rounded-full bg-violet-500 px-2 py-0.5 text-[10px] font-bold text-white"><Star className="h-2.5 w-2.5" /> Featured</span>}
                {p.stock === 0 && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">Out of Stock</span>}
                {p.stock > 0 && p.stock <= 10 && <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white"><AlertTriangle className="h-2.5 w-2.5" /> Low Stock</span>}
              </div>
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-foreground/40 opacity-0 group-hover:opacity-100 transition backdrop-blur-[2px]">
                <button onClick={() => setEditing(p)} className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-foreground shadow-lg hover:bg-primary hover:text-primary-foreground transition"><Pencil className="h-3 w-3" /> Edit</button>
                <button onClick={() => setConfirmDelete(p.id)} className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-destructive shadow-lg hover:bg-destructive hover:text-white transition"><Trash2 className="h-3 w-3" /> Delete</button>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2 p-3">
              <div>
                <div className="flex items-start justify-between gap-1"><span className="font-bold leading-snug line-clamp-2 text-sm flex-1">{p.name}</span><PriceTag value={p.price} size="sm" /></div>
                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  {p.brand && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{p.brand}</span>}
                  {p.category?.name && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{p.category.name}</span>}
                </div>
              </div>
              <div className="mt-auto">
                <div className="flex items-center justify-between mb-1"><span className="text-[10px] text-muted-foreground font-medium">Stock</span><span className={`text-[10px] font-extrabold ${p.stock === 0 ? "text-red-600" : p.stock <= 10 ? "text-amber-600" : "text-emerald-600"}`}>{p.stock} units</span></div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden"><div className={`h-full rounded-full transition-all ${p.stock === 0 ? "bg-red-500" : p.stock <= 10 ? "bg-amber-400" : "bg-emerald-500"}`} style={{ width: `${Math.min((p.stock / 100) * 100, 100)}%` }} /></div>
              </div>
              <div className="flex gap-1.5 pt-1">
                <button onClick={() => setEditing(p)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-muted py-2 text-xs font-bold hover:bg-primary hover:text-primary-foreground transition"><Pencil className="h-3 w-3" /> Edit</button>
                <button onClick={() => setConfirmDelete(p.id)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-destructive/10 py-2 text-xs font-bold text-destructive hover:bg-destructive hover:text-white transition"><Trash2 className="h-3 w-3" /> Delete</button>
              </div>
            </div>
          </div>
        ))}
        {!filteredProducts?.length && (
          <div className="col-span-full flex flex-col items-center gap-3 py-16 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-muted"><Package className="h-7 w-7 text-muted-foreground" /></div>
            <p className="text-sm font-semibold text-muted-foreground">{productSearch || productCatFilter !== "all" ? "No products match your filters" : "No products yet"}</p>
            {!productSearch && productCatFilter === "all" && <button onClick={() => setEditing({})} className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground">Add your first product</button>}
          </div>
        )}
      </div>
    </div>
  );
}

// Orders Tab
function OrdersTab({ orders, orderSearch, setOrderSearch, orderStatusFilter, setOrderStatusFilter, expandedOrder, setExpandedOrder, qc }: any) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(["all", "ordered", "in_transit", "delivered", "cancelled"] as const).map((s) => {
          const count = s === "all" ? (orders?.length ?? 0) : (orders?.filter((o: any) => o.status === s).length ?? 0);
          const colorMap: Record<string, string> = {
            all: "border-border bg-card",
            ordered: "border-blue-200 bg-blue-50",
            in_transit: "border-violet-200 bg-violet-50",
            delivered: "border-emerald-200 bg-emerald-50",
            cancelled: "border-red-200 bg-red-50",
          };
          const textMap: Record<string, string> = {
            all: "text-foreground",
            ordered: "text-blue-700",
            in_transit: "text-violet-700",
            delivered: "text-emerald-700",
            cancelled: "text-red-600",
          };
          return (
            <button key={s} onClick={() => setOrderStatusFilter(s)}
              className={`rounded-2xl border px-4 py-3 text-left transition hover:opacity-80 ${orderStatusFilter === s ? "ring-2 ring-primary ring-offset-1" : ""} ${colorMap[s]}`}>
              <div className={`text-xl font-extrabold ${textMap[s]}`}>{count}</div>
              <div className={`text-xs mt-0.5 capitalize font-medium ${textMap[s]} opacity-80`}>{s === "all" ? "All Orders" : s.replace("_", " ")}</div>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input type="text" placeholder="Search by order ID or customer name…" value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)}
          className="w-full rounded-full border border-input bg-card pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary transition" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="hidden grid-cols-[1fr_1fr_1.5fr_auto_auto_auto] gap-4 border-b border-border px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground md:grid">
          <span>Order</span><span>Customer</span><span>Address</span><span>Items</span><span>Status</span><span>Total</span>
        </div>
        {(() => {
          const filtered = (orders ?? []).filter((o: any) => {
            if (orderStatusFilter !== "all" && o.status !== orderStatusFilter) return false;
            if (orderSearch.trim()) {
              const q = orderSearch.toLowerCase();
              return o.id.toLowerCase().includes(q) || o.profile?.full_name?.toLowerCase().includes(q);
            }
            return true;
          });
          return filtered.length ? filtered.map((o: any) => (
            <div key={o.id} className="border-b border-border last:border-0">
              <div className="grid grid-cols-2 gap-3 px-5 py-4 hover:bg-muted/30 cursor-pointer md:grid-cols-[1fr_1fr_1.5fr_auto_auto_auto] md:items-center" onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}>
                <div>
                  <div className="text-sm font-bold font-mono">#{o.id.slice(0, 8)}</div>
                  <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</div>
                </div>
                <div className="text-sm font-semibold">{o.profile?.full_name ?? "—"}</div>
                <div className="hidden truncate text-xs text-muted-foreground md:block">{o.delivery_address ?? "—"}</div>
                <div className="hidden text-xs font-bold text-muted-foreground md:block">{o.items?.length ?? 0} item{o.items?.length !== 1 ? "s" : ""}</div>
                <div onClick={(e) => e.stopPropagation()}>
                  <select value={o.status} onChange={async (e) => { await supabase.from("orders").update({ status: e.target.value as any }).eq("id", o.id); qc.invalidateQueries(); }}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold capitalize cursor-pointer ${{
                      ordered: "border-blue-200 bg-blue-50 text-blue-700", pickup: "border-yellow-200 bg-yellow-50 text-yellow-700",
                      in_transit: "border-violet-200 bg-violet-50 text-violet-700", delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
                      cancelled: "border-red-200 bg-red-50 text-red-600" }[o.status as string] ?? "border-input bg-background"
                    }`}>
                    <option value="ordered">Ordered</option>
                    <option value="pickup">Pickup</option>
                    <option value="in_transit">In transit</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <PriceTag value={o.total} size="sm" />
              </div>
              {expandedOrder === o.id && (
                <div className="border-t border-border bg-muted/20 px-5 py-4">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Order Items</div>
                  <div className="space-y-2">
                    {o.items?.length ? o.items.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{item.product_name ?? `Product #${item.product_id?.slice(0,6)}`}</span>
                          {item.size && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{item.size}</span>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>x{item.quantity}</span>
                          <span className="font-bold text-foreground">{formatTotal(Number(item.price) * item.quantity)}</span>
                        </div>
                      </div>
                    )) : <p className="text-xs text-muted-foreground">No item details available</p>}
                  </div>
                  {o.delivery_address && (
                    <div className="mt-3 rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                      <span className="font-bold text-foreground">Delivery: </span>{o.delivery_address}
                    </div>
                  )}
                </div>
              )}
            </div>
          )) : (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-muted"><ScrollText className="h-7 w-7 text-muted-foreground" /></div>
              <p className="text-sm font-semibold text-muted-foreground">{orderSearch || orderStatusFilter !== "all" ? "No orders match your filters" : "No orders yet"}</p>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// Customers Tab
function CustomersTab({ customers }: any) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="hidden grid-cols-[auto_1fr_1fr_auto] gap-4 border-b border-border px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground md:grid">
        <span>Avatar</span><span>Name</span><span>Phone</span><span>Joined</span>
      </div>
      {customers?.map((c: any) => (
        <div key={c.id} className="grid grid-cols-[auto_1fr_auto] gap-3 border-b border-border px-5 py-4 last:border-0 md:grid-cols-[auto_1fr_1fr_auto] md:items-center">
          <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-primary/10 text-sm font-bold text-primary">
            {c.avatar_url ? <img src={c.avatar_url} alt="" className="h-full w-full object-cover" /> : (c.full_name?.[0] ?? "U").toUpperCase()}
          </div>
          <div className="text-sm font-bold">{c.full_name ?? "—"}</div>
          <div className="hidden text-xs text-muted-foreground md:block">{c.phone ?? "—"}</div>
          <div className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</div>
        </div>
      ))}
      {!customers?.length && <p className="px-5 py-8 text-center text-sm text-muted-foreground">No customers yet</p>}
    </div>
  );
}

// Settings Tab
function SettingsTab({ user }: any) {
  const [settingsTab, setSettingsTab] = useState<"profile" | "store" | "security">("profile");
  const [profileForm, setProfileForm] = useState({
    full_name: user?.user_metadata?.full_name ?? "",
    email: user?.email ?? "",
    phone: "",
    avatar_url: "",
  });
  const [storeForm, setStoreForm] = useState({
    store_name: "TM GARBS",
    currency: "NGN",
    timezone: "Africa/Lagos",
    language: "English",
  });
  const [securityForm, setSecurityForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const saveProfile = async () => {
    setSaving(true);
    setMessage(null);
    await new Promise(r => setTimeout(r, 800));
    setMessage({ type: "success", text: "Profile updated successfully" });
    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const saveStore = async () => {
    setSaving(true);
    setMessage(null);
    await new Promise(r => setTimeout(r, 800));
    setMessage({ type: "success", text: "Store settings updated successfully" });
    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const saveSecurity = async () => {
    setSaving(true);
    setMessage(null);
    if (securityForm.new_password !== securityForm.confirm_password) {
      setMessage({ type: "error", text: "Passwords do not match" });
      setSaving(false);
      return;
    }
    await new Promise(r => setTimeout(r, 800));
    setMessage({ type: "success", text: "Password changed successfully" });
    setSecurityForm({ current_password: "", new_password: "", confirm_password: "" });
    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex gap-1 rounded-2xl bg-muted p-1">
        {[
          { id: "profile" as const, icon: User, label: "Profile" },
          { id: "store" as const, icon: Globe, label: "Store" },
          { id: "security" as const, icon: Shield, label: "Security" },
        ].map((s) => (
          <button key={s.id} onClick={() => setSettingsTab(s.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              settingsTab === s.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            <s.icon className="h-4 w-4" />
            {s.label}
          </button>
        ))}
      </div>

      {message && (
        <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {settingsTab === "profile" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-primary/10 overflow-hidden">
                {profileForm.avatar_url ? <img src={profileForm.avatar_url} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-2xl font-extrabold text-primary">{(profileForm.full_name?.[0] ?? "U").toUpperCase()}</div>}
              </div>
              <button className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition">
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">{profileForm.full_name || "Admin User"}</h2>
              <p className="text-xs text-muted-foreground">{profileForm.email}</p>
            </div>
          </div>
          <div className="space-y-4">
            <SettingsInput icon={User} label="Full Name" value={profileForm.full_name} onChange={(v) => setProfileForm({ ...profileForm, full_name: v })} placeholder="Enter your full name" />
            <SettingsInput icon={Mail} label="Email Address" value={profileForm.email} onChange={(v) => setProfileForm({ ...profileForm, email: v })} type="email" placeholder="Enter your email" />
            <SettingsInput icon={Phone} label="Phone Number" value={profileForm.phone} onChange={(v) => setProfileForm({ ...profileForm, phone: v })} placeholder="Enter your phone number" />
          </div>
          <button onClick={saveProfile} disabled={saving} className="mt-6 flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl transition disabled:opacity-60">
            {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      )}

      {settingsTab === "store" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-extrabold tracking-tight mb-6">Store Settings</h2>
          <div className="space-y-4">
            <SettingsInput icon={Globe} label="Store Name" value={storeForm.store_name} onChange={(v) => setStoreForm({ ...storeForm, store_name: v })} placeholder="Enter store name" />
            <div>
              <label className="text-xs font-bold text-muted-foreground">Currency</label>
              <select value={storeForm.currency} onChange={(e) => setStoreForm({ ...storeForm, currency: e.target.value })} className="mt-1 w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none">
                <option value="NGN">₦ Naira (NGN)</option>
                <option value="USD">$ US Dollar (USD)</option>
                <option value="EUR">€ Euro (EUR)</option>
                <option value="GBP">£ British Pound (GBP)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground">Timezone</label>
              <select value={storeForm.timezone} onChange={(e) => setStoreForm({ ...storeForm, timezone: e.target.value })} className="mt-1 w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none">
                <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
                <option value="Africa/Nairobi">Africa/Nairobi (GMT+3)</option>
                <option value="America/New_York">America/New York (GMT-5)</option>
                <option value="Europe/London">Europe/London (GMT+0)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground">Language</label>
              <select value={storeForm.language} onChange={(e) => setStoreForm({ ...storeForm, language: e.target.value })} className="mt-1 w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none">
                <option value="English">English</option>
                <option value="French">French</option>
                <option value="Spanish">Spanish</option>
              </select>
            </div>
          </div>
          <button onClick={saveStore} disabled={saving} className="mt-6 flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl transition disabled:opacity-60">
            {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Save className="h-4 w-4" />}
            Save Settings
          </button>
        </div>
      )}

      {settingsTab === "security" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-extrabold tracking-tight mb-6">Security</h2>
          <div className="space-y-4">
            <SettingsInput icon={Lock} label="Current Password" value={securityForm.current_password} onChange={(v) => setSecurityForm({ ...securityForm, current_password: v })} type="password" placeholder="Enter current password" />
            <SettingsInput icon={Lock} label="New Password" value={securityForm.new_password} onChange={(v) => setSecurityForm({ ...securityForm, new_password: v })} type="password" placeholder="Enter new password" />
            <SettingsInput icon={Lock} label="Confirm New Password" value={securityForm.confirm_password} onChange={(v) => setSecurityForm({ ...securityForm, confirm_password: v })} type="password" placeholder="Confirm new password" />
          </div>
          <button onClick={saveSecurity} disabled={saving} className="mt-6 flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl transition disabled:opacity-60">
            {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Save className="h-4 w-4" />}
            Update Password
          </button>
        </div>
      )}
    </div>
  );
}

function SettingsInput({ icon: Icon, label, value, onChange, type = "text", placeholder }: { icon: any; label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-bold text-muted-foreground">{label}</label>
      <div className="relative mt-1">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full rounded-2xl border border-input bg-card pl-10 pr-4 py-3 text-sm outline-none focus:border-primary transition" />
      </div>
    </div>
  );
}

// Shared Components
function OrderStatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    ordered: "bg-blue-100 text-blue-700 border-blue-200",
    pickup: "bg-yellow-100 text-yellow-700 border-yellow-200",
    in_transit: "bg-purple-100 text-purple-700 border-purple-200",
    delivered: "bg-green-100 text-green-700 border-green-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
  };
  const colors = colorMap[status] ?? "bg-gray-100 text-gray-700 border-gray-200";
  return <span className={`rounded-full border px-2 py-1 text-[10px] font-bold capitalize ${colors}`}>{status.replace("_", " ")}</span>;
}

function tabDescription(t: Tab) {
  const map: Record<Tab, string> = {
    overview: "Store performance at a glance",
    products: "Manage your product catalog",
    orders: "Process and track customer orders",
    customers: "View registered customers",
    settings: "Configure your store and profile",
  };
  return map[t];
}

function NairaIcon({ className }: { className?: string }) {
  return <span className={`font-extrabold leading-none ${className ?? ""}`}>₦</span>;
}

function StatCard({ icon: Icon, label, value, trend, sub, color }: { icon: any; label: string; value: string; trend: number | null; sub: string; color: "emerald" | "blue" | "violet" | "amber" }) {
  const colorMap = {
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", icon: "text-emerald-600" },
    blue: { bg: "bg-blue-50", text: "text-blue-600", icon: "text-blue-600" },
    violet: { bg: "bg-violet-50", text: "text-violet-600", icon: "text-violet-600" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", icon: "text-amber-600" },
  }[color];
  const trendUp = (trend ?? 0) >= 0;
  const TrendIcon = trendUp ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`grid h-11 w-11 place-items-center rounded-2xl ${colorMap.bg}`}><Icon className={`h-5 w-5 ${colorMap.icon}`} /></div>
        {trend !== null && (
          <div className={`flex items-center gap-0.5 rounded-full px-2 py-1 text-[10px] font-bold ${trendUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
            <TrendIcon className="h-3 w-3" />{Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="mt-4 text-2xl font-extrabold tracking-tight">{value}</div>
      <div className="mt-0.5 text-sm font-semibold text-foreground/80">{label}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function OrderStatusBreakdown({ orders }: { orders: any[] }) {
  const statuses = ["ordered", "pickup", "in_transit", "delivered", "cancelled"] as const;
  const icons: Record<string, any> = { ordered: ShoppingCart, pickup: Package, in_transit: Truck, delivered: CheckCircle2, cancelled: XCircle };
  const colors: Record<string, any> = {
    ordered: { bar: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700" },
    pickup: { bar: "bg-yellow-400", bg: "bg-yellow-50", text: "text-yellow-700" },
    in_transit: { bar: "bg-violet-500", bg: "bg-violet-50", text: "text-violet-700" },
    delivered: { bar: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
    cancelled: { bar: "bg-red-400", bg: "bg-red-50", text: "text-red-600" },
  };
  const total = orders.length || 1;
  return (
    <div className="space-y-3">
      {statuses.map((s) => {
        const count = orders.filter((o: any) => o.status === s).length;
        const pct = Math.round((count / total) * 100);
        const StatusIcon = icons[s];
        return (
          <div key={s}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className={`grid h-6 w-6 place-items-center rounded-lg ${colors[s].bg}`}><StatusIcon className={`h-3.5 w-3.5 ${colors[s].text}`} /></div>
                <span className="text-xs font-semibold capitalize">{s.replace("_", " ")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{count}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${colors[s].bg} ${colors[s].text}`}>{pct}%</span>
              </div>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${colors[s].bar}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
      {orders.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No orders yet</p>}
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick, color }: { icon: any; label: string; onClick: () => void; color: string }) {
  const colorMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground",
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white",
    violet: "bg-violet-50 text-violet-600 hover:bg-violet-500 hover:text-white",
    amber: "bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white",
  };
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${colorMap[color] ?? colorMap.primary}`}>
      <Icon className="h-4 w-4 shrink-0" />{label}
    </button>
  );
}

function ProductEditor({ product, cats, onClose }: { product: any; cats: any[]; onClose: () => void }) {
  const isNew = !product.id;
  const [form, setForm] = useState({
    name: product.name ?? "", brand: product.brand ?? "", description: product.description ?? "",
    price: product.price ?? 0, category_id: product.category_id ?? cats[0]?.id ?? "",
    stock: product.stock ?? 100, is_featured: product.is_featured ?? false,
  });
  const [previews, setPreviews] = useState<{ url: string; file?: File }[]>(product.image_url ? [{ url: product.image_url }] : []);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setPreviews((prev) => [...prev, ...Array.from(files).map((file) => ({ url: URL.createObjectURL(file), file }))]);
  };

  const publish = async () => {
    setErr(null);
    setUploading(true);
    try {
      let imageUrl = product.image_url ?? "";
      const filesToUpload = previews.filter((p) => p.file);
      if (filesToUpload.length > 0) {
        const uploaded: string[] = [];
        for (const p of filesToUpload) {
          const ext = p.file!.name.split(".").pop();
          const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error: upErr } = await supabase.storage.from("product-images").upload(path, p.file!);
          if (upErr) throw new Error(upErr.message);
          const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
          uploaded.push(publicUrl);
        }
        imageUrl = [...previews.filter((p) => !p.file).map((p) => p.url), ...uploaded][0] ?? "";
      } else if (previews.length > 0) {
        imageUrl = previews[0].url;
      }
      const payload = { ...form, image_url: imageUrl };
      if (product.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", product.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw new Error(error.message);
      }
      onClose();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-background p-6 shadow-2xl">
        <h3 className="text-xl font-extrabold tracking-tight">{isNew ? "New Product" : "Edit Product"}</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-bold text-muted-foreground">Photos</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {previews.map((p, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
                  <img src={p.url} alt="" className="h-full w-full object-cover" />
                  {i === 0 && <span className="absolute bottom-1 left-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white">Cover</span>}
                  <button type="button" onClick={() => setPreviews((prev) => prev.filter((_, idx) => idx !== i))} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white hover:bg-destructive transition"><X className="h-3 w-3" /></button>
                </div>
              ))}
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-border bg-muted/40 hover:border-primary hover:bg-primary/5 transition">
                <ImagePlus className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] font-semibold text-muted-foreground">Add photos</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
              </label>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">First photo is the cover image shown to customers</p>
          </div>
          <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Input label="Brand" value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Price (₦)" type="number" value={String(form.price)} onChange={(v) => setForm({ ...form, price: Number(v) })} />
            <Input label="Stock" type="number" value={String(form.stock)} onChange={(v) => setForm({ ...form, stock: Number(v) })} />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground">Category</label>
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="mt-1 w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none">
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1 w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none" />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="rounded" />
            Featured product
          </label>
        </div>
        {err && <div className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive font-semibold">{err}</div>}
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} disabled={uploading} className="flex-1 rounded-full bg-muted py-3 text-sm font-bold disabled:opacity-50">Cancel</button>
          <button onClick={publish} disabled={uploading} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/30 disabled:opacity-60">
            {uploading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Uploading…</> : isNew ? "Publish" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirm({ confirmDelete, setConfirmDelete, qc }: { confirmDelete: string; setConfirmDelete: (v: null) => void; qc: any }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl">
        <h3 className="text-lg font-extrabold tracking-tight">Delete Product?</h3>
        <p className="mt-2 text-sm text-muted-foreground">This action cannot be undone. The product will be permanently removed from your catalog.</p>
        <div className="mt-5 flex gap-2">
          <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-full bg-muted py-3 text-sm font-bold">Cancel</button>
          <button onClick={async () => { await supabase.from("products").delete().eq("id", confirmDelete); setConfirmDelete(null); qc.invalidateQueries(); }} className="flex-1 rounded-full bg-destructive py-3 text-sm font-bold text-white">Delete</button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs font-bold text-muted-foreground">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none focus:border-primary transition" />
    </div>
  );
}