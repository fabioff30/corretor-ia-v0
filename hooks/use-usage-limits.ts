/**
 * Hook para gerenciar limites de uso do usuário
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UsageLimit, PlanLimitsConfig } from '@/types/supabase'
import { useUser } from './use-user'

export interface UsageStats {
  corrections_used: number
  rewrites_used: number
  ai_analyses_used: number
  corrections_remaining: number
  rewrites_remaining: number
  ai_analyses_remaining: number
  date: string
}

export function useUsageLimits() {
  const { user, profile } = useUser()
  const [usage, setUsage] = useState<UsageLimit | null>(null)
  const [limits, setLimits] = useState<PlanLimitsConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (!user || !profile) {
      setLoading(false)
      return
    }

    const fetchUsageAndLimits = async () => {
      try {
        setLoading(true)
        setError(null)

        // Buscar limites do plano
        const { data: limitsData, error: limitsError } = await supabase
          .from('plan_limits_config')
          .select('*')
          .eq('plan_type', profile.plan_type === 'admin' ? 'pro' : profile.plan_type)
          .single()

        if (limitsError) throw limitsError
        setLimits(limitsData)

        // Buscar uso atual do dia
        const today = new Date().toISOString().split('T')[0]
        const { data: usageData, error: usageError } = await supabase
          .from('usage_limits')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today)
          .single()

        // Se não existe registro para hoje, criar um
        if (usageError && usageError.code === 'PGRST116') {
          const { data: newUsage, error: insertError } = await supabase
            .from('usage_limits')
            .insert({
              user_id: user.id,
              date: today,
              corrections_used: 0,
              rewrites_used: 0,
              ai_analyses_used: 0,
            })
            .select()
            .single()

          // Se houver erro de duplicata, buscar o registro existente
          if (insertError && insertError.code === '23505') {
            const { data: existingUsage } = await supabase
              .from('usage_limits')
              .select('*')
              .eq('user_id', user.id)
              .eq('date', today)
              .single()

            if (existingUsage) {
              setUsage(existingUsage)
            }
          } else if (insertError) {
            throw insertError
          } else {
            setUsage(newUsage)
          }
        } else if (usageError) {
          throw usageError
        } else {
          setUsage(usageData)
        }
      } catch (err) {
        console.error('Erro ao buscar limites de uso:', err)
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    fetchUsageAndLimits()

    // Subscrever a mudanças em tempo real
    const subscription = supabase
      .channel('usage_limits_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'usage_limits',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setUsage(payload.new as UsageLimit)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, profile])

  // Calcular estatísticas de uso
  const getUsageStats = (): UsageStats | null => {
    if (!usage || !limits) return null

    const isPremium = profile?.plan_type === 'pro' || profile?.plan_type === 'admin'

    return {
      corrections_used: usage.corrections_used,
      rewrites_used: usage.rewrites_used,
      ai_analyses_used: usage.ai_analyses_used,
      corrections_remaining: isPremium
        ? -1 // Ilimitado
        : Math.max(0, limits.corrections_per_day - usage.corrections_used),
      rewrites_remaining: isPremium
        ? -1 // Ilimitado
        : Math.max(0, limits.rewrites_per_day - usage.rewrites_used),
      ai_analyses_remaining: isPremium
        ? -1 // Ilimitado
        : Math.max(0, limits.ai_analyses_per_day - usage.ai_analyses_used),
      date: usage.date,
    }
  }

  // Verificar se pode realizar operação
  const canPerformOperation = (operationType: 'correct' | 'rewrite' | 'ai_analysis'): boolean => {
    if (!usage || !limits || !profile) return false

    // Pro e Admin têm acesso ilimitado
    if (profile.plan_type === 'pro' || profile.plan_type === 'admin') return true

    // Verificar limites para usuários free
    switch (operationType) {
      case 'correct':
        return usage.corrections_used < limits.corrections_per_day
      case 'rewrite':
        return usage.rewrites_used < limits.rewrites_per_day
      case 'ai_analysis':
        return usage.ai_analyses_used < limits.ai_analyses_per_day
      default:
        return false
    }
  }

  // Atualizar uso (chamado após operação bem-sucedida)
  const refreshUsage = async () => {
    if (!user) return

    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('usage_limits')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

      if (error) throw error
      setUsage(data)
    } catch (err) {
      console.error('Erro ao atualizar uso:', err)
    }
  }

  return {
    usage,
    limits,
    loading,
    error,
    stats: getUsageStats(),
    canPerformOperation,
    refreshUsage,
    showAds: limits?.show_ads ?? true,
    maxCharacters: limits?.max_characters ?? 1500,
  }
}
