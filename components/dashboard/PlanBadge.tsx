/**
 * Badge que mostra o plano atual do usuário
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { Crown, Shield, Star } from 'lucide-react'

interface PlanBadgeProps {
  planType: 'free' | 'pro' | 'admin'
  className?: string
}

export function PlanBadge({ planType, className }: PlanBadgeProps) {
  const config = {
    free: {
      label: 'Gratuito',
      icon: Star,
      className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    },
    pro: {
      label: 'PRO',
      icon: Crown,
      className: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-bold',
    },
    admin: {
      label: 'ADMIN',
      icon: Shield,
      className: 'bg-gradient-to-r from-purple-500 to-purple-700 text-white font-bold',
    },
  }

  const { label, icon: Icon, className: badgeClassName } = config[planType]

  return (
    <Badge className={`${badgeClassName} ${className || ''}`}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  )
}
