/**
 * Página de configurações do usuário no dashboard
 */

'use client'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { ProfileEditForm } from '@/components/dashboard/ProfileEditForm'
import { AvatarUpload } from '@/components/dashboard/AvatarUpload'
import { PasswordChangeForm } from '@/components/dashboard/PasswordChangeForm'
import { SubscriptionManagement } from '@/components/dashboard/SubscriptionManagement'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Lock, CreditCard, Image } from 'lucide-react'

export default function DashboardSettingsPage() {
  return (
    <DashboardLayout
      title="Configurações"
      description="Gerencie suas preferências, perfil e assinatura"
    >
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="avatar" className="gap-2">
            <Image className="h-4 w-4" />
            <span className="hidden sm:inline">Avatar</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Segurança</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Assinatura</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Informações do Perfil</h3>
            <p className="text-sm text-muted-foreground">
              Atualize suas informações pessoais e dados de contato
            </p>
          </div>
          <Separator />
          <ProfileEditForm />
        </TabsContent>

        <TabsContent value="avatar" className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Foto de Perfil</h3>
            <p className="text-sm text-muted-foreground">
              Personalize sua conta com uma foto de perfil
            </p>
          </div>
          <Separator />
          <AvatarUpload />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Segurança da Conta</h3>
            <p className="text-sm text-muted-foreground">
              Mantenha sua conta segura alterando sua senha regularmente
            </p>
          </div>
          <Separator />
          <PasswordChangeForm />
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Gerenciar Assinatura</h3>
            <p className="text-sm text-muted-foreground">
              Veja detalhes da sua assinatura e gerencie pagamentos
            </p>
          </div>
          <Separator />
          <SubscriptionManagement />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
