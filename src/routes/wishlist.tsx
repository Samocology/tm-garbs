import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Heart, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppShell, PageHeader } from "@/components/AppShell";
import { PriceTag } from "@/components/PriceTag";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist — TM GARBS" }] }),
  component: WishlistPage,
});

function WishlistPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [user, loading, nav]);

  const { data } = useQuery({
    queryKey: ["wishlist", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("wishlist").select("*, product:products(*)").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const remove = async (id: string) => {
    await supabase.from("wishlist").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["wishlist"] });
    qc.invalidateQueries({ queryKey: ["wishlist-ids"] });
  };

  return (
    <AppShell>
      <PageHeader title="Wishlist" />
      <div className="px-5 pt-3 md:px-8">
        {!data?.length ? (
          <div className="grid h-[60vh] place-items-center text-center">
            <div>
              <Heart className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 font-bold">No saved items yet</p>
              <Link to="/home" className="mt-4 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground">Browse products</Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5 lg:grid-cols-5">
            {data.map((w: any) => (
              <div key={w.id} className="group relative rounded-2xl bg-card transition hover:shadow-xl hover:shadow-primary/5">
                <button onClick={() => remove(w.id)}
                  className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-destructive backdrop-blur transition hover:scale-110">
                  <X className="h-4 w-4" />
                </button>
                <Link to="/product/$id" params={{ id: w.product?.id }} className="block">
                  <div className="aspect-square overflow-hidden rounded-2xl bg-muted">
                    <img src={w.product?.image_url} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                  </div>
                  <div className="px-2 py-3">
                    <div className="truncate text-sm font-bold">{w.product?.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{w.product?.brand}</div>
                    <PriceTag value={w.product?.price ?? 0} size="sm" />
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
