import { CheckCircle, AlertCircle, Lightbulb, Wand2 } from "lucide-react"

interface TextEvaluationProps {
  evaluation: {
    strengths: string[]
    weaknesses: string[]
    suggestions: string[]
    score: number
    toneChanges?: string[] // Adicionar o campo opcional toneChanges
  }
}

export function TextEvaluation({ evaluation }: TextEvaluationProps) {
  const { strengths, weaknesses, suggestions, score, toneChanges } = evaluation

  // Verificar se estamos no modo de apenas ajustes de tom
  const isToneOnlyMode =
    toneChanges &&
    toneChanges.length > 0 &&
    strengths.length === 0 &&
    weaknesses.length === 0 &&
    suggestions.length === 0

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
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium">{isToneOnlyMode ? "Ajustes de Tom" : "Pontuação Geral"}</h4>
        {!isToneOnlyMode && (
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

      {/* Sempre mostrar a seção de ajustes de tom quando disponível */}
      {toneChanges && toneChanges.length > 0 && (
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
    </div>
  )
}
