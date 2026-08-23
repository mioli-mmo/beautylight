import Image from "next/image";

export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm">
        <Image
          src="/brand/bl-logo.png"
          alt="BL Cosméticos"
          width={44}
          height={44}
          priority
          className="h-full w-full object-cover"
        />
      </div>
      <div className="leading-tight">
        <p className="font-display text-lg font-semibold text-brand-700">
          BL Cosméticos
        </p>
        <p className="text-xs text-ink/60">Controle de vendas</p>
      </div>
    </div>
  );
}