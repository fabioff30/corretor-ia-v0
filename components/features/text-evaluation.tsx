"use client"

import { useState } from "react"
import { CheckCircle, AlertCircle, Lightbulb, Wand2, Sparkles, BookOpen, Crown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BlurredPremiumSection } from "@/components/premium/blurred-premium-section"
import { PremiumFeatureUpsellModal } from "@/components/premium/premium-feature-upsell-modal"
import { ErrorStatsSection, ErrorStats } from "@/components/features/error-stats-section"
import { PersonalizedTipSection } from "@/components/features/personalized-tip-section"
import { ImproveTipsSection, ImproveTip } from "@/components/features/improve-tips-section"
import { useRouter } from "next/navigation"
import { sendGTMEvent } from "@/utils/gtm-helper"

interface TextEvaluationProps {
  evaluation: {
    strengths: string[]
    weaknesses: string[]
    suggestions: string[]
    score: number
    toneChanges?: string[]
    styleApplied?: string
    changes?: string[]
    toneApplied?: string
    // Premium fields
    improvements?: string[]
    analysis?: string
    model?: string
    // Novos campos premium (vindos do backend)
    errorStats?: ErrorStats
    personalizedTip?: string
    improveTips?: ImproveTip[]
  }
  isPremiumUser?: boolean
}

export function TextEvaluation({ evaluation, isPremiumUser = false }: TextEvaluationProps) {
  const router = useRouter()
  const [showUpsellModal, setShowUpsellModal] = useState(false)
  const [upsellFeatureName, setUpsellFeatureName] = useState("Analises Avancadas")

  const {
    strengths,
    weaknesses,
    suggestions,
    score,
    toneChanges,
    styleApplied,
    changes,
    toneApplied,
    improvements,
    analysis,
    errorStats,
    personalizedTip,
    improveTips,
  } = evaluation

  // Detecta se e uma avaliacao premium (baseado nos campos recebidos)
  const hasPremiumContent = !!(improvements || analysis || errorStats || personalizedTip || improveTips)

  // Verificar o modo de operacao
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

  // Handler para upgrade quando usuario clica em conteudo bloqueado
  const handleUpgradeClick = (featureName: string) => {
    setUpsellFeatureName(featureName)
    setShowUpsellModal(true)
    sendGTMEvent("premium_feature_blocked_click", {
      feature_name: featureName,
      location: "text_evaluation",
    })
  }

  // Dados mock para preview do blur (quando usuario gratuito)
  const mockErrorStats: ErrorStats = {
    totalErrors: 5,
    categories: [
      { category: "ortografia", count: 2, percentage: 40 },
      { category: "gramatica", count: 2, percentage: 40 },
      { category: "pontuacao", count: 1, percentage: 20 },
    ],
  }

  const mockPersonalizedTip = "Seu texto mostra bom dominio da estrutura narrativa, mas poderia se beneficiar de transicoes mais suaves entre paragrafos para melhorar o fluxo de leitura."

  const mockImproveTips: ImproveTip[] = [
    {
      what: "Variar o inicio das frases",
      why: "Muitas frases comecam com o mesmo padrao, criando monotonia",
      how: "Tente iniciar algumas frases com advérbios, gerandivos ou oracoes subordinadas",
    },
    {
      what: "Usar conectivos mais elaborados",
      why: "A conexao entre ideias pode ficar mais clara e elegante",
      how: "Substitua 'e' e 'mas' por conectivos como 'alem disso', 'contudo', 'nao obstante'",
    },
  ]

  return (
    <>
      <div className="space-y-6 text-foreground">
        {/* Premium Badge */}
        {hasPremiumContent && isPremiumUser && (
          <div className="flex justify-center mb-4">
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none px-4 py-1.5">
              <Crown className="h-3.5 w-3.5 mr-1.5" />
              Analise Premium
            </Badge>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h4 className="text-lg font-medium">
            {isToneOnlyMode ? "Ajuste de Tom" : isRewriteMode ? "Reescrita" : "Pontuacao Geral"}
          </h4>
          {isCorrectionMode && (
            <div
              className={`text-2xl font-bold ${getScoreColor()} px-4 py-2 rounded-full ${getScoreBackground()} border`}
            >
              {score}/10
            </div>
          )}
        </div>

        {/* Mostrar secoes de avaliacao apenas se nao estivermos no modo de apenas ajustes de tom */}
        {!isToneOnlyMode && (
          <>
            {/* SECAO PREMIUM: Estatisticas de Erros */}
            {isCorrectionMode && (
              isPremiumUser && errorStats ? (
                <ErrorStatsSection errorStats={errorStats} />
              ) : (
                <BlurredPremiumSection
                  onUpgradeClick={() => handleUpgradeClick("Estatisticas de Erros")}
                  title="Estatisticas de Erros"
                  subtitle="Veja categorias detalhadas"
                >
                  <ErrorStatsSection errorStats={mockErrorStats} />
                </BlurredPremiumSection>
              )
            )}

            {/* SECAO PREMIUM: Dica Personalizada */}
            {isCorrectionMode && (
              isPremiumUser && personalizedTip ? (
                <PersonalizedTipSection tip={personalizedTip} />
              ) : (
                <BlurredPremiumSection
                  onUpgradeClick={() => handleUpgradeClick("Dicas Personalizadas")}
                  title="Dica Personalizada"
                  subtitle="Feedback exclusivo para seu texto"
                >
                  <PersonalizedTipSection tip={mockPersonalizedTip} />
                </BlurredPremiumSection>
              )
            )}

            {/* Premium: Analise Detalhada (existente) */}
            {analysis && (
              <div className="relative overflow-hidden rounded-xl p-6 border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-background text-left">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -z-10" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-purple-500/20 mr-3">
                      <BookOpen className="h-5 w-5 text-purple-500" />
                    </div>
                    <h4 className="text-base font-semibold text-purple-500">Analise Detalhada</h4>
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                </div>
                <p className="text-foreground/90 leading-relaxed">{analysis}</p>
              </div>
            )}

            {/* Premium: Melhorias Aplicadas (existente) */}
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

            {/* SECAO PREMIUM: Dicas de Melhoria */}
            {isCorrectionMode && (
              isPremiumUser && improveTips && improveTips.length > 0 ? (
                <ImproveTipsSection tips={improveTips} />
              ) : (
                <BlurredPremiumSection
                  onUpgradeClick={() => handleUpgradeClick("Dicas de Melhoria")}
                  title="Dicas de Melhoria"
                  subtitle="O que, por que e como melhorar"
                >
                  <ImproveTipsSection tips={mockImproveTips} />
                </BlurredPremiumSection>
              )
            )}

            {/* Secoes gratuitas existentes */}
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
                <h4 className="text-base font-medium text-blue-500">Sugestoes de Melhoria</h4>
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
                <p className="text-muted-foreground">Nenhuma sugestao disponível.</p>
              )}
            </div>
          </>
        )}

        {/* Secao de ajuste de tom */}
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

        {/* Secao de reescrita */}
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

        {/* Sempre mostrar a secao de ajustes de tom quando disponivel (modo correcao) */}
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
        {hasPremiumContent && isPremiumUser && (
          <div className="flex items-center justify-center pt-4 mt-6 border-t border-border/50">
            <div className="flex items-center gap-2 text-sm text-purple-500">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">Processado com nossa IA avancada</span>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Upsell Premium */}
      <PremiumFeatureUpsellModal
        isOpen={showUpsellModal}
        onClose={() => setShowUpsellModal(false)}
        featureName={upsellFeatureName}
      />
    </>
  )
}
