"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Gift, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useGoogleAnalytics } from "@/components/google-analytics-wrapper"

export function EasterEggSecret() {
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()
  const sendGAEvent = useGoogleAnalytics()

  const handleClick = () => {
    setShowModal(true)

    // Track discovery
    sendGAEvent("easter_egg_discovered", {
      category: "engagement",
      label: "footer_secret_message",
    })
  }

  const handleViewOffer = () => {
    sendGAEvent("easter_egg_converted", {
      category: "conversion",
      label: "clicked_view_offer",
    })

    setShowModal(false)
    router.push("/oferta-especial")
  }

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      "🎉 Descobri uma mensagem secreta no CorretorIA!\n\n" +
      "Eles estão dando 50% OFF para os mais espertos 😎\n\n" +
      "Clica aqui e procura a mensagem escondida:\n" +
      "https://corretordetextoonline.com.br"
    )

    sendGAEvent("easter_egg_shared_whatsapp", {
      category: "social_share",
      label: "whatsapp",
    })

    window.open(`https://wa.me/?text=${message}`, "_blank")
  }

  return (
    <>
      {/* Easter Egg Trigger */}
      <button
        onClick={handleClick}
        className="text-xs text-muted-foreground opacity-20 hover:opacity-50 transition-opacity cursor-pointer ml-1"
        aria-label="Mensagem secreta"
      >
        · pssiu... 👀
      </button>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl border border-primary/20 p-6 md:p-8"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Content */}
              <div className="text-center">
                {/* Icon */}
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
                  <Gift className="h-8 w-8 text-primary" />
                </div>

                {/* Title */}
                <h2 className="text-2xl md:text-3xl font-bold mb-3 gradient-text">
                  🎉 Parabéns, Detetive! 🕵️
                </h2>

                {/* Message */}
                <p className="text-base md:text-lg text-foreground/80 mb-2">
                  Você encontrou nossa mensagem secreta!
                </p>

                <p className="text-sm md:text-base text-foreground/70 mb-6">
                  Como recompensa pela sua atenção aos detalhes, essa página te dá{" "}
                  <span className="font-bold text-primary">50% OFF</span> no CorretorIA Premium!
                </p>

                {/* Buttons */}
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleViewOffer}
                    size="lg"
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold"
                  >
                    <Gift className="mr-2 h-5 w-5" />
                    Ver Oferta Especial
                  </Button>

                  <Button
                    onClick={handleShareWhatsApp}
                    variant="outline"
                    size="lg"
                    className="w-full border-primary/30 hover:bg-primary/5"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Compartilhar no WhatsApp
                  </Button>
                </div>

                {/* Fun Message */}
                <p className="text-xs text-muted-foreground mt-4">
                  Psst... não conta pra ninguém onde encontrou 🤫
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
