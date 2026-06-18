import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { BrandLogo } from "@/components/BrandLogo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TM GARBS — Premium Men's Clothing & Accessories" },
      { name: "description", content: "Tailored garments, refined essentials. Curated menswear for the modern man." },
    ],
  }),
  component: Landing,
});

const tiles = [
  "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&q=80",
  "https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=600&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
  "https://images.unsplash.com/photo-1492447166138-50c3889fccb1?w=600&q=80",
  "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80",
];

function Landing() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && user) nav({ to: "/home" }); }, [user, loading, nav]);

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto grid min-h-screen w-full max-w-md grid-rows-[1fr_auto] overflow-hidden md:max-w-7xl md:grid-cols-2 md:grid-rows-1">
        <div className="relative h-[55vh] overflow-hidden md:h-screen">
          <div className="grid h-full grid-cols-2 gap-2 p-2 md:grid-cols-3 md:gap-3 md:p-6">
            {tiles.map((src, i) => (
              <div key={i} className={`overflow-hidden rounded-2xl bg-muted ${i === 0 || i === 4 ? "row-span-2" : ""}`}>
                <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </div>

        <div className="relative -mt-8 flex flex-col rounded-t-[2.5rem] bg-background px-7 pb-10 pt-8 shadow-[0_-20px_40px_-12px_rgba(0,0,0,0.1)] md:m-0 md:items-center md:justify-center md:rounded-none md:pt-0">
          <div className="mb-6 flex justify-center md:mb-8">
            <BrandLogo className="h-32 w-32 md:h-40 md:w-40" />
          </div>
          <div className="md:max-w-md md:text-center">
            <div className="text-center font-display text-3xl font-extrabold tracking-widest text-primary md:text-5xl">TM GARBS</div>
            <p className="mt-1 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground md:text-xs">Men Clothing & Accessories</p>
            <h1 className="mt-6 text-center font-display text-2xl font-extrabold leading-tight md:text-4xl">
              Tailored for the <span className="text-primary italic">modern</span> gentleman.
            </h1>
            <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
              Refined essentials, premium fabrics, timeless silhouettes — curated for everyday distinction.
            </p>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="mt-7 flex items-center justify-center rounded-full bg-primary py-4 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98]"
            >
              Get Started
            </Link>
            <p className="mt-4 text-center text-sm text-foreground">
              Already have an account?{" "}
              <Link to="/auth" search={{ mode: "login" }} className="font-bold text-primary underline underline-offset-2">Log In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
