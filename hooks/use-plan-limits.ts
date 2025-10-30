/**
 * Hook para buscar limites do plano do usuário (client-side)
 */

'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { PlanLimitsConfig } from '@/types/supabase'
import { useUser } from './use-user'

export function usePlanLimits() {
  const { profile } = useUser()
  const [limits, setLimits] = useState<PlanLimitsConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const planType: 'free' | 'pro' = profile?.plan_type === 'pro' || profile?.plan_type === 'admin' ? 'pro' : 'free'

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    const fetchLimits = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('plan_limits_config')
          .select('*')
          .eq('plan_type', planType)
          .single()

        if (fetchError) throw fetchError

        if (isMounted) {
          setLimits(data)
        }
      } catch (err) {
        console.error('Erro ao buscar limites do plano:', err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Erro desconhecido')
          setLimits(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchLimits()

    // Subscrever a mudanças em tempo real (para quando admin alterar limites)
    const subscription = supabase
      .channel(`plan_limits_${planType}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'plan_limits_config',
          filter: `plan_type=eq.${planType}`,
        },
        (payload) => {
          if (!isMounted) return

          const updated = payload.new as PlanLimitsConfig | null
          if (updated) {
            setLimits(updated)
          }
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [planType])

  return {
    limits,
    loading,
    error,
  }
}
