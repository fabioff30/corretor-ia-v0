/**
 * Utilities para verificação de limites do usuário (server-side)
 */

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import type { Database, PlanLimitsConfig } from '@/types/supabase'

export interface LimitCheckResult {
  allowed: boolean
  reason?: string
  remaining?: number
  limit?: number
}

/**
 * Verifica se o usuário pode realizar uma operação
 */
export async function canUserPerformOperation(
  userId: string,
  operationType: 'correct' | 'rewrite' | 'ai_analysis' | 'file_upload'
): Promise<LimitCheckResult> {
  const supabase = await createClient()

  try {
    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan_type')
      .eq('id', userId)
      .single<{ plan_type: Database['public']['Tables']['profiles']['Row']['plan_type'] }>()

    if (profileError || !profile) {
      return {
        allowed: false,
        reason: 'Usuário não encontrado',
      }
    }

    // Pro, Admin e Lifetime têm acesso ilimitado
    if (profile.plan_type === 'pro' || profile.plan_type === 'admin' || profile.plan_type === 'lifetime') {
      return {
        allowed: true,
        remaining: -1, // Ilimitado
        limit: -1,
      }
    }

    // Buscar limites do plano Free
    const { data: limits, error: limitsError } = await supabase
      .from('plan_limits_config')
      .select('*')
      .eq('plan_type', 'free')
      .single<Database['public']['Tables']['plan_limits_config']['Row']>()

    if (limitsError || !limits) {
      return {
        allowed: false,
        reason: 'Erro ao buscar limites do plano',
      }
    }

    // Buscar uso atual do dia
    const today = new Date().toISOString().split('T')[0]
    const { data: usage, error: usageError } = await supabase
      .from('usage_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single<Database['public']['Tables']['usage_limits']['Row']>()

    // Se não tem registro, criar um e permitir
    if (usageError && usageError.code === 'PGRST116') {
      const serviceClient = createServiceRoleClient()
      await serviceClient.from('usage_limits').insert<Database['public']['Tables']['usage_limits']['Insert']>({
        user_id: userId,
        date: today,
        corrections_used: 0,
        rewrites_used: 0,
        ai_analyses_used: 0,
        file_uploads_used: 0,
      })

      return {
        allowed: true,
        remaining: getLimitForOperation(limits, operationType),
        limit: getLimitForOperation(limits, operationType),
      }
    }

    if (usageError) {
      return {
        allowed: false,
        reason: 'Erro ao buscar uso atual',
      }
    }

    // Verificar limite específico da operação
    const currentUsage = getUsageForOperation(usage, operationType)
    const limit = getLimitForOperation(limits, operationType)
    const remaining = Math.max(0, limit - currentUsage)

    if (currentUsage >= limit) {
      return {
        allowed: false,
        reason: `Limite diário atingido. Você pode fazer até ${limit} ${getOperationLabel(operationType)} por dia.`,
        remaining: 0,
        limit,
      }
    }

    return {
      allowed: true,
      remaining,
      limit,
    }
  } catch (error) {
    console.error('Erro ao verificar limite:', error)
    return {
      allowed: false,
      reason: 'Erro ao verificar limite',
    }
  }
}

/**
 * Incrementa o contador de uso após operação bem-sucedida
 */
export async function incrementUserUsage(
  userId: string,
  operationType: 'correct' | 'rewrite' | 'ai_analysis' | 'file_upload'
): Promise<{ success: boolean; error?: string }> {
  const serviceClient = createServiceRoleClient()

  try {
    // Usar função do banco de dados para incrementar
    const { error } = await serviceClient.rpc('increment_usage', {
      p_user_id: userId,
      p_operation_type: operationType,
    })

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Erro ao incrementar uso:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Salva a correção no histórico do usuário
 */
export async function saveCorrection(params: {
  userId: string
  originalText: string
  correctedText: string
  operationType: 'correct' | 'rewrite' | 'ai_analysis' | 'file_upload'
  toneStyle?: string
  evaluation?: any
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('user_corrections')
      .insert<Database['public']['Tables']['user_corrections']['Insert']>({
        user_id: params.userId,
        original_text: params.originalText,
        corrected_text: params.correctedText,
        operation_type: params.operationType,
        tone_style: params.toneStyle || null,
        evaluation: params.evaluation || null,
        character_count: params.originalText.length,
      })
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      id: data.id,
    }
  } catch (error) {
    console.error('Erro ao salvar correção:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Busca os limites atuais do plano do usuário
 */
export async function getUserLimits(userId: string): Promise<PlanLimitsConfig | null> {
  const supabase = await createClient()

  try {
    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan_type')
      .eq('id', userId)
      .single<{ plan_type: Database['public']['Tables']['profiles']['Row']['plan_type'] }>()

    if (profileError || !profile) return null

    // Admin e Lifetime usam limites de Pro (ilimitado)
    const planType = (profile.plan_type === 'admin' || profile.plan_type === 'lifetime') ? 'pro' : (profile.plan_type ?? 'free')

    // Buscar limites do plano
    const { data: limits, error: limitsError } = await supabase
      .from('plan_limits_config')
      .select('*')
      .eq('plan_type', planType)
      .single<Database['public']['Tables']['plan_limits_config']['Row']>()

    if (limitsError) return null

    return limits
  } catch (error) {
    console.error('Erro ao buscar limites:', error)
    return null
  }
}

/**
 * Busca o uso atual do dia do usuário
 */
export async function getUserUsageToday(userId: string) {
  const supabase = await createClient()

  try {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('usage_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single<Database['public']['Tables']['usage_limits']['Row']>()

    if (error && error.code === 'PGRST116') {
      // Não existe registro, retornar zeros
      return {
        corrections_used: 0,
        rewrites_used: 0,
        ai_analyses_used: 0,
        file_uploads_used: 0,
        date: today,
      }
    }

    if (error) throw error

    return {
      corrections_used: data.corrections_used,
      rewrites_used: data.rewrites_used,
      ai_analyses_used: data.ai_analyses_used,
      file_uploads_used: data.file_uploads_used,
      date: data.date,
    }
  } catch (error) {
    console.error('Erro ao buscar uso:', error)
    return {
      corrections_used: 0,
      rewrites_used: 0,
      ai_analyses_used: 0,
      file_uploads_used: 0,
      date: new Date().toISOString().split('T')[0],
    }
  }
}

// Helper functions
function getUsageForOperation(
  usage: any,
  operationType: 'correct' | 'rewrite' | 'ai_analysis' | 'file_upload'
): number {
  switch (operationType) {
    case 'correct':
      return usage.corrections_used || 0
    case 'rewrite':
      return usage.rewrites_used || 0
    case 'ai_analysis':
      return usage.ai_analyses_used || 0
    case 'file_upload':
      return usage.file_uploads_used || 0
    default:
      return 0
  }
}

function getLimitForOperation(
  limits: PlanLimitsConfig,
  operationType: 'correct' | 'rewrite' | 'ai_analysis' | 'file_upload'
): number {
  switch (operationType) {
    case 'correct':
      return limits.corrections_per_day
    case 'rewrite':
      return limits.rewrites_per_day
    case 'ai_analysis':
      return limits.ai_analyses_per_day
    case 'file_upload':
      return limits.file_uploads_per_day
    default:
      return 0
  }
}

function getOperationLabel(operationType: 'correct' | 'rewrite' | 'ai_analysis' | 'file_upload'): string {
  switch (operationType) {
    case 'correct':
      return 'correções'
    case 'rewrite':
      return 'reescritas'
    case 'ai_analysis':
      return 'análises de IA'
    case 'file_upload':
      return 'uploads de arquivo'
    default:
      return 'operações'
  }
}
