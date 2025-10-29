"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Copy, Sparkles, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface HumanizeResultProps {
  humanizedText: string
  explanation: string
  originalText: string
}

export function HumanizeResult({ humanizedText, explanation, originalText }: HumanizeResultProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(humanizedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)

      toast({
        title: "Texto copiado!",
        description: "O texto humanizado foi copiado para a área de transferência.",
      })
    } catch (err) {
      console.error("Failed to copy:", err)
      toast({
        variant: "destructive",
        title: "Erro ao copiar",
        description: "Não foi possível copiar o texto.",
      })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Main Result Card */}
      <Card className="border-2 border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-500/10 rounded-lg">
                <Sparkles className="h-6 w-6 text-violet-500" />
              </div>
              <div>
                <CardTitle className="text-2xl">Texto Humanizado</CardTitle>
                <CardDescription>Seu texto foi processado e humanizado com sucesso</CardDescription>
              </div>
            </div>
            <Button onClick={handleCopy} variant="outline" size="sm">
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Humanized Text */}
          <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-violet-200 dark:border-violet-800">
            <p className="whitespace-pre-wrap leading-relaxed text-foreground">{humanizedText}</p>
          </div>

          {/* Explanation */}
          <div className="p-4 bg-violet-100/50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-violet-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-1 text-violet-900 dark:text-violet-100">
                  Mudanças Realizadas
                </h4>
                <p className="text-sm text-violet-800 dark:text-violet-200">{explanation}</p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{originalText.length}</div>
              <div className="text-xs text-muted-foreground">Caracteres originais</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{humanizedText.length}</div>
              <div className="text-xs text-muted-foreground">Caracteres humanizados</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info - Accordion */}
      <Card>
        <CardContent className="pt-6">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="original">
              <AccordionTrigger>
                <span className="text-sm font-medium">Ver Texto Original</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="p-4 bg-muted/50 rounded-lg mt-2">
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                    {originalText}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="tips">
              <AccordionTrigger>
                <span className="text-sm font-medium">Dicas de Uso</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 mt-2">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>✓ Revise o texto:</strong> Embora o texto tenha sido humanizado, sempre revise
                      o conteúdo para garantir que mantém o sentido desejado.
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-900 dark:text-green-100">
                      <strong>✓ Personalize:</strong> Adicione seu toque pessoal ao texto humanizado para
                      torná-lo ainda mais autêntico.
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-sm text-purple-900 dark:text-purple-100">
                      <strong>✓ Detecte novamente:</strong> Você pode usar o Detector de IA novamente para
                      verificar o resultado da humanização.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </motion.div>
  )
}
