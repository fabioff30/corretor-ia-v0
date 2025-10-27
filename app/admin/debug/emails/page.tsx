'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Mail, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface EmailTemplate {
  id: string
  name: string
  description: string
  requiredFields: string[]
}

export default function EmailDebugPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [toEmail, setToEmail] = useState<string>('')
  const [name, setName] = useState<string>('Usuário Teste')
  const [resetLink, setResetLink] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingTemplates, setIsFetchingTemplates] = useState(true)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const { toast } = useToast()

  // Fetch available templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/admin/debug/send-test-email')
        if (response.ok) {
          const data = await response.json()
          setTemplates(data.templates)
        } else {
          toast({
            title: 'Erro ao carregar templates',
            description: 'Verifique se você tem permissão de admin',
            variant: 'destructive',
          })
        }
      } catch (error) {
        console.error('Erro ao buscar templates:', error)
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os templates de email',
          variant: 'destructive',
        })
      } finally {
        setIsFetchingTemplates(false)
      }
    }

    fetchTemplates()
  }, [toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)

    // Validations
    if (!selectedTemplate) {
      toast({
        title: 'Template não selecionado',
        description: 'Selecione um template de email',
        variant: 'destructive',
      })
      return
    }

    if (!toEmail) {
      toast({
        title: 'Email não informado',
        description: 'Informe o email do destinatário',
        variant: 'destructive',
      })
      return
    }

    if (selectedTemplate === 'password-reset' && !resetLink) {
      toast({
        title: 'Link obrigatório',
        description: 'Informe o link de recuperação de senha',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/debug/send-test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: selectedTemplate,
          to: toEmail,
          name,
          ...(resetLink && { resetLink }),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: data.message })
        toast({
          title: '✅ Email enviado!',
          description: data.message,
        })
      } else {
        setResult({ success: false, message: data.error || 'Erro ao enviar email' })
        toast({
          title: 'Erro ao enviar',
          description: data.error || 'Erro desconhecido',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Erro ao enviar email de teste:', error)
      setResult({ success: false, message: 'Erro de conexão' })
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar o email de teste',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const currentTemplate = templates.find((t) => t.id === selectedTemplate)

  if (isFetchingTemplates) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Debug de Emails</h1>
        <p className="text-muted-foreground">
          Teste o envio de emails do sistema antes de enviá-los para usuários reais
        </p>
      </div>

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Os emails serão enviados através do Brevo usando as configurações do ambiente de produção.
          Certifique-se de que as variáveis <code>BREVO_API_KEY</code> e{' '}
          <code>BREVO_SENDER_EMAIL</code> estão configuradas.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enviar Email de Teste
          </CardTitle>
          <CardDescription>
            Selecione um template e informe o destinatário para testar o envio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Template Selection */}
            <div className="space-y-2">
              <Label htmlFor="template">Template de Email</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger id="template">
                  <SelectValue placeholder="Selecione um template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentTemplate && (
                <p className="text-sm text-muted-foreground">{currentTemplate.description}</p>
              )}
            </div>

            {/* Recipient Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email do Destinatário *</Label>
              <Input
                id="email"
                type="email"
                placeholder="teste@exemplo.com"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Email real para onde o teste será enviado
              </p>
            </div>

            {/* Recipient Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Destinatário</Label>
              <Input
                id="name"
                type="text"
                placeholder="Nome do Usuário"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Nome que aparecerá no email</p>
            </div>

            {/* Reset Link (conditional) */}
            {selectedTemplate === 'password-reset' && (
              <div className="space-y-2">
                <Label htmlFor="resetLink">Link de Recuperação *</Label>
                <Input
                  id="resetLink"
                  type="url"
                  placeholder="https://www.corretordetextoonline.com.br/resetar-senha?token=..."
                  value={resetLink}
                  onChange={(e) => setResetLink(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  URL completa do link de recuperação de senha
                </p>
              </div>
            )}

            {/* Result Display */}
            {result && (
              <Alert variant={result.success ? 'default' : 'destructive'}>
                {result.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Email de Teste
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Templates List */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Templates Disponíveis</CardTitle>
          <CardDescription>Lista de todos os templates de email configurados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {templates.map((template) => (
              <div key={template.id} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-1">{template.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                <div className="flex gap-2 flex-wrap">
                  {template.requiredFields.map((field) => (
                    <code
                      key={field}
                      className="text-xs bg-muted px-2 py-1 rounded"
                    >
                      {field}
                    </code>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
