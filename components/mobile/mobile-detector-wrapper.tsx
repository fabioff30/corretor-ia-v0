"use client"

import { useState } from "react"
import { MobileHero } from "./mobile-hero"
import { MobileFAB } from "./mobile-fab"
import { MobileCorrectionLoading } from "./mobile-correction-loading"
import { MobileDetectorResult } from "./mobile-detector-result"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/hooks/use-user"
import { usePlanLimits } from "@/hooks/use-plan-limits"
import { AI_DETECTOR_CHARACTER_LIMIT, API_REQUEST_TIMEOUT } from "@/utils/constants"
import { sendGTMEvent } from "@/utils/gtm-helper"

interface MobileDetectorWrapperProps {
    onCorrect?: (text: string) => void
    onFileUpload?: () => void
    isLoading?: boolean
}

export function MobileDetectorWrapper({
    onCorrect: propOnCorrect,
    onFileUpload,
    isLoading: propIsLoading = false
}: MobileDetectorWrapperProps) {
    const [viewState, setViewState] = useState<"INPUT" | "LOADING" | "RESULT">("INPUT")
    const [result, setResult] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(propIsLoading)

    const { toast } = useToast()
    const { profile } = useUser()
    const { limits } = usePlanLimits()

    const isPremium = profile?.plan_type === "pro" || profile?.plan_type === "admin"
    const characterLimit = AI_DETECTOR_CHARACTER_LIMIT

    const handleHelpClick = () => {
        console.log('Help clicked')
    }

    const handleHistoryClick = () => {
        console.log('History clicked')
    }

    const handleDetect = async (text: string) => {
        if (!text.trim()) return

        setViewState("LOADING")
        setIsLoading(true)

        try {
            if (text.length > characterLimit) {
                throw new Error(`O texto excede o limite de ${characterLimit} caracteres.`)
            }

            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT)

            const response = await fetch("/api/ai-detector", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    text,
                    isPremium
                }),
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Erro ao analisar texto")
            }

            const data = await response.json()

            setResult(data)
            setViewState("RESULT")

            sendGTMEvent("detection_success", {
                is_mobile: true,
                is_premium: isPremium,
                char_count: text.length,
                verdict: data.result.verdict
            })

        } catch (error: any) {
            console.error("Detection error:", error)
            toast({
                title: "Erro na análise",
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
    }

    if (viewState === "LOADING") {
        return (
            <MobileCorrectionLoading
                title="Checando se o texto é de humano ou de robô 🤖"
                description="Nossa IA está analisando padrões de escrita para determinar a origem do texto."
            />
        )
    }

    if (viewState === "RESULT" && result) {
        return (
            <MobileDetectorResult
                result={result.result}
                textStats={result.textStats}
                brazilianism={result.brazilianism}
                onReset={handleReset}
            />
        )
    }

    return (
        <div className="relative min-h-[100dvh]">
            <MobileHero
                onSubmit={handleDetect}
                onFileUpload={onFileUpload}
                isLoading={isLoading}
                title="Detector de IA"
                subtitle="Identifique se um texto foi escrito por humanos ou inteligência artificial."
                badges={[
                    { text: "1/dia grátis", icon: "🎁", color: "text-green-500" },
                    { text: "Preciso", icon: "🎯", color: "text-blue-500" },
                    { text: "Rápido", icon: "⚡", color: "text-yellow-500" },
                ]}
                placeholder="Cole o texto para analisar..."
                showStats={false}
                submitButtonText="Detectar IA"
                loadingButtonText="Detectando..."
                showAIToggle={false}
            />

            {/* <MobileFAB
                onFileUpload={onFileUpload}
                onHistoryClick={handleHistoryClick}
                onHelpClick={handleHelpClick}
                // Hide AI Toggle and Settings for Detector
                onAIToggle={undefined}
                onSettingsClick={undefined}
            /> */}
        </div>
    )
}
