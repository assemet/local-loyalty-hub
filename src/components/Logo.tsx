import { cn } from "@/lib/utils";

/** Fello mark: a stamped circle, the universal symbol of a loyalty card. */
export function Logo({ className, withName = true }: { className?: string; withName?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="brand-gradient flex size-9 items-center justify-center rounded-xl text-primary-foreground shadow-card">
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden fill="none">
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 2.6" />
          <path
            d="M8.5 12.2l2.4 2.4 4.6-5"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {withName ? <span className="font-display text-xl font-bold tracking-tight">Fello</span> : null}
    </span>
  );
}

/** Store avatar: logo image when available, otherwise the store initials. */
export function StoreAvatar({
  name,
  logoUrl,
  className,
}: {
  name: string;
  logoUrl?: string | null;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        loading="lazy"
        className={cn("size-12 shrink-0 rounded-2xl border border-border object-cover", className)}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary font-display text-base font-bold text-secondary-foreground",
        className,
      )}
    >
      {initials || "F"}
    </span>
  );
}
