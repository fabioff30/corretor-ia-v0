"use client"

import { Loader2 } from "lucide-react"
import { motion } from "framer-motion"

interface MobileCorrectionLoadingProps {
    title?: string
    description?: string
}

export function MobileCorrectionLoading({
    title = "Fazendo as melhores correções",
    description = "Nossa IA está analisando seu texto para garantir gramática, ortografia e estilo perfeitos."
}: MobileCorrectionLoadingProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative"
            >
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <Loader2 className="h-16 w-16 text-primary animate-spin relative z-10" />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-y-2"
            >
                <h3 className="text-xl font-semibold text-foreground">
                    {title}
                </h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                    {description}
                </p>
            </motion.div>
        </div>
    )
}
