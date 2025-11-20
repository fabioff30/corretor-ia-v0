"use client"

import { useState } from "react"
import { MobileHero } from "./mobile-hero"
import { MobileFAB } from "./mobile-fab"
import { MobileBottomDrawer } from "./mobile-bottom-drawer"
import { MobileCorrectionLoading } from "./mobile-correction-loading"
import { MobileCorrectionResult } from "./mobile-correction-result"
import { AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/hooks/use-user"
import { usePlanLimits } from "@/hooks/use-plan-limits"
import { FREE_CHARACTER_LIMIT, UNLIMITED_CHARACTER_LIMIT, API_REQUEST_TIMEOUT } from "@/utils/constants"
import { sendGTMEvent } from "@/utils/gtm-helper"

interface MobileRewriteWrapperProps {
    onCorrect?: (text: string) => void
    onFileUpload?: () => void
    isLoading?: boolean
}

export function MobileRewriteWrapper({
    onCorrect: propOnCorrect,
    onFileUpload,
    isLoading: propIsLoading = false
}: MobileRewriteWrapperProps) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [aiEnabled, setAIEnabled] = useState(false)
    const [viewState, setViewState] = useState<"INPUT" | "LOADING" | "RESULT">("INPUT")
    const [result, setResult] = useState<any>(null)
    const [originalText, setOriginalText] = useState("")
    const [isLoading, setIsLoading] = useState(propIsLoading)
    const [selectedTone, setSelectedTone] = useState("formal")

    const { toast } = useToast()
    const { profile } = useUser()
    const { limits } = usePlanLimits()

    const isPremium = profile?.plan_type === "pro" || profile?.plan_type === "admin"
    const resolvedCharacterLimit = isPremium ? UNLIMITED_CHARACTER_LIMIT : limits?.max_characters ?? FREE_CHARACTER_LIMIT
    const isUnlimited = resolvedCharacterLimit === UNLIMITED_CHARACTER_LIMIT || resolvedCharacterLimit === -1
    const characterLimit = isUnlimited ? null : resolvedCharacterLimit

    const handleSettingsClick = () => {
        setIsDrawerOpen(true)
    }

    const handleDrawerClose = () => {
        setIsDrawerOpen(false)
    }

    const handleAIToggle = (enabled: boolean) => {
        setAIEnabled(enabled)
    }

    const handleToneSelect = (tone: string) => {
        setSelectedTone(tone)
        setIsDrawerOpen(false)
        toast({
            title: "Estilo selecionado",
            description: `Estilo alterado para: ${rewriteStyles.find(s => s.id === tone)?.label}`,
        })
    }

    const handleHelpClick = () => {
        console.log('Help clicked')
    }

    const handleHistoryClick = () => {
        console.log('History clicked')
    }

    const handleRewrite = async (text: string) => {
        if (!text.trim()) return

        setOriginalText(text)
        setViewState("LOADING")
        setIsLoading(true)

        try {
            if (!isUnlimited && characterLimit !== null && text.length > characterLimit) {
                throw new Error(`O texto excede o limite de ${characterLimit} caracteres.`)
            }

            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT)

            const response = await fetch("/api/rewrite", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text,
                    mode: selectedTone,
                    isMobile: true,
                    useAdvancedAI: aiEnabled && isPremium
                }),
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Erro ao reescrever texto")
            }

            const data = await response.json()

            setResult({
                correctedText: data.rewrittenText || data.text, // Adjust based on API response structure
                evaluation: data.evaluation
            })
            setViewState("RESULT")

            sendGTMEvent("rewrite_success", {
                is_mobile: true,
                is_premium: isPremium,
                char_count: text.length,
                style: selectedTone
            })

        } catch (error: any) {
            console.error("Rewrite error:", error)
            toast({
                title: "Erro na reescrita",
                description: error.message || "Ocorreu um erro ao processar seu texto.",
                variant: "destructive"
            })
            setViewState("INPUT")
        } finally {
            setIsLoading(false)
        }
    }

    const handleReset = () => {
        setViewState("INPUT")
        setResult(null)
        setOriginalText("")
    }

    const rewriteStyles = [
        { id: 'formal', label: 'Formal', icon: '👔' },
        { id: 'casual', label: 'Humanizado', icon: '😊' },
        { id: 'academic', label: 'Acadêmico', icon: '🎓' },
        { id: 'creative', label: 'Criativo', icon: '🎨' },
        { id: 'childish', label: 'Infantil', icon: '🧸' },
    ]

    if (viewState === "LOADING") {
        return <MobileCorrectionLoading />
    }

    if (viewState === "RESULT" && result) {
        return (
            <MobileCorrectionResult
                originalText={originalText}
                correctedText={result.correctedText}
                evaluation={result.evaluation}
                onReset={handleReset}
            />
        )
    }

    return (
        <div className="relative min-h-[100dvh]">
            <MobileHero
                onSubmit={handleRewrite}
                onFileUpload={onFileUpload}
                isLoading={isLoading}
                onAIToggle={handleAIToggle}
                aiEnabled={aiEnabled}
                title="Reescrever Texto IA"
                subtitle="Reescreva textos em diferentes estilos mantendo o significado original."
                badges={[
                    { text: "5 Estilos", icon: "🎨", color: "text-purple-500" },
                    { text: "Original", icon: "✨", color: "text-blue-500" },
                    { text: "Rápido", icon: "⚡", color: "text-yellow-500" },
                ]}
                placeholder="Cole seu texto para reescrever..."
            />

            <MobileFAB
                onSettingsClick={handleSettingsClick}
                onFileUpload={onFileUpload}
                onAIToggle={() => handleAIToggle(!aiEnabled)}
                onHistoryClick={handleHistoryClick}
                onHelpClick={handleHelpClick}
            />

            <AnimatePresence>
                {isDrawerOpen && (
                    <MobileBottomDrawer
                        isOpen={isDrawerOpen}
                        onClose={handleDrawerClose}
                        onAIToggle={handleAIToggle}
                        onToneSelect={handleToneSelect}
                        onFileUpload={onFileUpload}
                        aiEnabled={aiEnabled}
                        toneOptions={rewriteStyles}
                        toneLabel="Estilo de Reescrita"
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
