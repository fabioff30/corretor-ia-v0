/**
 * Hook para buscar limites do plano do usuário (client-side)
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PlanLimitsConfig } from '@/types/supabase'
import { useUser } from './use-user'

export function usePlanLimits() {
  const { profile } = useUser()
  const [limits, setLimits] = useState<PlanLimitsConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (!profile) {
      setLoading(false)
      return
    }

    const fetchLimits = async () => {
      try {
        setLoading(true)
        setError(null)

        // Admin usa limites de Pro
        const planType = profile.plan_type === 'admin' ? 'pro' : profile.plan_type

        const { data, error: fetchError } = await supabase
          .from('plan_limits_config')
          .select('*')
          .eq('plan_type', planType)
          .single()

        if (fetchError) throw fetchError

        setLimits(data)
      } catch (err) {
        console.error('Erro ao buscar limites do plano:', err)
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    fetchLimits()

    // Subscrever a mudanças em tempo real (para quando admin alterar limites)
    const subscription = supabase
      .channel('plan_limits_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'plan_limits_config',
        },
        (payload) => {
          const planType = profile.plan_type === 'admin' ? 'pro' : profile.plan_type
          if (payload.new && (payload.new as PlanLimitsConfig).plan_type === planType) {
            setLimits(payload.new as PlanLimitsConfig)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [profile])

  return {
    limits,
    loading,
    error,
  }
}
