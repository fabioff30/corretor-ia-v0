'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, CheckCircle, Repeat2, ScanSearch, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface User {
  id: string
  email: string
  full_name: string | null
}

interface UserCorrection {
  id: string
  original_text: string
  corrected_text: string
  operation_type: 'correct' | 'rewrite' | 'ai_analysis'
  character_count: number
  created_at: string
}

interface HistoryData {
  user: User
  history: UserCorrection[]
  stats: {
    total_corrections: number
    total_rewrites: number
    total_ai_analyses: number
  }
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface UserHistoryModalProps {
  userId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserHistoryModal({ userId, open, onOpenChange }: UserHistoryModalProps) {
  const [data, setData] = useState<HistoryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)

  useEffect(() => {
    if (open && userId) {
      fetchHistory()
    } else {
      setData(null)
      setPage(0)
    }
  }, [open, userId, page])

  const fetchHistory = async () => {
    if (!userId) return

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/users/${userId}/history?page=${page}&limit=10`)

      if (!response.ok) {
        throw new Error('Erro ao buscar histórico')
      }

      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'correct':
        return (
          <Badge className="gap-1 border-0 bg-emerald-500/10 text-emerald-600">
            <CheckCircle className="h-3.5 w-3.5" />
            Correção
          </Badge>
        )
      case 'rewrite':
        return (
          <Badge className="gap-1 border-0 bg-blue-500/10 text-blue-600">
            <Repeat2 className="h-3.5 w-3.5" />
            Reescrita
          </Badge>
        )
      case 'ai_analysis':
        return (
          <Badge className="gap-1 border-0 bg-purple-500/10 text-purple-600">
            <ScanSearch className="h-3.5 w-3.5" />
            Detector IA
          </Badge>
        )
      default:
        return <Badge>{type}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR })
    } catch {
      return '--'
    }
  }

  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text
    return `${text.substring(0, maxLength)}...`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico do Usuário</DialogTitle>
          <DialogDescription>
            {data ? `${data.user.full_name || data.user.email}` : 'Carregando...'}
          </DialogDescription>
        </DialogHeader>

        {loading && !data ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total de Correções</CardDescription>
                  <CardTitle className="text-2xl">{data.stats.total_corrections}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total de Reescritas</CardDescription>
                  <CardTitle className="text-2xl">{data.stats.total_rewrites}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Análises de IA</CardDescription>
                  <CardTitle className="text-2xl">{data.stats.total_ai_analyses}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* History Table */}
            <div>
              <h3 className="mb-4 text-sm font-medium">Histórico Recente</h3>
              {data.history.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    Nenhuma correção encontrada para este usuário.
                  </CardContent>
                </Card>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Texto Original</TableHead>
                        <TableHead className="text-right">Caracteres</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.history.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(item.created_at)}
                          </TableCell>
                          <TableCell>{getTypeBadge(item.operation_type)}</TableCell>
                          <TableCell className="max-w-md">
                            <span className="text-sm">{truncateText(item.original_text)}</span>
                          </TableCell>
                          <TableCell className="text-right">{item.character_count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando {page * data.pagination.limit + 1} até{' '}
                  {Math.min((page + 1) * data.pagination.limit, data.pagination.total)} de{' '}
                  {data.pagination.total} registros
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 0 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= data.pagination.totalPages - 1 || loading}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
