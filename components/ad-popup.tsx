"use client"
import { sendGTMEvent } from "@/utils/gtm-helper"
import Link from "next/link"
import Image from "next/image"

interface AdPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function AdPopup({ isOpen, onClose }: AdPopupProps) {
  // If the popup is open, track the view and display the banner
  if (isOpen) {
    // Register event for popup view
    if (!localStorage.getItem("auto-popup")) {
      sendGTMEvent("popup_ad_viewed", {
        ad_type: "supporter_banner",
        source: "correction_form",
      })
    }

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full overflow-hidden relative">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 z-10"
            aria-label="Fechar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <Link
            href="/apoiar?utm_source=popup&utm_medium=banner&utm_campaign=correction_support"
            onClick={() => {
              sendGTMEvent("popup_ad_clicked", {
                ad_type: "supporter_banner",
                destination: "support_page",
              })
              onClose()
            }}
            className="block"
          >
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/banner%20corretoria-wW4zGq97ZLHQ1kXMgKVHbnkhOUgLXR.webp"
              alt="Seja um Apoiador do CorretorIA - Junte-se aos nossos apoiadores e faça parte da comunidade que mantém o Corretor vivo. Cada contribuição conta!"
              width={600}
              height={600}
              className="w-full h-auto rounded-lg object-contain"
              priority
            />
          </Link>
        </div>
      </div>
    )
  }

  // If not open, return null
  return null
}
