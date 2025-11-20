import { Card, CardContent, CardFooter } from "@/components/ui/card"

export function BlogPageSkeleton() {
  return (
    <div className="grid gap-8">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="overflow-hidden">
          <div className="aspect-video w-full bg-muted animate-pulse" />
          <CardContent className="pt-6">
            <div className="h-8 bg-muted rounded animate-pulse mb-4" />
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse w-full" />
              <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
              <div className="h-4 bg-muted rounded animate-pulse w-4/6" />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <div className="flex justify-between w-full">
              <div className="h-4 bg-muted rounded animate-pulse w-24" />
              <div className="h-4 bg-muted rounded animate-pulse w-24" />
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
