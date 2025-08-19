"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useAdminAuth } from "@/hooks/use-admin-auth"

export function AdminLogin() {
  const [adminPassword, setAdminPassword] = useState("")
  const { isAuthenticated, login, logout, isLoading } = useAdminAuth()
  const { toast } = useToast()

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault()

    if (login(adminPassword)) {
      toast({
        title: "Login bem-sucedido",
        description: "Você está autenticado como administrador.",
      })
      setAdminPassword("")
    } else {
      toast({
        title: "Falha no login",
        description: "Senha incorreta. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleAdminLogout = () => {
    logout()
    toast({
      title: "Logout realizado",
      description: "Você saiu da área administrativa.",
    })
  }

  if (isLoading) {
    return null // Or a loading spinner
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 z-[100] w-full max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle>Acesso Administrativo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Senha"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="h-9"
              />
            </div>
            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
