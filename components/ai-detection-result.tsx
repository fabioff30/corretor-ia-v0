"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Bot, User, HelpCircle, FileText, Globe, AlertTriangle, CheckCircle, BarChart3, Award, Heart, ExternalLink } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { AIDetectorRating } from "@/components/ai-detector-rating"

interface AIDetectionResultProps {
  result: {
    verdict: "ai" | "human" | "uncertain"
    probability: number
    confidence: "low" | "medium" | "high"
    explanation?: string
    signals: string[]
  }
  textStats: {
    words: number
    characters: number
    sentences: number
    avgSentenceLength?: number
    avgWordLength?: number
    uppercaseRatio?: number
    digitRatio?: number
    punctuationRatio?: number
  }
  brazilianism?: {
    found: boolean
    count?: number
    score?: number
    explanation?: string
    terms?: Array<{ term: string; count: number }>
    source?: string
    version?: string
  }
  grammarSummary?: {
    errors: number
    grammarErrors?: number
    orthographyErrors?: number
    concordanceErrors?: number
    evaluation?: string
    confidence?: string
    model?: string
    details?: string[]
  }
  metadata: {
    promptVersion?: string
    termsVersion?: string
    termsSignature?: string
    models?: string[]
    grammarErrors?: number
  }
}

const verdictConfig = {
  ai: {
    icon: Bot,
    label: "Texto Gerado por IA",
    description: "Este texto provavelmente foi gerado por inteligência artificial",
    colorClass: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
    badgeClass: "bg-orange-500",
  },
  human: {
    icon: User,
    label: "Texto Escrito por Humano",
    description: "Este texto provavelmente foi escrito por um ser humano",
    colorClass: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    badgeClass: "bg-green-500",
  },
  uncertain: {
    icon: HelpCircle,
    label: "Resultado Inconclusivo",
    description: "Não foi possível determinar com certeza a origem do texto",
    colorClass: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    badgeClass: "bg-yellow-500",
  },
}

const confidenceConfig = {
  low: { label: "Baixa", color: "bg-red-500" },
  medium: { label: "Média", color: "bg-yellow-500" },
  high: { label: "Alta", color: "bg-green-500" },
}

