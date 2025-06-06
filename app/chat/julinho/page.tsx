import type { Metadata } from "next"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Julinho no WhatsApp - Tutor de Português | CorretorIA",
  description:
    "Converse com o Julinho, seu tutor de português, diretamente pelo WhatsApp e tire suas dúvidas sobre gramática, ortografia e muito mais!",
}

export default function JulinhoPage() {
  const whatsappNumber = "+5584999401840"
  const whatsappMessage = encodeURIComponent("Olá Julinho! Preciso de ajuda com português.")
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-green-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-green-500 p-6 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white mb-4 relative">
            <Image
              src="/images/julinho-avatar.webp"
              alt="Julinho"
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-1 right-1 bg-green-600 rounded-full p-1 shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white text-center">Julinho agora está no WhatsApp!</h1>
          <p className="text-white/90 text-center mt-2">Seu tutor de português está pronto para ajudar</p>
        </div>

        <div className="p-6">
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <p className="text-gray-800">
              Agora você pode conversar com o Julinho diretamente pelo WhatsApp! Tire suas dúvidas sobre:
            </p>
            <ul className="mt-3 space-y-2">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Gramática e ortografia</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Regras de acentuação</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Conjugação verbal</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Dúvidas sobre o novo acordo ortográfico</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>E muito mais!</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col space-y-4">
            <Button asChild className="bg-green-500 hover:bg-green-600 text-white py-3 h-auto">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                Conversar com o Julinho no WhatsApp
              </a>
            </Button>

            <Button asChild variant="outline" className="border-green-200 hover:bg-green-50 text-green-700">
              <a href="/" className="flex items-center justify-center">
                Voltar para o corretor de texto
              </a>
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-6 text-center">Número do WhatsApp: {whatsappNumber}</p>
        </div>
      </div>
    </div>
  )
}
