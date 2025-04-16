import { BackgroundGradient } from "@/components/background-gradient"

export default function BlogPostLoading() {
  return (
    <>
      <BackgroundGradient />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="h-6 w-32 bg-muted rounded animate-pulse mb-4" />
          <div className="h-10 bg-muted rounded animate-pulse mb-4 w-full" />
          <div className="h-10 bg-muted rounded animate-pulse mb-4 w-3/4" />

          <div className="flex gap-4 mb-6">
            <div className="h-5 w-24 bg-muted rounded animate-pulse" />
            <div className="h-5 w-24 bg-muted rounded animate-pulse" />
            <div className="h-5 w-24 bg-muted rounded animate-pulse" />
          </div>

          <div className="aspect-video w-full bg-muted rounded animate-pulse mb-8" />
        </div>

        <div className="grid md:grid-cols-[1fr_250px] gap-8">
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="h-6 bg-muted rounded animate-pulse w-full"
                style={{ width: `${Math.random() * 40 + 60}%` }}
              />
            ))}
          </div>

          <aside>
            <div className="h-64 bg-muted rounded animate-pulse" />
          </aside>
        </div>
      </div>
    </>
  )
}
