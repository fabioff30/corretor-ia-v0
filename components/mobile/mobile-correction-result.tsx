"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TextDiff } from "@/components/text-diff"
import { TextEvaluation } from "@/components/features/text-evaluation"
import { StarRating } from "@/components/star-rating"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Copy, Check, RotateCcw, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/hooks/use-user"
import { motion } from "framer-motion"
import { sendGTMEvent } from "@/utils/gtm-helper"
import { isBlackFridayActive } from "@/utils/constants"
import Link from "next/link"

interface MobileCorrectionResultProps {
    originalText: string
    correctedText: string
    evaluation: any
    onReset: () => void
}

export function MobileCorrectionResult({
    originalText,
    correctedText,
    evaluation,
    onReset
}: MobileCorrectionResultProps) {
    const { toast } = useToast()
    const { isPro } = useUser()
    const [copied, setCopied] = useState(false)

    const handleRatingSubmit = (rating: number) => {
        sendGTMEvent("mobile_correction_rated", {
            rating,
            text_length: originalText.length
        })
        // Não esconder - deixar o componente mostrar feedback e depoimentos
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(correctedText)
            setCopied(true)
            toast({
                title: "Texto copiado!",
                description: "O texto corrigido foi copiado para a área de transferência.",
            })
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            toast({
                title: "Erro ao copiar",
                description: "Não foi possível copiar o texto.",
                variant: "destructive",
            })
        }
    }

    return (
        <div className="flex flex-col min-h-[100dvh] bg-background pb-24">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={onReset} className="-ml-2">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="font-semibold text-lg">Resultado</h2>
                <Button variant="ghost" size="icon" onClick={handleCopy}>
                    {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
                <Tabs defaultValue="corrected" className="w-full">
                    <div className="px-4 pt-4">
                        <TabsList className="w-full grid grid-cols-3 mb-4">
                            <TabsTrigger value="corrected">Corrigido</TabsTrigger>
                            <TabsTrigger value="diff">Comparação</TabsTrigger>
                            <TabsTrigger value="analysis">Análise</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="corrected" className="mt-0 px-4 pb-4">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card border rounded-xl p-4 shadow-sm min-h-[300px] whitespace-pre-wrap text-lg leading-relaxed"
                        >
                            {correctedText}
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="diff" className="mt-0 px-4 pb-4">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card border rounded-xl overflow-hidden shadow-sm"
                        >
                            <TextDiff original={originalText} corrected={correctedText} />
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="analysis" className="mt-0 px-4 pb-4">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <TextEvaluation evaluation={evaluation} />
                        </motion.div>
                    </TabsContent>
                </Tabs>

                {/* User Rating */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="px-4 pb-4"
                >
                    <StarRating
                        onRatingSubmit={handleRatingSubmit}
                        correctionId={`mobile-${Date.now()}`}
                        textLength={originalText.length}
                    />
                </motion.div>

                {/* Black Friday Promo - apenas para usuários free */}
                {isBlackFridayActive() && !isPro && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="px-4 pb-4"
                    >
                        <Link href="/black-friday?utm_source=mobile&utm_medium=correction_result&utm_campaign=blackfriday2025">
                            <div className="bg-black text-white rounded-xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Zap className="h-5 w-5 text-yellow-400" />
                                    <div>
                                        <p className="font-bold text-sm">Black Friday</p>
                                        <p className="text-xs text-gray-300">Licença vitalícia por R$ 99,90</p>
                                    </div>
                                </div>
                                <span className="bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full">
                                    Ver oferta
                                </span>
                            </div>
                        </Link>
                    </motion.div>
                )}
            </div>

            {/* Bottom Action */}
            <div className="fixed bottom-[80px] left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent z-10">
                <Button onClick={onReset} className="w-full h-12 rounded-xl shadow-lg text-base font-medium">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Corrigir Outro Texto
                </Button>
            </div>
        </div>
    )
}
