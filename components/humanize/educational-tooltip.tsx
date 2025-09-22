"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, X, Lightbulb, Brain, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TooltipContent {
  title: string
  description: string
  details?: string[]
  tips?: string[]
  category?: 'info' | 'warning' | 'success' | 'educational'
}

interface EducationalTooltipProps {
  content: TooltipContent
  trigger?: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const tooltipPresets = {
  probabilityBaseline: {
    title: 'Probabilidade Base',
    description: 'Todo texto tem uma probabilidade mínima baseada em seu comprimento e estrutura.',
    details: [
      'Textos mais longos tendem a ter probabilidades mais altas',
      'A estrutura gramatical influencia o cálculo',
      'Padrões de pontuação são considerados'
    ],
    tips: [
      'Varie o comprimento das frases',
      'Use pontuação diversificada',
      'Inclua expressões mais naturais'
    ],
    category: 'educational' as const
  },
  aiTerms: {
    title: 'Termos de IA Detectados',
    description: 'Palavras e frases comumente usadas por IAs generativas.',
    details: [
      'Vocabulário técnico muito específico',
      'Expressões formais excessivas',
      'Padrões de linguagem repetitivos'
    ],
    tips: [
      'Use sinônimos variados',
      'Prefira linguagem mais coloquial',
      'Evite repetições desnecessárias'
    ],
    category: 'warning' as const
  },
  confidence: {
    title: 'Nível de Confiança',
    description: 'Indica quão certo está nosso algoritmo sobre a análise.',
    details: [
      'Baixo: Análise inconclusiva, precisa mais dados',
      'Médio: Indícios suficientes para conclusão',
      'Alto: Padrões claros identificados'
    ],
    category: 'info' as const
  },
  density: {
    title: 'Densidade de IA',
    description: 'Proporção de termos de IA em relação ao texto total.',
    details: [
      'Calculada como: (termos IA / total palavras) × 100',
      'Densidades altas indicam mais probabilidade de IA',
      'Considera apenas termos únicos identificados'
    ],
    tips: [
      'Substitua termos técnicos por equivalentes simples',
      'Use mais exemplos práticos',
      'Inclua expressões idiomáticas'
    ],
    category: 'educational' as const
  },
  markdown: {
    title: 'Padrões Markdown',
    description: 'Detecção de sintaxe markdown como forte indicador de IA.',
    details: [
      'Headers (# ## ###) são muito comuns em textos de IA',
      'Links [texto](url) em excesso indicam formatação artificial',
      'Blocos de código ``` são típicos de documentação gerada',
      'Tabelas markdown | col | são estruturas muito organizadas'
    ],
    tips: [
      'Remova formatação markdown desnecessária',
      'Use texto corrido em vez de headers excessivos',
      'Prefira descrições a listas estruturadas'
    ],
    category: 'warning' as const
  },
  bulletPoints: {
    title: 'Bullet Points Excessivos',
    description: 'Densidade muito alta de listas indica organização artificial.',
    details: [
      'IAs tendem a organizar tudo em listas',
      'Mais de 30% das linhas com bullets é suspeito',
      'Hierarquia excessiva (sub-listas) é artificial',
      'Múltiplos tipos de bullets indica estruturação'
    ],
    tips: [
      'Use parágrafos corridos em vez de listas',
      'Varie a estrutura do texto',
      'Reduza a hierarquização excessiva'
    ],
    category: 'warning' as const
  },
  structure: {
    title: 'Estrutura Excessiva',
    description: 'Organização muito rígida típica de textos gerados.',
    details: [
      'Parágrafos com tamanho idêntico são artificiais',
      'Listas numeradas muito longas (>8 itens)',
      'Seções organizadas em excesso (>5)',
      'Padrões repetitivos na estrutura'
    ],
    tips: [
      'Varie o comprimento dos parágrafos',
      'Quebre listas longas em texto corrido',
      'Torne a organização menos rígida'
    ],
    category: 'educational' as const
  }
}

export function EducationalTooltip({
  content,
  trigger,
  position = 'top',
  size = 'md',
  className = ""
}: EducationalTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)

  const categoryConfig = {
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      icon: HelpCircle
    },
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      icon: Target
    },
    success: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      icon: Target
    },
    educational: {
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      iconColor: 'text-purple-600',
      icon: Brain
    }
  }

  const sizeConfig = {
    sm: { width: 'w-72', padding: 'p-4' },
    md: { width: 'w-80', padding: 'p-5' },
    lg: { width: 'w-96', padding: 'p-6' }
  }

  const positionConfig = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2'
  }

  const config = categoryConfig[content.category || 'info']
  const IconComponent = config.icon

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Mais informações"
      >
        {trigger || <HelpCircle className="w-4 h-4" />}
      </button>

      {/* Tooltip */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Tooltip Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 10 : -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: position === 'top' ? 10 : -10 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className={`
                absolute z-50 ${positionConfig[position]}
                ${sizeConfig[size].width}
              `}
            >
              <Card className={`
                ${config.bgColor} ${config.borderColor}
                border-2 shadow-xl
              `}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`${config.iconColor} p-2 bg-white/60 rounded-full`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-gray-900">
                        {content.title}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="h-6 w-6 p-0 hover:bg-white/60"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className={sizeConfig[size].padding.replace('p-', 'px-').replace(/\d+/, m => (parseInt(m) - 1).toString()) + ' pb-4'}>
                  {/* Description */}
                  <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                    {content.description}
                  </p>

                  {/* Details */}
                  {content.details && content.details.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">
                        Detalhes
                      </h4>
                      <ul className="space-y-1.5">
                        {content.details.map((detail, index) => (
                          <li key={index} className="flex items-start gap-2 text-xs text-gray-600">
                            <div className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                            <span className="leading-relaxed">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tips */}
                  {content.tips && content.tips.length > 0 && (
                    <div className="bg-white/60 rounded-lg p-3 border border-white/40">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-3 h-3 text-amber-600" />
                        <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                          Dicas de Melhoria
                        </h4>
                      </div>
                      <ul className="space-y-1.5">
                        {content.tips.map((tip, index) => (
                          <li key={index} className="flex items-start gap-2 text-xs text-gray-600">
                            <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                            <span className="leading-relaxed">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Arrow */}
              <div
                className={`
                  absolute w-0 h-0
                  ${position === 'top' ? 'top-full left-4 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white' : ''}
                  ${position === 'bottom' ? 'bottom-full left-4 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white' : ''}
                  ${position === 'left' ? 'left-full top-4 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-white' : ''}
                  ${position === 'right' ? 'right-full top-4 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-white' : ''}
                `}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// Preset tooltips for common use cases
export const ProbabilityTooltip = () => (
  <EducationalTooltip content={tooltipPresets.probabilityBaseline} />
)

export const AITermsTooltip = () => (
  <EducationalTooltip content={tooltipPresets.aiTerms} />
)

export const ConfidenceTooltip = () => (
  <EducationalTooltip content={tooltipPresets.confidence} />
)

export const DensityTooltip = () => (
  <EducationalTooltip content={tooltipPresets.density} />
)

export const MarkdownTooltip = () => (
  <EducationalTooltip content={tooltipPresets.markdown} />
)

export const BulletPointsTooltip = () => (
  <EducationalTooltip content={tooltipPresets.bulletPoints} />
)

export const StructureTooltip = () => (
  <EducationalTooltip content={tooltipPresets.structure} />
)

export default EducationalTooltip