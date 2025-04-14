"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import Script from "next/script"

interface MercadoPagoButtonProps {
  preferenceId: string
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function MercadoPagoButton({ preferenceId, onSuccess, onError }: MercadoPagoButtonProps) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false)
  const [isButtonRendered, setIsButtonRendered] = useState(false)
  const buttonContainerRef = useRef<HTMLDivElement>(null)
  const [publicKey, setPublicKey] = useState<string>("")

  // Function to handle SDK loading
  const handleSDKLoad = () => {
    setIsSDKLoaded(true)
  }

  // Add this useEffect to fetch the public key
  useEffect(() => {
    const fetchPublicKey = async () => {
      try {
        const response = await fetch("/api/mercadopago/config")
        if (!response.ok) {
          throw new Error(`Failed to fetch Mercado Pago configuration: ${response.status}`)
        }
        const data = await response.json()
        setPublicKey(data.publicKey)
      } catch (error) {
        console.error("Error fetching Mercado Pago public key:", error)
        if (onError) onError(error instanceof Error ? error : new Error(String(error)))
      }
    }

    fetchPublicKey()
  }, [onError])

  // Initialize and render the button when SDK is loaded and preferenceId changes
  useEffect(() => {
    if (!isSDKLoaded || !preferenceId || !buttonContainerRef.current || !publicKey) return

    try {
      // Clear the container first
      if (buttonContainerRef.current) {
        buttonContainerRef.current.innerHTML = ""
      }

      // Then use the state variable instead of the environment variable
      const mp = new window.MercadoPago(publicKey || "", {
        locale: "pt-BR",
      })

      // Render the button
      mp.bricks().create("wallet", buttonContainerRef.current.id, {
        initialization: {
          preferenceId: preferenceId,
        },
        callbacks: {
          onReady: () => {
            console.log("Mercado Pago brick ready")
            setIsButtonRendered(true)
          },
          onSubmit: () => {
            console.log("Payment submitted to Mercado Pago")
          },
          onError: (error: Error) => {
            console.error("Mercado Pago brick error:", error)
            // Add more detailed error logging
            if (error.message?.includes("invalid_token") || error.message?.includes("token")) {
              console.error("Possível problema com o token do Mercado Pago. Verifique as credenciais.")
            }
            if (onError) onError(error)
          },
        },
        customization: {
          texts: {
            valueProp: "smart_option",
          },
          visual: {
            buttonHeight: "48px",
          },
        },
      })
    } catch (error) {
      console.error("Error initializing MercadoPago:", error)
      if (onError) onError(error instanceof Error ? error : new Error(String(error)))
    }
  }, [isSDKLoaded, preferenceId, onError, publicKey])

  return (
    <>
      {/* Load MercadoPago SDK */}
      <Script src="https://sdk.mercadopago.com/js/v2" onLoad={handleSDKLoad} strategy="afterInteractive" />

      {/* Button container */}
      <div className="w-full">
        {!isButtonRendered && (
          <div className="w-full h-14 flex items-center justify-center bg-primary/10 rounded-md border border-primary/20">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          </div>
        )}
        <div id="wallet_container" ref={buttonContainerRef} className={isButtonRendered ? "block" : "hidden"}></div>
      </div>
    </>
  )
}
