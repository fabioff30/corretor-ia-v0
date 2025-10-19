/**
 * Hook para gerenciar histórico de correções do usuário
 */

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useUser } from './use-user'
import type { UserCorrection } from '@/types/supabase'

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
  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)

  const PAGE_SIZE = 20
  const filtersKey = useMemo(() => JSON.stringify(filters || {}), [filters])

  const fetchCorrections = useCallback(
    async (targetPage: number, replace = false) => {
      if (!user) return

      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      const params = new URLSearchParams()
      params.set('page', String(targetPage))
      params.set('pageSize', String(PAGE_SIZE))

      if (filters.operationType) params.set('operationType', filters.operationType)
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.set('dateTo', filters.dateTo)
      if (filters.searchQuery) params.set('searchQuery', filters.searchQuery)

      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/dashboard/correcoes?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          throw new Error(payload?.error || 'Não foi possível carregar o histórico de textos')
        }

        const payload = (await response.json()) as {
          items: UserCorrection[]
          hasMore: boolean
          page: number
        }

        if (!isMountedRef.current) return

        setCorrections((prev) => {
          const incoming = payload.items || []

          if (replace) {
            return incoming
          }

          const existingIds = new Set(prev.map((item) => item.id))
          const merged = [...prev]

          for (const item of incoming) {
            if (!existingIds.has(item.id)) {
              merged.push(item)
            }
          }

          return merged
        })

        setHasMore(payload.hasMore)
        setPage(payload.page)
      } catch (err) {
        if (controller.signal.aborted) return

        console.error('Erro ao buscar correções:', err)
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    },
    [filters, user],
  )

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
      abortControllerRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setLoading(false)
      setCorrections([])
      return
    }

    setPage(0)
    fetchCorrections(0, true)
  }, [user, fetchCorrections, filtersKey])

  useEffect(() => {
    if (!user) return
    setCorrections([])
    setHasMore(true)
  }, [user?.id, filtersKey])

  const loadMore = () => {
    if (loading || !hasMore) return
    const nextPage = page + 1
    fetchCorrections(nextPage)
  }

  const deleteCorrection = async (correctionId: string) => {
    try {
      const response = await fetch(`/api/dashboard/correcoes?id=${encodeURIComponent(correctionId)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || 'Erro ao deletar correção')
      }

      setCorrections((prev) => prev.filter((c) => c.id !== correctionId))

      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar correção'
      return { error: errorMessage }
    }
  }

  const refresh = useCallback(() => {
    fetchCorrections(0, true)
  }, [fetchCorrections])

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