export function AIDetectionResult({ result, textStats, brazilianism, grammarSummary, metadata }: AIDetectionResultProps) {
  const config = verdictConfig[result.verdict]
  const Icon = config.icon
  const confidenceInfo = confidenceConfig[result.confidence]
  const probabilityPercent = Math.round(result.probability * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Main Verdict Card */}
      <Card className={`border-2 ${config.colorClass}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon className="h-8 w-8" />
              <div>
                <CardTitle className="text-2xl">{config.label}</CardTitle>
                <p className="text-sm mt-1 opacity-80">{config.description}</p>
              </div>
            </div>
            <Badge className={confidenceInfo.color}>
              Confiança: {confidenceInfo.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Probabilidade</span>
              <span className="text-2xl font-bold">{probabilityPercent}%</span>
            </div>
            <Progress value={probabilityPercent} className="h-3" />
          </div>

          {/* Explanation */}
          {result.explanation && (
            <div className="pt-4 border-t">
              <p className="text-sm leading-relaxed">{result.explanation}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Donation Call to Action - BIG */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="p-4 bg-primary/20 rounded-full">
                <Heart className="h-12 w-12 text-primary" fill="currentColor" />
              </div>

              <div className="space-y-3 max-w-2xl">
                <h3 className="text-3xl font-bold tracking-tight">
                  Gostou do Detector de IA?
                </h3>
                <p className="text-lg text-muted-foreground">
                  Ajude a manter o CorretorIA <strong>100% gratuito</strong> para todos!
                  Sua doação permite que continuemos desenvolvendo ferramentas incríveis de IA.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Button asChild size="lg" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all">
                  <Link href="/contato">
                    <Heart className="mr-2 h-5 w-5" />
                    Fazer uma Doação
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                  <Link href="/premium">
                    <ExternalLink className="mr-2 h-5 w-5" />
                    Ver Planos Premium
                  </Link>
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                ✨ Cada doação nos ajuda a criar mais ferramentas gratuitas de IA
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Text Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Estatísticas do Texto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold">{textStats.words}</div>
              <div className="text-sm text-muted-foreground">Palavras</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold">{textStats.characters}</div>
              <div className="text-sm text-muted-foreground">Caracteres</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold">{textStats.sentences}</div>
              <div className="text-sm text-muted-foreground">Frases</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold">{grammarSummary?.errors || 0}</div>
              <div className="text-sm text-muted-foreground">Erros</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information - Accordion */}
      <Card>
        <CardContent className="pt-6">
          <Accordion type="single" collapsible className="w-full">
            {/* Signals Detected */}
            {result.signals && result.signals.length > 0 && (
              <AccordionItem value="signals">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Sinais Detectados ({result.signals.length})</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 mt-2">
                    {result.signals.map((signal, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{signal}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Brazilianisms */}
            {brazilianism?.found && (
              <AccordionItem value="brazilianism">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    <span>Brasileirismos {brazilianism.count ? `(${brazilianism.count})` : ''}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {brazilianism.explanation && (
                    <p className="text-sm text-muted-foreground mb-4">{brazilianism.explanation}</p>
                  )}

                  {brazilianism.score !== undefined && brazilianism.score > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Score de Brasileirismos</span>
                        <span className="text-sm font-bold">{(brazilianism.score * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={brazilianism.score * 100} className="h-2" />
                    </div>
                  )}

                  {brazilianism.terms && brazilianism.terms.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                      {brazilianism.terms.map((term, index) => (
                        <div key={index} className="p-3 bg-muted rounded-lg">
                          <div className="font-medium">{term.term}</div>
                          <div className="text-sm text-muted-foreground">
                            {term.count} {term.count === 1 ? "ocorrência" : "ocorrências"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {brazilianism.source && (
                    <p className="text-xs text-muted-foreground mt-4">
                      Fonte: {brazilianism.source} {brazilianism.version && `(${brazilianism.version})`}
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Grammar Summary */}
            {grammarSummary && grammarSummary.errors > 0 && (
              <AccordionItem value="grammar">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    <span>Resumo Gramatical ({grammarSummary.errors} erros)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {/* Error Breakdown */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {grammarSummary.grammarErrors !== undefined && grammarSummary.grammarErrors > 0 && (
                      <div className="text-center p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{grammarSummary.grammarErrors}</div>
                        <div className="text-xs text-red-600/80 dark:text-red-400/80">Gramática</div>
                      </div>
                    )}
                    {grammarSummary.orthographyErrors !== undefined && grammarSummary.orthographyErrors > 0 && (
                      <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{grammarSummary.orthographyErrors}</div>
                        <div className="text-xs text-orange-600/80 dark:text-orange-400/80">Ortografia</div>
                      </div>
                    )}
                    {grammarSummary.concordanceErrors !== undefined && grammarSummary.concordanceErrors > 0 && (
                      <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{grammarSummary.concordanceErrors}</div>
                        <div className="text-xs text-yellow-600/80 dark:text-yellow-400/80">Concordância</div>
                      </div>
                    )}
                  </div>

                  {/* Evaluation */}
                  {grammarSummary.evaluation && (
                    <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm">{grammarSummary.evaluation}</p>
                      {grammarSummary.model && (
                        <div className="mt-2 flex items-center gap-2">
                          <Award className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Analisado por: {grammarSummary.model}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {grammarSummary.details && grammarSummary.details.length > 0 && (
                    <ul className="space-y-2 mb-4">
                      {grammarSummary.details.map((detail, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-destructive mt-1">•</span>
                          <span className="text-sm">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Suggestion to use corrector */}
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">
                          Encontramos erros no seu texto
                        </p>
                        <p className="text-sm text-muted-foreground mb-3">
                          Use nosso corretor gratuito para corrigir automaticamente todos os erros gramaticais
                        </p>
                        <Link
                          href="/"
                          className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                        >
                          Corrigir texto agora →
                        </Link>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Advanced Statistics */}
            {(textStats.avgSentenceLength || textStats.avgWordLength || textStats.uppercaseRatio !== undefined) && (
              <AccordionItem value="advanced-stats">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Estatísticas Avançadas</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {textStats.avgSentenceLength && textStats.avgSentenceLength > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Comprimento Médio de Frase</span>
                          <span className="text-sm font-bold">{textStats.avgSentenceLength.toFixed(1)} palavras</span>
                        </div>
                        <Progress value={Math.min(100, (textStats.avgSentenceLength / 30) * 100)} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {textStats.avgSentenceLength < 15 ? 'Frases curtas' : textStats.avgSentenceLength < 25 ? 'Comprimento ideal' : 'Frases longas'}
                        </p>
                      </div>
                    )}

                    {textStats.avgWordLength && textStats.avgWordLength > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Comprimento Médio de Palavra</span>
                          <span className="text-sm font-bold">{textStats.avgWordLength.toFixed(2)} caracteres</span>
                        </div>
                        <Progress value={Math.min(100, (textStats.avgWordLength / 10) * 100)} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {textStats.avgWordLength < 4 ? 'Vocabulário simples' : textStats.avgWordLength < 6 ? 'Vocabulário médio' : 'Vocabulário complexo'}
                        </p>
                      </div>
                    )}

                    {textStats.uppercaseRatio !== undefined && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Taxa de Maiúsculas</span>
                          <span className="text-sm font-bold">{(textStats.uppercaseRatio * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={textStats.uppercaseRatio * 100} className="h-2" />
                      </div>
                    )}

                    {textStats.digitRatio !== undefined && textStats.digitRatio > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Taxa de Dígitos</span>
                          <span className="text-sm font-bold">{(textStats.digitRatio * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={textStats.digitRatio * 100} className="h-2" />
                      </div>
                    )}

                    {textStats.punctuationRatio !== undefined && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Taxa de Pontuação</span>
                          <span className="text-sm font-bold">{(textStats.punctuationRatio * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={textStats.punctuationRatio * 100} className="h-2" />
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

          </Accordion>
        </CardContent>
      </Card>

      {/* Feedback Rating */}
      <AIDetectorRating
        verdict={result.verdict}
        probability={result.probability}
        textLength={textStats.characters}
      />
    </motion.div>
  )
}
