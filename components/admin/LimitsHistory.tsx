'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, History, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ChangeRecord {
  id: string
  plan_type: string
  field_changed: string
  old_value: string | null
  new_value: string | null
  changed_by: string | null
  changed_by_email: string | null
  changed_at: string
}

interface LimitsHistoryProps {
  refreshTrigger?: number
}

export function LimitsHistory({ refreshTrigger }: LimitsHistoryProps) {
  const [history, setHistory] = useState<ChangeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)

  const limit = 10

  useEffect(() => {
    fetchHistory()
  }, [page, refreshTrigger])

  const fetchHistory = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/limites/history?page=${page}&limit=${limit}`)

      if (!response.ok) {
        throw new Error('Erro ao buscar histórico')
      }

      const result = await response.json()
      setHistory(result.history || [])
      setTotal(result.pagination.total)
      setTotalPages(result.pagination.totalPages)
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    } catch {
      return '--'
    }
  }

  const formatFieldName = (field: string) => {
    const fieldNames: Record<string, string> = {
      max_characters: 'Máximo de Caracteres',
      corrections_per_day: 'Correções por Dia',
      rewrites_per_day: 'Reescritas por Dia',
      ai_analyses_per_day: 'Análises de IA por Dia',
      show_ads: 'Exibir Anúncios',
    }
    return fieldNames[field] || field
  }

  const formatValue = (value: string | null) => {
    if (value === null) return 'N/A'
    if (value === '-1') return 'Ilimitado'
    if (value === 'true') return 'Sim'
    if (value === 'false') return 'Não'
    return value
  }

  const getPlanBadge = (planType: string) => {
    return planType === 'free' ? (
      <Badge variant="secondary">Gratuito</Badge>
    ) : (
      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">Premium</Badge>
    )
  }

  if (loading && history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Mudanças
          </CardTitle>
          <CardDescription>Registro de todas as alterações nos limites</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Histórico de Mudanças
        </CardTitle>
        <CardDescription>
          Registro de todas as alterações nos limites dos planos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Nenhuma mudança registrada ainda.
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Campo</TableHead>
                    <TableHead>Mudança</TableHead>
                    <TableHead>Alterado Por</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDate(record.changed_at)}
                      </TableCell>
                      <TableCell>{getPlanBadge(record.plan_type)}</TableCell>
                      <TableCell className="font-medium">
                        {formatFieldName(record.field_changed)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">
                            {formatValue(record.old_value)}
                          </span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{formatValue(record.new_value)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {record.changed_by_email || 'Sistema'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando {page * limit + 1} até {Math.min((page + 1) * limit, total)} de {total}{' '}
                  registros
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 0 || loading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <div className="flex items-center gap-1 px-2">
                    <span className="text-sm">
                      Página {page + 1} de {totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages - 1 || loading}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
