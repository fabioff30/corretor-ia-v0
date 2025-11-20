/**
 * Hook para detectar se está em dispositivo mobile
 * Usa media query para breakpoint de 768px
 */

import { useEffect, useState } from 'react'

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Criar media query
    const mediaQuery = window.matchMedia('(max-width: 768px)')

    // Setar valor inicial
    setIsMobile(mediaQuery.matches)

    // Listener para mudanças (rotação, resize)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)

    // Adicionar listener
    mediaQuery.addEventListener('change', handler)

    // Cleanup
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return isMobile
}

/**
 * Hook para detectar orientação do dispositivo
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(
        window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape'
      )
    }

    updateOrientation()
    window.addEventListener('resize', updateOrientation)

    return () => window.removeEventListener('resize', updateOrientation)
  }, [])

  return orientation
}

/**
 * Hook para obter safe areas do dispositivo
 */
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  })

  useEffect(() => {
    const updateSafeArea = () => {
      setSafeArea({
        top: parseInt(
          getComputedStyle(document.documentElement)
            .getPropertyValue('env(safe-area-inset-top)') || '0'
        ),
        bottom: parseInt(
          getComputedStyle(document.documentElement)
            .getPropertyValue('env(safe-area-inset-bottom)') || '0'
        ),
        left: parseInt(
          getComputedStyle(document.documentElement)
            .getPropertyValue('env(safe-area-inset-left)') || '0'
        ),
        right: parseInt(
          getComputedStyle(document.documentElement)
            .getPropertyValue('env(safe-area-inset-right)') || '0'
        ),
      })
    }

    updateSafeArea()
    window.addEventListener('resize', updateSafeArea)

    return () => window.removeEventListener('resize', updateSafeArea)
  }, [])

  return safeArea
}
