"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { revalidateContent } from "@/actions/revalidate-content"

interface AdminRefreshButtonProps {
  slug?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function AdminRefreshButton({
  slug,
  variant = "outline",
  size = "sm",
  className = "",
}: AdminRefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()
  const { isAdmin, isLoading } = useAdminAuth()

  // Se não for admin ou ainda estiver carregando, não renderiza o botão
  if (!isAdmin || isLoading) return null

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Usar a Server Action em vez de chamar a API diretamente
      const result = await revalidateContent(slug)

      if (result.success) {
        toast({
          title: "Conteúdo atualizado",
          description: result.message,
        })

        // Force a client-side navigation to refresh the page after a short delay
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        throw new Error(result.message || "Falha ao atualizar o conteúdo")
      }
    } catch (error) {
      console.error("Error refreshing content:", error)
      toast({
        title: "Erro ao atualizar",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar o conteúdo.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Button onClick={handleRefresh} disabled={isRefreshing} size={size} variant={variant} className={className}>
      {isRefreshing ? (
        <>
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Atualizando...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          {slug ? "Atualizar post" : "Atualizar conteúdo"}
        </>
      )}
    </Button>
  )
}
