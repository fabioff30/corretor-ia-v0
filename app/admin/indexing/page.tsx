"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Search, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from "lucide-react"

interface IndexingResult {
  url: string
  success: boolean
  error?: string
}

interface BatchResult {
  success: boolean
  total: number
  successful: number
  failed: number
  results: IndexingResult[]
  message?: string
}

export default function IndexingPage() {
  const [urls, setUrls] = useState<string[]>([])
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<BatchResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Carregar URLs disponíveis
  useEffect(() => {
    fetchUrls()
  }, [])

  async function fetchUrls() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/indexing")
      if (!response.ok) {
        throw new Error("Falha ao carregar URLs")
      }
      const data = await response.json()
      setUrls(data.urls || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  // Toggle seleção de URL
  function toggleUrl(url: string) {
    const newSelected = new Set(selectedUrls)
    if (newSelected.has(url)) {
      newSelected.delete(url)
    } else {
      newSelected.add(url)
    }
    setSelectedUrls(newSelected)
  }

  // Selecionar/deselecionar todas
  function toggleAll() {
    if (selectedUrls.size === urls.length) {
      setSelectedUrls(new Set())
    } else {
      setSelectedUrls(new Set(urls))
    }
  }

  // Submeter URLs para indexação
  async function submitForIndexing() {
    if (selectedUrls.size === 0) {
      setError("Selecione pelo menos uma URL")
      return
    }

    setSubmitting(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch("/api/admin/indexing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls: Array.from(selectedUrls),
          action: "URL_UPDATED",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Falha ao submeter URLs")
      }

      setResult(data)
      setSelectedUrls(new Set()) // Limpar seleção após sucesso
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setSubmitting(false)
    }
  }

  // Indexar todas as URLs
  async function indexAll() {
    setSubmitting(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch("/api/admin/indexing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ indexAll: true }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Falha ao submeter URLs")
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Google Indexing API</h1>
        <p className="text-muted-foreground">
          Submeta URLs para indexação no Google. Limite: 200 URLs/dia.
        </p>
      </div>

      {/* Alerta de quota */}
      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Limite de Quota</AlertTitle>
        <AlertDescription>
          O Google permite submeter até 200 URLs por dia por padrão. Use com moderação.
          Para aumentar a quota, solicite no Google Cloud Console.
        </AlertDescription>
      </Alert>

      {/* Resultado da última submissão */}
      {result && (
        <Alert
          className={`mb-6 ${result.failed > 0 ? "border-yellow-500" : "border-green-500"}`}
          variant={result.failed > 0 ? "destructive" : "default"}
        >
          {result.failed > 0 ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          <AlertTitle>Resultado da Indexação</AlertTitle>
          <AlertDescription>
            <p className="mb-2">{result.message}</p>
            <div className="flex gap-4 text-sm">
              <span className="text-green-600">Sucesso: {result.successful}</span>
              {result.failed > 0 && (
                <span className="text-red-600">Falhas: {result.failed}</span>
              )}
            </div>
            {result.failed > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto text-sm">
                {result.results
                  .filter(r => !r.success)
                  .map((r, i) => (
                    <div key={i} className="text-red-600">
                      {r.url}: {r.error}
                    </div>
                  ))}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Erro */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Ações rápidas */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Indexe todas as URLs de uma vez ou selecione individualmente</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button
            onClick={indexAll}
            disabled={submitting || loading}
            className="flex items-center gap-2"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Indexar Todas ({urls.length} URLs)
          </Button>
          <Button
            variant="outline"
            onClick={fetchUrls}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar Lista
          </Button>
        </CardContent>
      </Card>

      {/* Lista de URLs */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>URLs Disponíveis</CardTitle>
              <CardDescription>
                Selecione as URLs que deseja indexar
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                {selectedUrls.size} de {urls.length} selecionadas
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAll}
                disabled={loading}
              >
                {selectedUrls.size === urls.length ? "Desmarcar Todas" : "Selecionar Todas"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="max-h-96 overflow-y-auto space-y-2 mb-4">
                {urls.map((url, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleUrl(url)}
                  >
                    <Checkbox
                      checked={selectedUrls.has(url)}
                      onCheckedChange={() => toggleUrl(url)}
                    />
                    <span className="text-sm font-mono truncate flex-1">{url}</span>
                    {url.includes("/blog/") && (
                      <Badge variant="secondary" className="text-xs">Blog</Badge>
                    )}
                  </div>
                ))}
              </div>

              <Button
                onClick={submitForIndexing}
                disabled={submitting || selectedUrls.size === 0}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Enviando para indexação...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Indexar Selecionadas ({selectedUrls.size})
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Instruções */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Configuração Necessária</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Para usar a Indexing API, você precisa:
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              <strong>Habilitar a Indexing API</strong> no Google Cloud Console
            </li>
            <li>
              <strong>Adicionar o Service Account</strong> como proprietário no Google Search Console
              <br />
              <span className="text-xs">
                (O email do service account está nas credenciais do Google Analytics)
              </span>
            </li>
            <li>
              <strong>Verificar propriedade</strong> do site no Search Console
            </li>
          </ol>
          <p className="text-xs">
            Documentação:{" "}
            <a
              href="https://developers.google.com/search/apis/indexing-api/v3/quickstart"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google Indexing API Quickstart
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
