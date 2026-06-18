import { formatPrice } from "@/lib/format";

export function PriceTag({ value, size = "md", color = "default" }: { value: number | string; size?: "sm" | "md" | "lg" | "xl"; color?: "default" | "destructive" }) {
  const { whole, cents } = formatPrice(value);
  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
    xl: "text-2xl",
  };
  const cls = color === "destructive" ? "text-destructive" : "text-foreground";
  return (
    <span className={`${sizes[size]} font-bold ${cls}`}>
      {whole}
      <span className="text-[0.65em] align-baseline opacity-70">.{cents}</span>
    </span>
  );
}
