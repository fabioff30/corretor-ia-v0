/**
 * Hook para gerenciar limites de uso do usuário
 */

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useUser } from './use-user'
import type { PlanLimitsConfig, UsageLimit } from '@/types/supabase'

export interface UsageStats {
  corrections_used: number
  rewrites_used: number
  ai_analyses_used: number
  corrections_remaining: number
  rewrites_remaining: number
  ai_analyses_remaining: number
  date: string
}

interface UsageHistoryEntry {
  date: string
  corrections_used: number
  rewrites_used: number
  ai_analyses_used: number
}

interface UsageApiResponse {
  usage: UsageLimit
  limits: PlanLimitsConfig
  stats: UsageStats
  showAds: boolean
  maxCharacters: number
  history: UsageHistoryEntry[]
}

export function useUsageLimits() {
  const { profile } = useUser()
  const [usage, setUsage] = useState<UsageLimit | null>(null)
  const [limits, setLimits] = useState<PlanLimitsConfig | null>(null)
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [history, setHistory] = useState<UsageHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAds, setShowAds] = useState<boolean>(true)
  const [maxCharacters, setMaxCharacters] = useState<number>(1500)

  const fetchUsage = useCallback(async () => {
    if (!profile?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/dashboard/usage', {
        method: 'GET',
        cache: 'no-store',
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || 'Não foi possível carregar os dados do dashboard')
      }

      const payload = (await response.json()) as UsageApiResponse

      setUsage(payload.usage)
      setLimits(payload.limits)
      setStats(payload.stats)
      setHistory(payload.history)
      setShowAds(payload.showAds)
      setMaxCharacters(payload.maxCharacters)
    } catch (err) {
      console.error('Erro ao carregar uso do dashboard:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [profile?.id, profile?.plan_type])

  useEffect(() => {
    fetchUsage()
  }, [fetchUsage])

  const canPerformOperation = useCallback(
    (operationType: 'correct' | 'rewrite' | 'ai_analysis') => {
      if (!stats || !limits || !profile) return false

      if (profile.plan_type === 'pro' || profile.plan_type === 'admin') {
        return true
      }

      switch (operationType) {
        case 'correct':
          return stats.corrections_remaining !== 0
        case 'rewrite':
          return stats.rewrites_remaining !== 0
        case 'ai_analysis':
          return stats.ai_analyses_remaining !== 0
        default:
          return false
      }
    },
    [stats, limits, profile],
  )

  const refreshUsage = useCallback(async () => {
    await fetchUsage()
  }, [fetchUsage])

  const computedStats = useMemo(() => stats, [stats])

  return {
    usage,
    limits,
    stats: computedStats,
    loading,
    error,
    history,
    canPerformOperation,
    refreshUsage,
    showAds,
    maxCharacters,
  }
}
