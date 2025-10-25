"use client"

/**
 * Wrapper simplificado para RewriteStyleSelect
 * Mantém compatibilidade com código anterior
 */

import { RewriteStyleSelect, RewriteStyleSelectWithDescription } from "./rewrite-style-select"
import type { RewriteStyleInternal } from "@/utils/rewrite-styles"

interface RewriteStyleSelectorProps {
  value: RewriteStyleInternal
  onChange: (style: RewriteStyleInternal) => void
  isPremium: boolean
  onPremiumLocked?: (style: RewriteStyleInternal) => void
  disabled?: boolean
}

export function RewriteStyleSelector(props: RewriteStyleSelectorProps) {
  return <RewriteStyleSelectWithDescription {...props} />
}

// Re-export para facilitar imports
export { RewriteStyleSelect, RewriteStyleSelectWithDescription }
