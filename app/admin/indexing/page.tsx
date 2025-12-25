"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Search, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Copy, Clock, Trash2 } from "lucide-react"

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

interface PendingUrl {
  url: string
  error: string
  failedAt: string
}

const PENDING_URLS_KEY = "indexing_pending_urls"

export default function IndexingPage() {
  const [urls, setUrls] = useState<string[]>([])
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<BatchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingUrls, setPendingUrls] = useState<PendingUrl[]>([])
  const [copied, setCopied] = useState(false)

  // Carregar URLs disponíveis e pendentes
  useEffect(() => {
    fetchUrls()
    loadPendingUrls()
  }, [])

  // Salvar URLs que falharam quando o resultado mudar
  useEffect(() => {
    if (result && result.failed > 0) {
      const failedResults = result.results.filter(r => !r.success)
      savePendingUrls(failedResults)
    }
  }, [result])

  function loadPendingUrls() {
    try {
      const stored = localStorage.getItem(PENDING_URLS_KEY)
      if (stored) {
        setPendingUrls(JSON.parse(stored))
      }
    } catch (err) {
      console.error("Erro ao carregar URLs pendentes:", err)
    }
  }

  function savePendingUrls(failedResults: IndexingResult[]) {
    const now = new Date().toISOString()
    const newPending: PendingUrl[] = failedResults.map(r => ({
      url: r.url,
      error: r.error || "Erro desconhecido",
      failedAt: now,
    }))

    // Merge com pendentes existentes (evitar duplicatas)
    const existingUrls = new Set(pendingUrls.map(p => p.url))
    const merged = [...pendingUrls]

    for (const p of newPending) {
      if (!existingUrls.has(p.url)) {
        merged.push(p)
      }
    }

    setPendingUrls(merged)
    localStorage.setItem(PENDING_URLS_KEY, JSON.stringify(merged))
  }

  function clearPendingUrls() {
    setPendingUrls([])
    localStorage.removeItem(PENDING_URLS_KEY)
  }

  function removePendingUrl(url: string) {
    const updated = pendingUrls.filter(p => p.url !== url)
    setPendingUrls(updated)
    localStorage.setItem(PENDING_URLS_KEY, JSON.stringify(updated))
  }

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

  function toggleUrl(url: string) {
    const newSelected = new Set(selectedUrls)
    if (newSelected.has(url)) {
      newSelected.delete(url)
    } else {
      newSelected.add(url)
    }
    setSelectedUrls(newSelected)
  }

  function toggleAll() {
    if (selectedUrls.size === urls.length) {
      setSelectedUrls(new Set())
    } else {
      setSelectedUrls(new Set(urls))
    }
  }

  function selectPendingUrls() {
    const pendingSet = new Set(pendingUrls.map(p => p.url))
    setSelectedUrls(pendingSet)
  }

  async function copyPendingUrls() {
    const urlList = pendingUrls.map(p => p.url).join("\n")
    await navigator.clipboard.writeText(urlList)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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

      // Remover URLs que tiveram sucesso da lista de pendentes
      if (data.results) {
        const successfulUrls = data.results
          .filter((r: IndexingResult) => r.success)
          .map((r: IndexingResult) => r.url)

        const updatedPending = pendingUrls.filter(p => !successfulUrls.includes(p.url))
        setPendingUrls(updatedPending)
        localStorage.setItem(PENDING_URLS_KEY, JSON.stringify(updatedPending))
      }

      setSelectedUrls(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setSubmitting(false)
    }
  }

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

      {/* URLs Pendentes (que falharam anteriormente) */}
      {pendingUrls.length > 0 && (
        <Card className="mb-6 border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <Clock className="h-5 w-5" />
                  URLs Pendentes ({pendingUrls.length})
                </CardTitle>
                <CardDescription>
                  Estas URLs falharam anteriormente por limite de quota. Tente novamente amanhã.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyPendingUrls}
                  className="flex items-center gap-1"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? "Copiado!" : "Copiar"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectPendingUrls}
                  className="flex items-center gap-1"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Selecionar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearPendingUrls}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {pendingUrls.map((pending, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-background rounded text-sm"
                >
                  <div className="flex-1 truncate">
                    <span className="font-mono text-xs">{pending.url}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePendingUrl(pending.url)}
                    className="ml-2 h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado da última submissão */}
      {result && (
        <Card className={`mb-6 ${result.failed > 0 ? "border-yellow-500" : "border-green-500"}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.failed > 0 ? (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
              Resultado da Indexação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{result.successful}</div>
                <div className="text-sm text-muted-foreground">Sucesso</div>
              </div>
              {result.failed > 0 && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{result.failed}</div>
                  <div className="text-sm text-muted-foreground">Falhas</div>
                </div>
              )}
              <div className="text-center">
                <div className="text-3xl font-bold text-muted-foreground">{result.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>

            {result.failed > 0 && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>URLs que falharam (salvas automaticamente)</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 max-h-32 overflow-y-auto text-sm space-y-1">
                    {result.results
                      .filter(r => !r.success)
                      .map((r, i) => (
                        <div key={i} className="font-mono text-xs">
                          {r.url.replace("https://www.corretordetextoonline.com.br", "")}
                        </div>
                      ))}
                  </div>
                  <p className="mt-2 text-xs">
                    Estas URLs foram salvas na seção "Pendentes" acima. Tente novamente amanhã.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
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
        <CardContent className="flex flex-wrap gap-4">
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
          {pendingUrls.length > 0 && (
            <Button
              variant="secondary"
              onClick={async () => {
                selectPendingUrls()
                // Pequeno delay para atualizar a seleção antes de submeter
                setTimeout(() => submitForIndexing(), 100)
              }}
              disabled={submitting || loading}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Reindexar Pendentes ({pendingUrls.length})
            </Button>
          )}
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
                {urls.map((url, index) => {
                  const isPending = pendingUrls.some(p => p.url === url)
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer ${
                        isPending ? "bg-yellow-500/10 border border-yellow-500/30" : ""
                      }`}
                      onClick={() => toggleUrl(url)}
                    >
                      <Checkbox
                        checked={selectedUrls.has(url)}
                        onCheckedChange={() => toggleUrl(url)}
                      />
                      <span className="text-sm font-mono truncate flex-1">{url}</span>
                      <div className="flex gap-1">
                        {isPending && (
                          <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-500">
                            Pendente
                          </Badge>
                        )}
                        {url.includes("/blog/") && (
                          <Badge variant="secondary" className="text-xs">Blog</Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
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
                Email: 474086296711-compute@developer.gserviceaccount.com
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
