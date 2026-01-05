// @ts-nocheck
/**
 * Utility para verificar se deve mostrar anúncios para o usuário
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Verifica se deve mostrar anúncios para o usuário autenticado
 * @param userId ID do usuário
 * @returns true se deve mostrar anúncios, false caso contrário
 */
export async function shouldShowAds(userId: string | null): Promise<boolean> {
  // Se não há usuário autenticado, mostrar anúncios (visitante)
  if (!userId) return true

  const supabase = await createClient()

  try {
    // Buscar perfil do usuário
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('plan_type')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      // Em caso de erro, mostrar anúncios por segurança
      return true
    }

    // Buscar configuração de anúncios do plano
    const planType = profile.plan_type === 'admin' ? 'pro' : profile.plan_type

    const { data: limits, error: limitsError } = await supabase
      .from('plan_limits_config')
      .select('show_ads')
      .eq('plan_type', planType)
      .single()

    if (limitsError || !limits) {
      // Em caso de erro, mostrar anúncios por segurança
      return true
    }

    return limits.show_ads
  } catch (error) {
    console.error('Erro ao verificar exibição de anúncios:', error)
    // Em caso de erro, mostrar anúncios por segurança
    return true
  }
}

/**
 * Verifica se deve mostrar anúncios (versão client-side)
 * Usa dados do perfil já carregados
 */
export function shouldShowAdsClient(planType: 'free' | 'pro' | 'admin' | null): boolean {
  if (!planType) return true // Visitante
  if (planType === 'pro' || planType === 'admin') return false
  return true // Free mostra anúncios
}
// @ts-nocheck
