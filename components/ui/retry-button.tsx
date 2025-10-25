import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface RetryButtonProps {
  onClick: () => void
  isLoading?: boolean
  disabled?: boolean
  variant?: "default" | "outline" | "secondary" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  children?: React.ReactNode
  showIcon?: boolean
}

/**
 * Retry Button Component
 * Provides consistent retry UX across the application
 * Per frontend-api.md spec (line 263): "Implementar botão 'Tentar novamente'"
 */
export function RetryButton({
  onClick,
  isLoading = false,
  disabled = false,
  variant = "outline",
  size = "default",
  className,
  children = "Tentar novamente",
  showIcon = true,
}: RetryButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      variant={variant}
      size={size}
      className={cn(
        "gap-2",
        isLoading && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {showIcon && (
        <RefreshCw
          className={cn(
            "h-4 w-4",
            isLoading && "animate-spin"
          )}
        />
      )}
      {children}
    </Button>
  )
}
