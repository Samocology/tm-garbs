import logoAsset from "@/assets/tm-garbs-logo.png";

export function BrandLogo({ className = "h-28 w-28", showText = false }: { className?: string; showText?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <img src={logoAsset} alt="TM Garbs" className={`${className} object-contain`} />
      {showText && (
        <div className="leading-tight">
          <div className="font-display text-lg font-extrabold tracking-wide text-primary">TM GARBS — Men Clothing & Accessories</div>
        </div>
      )}
    </div>
  );
}
