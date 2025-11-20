import { CheckCircle, AlertCircle, Lightbulb, Wand2, Sparkles, BookOpen, Crown } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface TextEvaluationProps {
  evaluation: {
    strengths: string[]
    weaknesses: string[]
    suggestions: string[]
    score: number
    toneChanges?: string[] // Adicionar o campo opcional toneChanges
    styleApplied?: string // Para reescrita
    changes?: string[] // Para reescrita e ajuste de tom
    toneApplied?: string // Para ajuste de tom
    // Premium fields
    improvements?: string[]
    analysis?: string
    model?: string
  }
}

export function TextEvaluation({ evaluation }: TextEvaluationProps) {
  const { strengths, weaknesses, suggestions, score, toneChanges, styleApplied, changes, toneApplied, improvements, analysis, model } = evaluation

  // Detect premium evaluation
  const isPremium = !!(improvements || analysis)

  // Verificar o modo de operação
  const isToneOnlyMode = toneApplied && changes && changes.length > 0
  const isRewriteMode = styleApplied && !toneApplied
  const isCorrectionMode = !isToneOnlyMode && !isRewriteMode

  const getScoreColor = () => {
    if (score >= 8) return "text-green-500"
    if (score >= 6) return "text-yellow-500"
    return "text-red-500"
  }

  const getScoreBackground = () => {
    if (score >= 8) return "bg-green-500/20 border-green-500/30"
    if (score >= 6) return "bg-yellow-500/20 border-yellow-500/30"
    return "bg-red-500/20 border-red-500/30"
  }

  return (
    <div className="space-y-6 text-foreground">
      {/* Premium Badge */}
      {isPremium && (
        <div className="flex justify-center mb-4">
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none px-4 py-1.5">
            <Crown className="h-3.5 w-3.5 mr-1.5" />
            Análise Premium
          </Badge>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium">
          {isToneOnlyMode ? "Ajuste de Tom" : isRewriteMode ? "Reescrita" : "Pontuação Geral"}
        </h4>
        {isCorrectionMode && (
          <div
            className={`text-2xl font-bold ${getScoreColor()} px-4 py-2 rounded-full ${getScoreBackground()} border`}
          >
            {score}/10
          </div>
        )}
      </div>

      {/* Mostrar seções de avaliação apenas se não estivermos no modo de apenas ajustes de tom */}
      {!isToneOnlyMode && (
        <>
          {/* Premium: Análise Detalhada (Destaque principal) */}
          {analysis && (
            <div className="relative overflow-hidden rounded-xl p-6 border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-background text-left">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -z-10" />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-purple-500/20 mr-3">
                    <BookOpen className="h-5 w-5 text-purple-500" />
                  </div>
                  <h4 className="text-base font-semibold text-purple-500">Análise Detalhada</h4>
                </div>
                <Badge className="bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              </div>
              <p className="text-foreground/90 leading-relaxed">{analysis}</p>
            </div>
          )}

          {/* Premium: Melhorias Aplicadas */}
          {improvements && improvements.length > 0 && (
            <div className="bg-purple-500/5 rounded-lg p-4 border border-purple-500/20 text-left">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Sparkles className="h-5 w-5 text-purple-500 mr-2" />
                  <h4 className="text-base font-medium text-purple-500">Melhorias Aplicadas</h4>
                </div>
                <Badge className="bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30 text-xs">
                  Premium
                </Badge>
              </div>
              <ul className="space-y-2">
                {improvements.map((improvement, index) => (
                  <li key={index} className="text-foreground/90 flex items-start">
                    <span className="inline-block w-4 h-4 mr-2 mt-1 rounded-full bg-purple-500/20 flex-shrink-0"></span>
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-muted/30 rounded-lg p-4 border text-left">
            <div className="flex items-center mb-3">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <h4 className="text-base font-medium text-green-500">Pontos Fortes</h4>
            </div>
            {strengths.length > 0 ? (
              <ul className="space-y-2">
                {strengths.map((strength, index) => (
                  <li key={index} className="text-foreground/90 flex items-start">
                    <span className="inline-block w-4 h-4 mr-2 mt-1 rounded-full bg-green-500/20 flex-shrink-0"></span>
                    {strength}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">Nenhum ponto forte identificado.</p>
            )}
          </div>

          <div className="bg-muted/30 rounded-lg p-4 border text-left">
            <div className="flex items-center mb-3">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <h4 className="text-base font-medium text-red-500">Pontos a Melhorar</h4>
            </div>
            {weaknesses.length > 0 ? (
              <ul className="space-y-2">
                {weaknesses.map((weakness, index) => (
                  <li key={index} className="text-foreground/90 flex items-start">
                    <span className="inline-block w-4 h-4 mr-2 mt-1 rounded-full bg-red-500/20 flex-shrink-0"></span>
                    {weakness}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">Nenhum ponto fraco identificado.</p>
            )}
          </div>

          <div className="bg-muted/30 rounded-lg p-4 border text-left">
            <div className="flex items-center mb-3">
              <Lightbulb className="h-5 w-5 text-blue-500 mr-2" />
              <h4 className="text-base font-medium text-blue-500">Sugestões de Melhoria</h4>
            </div>
            {suggestions.length > 0 ? (
              <ul className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="text-foreground/90 flex items-start">
                    <span className="inline-block w-4 h-4 mr-2 mt-1 rounded-full bg-blue-500/20 flex-shrink-0"></span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">Nenhuma sugestão disponível.</p>
            )}
          </div>
        </>
      )}

      {/* Seção de ajuste de tom */}
      {isToneOnlyMode && toneApplied && (
        <div className="bg-muted/30 rounded-lg p-4 border text-left">
          <div className="flex items-center mb-3">
            <Wand2 className="h-5 w-5 text-purple-500 mr-2" />
            <h4 className="text-base font-medium text-purple-500">Tom Aplicado: {toneApplied}</h4>
          </div>
          {changes && changes.length > 0 && (
            <ul className="space-y-2">
              {changes.map((change, index) => (
                <li key={index} className="text-foreground/90 flex items-start">
                  <span className="inline-block w-4 h-4 mr-2 mt-1 rounded-full bg-purple-500/20 flex-shrink-0"></span>
                  {change}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Seção de reescrita */}
      {isRewriteMode && styleApplied && (
        <div className="bg-muted/30 rounded-lg p-4 border text-left">
          <div className="flex items-center mb-3">
            <Wand2 className="h-5 w-5 text-purple-500 mr-2" />
            <h4 className="text-base font-medium text-purple-500">Estilo Aplicado: {styleApplied}</h4>
          </div>
          {changes && changes.length > 0 && (
            <ul className="space-y-2">
              {changes.map((change, index) => (
                <li key={index} className="text-foreground/90 flex items-start">
                  <span className="inline-block w-4 h-4 mr-2 mt-1 rounded-full bg-purple-500/20 flex-shrink-0"></span>
                  {change}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Sempre mostrar a seção de ajustes de tom quando disponível (modo correção) */}
      {toneChanges && toneChanges.length > 0 && isCorrectionMode && (
        <div className="bg-muted/30 rounded-lg p-4 border text-left">
          <div className="flex items-center mb-3">
            <Wand2 className="h-5 w-5 text-purple-500 mr-2" />
            <h4 className="text-base font-medium text-purple-500">Ajustes de Tom</h4>
          </div>
          <ul className="space-y-2">
            {toneChanges.map((change, index) => (
              <li key={index} className="text-foreground/90 flex items-start">
                <span className="inline-block w-4 h-4 mr-2 mt-1 rounded-full bg-purple-500/20 flex-shrink-0"></span>
                {change}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Premium Footer */}
      {isPremium && (
        <div className="flex items-center justify-center pt-4 mt-6 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-purple-500">
            <Sparkles className="h-4 w-4" />
            <span className="font-medium">Processado com nossa IA avançada</span>
          </div>
        </div>
      )}
    </div>
  )
}
