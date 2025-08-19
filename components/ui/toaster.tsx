"use client"

import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle } from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cn } from "@/lib/utils"
import * as React from "react"

export function Toaster() {
  const { toasts, dismiss } = useToast()
  const toastRefs = React.useRef<Map<string, HTMLElement>>(new Map())

  // Adicionar efeito para detectar cliques fora do toast
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      toastRefs.current.forEach((toastElement, id) => {
        if (toastElement && !toastElement.contains(event.target as Node)) {
          dismiss(id)
        }
      })
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [dismiss])

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast
          key={id}
          {...props}
          ref={(el) => {
            if (el) toastRefs.current.set(id, el as unknown as HTMLElement)
            else toastRefs.current.delete(id)
          }}
        >
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastPrimitives.Viewport
        className={cn(
          "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:top-0 sm:right-0 sm:flex-col md:max-w-[420px]",
        )}
      />
    </ToastProvider>
  )
}
