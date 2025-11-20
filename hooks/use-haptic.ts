/**
 * Hook para haptic feedback em dispositivos móveis
 * Usa navigator.vibrate API com fallback gracioso
 */

import { useCallback } from 'react'

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning'

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 50,
  success: [10, 50, 10],
  error: [50, 100, 50],
  warning: [30, 50, 30],
}

export function useHaptic() {
  const vibrate = useCallback((pattern: HapticPattern) => {
    // Verificar se vibration API está disponível
    if (!('vibrate' in navigator)) {
      console.debug('[Haptic] Vibration API not supported')
      return
    }

    try {
      const vibrationPattern = PATTERNS[pattern]
      navigator.vibrate(vibrationPattern)
    } catch (error) {
      console.debug('[Haptic] Vibration failed:', error)
    }
  }, [])

  const cancel = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(0)
    }
  }, [])

  return {
    vibrate,
    cancel,
    light: () => vibrate('light'),
    medium: () => vibrate('medium'),
    heavy: () => vibrate('heavy'),
    success: () => vibrate('success'),
    error: () => vibrate('error'),
    warning: () => vibrate('warning'),
  }
}

/**
 * Hook pré-configurado para correção de texto
 */
export function useCorrectionHaptic() {
  const haptic = useHaptic()

  return {
    onTextStart: () => haptic.light(),
    onButtonPress: () => haptic.medium(),
    onSuccess: () => haptic.success(),
    onError: () => haptic.error(),
  }
}
