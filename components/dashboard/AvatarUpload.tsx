'use client'

import { useState, useRef } from 'react'
import { useUser } from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Upload, User, CheckCircle2, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']

export function AvatarUpload() {
  const { profile, uploadAvatar } = useUser()
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, envie uma imagem JPG, PNG ou WEBP.',
        variant: 'destructive',
      })
      return
    }

    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'Arquivo muito grande',
        description: 'A imagem deve ter no máximo 5MB.',
        variant: 'destructive',
      })
      return
    }

    // Criar preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload automático
    handleUpload(file)
  }

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    setSuccess(false)

    try {
      const { data, error } = await uploadAvatar(file)

      if (error) {
        toast({
          title: 'Erro ao fazer upload',
          description: error,
          variant: 'destructive',
        })
        setPreview(null)
        return
      }

      setSuccess(true)
      toast({
        title: 'Avatar atualizado',
        description: 'Sua foto de perfil foi atualizada com sucesso.',
      })

      setTimeout(() => {
        setSuccess(false)
        setPreview(null)
      }, 3000)
    } catch (error) {
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao fazer upload. Tente novamente.',
        variant: 'destructive',
      })
      setPreview(null)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const getInitials = () => {
    if (!profile?.full_name) return '?'
    const names = profile.full_name.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    }
    return profile.full_name[0].toUpperCase()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Foto de Perfil</CardTitle>
        <CardDescription>
          Envie uma foto para personalizar seu perfil (JPG, PNG ou WEBP - máx. 5MB)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-6">
          {/* Avatar Preview */}
          <Avatar className="h-24 w-24">
            <AvatarImage src={preview || profile?.avatar_url || undefined} alt={profile?.full_name || 'Avatar'} />
            <AvatarFallback className="text-2xl">
              {profile?.avatar_url || preview ? null : getInitials()}
            </AvatarFallback>
          </Avatar>

          {/* Upload Button */}
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_FILE_TYPES.join(',')}
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleButtonClick}
              disabled={isUploading}
              className="gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Escolher Foto
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Recomendado: 400x400px ou maior
            </p>
          </div>
        </div>

        {/* Mensagem de Sucesso */}
        {success && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Foto de perfil atualizada com sucesso!
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
