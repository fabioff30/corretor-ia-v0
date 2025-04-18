"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { useToast } from "@/hooks/use-toast"
import { Lock, LogOut } from "lucide-react"

export function AdminLogin() {
  const [password, setPassword] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const { isAdmin, loginAsAdmin, logoutAdmin } = useAdminAuth()
  const { toast } = useToast()

  const handleLogin = () => {
    if (loginAsAdmin(password)) {
      toast({
        title: "Login bem-sucedido",
        description: "Você está logado como administrador.",
      })
      setIsOpen(false)
      setPassword("")
    } else {
      toast({
        title: "Falha no login",
        description: "Senha incorreta.",
        variant: "destructive",
      })
    }
  }

  const handleLogout = () => {
    logoutAdmin()
    toast({
      title: "Logout bem-sucedido",
      description: "Você saiu da conta de administrador.",
    })
  }

  return (
    <div className="fixed bottom-4 left-4 z-10">
      {isAdmin ? (
        <Button variant="outline" size="sm" onClick={handleLogout} className="bg-background/80 backdrop-blur-sm">
          <LogOut className="h-4 w-4 mr-2" />
          Sair (Admin)
        </Button>
      ) : (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm opacity-50 hover:opacity-100"
            >
              <Lock className="h-4 w-4" />
              <span className="sr-only">Admin Login</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Login de Administrador</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Input
                  id="password"
                  type="password"
                  placeholder="Senha de administrador"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleLogin()
                    }
                  }}
                />
              </div>
              <Button onClick={handleLogin}>Login</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
