"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Info, Lightbulb, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface NoTermsFoundProps {
  probability: number
  explanation?: string
  textStats?: {
    wordCount: number
    density: number
  }
  showDetails?: boolean
  onLearnMore?: () => void
  className?: string
}

export function NoTermsFound({
  probability,
  explanation = "",
  textStats,
  showDetails = true,
  onLearnMore,
  className = ""
}: NoTermsFoundProps) {
  const probabilityLevel = probability < 30 ? 'low' : probability < 60 ? 'medium' : 'high'

  const levelConfig = {
    low: {
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: Info,
      title: 'Baixa Probabilidade de IA',
      description: 'Nenhum termo específico de IA foi encontrado. O texto parece natural.'
    },
    medium: {
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      icon: AlertCircle,
      title: 'Probabilidade Moderada de IA',
      description: 'Embora não detectamos termos específicos, existem padrões estruturais que sugerem possível geração por IA.'
    },
    high: {
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: AlertCircle,
      title: 'Alta Probabilidade de IA',
      description: 'Detectamos padrões estruturais e de linguagem típicos de textos gerados por IA, mesmo sem termos específicos.'
    }
  }

  const config = levelConfig[probabilityLevel]
  const IconComponent = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card className={`${config.bgColor} ${config.borderColor} border-2`}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className={`${config.color} p-2 rounded-full bg-white/60`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className={`text-lg ${config.color}`}>
                {config.title}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {config.description}
              </p>
            </div>
            <Badge variant="outline" className={`${config.color} border-current`}>
              {probability.toFixed(1)}% IA
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Explanation Section */}
          {explanation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/60 rounded-lg p-4 border border-white/40"
            >
              <div className="flex items-start gap-3">
                <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-sm text-gray-900 mb-2">
                    Por que detectamos essa probabilidade?
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {explanation}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Text Statistics */}
          {showDetails && textStats && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/60 rounded-lg p-4 border border-white/40"
            >
              <h4 className="font-medium text-sm text-gray-900 mb-3">
                Estatísticas do Texto
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {textStats.wordCount}
                  </div>
                  <div className="text-xs text-gray-500">
                    palavras
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {(textStats.density * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    densidade
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Educational Tips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white/60 rounded-lg p-4 border border-white/40"
          >
            <h4 className="font-medium text-sm text-gray-900 mb-3">
              Como interpretamos textos sem termos específicos de IA
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                <span>Analisamos padrões estruturais e fluxo das ideias</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                <span>Verificamos complexidade da linguagem e vocabulário</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                <span>Consideramos o comprimento e densidade do texto</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                <span>Comparamos com padrões de escrita humana e artificial</span>
              </li>
            </ul>
          </motion.div>

          {/* Learn More Button */}
          {onLearnMore && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="pt-2"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={onLearnMore}
                className="w-full"
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                Saiba mais sobre detecção de IA
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default NoTermsFound