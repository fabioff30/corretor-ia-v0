'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Edit, History, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface UserWithStats {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  plan_type: 'free' | 'pro' | 'admin'
  subscription_status: 'active' | 'inactive' | 'past_due' | 'cancelled'
  created_at: string
  usage_today: {
    corrections_used: number
    rewrites_used: number
    ai_analyses_used: number
  }
  total_corrections: number
}

interface UsersTableProps {
  users: UserWithStats[]
  loading: boolean
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onPageChange: (page: number) => void
  onEditUser: (user: UserWithStats) => void
  onViewHistory: (userId: string) => void
}

export function UsersTable({
  users,
  loading,
  pagination,
  onPageChange,
  onEditUser,
  onViewHistory,
}: UsersTableProps) {
  const getPlanBadge = (planType: string) => {
    switch (planType) {
      case 'free':
        return <Badge variant="secondary">Gratuito</Badge>
      case 'pro':
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">Premium</Badge>
      case 'admin':
        return <Badge className="bg-gradient-to-r from-orange-500 to-red-500">Admin</Badge>
      default:
        return <Badge>{planType}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Ativo</Badge>
      case 'inactive':
        return <Badge variant="secondary">Inativo</Badge>
      case 'past_due':
        return <Badge className="bg-orange-500">Vencido</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
    } catch {
      return '--'
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      const names = name.split(' ')
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      }
      return name[0].toUpperCase()
    }
    return email[0].toUpperCase()
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Nenhum usuário encontrado.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Uso Hoje</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    {/* User Avatar & Name */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || user.email} />
                          <AvatarFallback>{getInitials(user.full_name, user.email)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.full_name || 'Sem nome'}</p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>

                    {/* Plan */}
                    <TableCell>{getPlanBadge(user.plan_type)}</TableCell>

                    {/* Status */}
                    <TableCell>{getStatusBadge(user.subscription_status)}</TableCell>

                    {/* Usage Today */}
                    <TableCell className="text-center">
                      <div className="text-sm">
                        <p className="font-medium">{user.usage_today.corrections_used}</p>
                        <p className="text-xs text-muted-foreground">correções</p>
                      </div>
                    </TableCell>

                    {/* Total Corrections */}
                    <TableCell className="text-center">
                      <p className="font-medium">{user.total_corrections}</p>
                    </TableCell>

                    {/* Created At */}
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(user.created_at)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditUser(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar Plano
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onViewHistory(user.id)}>
                            <History className="mr-2 h-4 w-4" />
                            Ver Histórico
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {pagination.page * pagination.limit + 1} até{' '}
            {Math.min((pagination.page + 1) * pagination.limit, pagination.total)} de {pagination.total} usuários
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <div className="flex items-center gap-1 px-2">
              <span className="text-sm">
                Página {pagination.page + 1} de {pagination.totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages - 1}
            >
              Próxima
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
