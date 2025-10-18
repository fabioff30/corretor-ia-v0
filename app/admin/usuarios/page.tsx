/**
 * Admin Page: Users Management
 * /admin/usuarios
 *
 * Manage all users, edit plans, view usage
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UsersTable, type UserWithStats } from '@/components/admin/UsersTable'
import { UserFilters, type UserFilterState } from '@/components/admin/UserFilters'
import { EditUserPlanDialog } from '@/components/admin/EditUserPlanDialog'
import { UserHistoryModal } from '@/components/admin/UserHistoryModal'
import { Users, UserCheck, Crown } from 'lucide-react'

interface UsersData {
  users: UserWithStats[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function AdminUsersPage() {
  const [data, setData] = useState<UsersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<UserFilterState>({
    search: '',
    plan: 'all',
    status: 'all',
  })
  const [page, setPage] = useState(0)
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [historyUserId, setHistoryUserId] = useState<string | null>(null)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })

      if (filters.search) params.append('search', filters.search)
      if (filters.plan !== 'all') params.append('plan', filters.plan)
      if (filters.status !== 'all') params.append('status', filters.status)

      const response = await fetch(`/api/admin/users?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Erro ao buscar usuários')
      }

      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Reset page when filters change
  useEffect(() => {
    setPage(0)
  }, [filters])

  const handleEditUser = (user: UserWithStats) => {
    setSelectedUser(user)
    setEditDialogOpen(true)
  }

  const handleViewHistory = (userId: string) => {
    setHistoryUserId(userId)
    setHistoryModalOpen(true)
  }

  const handleEditSuccess = () => {
    fetchUsers()
  }

  // Calculate stats
  const stats = data
    ? {
        total: data.pagination.total,
        free: data.users.filter((u) => u.plan_type === 'free').length,
        pro: data.users.filter((u) => u.plan_type === 'pro').length,
        admin: data.users.filter((u) => u.plan_type === 'admin').length,
      }
    : { total: 0, free: 0, pro: 0, admin: 0 }

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
        <p className="text-muted-foreground">
          Visualize, filtre e gerencie todos os usuários do sistema
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usuários Free</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.free}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usuários Premium</CardTitle>
            <UserCheck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.pro}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Crown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.admin}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <UserFilters filters={filters} onFiltersChange={setFilters} />

      {/* Users Table */}
      <UsersTable
        users={data?.users || []}
        loading={loading}
        pagination={data?.pagination || { page: 0, limit: 20, total: 0, totalPages: 0 }}
        onPageChange={setPage}
        onEditUser={handleEditUser}
        onViewHistory={handleViewHistory}
      />

      {/* Edit User Dialog */}
      <EditUserPlanDialog
        user={selectedUser}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
      />

      {/* User History Modal */}
      <UserHistoryModal
        userId={historyUserId}
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
      />
    </div>
  )
}
