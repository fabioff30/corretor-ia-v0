export type PremiumLoadingProps = {
  className?: string
  lines?: number
}

export function PremiumLoading({ className = "", lines = 3 }: PremiumLoadingProps) {
  const widths = ["w-2/3", "w-1/2", "w-full"]
  const items = Array.from({ length: lines })

  return (
    <div className={`relative overflow-hidden rounded-lg border border-border bg-muted/50 ${className}`}>
      <div className="space-y-3 p-4">
        {items.map((_, i) => {
          const w = widths[i] ?? "w-full"
          return <div key={i} className={`h-4 rounded-md bg-muted ${w}`} />
        })}
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -translate-x-full bg-gradient-to-r from-transparent via-foreground/10 to-transparent will-change-transform animate-shimmer"
      />
    </div>
  )
}

