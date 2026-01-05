"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ChevronDown, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  FREE_REWRITE_STYLES,
  PREMIUM_REWRITE_STYLES,
  RewriteStyleInternal,
  getRewriteStyle,
} from "@/utils/rewrite-styles"
import { StyleSelectCard } from "./style-select-card"
import { StyleDescriptionCard } from "./style-description-card"

export interface RewriteStyleSelectProps {
  value: RewriteStyleInternal
  onChange: (style: RewriteStyleInternal) => void
  isPremium: boolean
  onPremiumLocked?: (style: RewriteStyleInternal) => void
  disabled?: boolean
}

export function RewriteStyleSelect({
  value,
  onChange,
  isPremium,
  onPremiumLocked,
  disabled = false,
}: RewriteStyleSelectProps) {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    setIsMounted(true)
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const selectedStyle = getRewriteStyle(value)

  const handleStyleClick = (styleId: string) => {
    const style = styleId as RewriteStyleInternal
    // Permitir que todos selecionem qualquer estilo
    onChange(style)
    setOpen(false)
    setSearchQuery("")

    // Notificar se é um estilo premium (mas não bloquear)
    const styleDef = getRewriteStyle(style)
    if (styleDef?.tier === "premium" && !isPremium) {
      onPremiumLocked?.(style)
    }
  }

  const allStyles = [...FREE_REWRITE_STYLES, ...PREMIUM_REWRITE_STYLES]
  const filteredStyles = allStyles.filter(
    (style) =>
      style.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      style.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const content = (
    <div className="space-y-4 w-full">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar estilo..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
          aria-label="Buscar estilo de reescrita"
        />
      </div>

      {/* Styles Grid */}
      {filteredStyles.length > 0 ? (
        <div className="grid grid-cols-1 gap-2">
          {filteredStyles.map((style) => {
            const isSelected = value === style.id
            const isLocked = !isPremium && style.tier === "premium"

            return (
              <StyleSelectCard
                key={style.id}
                style={style}
                isSelected={isSelected}
                isLocked={isLocked}
                onSelect={handleStyleClick}
              />
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <p>Nenhum estilo encontrado</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="mt-2"
          >
            Limpar busca
          </Button>
        </div>
      )}
    </div>
  )

  if (!isMounted) return null

  return (
    <>
      {/* Desktop: Popover */}
      {!isMobile ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full sm:w-auto justify-between px-3 h-10"
              disabled={disabled}
              aria-label={`Estilo de reescrita: ${selectedStyle?.label}. Clique para escolher`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {selectedStyle && (
                  <>
                    <selectedStyle.icon className={`h-4 w-4 flex-shrink-0 ${selectedStyle.iconColor}`} />
                    <span className="truncate text-sm font-medium">
                      {selectedStyle.label}
                    </span>
                  </>
                )}
              </div>
              <ChevronDown
                className={`h-4 w-4 flex-shrink-0 ml-2 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
              />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-72 p-4" align="start">
            <div className="space-y-2 mb-3">
              <h4 className="font-semibold text-sm">Escolher Estilo de Reescrita</h4>
              <p className="text-xs text-muted-foreground">
                Selecione o estilo desejado para reescrever seu texto
              </p>
            </div>

            {content}
          </PopoverContent>
        </Popover>
      ) : (
        <>
          {/* Mobile: Trigger Button */}
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between px-3 h-11 sm:h-10"
            disabled={disabled}
            onClick={() => setOpen(true)}
            aria-label={`Estilo de reescrita: ${selectedStyle?.label}. Clique para escolher`}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {selectedStyle && (
                <>
                  <selectedStyle.icon className={`h-4 w-4 flex-shrink-0 ${selectedStyle.iconColor}`} />
                  <span className="truncate text-sm font-medium">
                    {selectedStyle.label}
                  </span>
                </>
              )}
            </div>
            <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2" />
          </Button>

          {/* Mobile: Sheet */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent
              side="bottom"
              className="h-[90vh] flex flex-col rounded-t-xl"
            >
              <SheetHeader>
                <SheetTitle>Escolher Estilo de Reescrita</SheetTitle>
                <SheetDescription>
                  Selecione o estilo desejado para transformar seu texto
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto py-4">
                {content}
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}
    </>
  )
}

/**
 * Versão do select com card de descrição incluída
 * Ideal para usar em formulários
 */
export function RewriteStyleSelectWithDescription(
  props: RewriteStyleSelectProps
) {
  const selectedStyle = getRewriteStyle(props.value)

  return (
    <div className="space-y-2">
      <RewriteStyleSelect {...props} />
      <StyleDescriptionCard
        style={selectedStyle}
        isPremium={props.isPremium}
        onPremiumClick={() => props.onPremiumLocked?.(props.value)}
      />
    </div>
  )
}
