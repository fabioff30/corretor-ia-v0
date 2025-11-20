"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, RotateCcw, Bot, User, HelpCircle, AlertTriangle, FileText, Globe } from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { AIDetectorRating } from "@/components/features/ai-detector-rating"

interface MobileDetectorResultProps {
    result: {
        verdict: "ai" | "human" | "uncertain"
        probability: number
        confidence: "low" | "medium" | "high"
        explanation?: string
        signals: string[]
    }
    textStats: {
        words: number
        characters: number
        sentences: number
    }
    brazilianism?: {
        found: boolean
        count?: number
        score?: number
        explanation?: string
    }
    onReset: () => void
}

const verdictConfig = {
    ai: {
        icon: Bot,
        label: "Texto de IA",
        description: "Provavelmente gerado por IA",
        colorClass: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
        badgeClass: "bg-orange-500",
    },
    human: {
        icon: User,
        label: "Texto Humano",
        description: "Provavelmente escrito por humano",
        colorClass: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
        badgeClass: "bg-green-500",
    },
    uncertain: {
        icon: HelpCircle,
        label: "Inconclusivo",
        description: "Origem incerta",
        colorClass: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
        badgeClass: "bg-yellow-500",
    },
}

const confidenceConfig = {
    low: { label: "Baixa", color: "bg-red-500" },
    medium: { label: "Média", color: "bg-yellow-500" },
    high: { label: "Alta", color: "bg-green-500" },
}

export function MobileDetectorResult({
    result,
    textStats,
    brazilianism,
    onReset
}: MobileDetectorResultProps) {
    const config = verdictConfig[result.verdict]
    const Icon = config.icon
    const confidenceInfo = confidenceConfig[result.confidence]
    const probabilityPercent = Math.round(result.probability * 100)

    return (
        <div className="flex flex-col min-h-[100dvh] bg-background pb-24">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={onReset} className="-ml-2">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="font-semibold text-lg">Resultado da Análise</h2>
                <div className="w-9" /> {/* Spacer */}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Verdict Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl border-2 p-4 ${config.colorClass}`}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-background/50 rounded-full">
                                <Icon className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{config.label}</h3>
                                <p className="text-xs opacity-80">{config.description}</p>
                            </div>
                        </div>
                        <Badge className={confidenceInfo.color}>
                            {confidenceInfo.label}
                        </Badge>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-medium">Probabilidade IA</span>
                            <span className="font-bold">{probabilityPercent}%</span>
                        </div>
                        <Progress
                            value={probabilityPercent}
                            className="h-3 bg-background/30"
                            indicatorClassName="bg-current"
                        />
                    </div>
                </motion.div>

                {/* Explanation */}
                {result.explanation && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-card border rounded-xl p-4 shadow-sm"
                    >
                        <h4 className="font-semibold mb-2 text-sm">Explicação</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {result.explanation}
                        </p>
                    </motion.div>
                )}

                {/* Details Accordion */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {/* Signals */}
                        {result.signals && result.signals.length > 0 && (
                            <AccordionItem value="signals" className="border rounded-xl px-4">
                                <AccordionTrigger className="hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                                        <span>Sinais Detectados ({result.signals.length})</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <ul className="space-y-2">
                                        {result.signals.map((signal, index) => (
                                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                                <span className="text-primary mt-1">•</span>
                                                {signal}
                                            </li>
                                        ))}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        )}

                        {/* Stats */}
                        <AccordionItem value="stats" className="border rounded-xl px-4">
                            <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-500" />
                                    <span>Estatísticas</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="p-2 bg-muted rounded-lg">
                                        <div className="text-xl font-bold">{textStats.words}</div>
                                        <div className="text-xs text-muted-foreground">Palavras</div>
                                    </div>
                                    <div className="p-2 bg-muted rounded-lg">
                                        <div className="text-xl font-bold">{textStats.characters}</div>
                                        <div className="text-xs text-muted-foreground">Caracteres</div>
                                    </div>
                                    <div className="p-2 bg-muted rounded-lg">
                                        <div className="text-xl font-bold">{textStats.sentences}</div>
                                        <div className="text-xs text-muted-foreground">Frases</div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        {/* Brazilianisms */}
                        {brazilianism?.found && (
                            <AccordionItem value="brazilianism" className="border rounded-xl px-4">
                                <AccordionTrigger className="hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-green-500" />
                                        <span>Brasileirismos</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Score</span>
                                            <span className="font-bold">{((brazilianism.score || 0) * 100).toFixed(0)}%</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {brazilianism.explanation}
                                        </p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        )}
                    </Accordion>
                </motion.div>

                {/* Rating */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <AIDetectorRating
                        verdict={result.verdict}
                        probability={result.probability}
                        textLength={textStats.characters}
                    />
                </motion.div>
            </div>

            {/* Bottom Action */}
            <div className="fixed bottom-[80px] left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent z-10">
                <Button onClick={onReset} className="w-full h-12 rounded-xl shadow-lg text-base font-medium">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Nova Análise
                </Button>
            </div>
        </div>
    )
}
