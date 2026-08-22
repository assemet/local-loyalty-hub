import { cn } from "@/lib/utils";

/** Visual stamp card: filled dots for collected stamps, empty for remaining. */
export function StampRow({
  current,
  total,
  className,
}: {
  current: number;
  total: number;
  className?: string;
}) {
  const capped = Math.min(current, total);
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)} aria-hidden>
      {Array.from({ length: total }).map((_, index) => (
        <span
          key={index}
          className={cn(
            "size-4 rounded-full border-2 transition-colors",
            index < capped ? "border-primary bg-primary" : "border-border bg-transparent",
          )}
        />
      ))}
    </div>
  );
}
