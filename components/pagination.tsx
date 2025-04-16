import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PaginationProps {
  currentPage: number
  totalPages: number
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 5

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always include first page
      pages.push(1)

      // Calculate start and end of page range around current page
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if at the beginning
      if (currentPage <= 2) {
        end = Math.min(totalPages - 1, 4)
      }

      // Adjust if at the end
      if (currentPage >= totalPages - 1) {
        start = Math.max(2, totalPages - 3)
      }

      // Add ellipsis if needed before start
      if (start > 2) {
        pages.push("...")
      }

      // Add page numbers
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      // Add ellipsis if needed after end
      if (end < totalPages - 1) {
        pages.push("...")
      }

      // Always include last page
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <nav aria-label="Paginação" className="flex justify-center">
      <ul className="flex items-center gap-1">
        <li>
          <Button variant="outline" size="icon" disabled={currentPage === 1} asChild={currentPage !== 1}>
            {currentPage === 1 ? (
              <span className="cursor-not-allowed">
                <ChevronLeft className="h-4 w-4" />
              </span>
            ) : (
              <Link href={`/blog?page=${currentPage - 1}`} aria-label="Página anterior">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            )}
          </Button>
        </li>

        {pageNumbers.map((page, index) => (
          <li key={index}>
            {page === "..." ? (
              <span className="px-3 py-2">...</span>
            ) : (
              <Button
                variant={currentPage === page ? "default" : "outline"}
                size="icon"
                asChild={currentPage !== page}
                className="h-9 w-9"
              >
                {currentPage === page ? (
                  <span>{page}</span>
                ) : (
                  <Link href={`/blog?page=${page}`} aria-label={`Página ${page}`}>
                    {page}
                  </Link>
                )}
              </Button>
            )}
          </li>
        ))}

        <li>
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage === totalPages}
            asChild={currentPage !== totalPages}
          >
            {currentPage === totalPages ? (
              <span className="cursor-not-allowed">
                <ChevronRight className="h-4 w-4" />
              </span>
            ) : (
              <Link href={`/blog?page=${currentPage + 1}`} aria-label="Próxima página">
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </Button>
        </li>
      </ul>
    </nav>
  )
}
