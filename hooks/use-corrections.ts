/**
 * Hook para gerenciar histórico de correções do usuário
 */

'use client'

import { useEffect, useState } from 'react'
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

  const supabase = createClient()
  const PAGE_SIZE = 20

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    fetchCorrections()
  }, [user, filters, page])

  const fetchCorrections = async () => {
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

      // Aplicar filtros
      if (filters.operationType) {
        query = query.eq('operation_type', filters.operationType)
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo)
      }

      if (filters.searchQuery) {
        query = query.or(
          `original_text.ilike.%${filters.searchQuery}%,corrected_text.ilike.%${filters.searchQuery}%`
        )
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      if (page === 0) {
        setCorrections(data || [])
      } else {
        setCorrections((prev) => [...prev, ...(data || [])])
      }

      setHasMore((data || []).length === PAGE_SIZE)
    } catch (err) {
      console.error('Erro ao buscar correções:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

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

      // Remover da lista local
      setCorrections((prev) => prev.filter((c) => c.id !== correctionId))

      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar correção'
      return { error: errorMessage }
    }
  }

  const refresh = () => {
    setPage(0)
    fetchCorrections()
  }

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
