"use client"

import { useState, useEffect } from "react"
import { MobileHero } from "./mobile-hero"
import { MobileFAB } from "./mobile-fab"
import { MobileBottomDrawer } from "./mobile-bottom-drawer"
import { MobileCorrectionLoading } from "./mobile-correction-loading"
import { MobileCorrectionResult } from "./mobile-correction-result"
import { AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/hooks/use-user"
import { usePlanLimits } from "@/hooks/use-plan-limits"
import { FREE_CHARACTER_LIMIT, UNLIMITED_CHARACTER_LIMIT, API_REQUEST_TIMEOUT, FREE_DAILY_REWRITES_LIMIT } from "@/utils/constants"
import { sendGTMEvent } from "@/utils/gtm-helper"
import { trackPixelCustomEvent } from "@/utils/meta-pixel"
import Link from "next/link"

const FREE_REWRITES_STORAGE_KEY = "corretoria:free-rewrites-usage"
const REWRITE_TRANSFER_KEY = "corretoria:rewrite-transfer-text"

// Helper to get today's date in local timezone (not UTC)
const getLocalDateString = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const readFreeRewriteUsage = () => {
    if (typeof window === "undefined") {
        return { date: "", count: 0 }
    }
    const today = getLocalDateString()

    try {
        const raw = window.localStorage.getItem(FREE_REWRITES_STORAGE_KEY)
        if (raw) {
            const parsed = JSON.parse(raw) as { date?: string; count?: number }
            if (parsed.date === today) {
                return { date: today, count: parsed.count ?? 0 }
            }
        }
    } catch (error) {
        console.warn("Não foi possível ler o uso diário de reescritas gratuitas:", error)
    }

    const initialValue = { date: today, count: 0 }
    if (typeof window !== "undefined") {
        window.localStorage.setItem(FREE_REWRITES_STORAGE_KEY, JSON.stringify(initialValue))
    }
    return initialValue
}

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
    const [selectedTone, setSelectedTone] = useState("humanized")
    const [freeRewritesCount, setFreeRewritesCount] = useState(0)
    const [transferredText, setTransferredText] = useState("")

    const { toast } = useToast()
    const { profile } = useUser()
    const { limits } = usePlanLimits()

    const isPremium = profile?.plan_type === "pro" || profile?.plan_type === "admin"
    const rewritesDailyLimit = limits?.rewrites_per_day ?? FREE_DAILY_REWRITES_LIMIT

    // Load rewrite usage on mount
    useEffect(() => {
        if (isPremium) {
            setFreeRewritesCount(0)
            return
        }
        const usage = readFreeRewriteUsage()
        setFreeRewritesCount(usage.count)
    }, [isPremium])

    // Check for transferred text from correction page
    useEffect(() => {
        const text = localStorage.getItem(REWRITE_TRANSFER_KEY)
        if (text) {
            setTransferredText(text)
            localStorage.removeItem(REWRITE_TRANSFER_KEY)
        }
    }, [])
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

        // Check daily limit for free users
        if (!isPremium) {
            const usage = readFreeRewriteUsage()
            if (usage.count >= rewritesDailyLimit) {
                sendGTMEvent("free_rewrite_limit_reached", {
                    limit: rewritesDailyLimit,
                    usage: usage.count,
                    device_type: "mobile",
                    text_length: text.length,
                    character_limit: characterLimit,
                    user_id: profile?.id || null,
                    is_authenticated: !!profile,
                    page_path: typeof window !== "undefined" ? window.location.pathname : "/",
                })

                // Meta Pixel para remarketing
                trackPixelCustomEvent("FreeRewriteLimitReached", {
                    device_type: "mobile",
                    text_length: text.length,
                    is_authenticated: !!profile,
                })

                // Dar tempo para o GTM processar antes de redirecionar
                setTimeout(() => {
                    window.location.href = "/premium"
                }, 150)
                return
            }
        }

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
                    style: selectedTone,
                    isMobile: true,
                    isPremium
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

            sendGTMEvent("rewrite_text", {
                text_length: text.length,
                style: selectedTone,
                is_premium: isPremium,
            })

            // Increment rewrite count for free users
            if (!isPremium) {
                const usage = readFreeRewriteUsage()
                const updatedCount = Math.min(rewritesDailyLimit, usage.count + 1)
                if (typeof window !== "undefined") {
                    window.localStorage.setItem(
                        FREE_REWRITES_STORAGE_KEY,
                        JSON.stringify({
                            date: usage.date || getLocalDateString(),
                            count: updatedCount,
                        })
                    )
                }
                setFreeRewritesCount(updatedCount)
            }

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
        // Free styles
        { id: 'formal', label: 'Formal', icon: '💼' },
        { id: 'humanized', label: 'Humanizado', icon: '❤️' },
        { id: 'academic', label: 'Acadêmico', icon: '🎓' },
        { id: 'creative', label: 'Criativo', icon: '🎨' },
        { id: 'childlike', label: 'Como uma Criança', icon: '👶' },
        // Premium styles
        { id: 'technical', label: 'Técnico', icon: '💻' },
        { id: 'journalistic', label: 'Jornalístico', icon: '📰' },
        { id: 'advertising', label: 'Publicitário', icon: '📈' },
        { id: 'blog_post', label: 'Blog Post', icon: '📖' },
        { id: 'reels_script', label: 'Roteiro Reels', icon: '⚡' },
        { id: 'youtube_script', label: 'Roteiro YouTube', icon: '▶️' },
        { id: 'presentation', label: 'Apresentação', icon: '🎤' },
        { id: 'legal', label: 'Jurídico', icon: '⚖️' },
    ]

    const selectedStyleLabel = rewriteStyles.find(s => s.id === selectedTone)?.label || "Humanizado"

    if (viewState === "LOADING") {
        return (
            <MobileCorrectionLoading
                title="Reescrevendo seu texto da melhor forma"
                description="Nossa IA está reescrevendo seu texto com o estilo selecionado."
            />
        )
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
                headingAs="h1"
                title="Reescreva seus Textos com IA Grátis"
                subtitle="Reescreva e humanize textos instantaneamente. Elimine plágio, adapte o tom e mantenha a originalidade — 100% grátis."
                badges={[
                    { text: "5 Estilos", icon: "🎨", color: "text-purple-500" },
                    { text: "Original", icon: "✨", color: "text-blue-500" },
                    { text: "Rápido", icon: "⚡", color: "text-yellow-500" },
                ]}
                placeholder="Cole seu texto para reescrever..."
                submitButtonText="Reescrever"
                loadingButtonText="Reescrevendo..."
                showStyleSelector={true}
                selectedStyle={selectedTone}
                selectedStyleLabel={selectedStyleLabel}
                onStyleClick={handleSettingsClick}
                usageCount={freeRewritesCount}
                usageLimit={rewritesDailyLimit}
                initialText={transferredText}
                onTextChange={setTransferredText}
            />

            {/* <MobileFAB
                onSettingsClick={handleSettingsClick}
                onFileUpload={onFileUpload}
                onHistoryClick={handleHistoryClick}
                onHelpClick={handleHelpClick}
            /> */}

            <AnimatePresence>
                {isDrawerOpen && (
                    <MobileBottomDrawer
                        isOpen={isDrawerOpen}
                        onClose={handleDrawerClose}
                        onToneSelect={handleToneSelect}
                        toneOptions={rewriteStyles}
                        toneLabel="Estilo de Reescrita"
                        hideAIToggle={true}
                        hideFileUpload={true}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
