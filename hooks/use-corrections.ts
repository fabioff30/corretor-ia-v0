/**
 * Hook para gerenciar histórico de correções do usuário
 */

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserCorrection } from '@/types/supabase'
import { useUser } from './use-user'

export interface CorrectionFilters {
  operationType?: 'correct' | 'rewrite' | 'ai_analysis'
  searchQuery?: string
  dateFrom?: string
  dateTo?: string
}

export function useCorrections(filters: CorrectionFilters = {}) {
  const { user } = useUser()
  const [corrections, setCorrections] = useState<UserCorrection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  const supabase = useMemo(() => createClient(), [])
  const PAGE_SIZE = 20
  const filtersKey = useMemo(() => JSON.stringify(filters || {}), [filters])

  const fetchCorrections = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('user_corrections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      const parsedFilters = filters || {}

      if (parsedFilters.operationType) {
        query = query.eq('operation_type', parsedFilters.operationType)
      }

      if (parsedFilters.dateFrom) {
        query = query.gte('created_at', parsedFilters.dateFrom)
      }

      if (parsedFilters.dateTo) {
        query = query.lte('created_at', parsedFilters.dateTo)
      }

      if (parsedFilters.searchQuery) {
        query = query.or(
          `original_text.ilike.%${parsedFilters.searchQuery}%,corrected_text.ilike.%${parsedFilters.searchQuery}%`
        )
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      if (page === 0) {
        setCorrections(data || [])
      } else {
        setCorrections((prev) => {
          const existingIds = new Set(prev.map((item) => item.id))
          const merged = [...prev]
          for (const item of data || []) {
            if (!existingIds.has(item.id)) {
              merged.push(item)
            }
          }
          return merged
        })
      }

      setHasMore((data || []).length === PAGE_SIZE)
    } catch (err) {
      console.error('Erro ao buscar correções:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [user, supabase, filtersKey, page])

  useEffect(() => {
    if (!user) {
      setLoading(false)
      setCorrections([])
      return
    }

    fetchCorrections()
  }, [user, fetchCorrections])

  useEffect(() => {
    setPage(0)
  }, [filtersKey, user?.id])

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1)
    }
  }

  const deleteCorrection = async (correctionId: string) => {
    try {
      const { error } = await supabase
        .from('user_corrections')
        .delete()
        .eq('id', correctionId)

      if (error) throw error

      setCorrections((prev) => prev.filter((c) => c.id !== correctionId))

      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar correção'
      return { error: errorMessage }
    }
  }

  const refresh = useCallback(() => {
    setPage(0)
    fetchCorrections()
  }, [fetchCorrections])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`user_corrections_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_corrections',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newCorrection = payload.new as UserCorrection
          setCorrections((prev) => {
            const exists = prev.some((item) => item.id === newCorrection.id)
            const updated = exists
              ? prev.map((item) => (item.id === newCorrection.id ? (newCorrection as UserCorrection) : item))
              : [newCorrection as UserCorrection, ...prev]
            const maxItems = PAGE_SIZE * (page + 1)
            return updated.slice(0, maxItems)
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'user_corrections',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const deletedId = (payload.old as UserCorrection)?.id
          if (deletedId) {
            setCorrections((prev) => prev.filter((item) => item.id !== deletedId))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_corrections',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedCorrection = payload.new as UserCorrection
          setCorrections((prev) => prev.map((item) => (item.id === updatedCorrection.id ? updatedCorrection : item)))
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [supabase, user, PAGE_SIZE, page])

  useEffect(() => {
    const handler = () => {
      refresh()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('user-corrections:refresh', handler)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('user-corrections:refresh', handler)
      }
    }
  }, [refresh])

  return {
    corrections,
    loading,
    error,
    hasMore,
    loadMore,
    deleteCorrection,
    refresh,
  }
}
