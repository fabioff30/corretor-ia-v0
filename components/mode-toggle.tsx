"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Necessário para evitar problemas de hidratação
  useEffect(() => {
    setMounted(true)
    // Não redefina o tema aqui, apenas defina se não estiver definido
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="border-input bg-background">
        <Sun className="h-[1.2rem] w-[1.2rem] text-foreground" />
        <span className="sr-only">Alternar tema</span>
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className="border-input bg-background"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={`Alternar para modo ${theme === "dark" ? "claro" : "escuro"}`}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Alternar tema</span>
    </Button>
  )
}
