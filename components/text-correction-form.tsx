"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TextDiff } from "@/components/text-diff"
import { TextEvaluation } from "@/components/text-evaluation"
import { Loader2, Send, Copy, RotateCcw, AlertTriangle, Sparkles, Clock, Heart, Share2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { sendGTMEvent } from "@/utils/gtm-helper"
import { StarRating } from "@/components/star-rating"
import { getUserSubscription, type Subscription } from "@/utils/subscription"
import { FREE_CHARACTER_LIMIT, API_REQUEST_TIMEOUT, MIN_REQUEST_INTERVAL } from "@/utils/constants"
import { ToneAdjuster } from "@/components/tone-adjuster"
import Link from "next/link"

// Importar o utilitário do Meta Pixel
import { trackPixelCustomEvent } from "@/utils/meta-pixel"

interface TextCorrectionFormProps {
  onTextCorrected?: () => void
}

export default function TextCorrectionForm({ onTextCorrected }: TextCorrectionFormProps) {
  const [originalText, setOriginalText] = useState("")
  const [charCount, setCharCount] = useState(0)
  const [result, setResult] = useState<{
    correctedText: string
    evaluation: {
      strengths: string[]
      weaknesses: string[]
      suggestions: string[]
      score: number
      toneChanges: string[]
    }
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [requestTimer, setRequestTimer] = useState<number | null>(null)
  const lastRequestTime = useRef<number>(0)
  const { toast } = useToast()
  const [showRating, setShowRating] = useState(false)
  const [correctionId, setCorrectionId] = useState<string>("")
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [selectedTone, setSelectedTone] = useState<
    "Padrão" | "Formal" | "Informal" | "Acadêmico" | "Criativo" | "Conciso" | "Romântico"
  >("Padrão")

  // Detectar se é dispositivo móvel
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Verificar inicialmente
    checkMobile()

    // Adicionar listener para redimensionamento
    window.addEventListener("resize", checkMobile)

    // Limpar listener
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Limpar o timer quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (requestTimer) {
        clearTimeout(requestTimer)
      }
    }
  }, [requestTimer])

  // Atualizar a contagem de caracteres quando o texto mudar
  useEffect(() => {
    setCharCount(originalText.length)
  }, [originalText])

  // Carregar a assinatura do usuário
  useEffect(() => {
    const loadSubscription = async () => {
      const userSubscription = await getUserSubscription()
      setSubscription(userSubscription)
    }

    loadSubscription()
  }, [])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    // Limitar o texto ao número máximo de caracteres
    const characterLimit = subscription?.features.characterLimit || FREE_CHARACTER_LIMIT
    if (newText.length <= characterLimit) {
      setOriginalText(newText)
      // Atualizar o estado isTyping quando o usuário começar a digitar
      if (newText.length > 0 && !isTyping) {
        setIsTyping(true)
      } else if (newText.length === 0 && isTyping) {
        setIsTyping(false)
      }
    } else {
      // Se o usuário tentar colar um texto maior que o limite, cortar para o tamanho máximo
      setOriginalText(newText.slice(0, characterLimit))
      setIsTyping(true)
      toast({
        title: "Limite de caracteres atingido",
        description: `O texto foi limitado a ${characterLimit} caracteres.`,
        variant: "destructive",
      })
    }
  }

  // Modificar a função handleToneChange para tratar o caso "Padrão" de forma especial
  const handleToneChange = (tone: string) => {
    setSelectedTone(tone as "Padrão" | "Formal" | "Informal" | "Acadêmico" | "Criativo" | "Conciso" | "Romântico")
    console.log(`Tom selecionado: ${tone}`)
  }

  // Modificar a função sanitizeText para preservar acentuação
  const sanitizeText = (text: string) => {
    // Remover caracteres invisíveis e potencialmente perigosos
    // mas preservar acentuação e caracteres especiais do português
    let sanitized = text
      .trim()
      .replace(/[\u200B-\u200D\uFEFF]/g, "") // Remover caracteres de largura zero
      .replace(/\u00A0/g, " ") // Substituir espaços não-quebráveis por espaços normais
      .replace(/[\r\n]+/g, "\n") // Normalizar quebras de linha

    // Remover tags HTML exceto <br>, mas preservar acentuação
    sanitized = sanitized.replace(/<(?!br\s*\/?)[^>]+>/gi, "")

    // Limitar o comprimento para evitar problemas com textos muito longos
    const characterLimit = subscription?.features.characterLimit || FREE_CHARACTER_LIMIT
    if (sanitized.length > characterLimit) {
      sanitized = sanitized.substring(0, characterLimit)
    }

    return sanitized
  }

  // Verificar se o texto contém conteúdo suspeito
  const containsSuspiciousContent = (text: string): boolean => {
    const suspiciousPatterns = [
      /<script>/i,
      /javascript:/i,
      /onerror=/i,
      /onload=/i,
      /eval\(/i,
      /document\.cookie/i,
      /fetch\(/i,
      /localStorage/i,
      /sessionStorage/i,
    ]

    return suspiciousPatterns.some((pattern) => pattern.test(text))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Verificar texto vazio
    if (!originalText.trim()) {
      toast({
        title: "Texto vazio",
        description: "Por favor, insira um texto para correção.",
        variant: "destructive",
      })
      return
    }

    // Verificar limite de caracteres
    const characterLimit = subscription?.features.characterLimit || FREE_CHARACTER_LIMIT
    if (originalText.length > characterLimit) {
      toast({
        title: "Texto muito longo",
        description: `Por favor, reduza o texto para no máximo ${characterLimit} caracteres.`,
        variant: "destructive",
      })
      return
    }

    // Verificar conteúdo suspeito
    if (containsSuspiciousContent(originalText)) {
      toast({
        title: "Conteúdo não permitido",
        description: "O texto contém conteúdo que não é permitido. Por favor, remova qualquer código ou script.",
        variant: "destructive",
      })
      return
    }

    // Verificar intervalo entre requisições
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime.current

    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = Math.ceil((MIN_REQUEST_INTERVAL - timeSinceLastRequest) / 1000)
      toast({
        title: "Muitas requisições",
        description: `Por favor, aguarde ${waitTime} segundos antes de enviar outra correção.`,
        variant: "destructive",
      })
      return
    }

    // Atualizar o tempo da última requisição
    lastRequestTime.current = now

    // Sanitizar o texto antes de enviar
    const textToSend = sanitizeText(originalText)

    // Gerar um ID único para a correção
    const newCorrectionId = crypto.randomUUID()
    setCorrectionId(newCorrectionId)

    setIsLoading(true)
    setError(null)

    // Configurar um timeout para a requisição
    const timeoutId = window.setTimeout(() => {
      if (isLoading) {
        setIsLoading(false)
        setError(
          "O servidor demorou muito para responder. Por favor, tente novamente com um texto menor ou mais tarde.",
        )
        toast({
          title: "Tempo limite excedido",
          description: "O servidor demorou muito para responder. Por favor, tente novamente.",
          variant: "destructive",
        })
      }
    }, API_REQUEST_TIMEOUT)

    setRequestTimer(timeoutId)

    try {
      console.log("Cliente: Iniciando requisição para correção de texto")

      // Usar nossa API proxy em vez do webhook diretamente
      const controller = new AbortController()
      const signal = controller.signal

      console.log("Cliente: Enviando texto para API")
      const response = await fetch("/api/correct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: textToSend,
          isMobile: isMobile,
          tone: selectedTone, // Sempre enviar o tom selecionado, incluindo "Padrão"
        }),
        signal,
      })
      console.log(`Cliente: Resposta recebida com status ${response.status}`)

      // Limpar o timeout se a resposta chegar
      clearTimeout(timeoutId)
      setRequestTimer(null)

      if (!response.ok) {
        let errorMessage = "Erro na resposta do servidor"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || `Erro na resposta do servidor: ${response.status}`
        } catch (e) {
          // Se não conseguir parsear o JSON, usar mensagem genérica
          errorMessage = `Erro na resposta do servidor: ${response.status}`
        }

        // Mensagens específicas para diferentes códigos de status
        if (response.status === 504) {
          errorMessage =
            "O servidor demorou muito para responder. Por favor, tente novamente com um texto menor ou mais tarde."
        } else if (response.status === 429) {
          errorMessage =
            "Você fez muitas requisições em um curto período. Por favor, aguarde um momento antes de tentar novamente."
        } else if (response.status === 413) {
          errorMessage = "O texto é muito grande. Por favor, reduza o tamanho do texto."
        }

        throw new Error(errorMessage)
      }

      // Processar a resposta
      console.log("Cliente: Processando resposta JSON")
      const data = await response.json()
      console.log("Cliente: Resposta JSON processada com sucesso")

      // Verificar se a resposta tem o formato esperado e criar estrutura padrão se necessário
      const processedData = {
        correctedText: "",
        evaluation: {
          strengths: [],
          weaknesses: [],
          suggestions: [],
          score: 7,
          toneChanges: [], // Adicionar o novo campo toneChanges
        },
      }

      if (data.correctedText) {
        processedData.correctedText = data.correctedText
      } else {
        console.error("Cliente: Campo correctedText não encontrado na resposta")
        throw new Error("Formato de resposta inválido: texto corrigido não encontrado")
      }

      if (data.evaluation) {
        processedData.evaluation = {
          strengths: data.evaluation.strengths || [],
          weaknesses: data.evaluation.weaknesses || [],
          suggestions: data.evaluation.suggestions || [],
          score: data.evaluation.score || 7,
          toneChanges: data.evaluation.toneChanges || [], // Adicionar o campo toneChanges
        }
      } else {
        console.warn("Cliente: Campo evaluation não encontrado na resposta, usando padrão")
      }

      // Processar o texto corrigido (remover aspas extras se necessário)
      let processedText = processedData.correctedText
      if (typeof processedText === "string" && processedText.startsWith('"') && processedText.endsWith('"')) {
        processedText = processedText.slice(1, -1)
      }

      setResult({
        correctedText: processedText,
        evaluation: processedData.evaluation,
      })

      // Modificar a parte onde definimos os flags após a correção bem-sucedida
      // Localizar a seção após setResult({...}) e antes do toast

      // Marcar que o texto foi corrigido para exibir o widget de doação
      localStorage.setItem("text-corrected", "true")
      // Limpar o flag "banner-closed" para permitir que o banner apareça novamente após uma nova correção
      localStorage.removeItem("banner-closed")
      // Definir um flag específico para mostrar o banner de anúncios
      localStorage.setItem("show-ad-banner", "true")

      // Disparar eventos para notificar outras partes da aplicação
      window.dispatchEvent(new Event("storage"))
      // Disparar um evento personalizado para garantir que o banner seja exibido
      window.dispatchEvent(new CustomEvent("showAdBanner"))

      // Adicionar um pequeno atraso para garantir que o banner apareça após o toast
      setTimeout(() => {
        // Disparar os eventos novamente após um pequeno atraso
        window.dispatchEvent(new Event("storage"))
        window.dispatchEvent(new CustomEvent("showAdBanner"))
      }, 1000)

      // Mostrar o banner APENAS quando o texto for corrigido com sucesso
      // setShowAdPopup(true)

      // Marcar que o texto foi corrigido para exibir o widget de doação
      localStorage.setItem("text-corrected", "true")
      // Limpar o flag "banner-closed" para permitir que o banner apareça novamente após uma nova correção
      localStorage.removeItem("banner-closed")
      // Definir um flag específico para mostrar o banner de anúncios
      localStorage.setItem("show-ad-banner", "true")
      // Disparar um evento para notificar outras partes da aplicação
      window.dispatchEvent(new Event("storage"))

      // Enviar evento para o GTM
      sendGTMEvent("text_corrected", {
        textLength: originalText.length,
        correctionScore: processedData.evaluation.score || 0,
        tone: selectedTone,
      })

      // Rastrear evento de correção no Meta Pixel
      trackPixelCustomEvent("TextCorrected", {
        text_length: originalText.length,
        correction_score: processedData.evaluation.score || 0,
        tone: selectedTone,
      })

      toast({
        title: "Texto corrigido com sucesso!",
        description: "Confira os resultados abaixo.",
      })

      // Mostrar a avaliação após a correção bem-sucedida
      setShowRating(true)

      // Chamar o callback se existir
      if (onTextCorrected) {
        onTextCorrected()
      }
    } catch (error) {
      // Limpar o timeout se ocorrer um erro
      clearTimeout(timeoutId)
      setRequestTimer(null)

      console.error("Cliente: Erro ao processar o texto:", error)

      // Mensagem de erro específica para AbortError (timeout do fetch)
      if (error.name === "AbortError") {
        setError(
          "O servidor demorou muito para responder. Por favor, tente novamente com um texto menor ou mais tarde.",
        )
      } else if (error.message && error.message.includes("404")) {
        // Erro específico para webhook não encontrado
        setError(
          "O serviço de correção está temporariamente indisponível. Estamos trabalhando para resolver o problema. Por favor, tente novamente mais tarde.",
        )
      } else {
        setError(`Erro ao processar o texto: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
      }

      // Garantir que o banner não seja exibido em caso de erro
      // setShowAdPopup(false)

      toast({
        title: "Erro ao corrigir texto",
        description:
          error instanceof Error ? error.message : "Não foi possível processar a correção. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.correctedText)

      // Enviar evento para o GTM
      sendGTMEvent("text_copied", {
        textLength: result.correctedText.length,
      })

      toast({
        title: "Copiado!",
        description: "O texto corrigido foi copiado para a área de transferência.",
      })
    }
  }

  const handleReset = () => {
    setOriginalText("")
    setResult(null)
    setError(null)
    setIsTyping(false)
    setShowRating(false)
  }

  // Calcular a cor do contador de caracteres
  const getCounterColor = () => {
    const characterLimit = subscription?.features.characterLimit || FREE_CHARACTER_LIMIT
    if (charCount > characterLimit * 0.9) return "text-red-500"
    if (charCount > characterLimit * 0.7) return "text-yellow-500"
    return "text-muted-foreground"
  }

  // Adicionar a função para lidar com a submissão da avaliação
  const handleRatingSubmit = (rating: number) => {
    console.log(`Avaliação recebida: ${rating} estrelas`)
    // Aqui você pode implementar a lógica para enviar a avaliação para um backend
    // ou armazená-la de alguma forma
  }

  return (
    <Card className="w-full shadow-sm">
      <CardContent className="p-4 sm:p-6">
        {error && (
          <Alert variant="destructive" className="mb-6 bg-destructive/10 border-destructive/30">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro no serviço</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mb-4 bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-start">
          <Heart className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-foreground/80">
            Ajude a manter este serviço gratuito! Aceitamos doações a partir de R$1 via PIX. Sua contribuição é
            fundamental para continuarmos oferecendo correções de texto de qualidade.{" "}
            <Link
              href="/apoiar"
              onClick={() => {
                sendGTMEvent("donation_click", {
                  location: "correction_form",
                  element_type: "notice_link",
                  section: "form_header",
                })
              }}
              className="font-medium text-green-500 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 underline decoration-dotted underline-offset-2 transition-colors px-1 rounded hover:bg-green-500/10"
            >
              Faça sua doação aqui
            </Link>
            .
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Textarea
              placeholder="Digite ou cole seu texto aqui para correção..."
              className="min-h-[180px] resize-y text-base p-4 focus-visible:ring-primary bg-background border rounded-lg text-foreground"
              value={originalText}
              onChange={handleTextChange}
              disabled={isLoading}
              maxLength={subscription?.features.characterLimit || FREE_CHARACTER_LIMIT}
              aria-label="Texto para correção"
            />
            <div className="absolute top-3 right-3">
              <div
                className={`transition-opacity duration-300 ${
                  isTyping ? "opacity-0" : "opacity-100"
                } hidden md:flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-xs`}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                <span>IA Avançada</span>
              </div>
            </div>
          </div>

          {/* Contador de caracteres */}
          <div className={`text-xs text-right ${getCounterColor()}`}>
            {charCount}/{subscription?.features.characterLimit || FREE_CHARACTER_LIMIT} caracteres
          </div>

          {/* Adicionar o componente de ajuste de tom */}
          <div className="mb-4">
            <ToneAdjuster onToneChange={handleToneChange} disabled={isLoading} />
          </div>

          {/* Melhorar a responsividade dos botões */}
          <div className="flex flex-wrap gap-3 justify-end">
            {originalText && (
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isLoading}
                className="w-full sm:w-auto order-3 sm:order-1"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            )}
            <Button
              variant="outline"
              className="bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20 relative group w-full sm:w-auto order-2 sm:order-2"
              onClick={() => {
                sendGTMEvent("donation_button_click", {
                  location: "correction_form",
                })
              }}
              asChild
            >
              <Link
                href="/apoiar"
                onClick={() => {
                  sendGTMEvent("donation_click", {
                    location: "correction_form",
                    element_type: "donate_button",
                    section: "form_actions",
                  })
                }}
              >
                <Heart className="mr-2 h-4 w-4 transition-transform group-hover:animate-heartbeat" />
                <span className="relative z-10">Doar</span>
                <span className="absolute inset-0 bg-green-500/0 group-hover:bg-green-500/10 transition-colors duration-300 rounded-md"></span>
              </Link>
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                !originalText.trim() ||
                charCount > (subscription?.features.characterLimit || FREE_CHARACTER_LIMIT)
              }
              className="px-6 relative overflow-hidden group w-full sm:w-auto order-1 sm:order-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Corrigindo...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  Corrigir
                </>
              )}
            </Button>
          </div>

          {/* Aviso de tempo de processamento */}
          {isLoading && (
            <div className="flex items-center justify-center text-xs text-muted-foreground mt-2">
              <Clock className="h-3 w-3 mr-1" />
              <span>Textos maiores podem levar até 1 minuto para processar</span>
            </div>
          )}
        </form>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-8"
          >
            <Tabs defaultValue="corrected" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4 md:mb-6 bg-muted/50 p-0.5 sm:p-1 rounded-lg text-xs sm:text-sm">
                <TabsTrigger
                  value="corrected"
                  className="rounded-md py-1.5 px-1 sm:px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <span className="hidden sm:inline">Texto </span>Corrigido
                </TabsTrigger>
                <TabsTrigger
                  value="diff"
                  className="rounded-md py-1.5 px-1 sm:px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Comparação
                </TabsTrigger>
                <TabsTrigger
                  value="evaluation"
                  className="rounded-md py-1.5 px-1 sm:px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Avaliação
                </TabsTrigger>
              </TabsList>

              <TabsContent value="corrected" className="mt-0">
                <Card>
                  <CardContent className="p-2 sm:p-4 md:p-6">
                    <div className="p-2 sm:p-4 bg-muted/30 rounded-lg whitespace-pre-wrap mb-4 text-foreground border text-left text-sm sm:text-base">
                      {result.correctedText}
                    </div>
                    {/* Melhorar a responsividade dos botões de ação */}
                    <div className="flex flex-col sm:flex-row gap-2 justify-end">
                      <Button
                        onClick={handleCopy}
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto text-xs sm:text-sm py-2 h-auto"
                      >
                        <Copy className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Copiar Texto
                      </Button>
                      <Button
                        onClick={() => {
                          // Criar URL para compartilhar no WhatsApp com assinatura entre parênteses e em uma nova linha
                          // Usando um coração representado por um caractere mais compatível
                          const whatsappText = encodeURIComponent(
                            `${result.correctedText}

(Texto revisado pelo https://corretordetextoonline.com.br/)`,
                          )
                          const whatsappUrl = `https://wa.me/?text=${whatsappText}`

                          // Registrar evento no GTM
                          sendGTMEvent("whatsapp_share", {
                            textLength: result.correctedText.length,
                          })

                          // Abrir em nova janela/aba
                          window.open(whatsappUrl, "_blank")
                        }}
                        size="sm"
                        className="w-full sm:w-auto text-xs sm:text-sm py-2 h-auto bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Share2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Compartilhar no WhatsApp
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="diff" className="mt-0">
                <Card>
                  <CardContent className="p-2 sm:p-4 md:p-6">
                    <TextDiff original={originalText} corrected={result.correctedText} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="evaluation" className="mt-0">
                <Card>
                  <CardContent className="p-2 sm:p-4 md:p-6">
                    <TextEvaluation evaluation={result.evaluation} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}

        {result && showRating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6"
          >
            <StarRating
              onRatingSubmit={handleRatingSubmit}
              correctionId={correctionId}
              textLength={originalText.length}
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="mt-6 flex justify-center"
            >
              <Button
                size="lg"
                className="bg-green-500 hover:bg-green-600 text-white px-8 w-full sm:w-auto"
                onClick={() => {
                  sendGTMEvent("donation_button_click", {
                    location: "after_rating",
                  })
                }}
                asChild
              >
                <Link
                  href="/apoiar"
                  onClick={() => {
                    sendGTMEvent("donation_click", {
                      location: "after_rating",
                      element_type: "support_button",
                      section: "rating_section",
                    })
                  }}
                >
                  <Heart className="mr-2 h-5 w-5" />
                  Apoiar o CorretorIA
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        )}

        <style jsx global>{`
         @keyframes heartbeat {
           0%, 100% { transform: scale(1); }
           25% { transform: scale(1.4); }
           50% { transform: scale(1); }
           75% { transform: scale(1.2); }
         }
         
         .animate-heartbeat {
           animation: heartbeat 1.2s ease-in-out infinite;
         }
       `}</style>
      </CardContent>
    </Card>
  )
}
