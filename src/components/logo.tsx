import { cn } from "@/lib/utils";

export function Logo({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  };

  const s = iconSizes[size];

  return (
    <div
      className={cn(
        sizes[size],
        "rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-soft shrink-0",
        className
      )}
    >
      <svg
        width={s}
        height={s}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Fork + Knife abstract mark — represents food/restaurant */}
        {/* Left tine */}
        <rect x="6" y="4" width="2.5" height="14" rx="1.25" fill="white" />
        {/* Middle tine */}
        <rect x="10.5" y="4" width="2.5" height="14" rx="1.25" fill="white" />
        {/* Handle connecting */}
        <rect x="6" y="15" width="7" height="2.5" rx="1.25" fill="white" />
        {/* Stem down */}
        <rect x="8.25" y="15" width="2.5" height="13" rx="1.25" fill="white" />
        {/* Knife blade */}
        <path
          d="M20 4C20 4 23.5 4 23.5 10C23.5 14.5 20 16 20 16L20 4Z"
          fill="white"
          fillOpacity="0.9"
        />
        {/* Knife handle */}
        <rect x="20.5" y="16" width="2.5" height="12" rx="1.25" fill="white" />
      </svg>
    </div>
  );
}

export function LogoText({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <span
      className={cn(
        textSizes[size],
        "font-bold text-foreground tracking-tight",
        className
      )}
    >
      HRH
    </span>
  );
}

export function LogoFull({
  size = "md",
  subtitle,
  className,
}: {
  size?: "sm" | "md" | "lg";
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Logo size={size} />
      <div>
        <LogoText size={size} />
        {subtitle && (
          <span className="block text-[11px] text-muted-foreground font-medium tracking-wide uppercase">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
