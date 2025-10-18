"use client"

import { useCallback, useMemo, useState, type ComponentType } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Eye,
  Trash2,
  Copy,
  Download,
  Sparkles,
  Search,
  Calendar,
  FileText,
  CheckCircle,
  Repeat2,
  ScanSearch,
} from "lucide-react"

import { DashboardLayout } from "@/components/dashboard/DashboardLayout"
import { UpgradeBanner } from "@/components/dashboard/UpgradeBanner"
import { useUser } from "@/hooks/use-user"
import { useCorrections, type CorrectionFilters } from "@/hooks/use-corrections"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { TextDiff } from "@/components/text-diff"
import { TextEvaluation } from "@/components/text-evaluation"
import { AIDetectionResult } from "@/components/ai-detection-result"
import { useToast } from "@/hooks/use-toast"
import type { UserCorrection } from "@/types/supabase"

const typeTabs: Array<{ value: "all" | "correct" | "rewrite" | "ai_analysis"; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "correct", label: "Correções" },
  { value: "rewrite", label: "Reescritas" },
  { value: "ai_analysis", label: "Detector IA" },
]

const typeConfig: Record<"correct" | "rewrite" | "ai_analysis", { label: string; icon: ComponentType<{ className?: string }> }> = {
  correct: { label: "Correção", icon: CheckCircle },
  rewrite: { label: "Reescrita", icon: Repeat2 },
  ai_analysis: { label: "Análise IA", icon: ScanSearch },
}

function formatDate(dateIso: string) {
  try {
    return format(new Date(dateIso), "dd/MM/yyyy HH:mm", { locale: ptBR })
  } catch (error) {
    return "--"
  }
}

