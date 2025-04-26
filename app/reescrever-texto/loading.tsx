import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function RewriteTextLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-10 w-64 mx-auto mb-2" />
        <Skeleton className="h-5 w-96 mx-auto mb-8" />

        <Card className="mb-8">
          <CardContent className="p-6">
            <Skeleton className="h-40 w-full mb-4" />
            <div className="flex justify-between mb-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-24" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <section>
            <Skeleton className="h-8 w-80 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-4" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Skeleton className="h-4 w-4 mt-1" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </section>

          <section>
            <Skeleton className="h-8 w-64 mb-3" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Skeleton className="h-4 w-4 mt-1" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
