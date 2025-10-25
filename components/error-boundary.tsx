"use client"

import { Component, ReactNode, ErrorInfo } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error) => ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary to catch rendering errors
 * Prevents entire app crash from component errors
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error)
      }

      // Default fallback UI
      return (
        <Alert variant="destructive" className="m-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao processar dados</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p className="text-sm">
              Ocorreu um erro inesperado ao renderizar a página. Por favor, recarregue a página.
            </p>
            <details className="text-xs mt-2 cursor-pointer">
              <summary className="font-medium">Detalhes do erro</summary>
              <pre className="mt-2 bg-black/5 p-2 rounded overflow-auto max-h-40">
                {this.state.error.message}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-3 py-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 text-sm"
            >
              Recarregar página
            </button>
          </AlertDescription>
        </Alert>
      )
    }

    return this.props.children
  }
}
