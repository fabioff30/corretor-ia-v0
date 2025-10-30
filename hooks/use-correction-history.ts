import { useState, useEffect } from 'react'
import { CorrectionHistory, supabase } from '@/lib/supabase'
import { useUser } from "@/components/providers/user-provider"

export const useCorrectionHistory = () => {
  const { user } = useUser()
  const [history, setHistory] = useState<CorrectionHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setHistory([])
      setLoading(false)
      return
    }

    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('correction_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) {
          console.error('Erro ao buscar histórico:', error)
          setHistory([])
        } else {
          setHistory(data || [])
        }
      } catch (error) {
        console.error('Erro ao carregar histórico:', error)
        setHistory([])
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

  // Estatísticas derivadas
  const stats = {
    totalCorrections: history.length,
    averageScore: history.length > 0 
      ? Math.round((history.reduce((sum, h) => sum + h.score, 0) / history.length) * 10) / 10
      : 0,
    totalCharacters: history.reduce((sum, h) => sum + h.character_count, 0),
    correctionsByType: {
      grammar: history.filter(h => h.correction_type === 'grammar').length,
      style: history.filter(h => h.correction_type === 'style').length,
      tone: history.filter(h => h.correction_type === 'tone').length,
      complete: history.filter(h => h.correction_type === 'complete').length,
    }
  }

  return {
    history,
    loading,
    stats,
    saveCorrection
  }
}