function getTypeBadge(type: "correct" | "rewrite" | "ai_analysis") {
  const config = typeConfig[type]
  const Icon = config.icon
  const variantClass =
    type === "correct"
      ? "bg-emerald-500/10 text-emerald-600"
      : type === "rewrite"
        ? "bg-blue-500/10 text-blue-600"
        : "bg-purple-500/10 text-purple-600"

  return (
    <Badge className={`gap-1 border-0 ${variantClass}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  )
}

function buildFilters(
  operation: "all" | "correct" | "rewrite" | "ai_analysis",
  search: string,
  from: string,
  to: string,
): CorrectionFilters {
  const filters: CorrectionFilters = {}

  if (operation !== "all") {
    filters.operationType = operation
  }

  if (search.trim()) {
    filters.searchQuery = search.trim()
  }

  if (from) {
    filters.dateFrom = `${from}T00:00:00Z`
  }

  if (to) {
    filters.dateTo = `${to}T23:59:59Z`
  }

  return filters
}

function getAiSummary(summaryText: string | null) {
  if (!summaryText) return null
  try {
    return JSON.parse(summaryText) as {
      verdict: string
      probability: number
      confidence: string
      topSignals: string[]
    }
  } catch (error) {
    return null
  }
}

function buildCopyPayload(correction: UserCorrection) {
  if (correction.operation_type === "ai_analysis") {
    const summary = getAiSummary(correction.corrected_text)
    if (!summary) return ""
    const probability = Math.round((summary.probability ?? 0) * 100)
    const signals = summary.topSignals && summary.topSignals.length > 0 ? `\nSinais principais:\n- ${summary.topSignals.join("\n- ")}` : ""
    return `Análise do Detector de IA\nVeredito: ${summary.verdict}\nProbabilidade: ${probability}%\nConfiança: ${summary.confidence}${signals}`
  }

  return correction.corrected_text
}

function formatPreview(correction: UserCorrection) {
  if (correction.operation_type === "ai_analysis") {
    const summary = getAiSummary(correction.corrected_text)
    if (!summary) return "Resultado disponível"
    const probability = Math.round((summary.probability ?? 0) * 100)
    return `${summary.verdict.toUpperCase()} • ${probability}% confiança`
  }

  const text = correction.corrected_text || ""
  if (!text) return "Sem texto disponível"
  return text.length > 100 ? `${text.slice(0, 100)}…` : text
}

export default function CorrectionsHistoryPage() {
  const { profile } = useUser()
  const { toast } = useToast()

  const [activeType, setActiveType] = useState<"all" | "correct" | "rewrite" | "ai_analysis">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedCorrection, setSelectedCorrection] = useState<UserCorrection | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const isPremium = profile?.plan_type === "pro" || profile?.plan_type === "admin"

  const filters = useMemo(
    () => buildFilters(activeType, searchTerm, dateFrom, dateTo),
    [activeType, searchTerm, dateFrom, dateTo],
  )

  const { corrections, loading, error, hasMore, loadMore, deleteCorrection, refresh } = useCorrections(filters)

  const handleViewDetails = useCallback((correction: UserCorrection) => {
    setSelectedCorrection(correction)
    setDetailsOpen(true)
  }, [])

  const handleCopy = useCallback(
    async (correction: UserCorrection) => {
      try {
        const payload = buildCopyPayload(correction)
        if (!payload) throw new Error("Nada para copiar")
        await navigator.clipboard.writeText(payload)
        toast({ title: "Copiado!", description: "O conteúdo foi copiado para a área de transferência." })
      } catch (copyError) {
        toast({
          title: "Não foi possível copiar",
          description: copyError instanceof Error ? copyError.message : "Tente novamente",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  const handleDownload = useCallback(
    (correction: UserCorrection) => {
      try {
        const isAi = correction.operation_type === "ai_analysis"
        const filename = `corretor-${correction.operation_type}-${format(new Date(correction.created_at), "yyyyMMdd-HHmm")}.${
          isAi ? "json" : "txt"
        }`

        const payload = isAi
          ? JSON.stringify(
              {
                summary: getAiSummary(correction.corrected_text),
                evaluation: correction.evaluation,
                originalText: correction.original_text,
              },
              null,
              2,
            )
          : correction.corrected_text

        const blob = new Blob([payload], { type: isAi ? "application/json" : "text/plain;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } catch (downloadError) {
        toast({
          title: "Erro ao baixar",
          description: downloadError instanceof Error ? downloadError.message : "Tente novamente",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  const handleDelete = useCallback(
    async (correction: UserCorrection) => {
      const { error: deleteError } = await deleteCorrection(correction.id)
      if (deleteError) {
        toast({
          title: "Erro ao excluir",
          description: deleteError,
          variant: "destructive",
        })
      } else {
        toast({ title: "Removido", description: "O item foi excluído do histórico." })
      }
    },
    [deleteCorrection, toast],
  )

  const renderDetails = useCallback(() => {
    if (!selectedCorrection) return null

    if (selectedCorrection.operation_type === "ai_analysis") {
      const evaluation = (selectedCorrection.evaluation || getAiSummary(selectedCorrection.corrected_text)) as any

      if (!evaluation) {
        return <p className="text-sm text-muted-foreground">Detalhes indisponíveis para esta análise.</p>
      }

      return <AIDetectionResult {...evaluation} />
    }

    const evaluation = selectedCorrection.evaluation as any

    return (
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Comparação</h4>
          <div className="mt-3 rounded-lg border bg-background p-3">
            <TextDiff original={selectedCorrection.original_text} corrected={selectedCorrection.corrected_text} />
          </div>
        </div>

        {selectedCorrection.operation_type === "correct" && evaluation && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Avaliação da IA</h4>
            <div className="mt-3 rounded-lg border bg-background p-4">
              <TextEvaluation evaluation={evaluation} />
            </div>
          </div>
        )}

        {selectedCorrection.operation_type === "rewrite" && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Estilo aplicado</h4>
              <Badge className="mt-2 capitalize">
                {evaluation?.styleApplied || selectedCorrection.tone_style || "Estilo personalizado"}
              </Badge>
            </div>
            {Array.isArray(evaluation?.changes) && evaluation.changes.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Mudanças principais</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {evaluation.changes.map((change: string, index: number) => (
                    <li key={`${change}-${index}`}>{change}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }, [selectedCorrection])

  return (
    <DashboardLayout
      title="Meus textos"
      description="Consulte correções, reescritas e análises salvas automaticamente no plano Premium"
    >
      {!isPremium ? (
        <div className="mx-auto max-w-3xl space-y-6">
          <Alert>
            <AlertTitle>Histórico exclusivo para Premium</AlertTitle>
            <AlertDescription>
              O painel “Meus textos” registra automaticamente todas as correções, reescritas e análises realizadas pelos
              usuários do plano Pro.
            </AlertDescription>
          </Alert>
          <UpgradeBanner />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg border bg-background p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <Tabs value={activeType} onValueChange={(value) => setActiveType(value as typeof activeType)}>
                <TabsList className="grid grid-cols-4">
                  {typeTabs.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm">
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:items-center lg:gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Buscar por conteúdo"
                    className="pl-9"
                  />
                </div>

                <div className="flex gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
                  </div>
                  <span className="self-center text-sm text-muted-foreground">até</span>
                  <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
                </div>

                {(dateFrom || dateTo || searchTerm) && (
                  <Button
                    variant="ghost"
                    className="justify-self-start"
                    onClick={() => {
                      setSearchTerm("")
                      setDateFrom("")
                      setDateTo("")
                    }}
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Não foi possível carregar o histórico</AlertTitle>
              <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>{error}</span>
                <Button size="sm" onClick={refresh} variant="outline">
                  Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="overflow-hidden rounded-lg border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-36">Data</TableHead>
                  <TableHead className="w-32">Tipo</TableHead>
                  <TableHead className="w-24 text-right">Caracteres</TableHead>
                  <TableHead>Prévia</TableHead>
                  <TableHead className="w-[180px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && corrections.length === 0 &&
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`} data-testid="history-row-skeleton">
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-8 w-32" />
                      </TableCell>
                    </TableRow>
                  ))}

                {!loading && corrections.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center">
                      <div className="mx-auto max-w-lg space-y-3 text-muted-foreground">
                        <Sparkles className="mx-auto h-6 w-6" />
                        <p className="text-sm">
                          Nenhum texto encontrado para os filtros selecionados. Correções, reescritas e análises premium serão
                          exibidas aqui automaticamente.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {corrections.map((correction) => (
                  <TableRow key={correction.id}>
                    <TableCell className="font-medium">{formatDate(correction.created_at)}</TableCell>
                    <TableCell>{getTypeBadge(correction.operation_type)}</TableCell>
                    <TableCell className="text-right">{correction.character_count.toLocaleString("pt-BR")}</TableCell>
                    <TableCell>
                      <div className="max-w-xl truncate text-sm text-muted-foreground">{formatPreview(correction)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleViewDetails(correction)}
                          aria-label="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleCopy(correction)}
                          aria-label="Copiar resultado"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDownload(correction)}
                          aria-label="Baixar"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" aria-label="Excluir">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover este registro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. O texto será removido definitivamente do seu histórico.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(correction)}>Remover</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <Button onClick={loadMore} disabled={loading} variant="outline">
                {loading ? "Carregando..." : "Carregar mais"}
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Detalhes do texto
            </DialogTitle>
            {selectedCorrection && (
              <DialogDescription>
                {formatDate(selectedCorrection.created_at)} • {typeConfig[selectedCorrection.operation_type].label}
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedCorrection ? (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Texto original</h4>
                <p className="mt-2 whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-sm">
                  {selectedCorrection.original_text}
                </p>
              </div>

              {selectedCorrection.operation_type !== "ai_analysis" && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Resultado salvo</h4>
                  <p className="mt-2 whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-sm">
                    {selectedCorrection.corrected_text}
                  </p>
                </div>
              )}

              {renderDetails()}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Selecione um item para visualizar os detalhes.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
