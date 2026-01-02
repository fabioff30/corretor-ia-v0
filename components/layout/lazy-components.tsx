"use client"

import dynamic from 'next/dynamic'

// Lazy load componentes pesados para melhor performance inicial
// Usando ssr: false para carregar apenas no cliente após hidratação
export const LazyJulinhoAssistant = dynamic(
  () => import('@/components/julinho-assistant').then(mod => mod.JulinhoAssistant),
  { ssr: false }
)

export const LazyGoogleOneTap = dynamic(
  () => import('@/components/google-one-tap').then(mod => mod.GoogleOneTap),
  { ssr: false }
)
