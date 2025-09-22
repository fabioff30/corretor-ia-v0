import { useState, useEffect } from 'react'
import { CorrectionHistory, supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/unified-auth-context'

// Extended interfaces for different content types
export interface RewriteHistory {
  id: string
  user_id: string
  original_text: string
  rewritten_text: string
  style: string
  score: number
  character_count: number
  evaluation?: any
  created_at: string
  updated_at: string
  type: 'rewrite'
}

export interface AnalysisHistory {
  id: string
  user_id: string
  original_text: string
  analysis_result: any
  analysis_type: string
  score: number
  character_count: number
  created_at: string
  updated_at: string
  type: 'analysis'
}

export interface HumanizationHistory {
  id: string
  user_id: string
  original_text: string
  humanized_text: string
  humanization_type: string
  score: number
  character_count: number
  evaluation?: any
  created_at: string
  updated_at: string
  type: 'humanization'
}

export type UnifiedHistoryItem =
  | (CorrectionHistory & { type: 'correction' })
  | RewriteHistory
  | AnalysisHistory
  | HumanizationHistory

export const useCorrectionHistory = () => {
  const { user } = useAuth()
  const [history, setHistory] = useState<CorrectionHistory[]>([])
  const [allHistory, setAllHistory] = useState<UnifiedHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setHistory([])
      setAllHistory([])
      setLoading(false)
      return
    }

    const fetchHistory = async () => {
      try {
        // Fetch corrections
        const { data: correctionData, error: correctionError } = await supabase
          .from('correction_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (correctionError) {
          console.error('Erro ao buscar histórico de correções:', correctionError)
        }

        // Fetch rewrites
        const { data: rewriteData, error: rewriteError } = await supabase
          .from('rewrite_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (rewriteError) {
          console.error('Erro ao buscar histórico de reescritas:', rewriteError)
        }

        // Fetch analyses
        const { data: analysisData, error: analysisError } = await supabase
          .from('analysis_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (analysisError) {
          console.error('Erro ao buscar histórico de análises:', analysisError)
        }

        // Fetch humanizations
        const { data: humanizationData, error: humanizationError } = await supabase
          .from('humanization_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (humanizationError) {
          console.error('Erro ao buscar histórico de humanizações:', humanizationError)
        }

        // Set correction history (for backward compatibility)
        setHistory(correctionData || [])

        // Combine all history items and sort by created_at
        const allItems: UnifiedHistoryItem[] = [
          ...(correctionData || []).map(item => ({ ...item, type: 'correction' as const })),
          ...(rewriteData || []).map(item => ({ ...item, type: 'rewrite' as const })),
          ...(analysisData || []).map(item => ({ ...item, type: 'analysis' as const })),
          ...(humanizationData || []).map(item => ({ ...item, type: 'humanization' as const }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        setAllHistory(allItems.slice(0, 50)) // Limit to 50 most recent items

      } catch (error) {
        console.error('Erro ao carregar histórico:', error)
        setHistory([])
        setAllHistory([])
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [user])

  // Função para salvar uma nova correção
  const saveCorrection = async (
    originalText: string,
    correctedText: string,
    score: number,
    correctionType: 'grammar' | 'style' | 'tone' | 'complete'
  ) => {
    if (!user) return { error: 'Usuário não autenticado' }

    try {
      const { data, error } = await supabase
        .from('correction_history')
        .insert([
          {
            user_id: user.id,
            original_text: originalText,
            corrected_text: correctedText,
            score: score,
            character_count: originalText.length,
            correction_type: correctionType
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('Erro ao salvar correção:', error)
        return { error: 'Erro ao salvar correção' }
      }

      // Adicionar ao histórico local
      setHistory(prev => [data, ...prev])
      return { error: null, data }
    } catch (error) {
      console.error('Erro ao salvar correção:', error)
      return { error: 'Erro ao salvar correção' }
    }
  }

  // Estatísticas derivadas (incluindo todos os tipos de conteúdo)
  const stats = {
    totalCorrections: history.length,
    totalItems: allHistory.length,
    averageScore: allHistory.length > 0
      ? Math.round((allHistory.reduce((sum, h) => sum + h.score, 0) / allHistory.length) * 10) / 10
      : 0,
    totalCharacters: allHistory.reduce((sum, h) => sum + h.character_count, 0),
    correctionsByType: {
      grammar: history.filter(h => h.correction_type === 'grammar').length,
      style: history.filter(h => h.correction_type === 'style').length,
      tone: history.filter(h => h.correction_type === 'tone').length,
      complete: history.filter(h => h.correction_type === 'complete').length,
    },
    itemsByType: {
      corrections: allHistory.filter(h => h.type === 'correction').length,
      rewrites: allHistory.filter(h => h.type === 'rewrite').length,
      analyses: allHistory.filter(h => h.type === 'analysis').length,
      humanizations: allHistory.filter(h => h.type === 'humanization').length,
    }
  }

  return {
    history, // For backward compatibility
    allHistory, // New unified history
    loading,
    stats,
    saveCorrection
  }
}