'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Search, X } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'

export interface UserFilterState {
  search: string
  plan: 'all' | 'free' | 'pro' | 'admin'
  status: 'all' | 'active' | 'inactive' | 'past_due' | 'cancelled'
}

interface UserFiltersProps {
  filters: UserFilterState
  onFiltersChange: (filters: UserFilterState) => void
}

export function UserFilters({ filters, onFiltersChange }: UserFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search)
  const debouncedSearch = useDebounce(searchInput, 500)

  // Update filters when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ ...filters, search: debouncedSearch })
    }
  }, [debouncedSearch])

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
  }

  const handlePlanChange = (value: string) => {
    onFiltersChange({ ...filters, plan: value as UserFilterState['plan'] })
  }

  const handleStatusChange = (value: string) => {
    onFiltersChange({ ...filters, status: value as UserFilterState['status'] })
  }

  const handleClearFilters = () => {
    setSearchInput('')
    onFiltersChange({
      search: '',
      plan: 'all',
      status: 'all',
    })
  }

  const hasActiveFilters =
    filters.search !== '' || filters.plan !== 'all' || filters.status !== 'all'

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Nome ou email..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Plan Filter */}
          <div className="space-y-2">
            <Label htmlFor="plan">Plano</Label>
            <Select value={filters.plan} onValueChange={handlePlanChange}>
              <SelectTrigger id="plan">
                <SelectValue placeholder="Selecione o plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os planos</SelectItem>
                <SelectItem value="free">Gratuito</SelectItem>
                <SelectItem value="pro">Premium</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={filters.status} onValueChange={handleStatusChange}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="past_due">Vencido</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              className="w-full gap-2"
            >
              <X className="h-4 w-4" />
              Limpar Filtros
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
