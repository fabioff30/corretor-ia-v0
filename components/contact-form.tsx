"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { submitContactForm } from "@/actions/contact-form"
import { Loader2, Send, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { sendGTMEvent } from "@/utils/gtm-helper"

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
    message: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      const result = await submitContactForm(formData)

      if (result.success) {
        // Track successful submission
        sendGTMEvent("contact_form_submitted", {
          form_location: "header_modal",
        })

        setIsSuccess(true)
        toast({
          title: "Mensagem enviada!",
          description: result.message || "Agradecemos seu contato. Responderemos em breve.",
        })

        // Reset form after 3 seconds
        setTimeout(() => {
          setFormData({
            name: "",
            email: "",
            whatsapp: "",
            message: "",
          })
          setIsSuccess(false)
        }, 3000)
      } else {
        if (result.errors) {
          setErrors(result.errors)
        } else {
          toast({
            title: "Erro ao enviar mensagem",
            description: result.message || "Ocorreu um erro ao enviar sua mensagem. Por favor, tente novamente.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      toast({
        title: "Erro ao enviar mensagem",
        description: "Ocorreu um erro ao enviar sua mensagem. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          name="name"
          placeholder="Seu nome completo"
          value={formData.name}
          onChange={handleChange}
          disabled={isSubmitting || isSuccess}
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="seu@email.com"
          value={formData.email}
          onChange={handleChange}
          disabled={isSubmitting || isSuccess}
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="whatsapp">WhatsApp</Label>
        <Input
          id="whatsapp"
          name="whatsapp"
          placeholder="(00) 00000-0000"
          value={formData.whatsapp}
          onChange={handleChange}
          disabled={isSubmitting || isSuccess}
          className={errors.whatsapp ? "border-red-500" : ""}
        />
        {errors.whatsapp && <p className="text-sm text-red-500">{errors.whatsapp}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Mensagem (opcional)</Label>
        <Textarea
          id="message"
          name="message"
          placeholder="Sua mensagem..."
          rows={4}
          value={formData.message}
          onChange={handleChange}
          disabled={isSubmitting || isSuccess}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting || isSuccess}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : isSuccess ? (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Enviado!
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Enviar Mensagem
          </>
        )}
      </Button>
    </form>
  )
}
