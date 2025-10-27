/**
 * Admin Page: Plan Limits Configuration
 * /admin/limites
 *
 * Configure and manage plan limits
 */

'use client'

import { useState, useEffect } from 'react'
import { LimitsEditor } from '@/components/admin/LimitsEditor'
import { LimitsPreview } from '@/components/admin/LimitsPreview'
import { LimitsHistory } from '@/components/admin/LimitsHistory'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Settings, AlertCircle } from 'lucide-react'

interface PlanLimits {
  id: string
  plan_type: 'free' | 'pro'
  max_characters: number
  corrections_per_day: number
  rewrites_per_day: number
  ai_analyses_per_day: number
  show_ads: boolean
}

export default function AdminLimitsPage() {
  const [limits, setLimits] = useState<PlanLimits[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    fetchLimits()
  }, [refreshTrigger])

  const fetchLimits = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/limites', {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar limites')
      }

      const result = await response.json()
      setLimits(result.limits || [])
    } catch (error) {
      console.error('Error fetching limits:', error)
      setError(error instanceof Error ? error.message : 'Erro ao carregar limites')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Configurar Limites dos Planos
        </h1>
        <p className="text-muted-foreground">
          Gerencie os limites de uso e configurações de cada plano
        </p>
      </div>

      {/* Important Alert */}
      <Alert className="border-blue-500 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Importante:</strong> As mudanças nos limites são aplicadas imediatamente para todos os
          usuários. Todas as alterações são registradas no histórico de auditoria.
        </AlertDescription>
      </Alert>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-500 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      ) : (
        <>
          {/* Limits Editor */}
          <LimitsEditor limits={limits} onUpdate={handleUpdate} />

          {/* Current Limits Preview */}
          <div>
            <h2 className="mb-4 text-xl font-semibold">Limites Atuais</h2>
            <LimitsPreview limits={limits} />
          </div>

          {/* History */}
          <div>
            <LimitsHistory refreshTrigger={refreshTrigger} />
          </div>
        </>
      )}
    </div>
  )
}
