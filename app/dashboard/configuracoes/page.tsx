/**
 * Página de configurações do usuário no dashboard
 */

import { DashboardLayout } from "@/components/dashboard/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardSettingsPage() {
  return (
    <DashboardLayout
      title="Configurações"
      description="Gerencie preferências da sua conta e notificações"
    >
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Em breve</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Estamos preparando esta seção. Enquanto isso, entre em contato pelo suporte se precisar atualizar algum dado.
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
