"use server"

import { z } from "zod"

// Define the schema for form validation
const contactFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  whatsapp: z
    .string()
    .min(10, "Número de WhatsApp inválido")
    .max(15, "Número de WhatsApp inválido")
    .refine((val) => /^[0-9+\s()-]+$/.test(val), {
      message: "Número de WhatsApp inválido",
    }),
  message: z.string().optional(),
})

type ContactFormData = z.infer<typeof contactFormSchema>

// Webhook URL - using a fallback mechanism
const WEBHOOK_URL = "https://auto.ffmedia.com.br/webhook/contato/bbe40ca9-ed12-449b-a3a5-5ec5a628ddee"

// Also update the fetch implementation to include better logging and error handling
export async function submitContactForm(formData: ContactFormData) {
  try {
    // Validate the form data
    const validatedData = contactFormSchema.parse(formData)

    // Log the data being sent (for debugging)
    console.log("Sending contact form data to webhook:", {
      url: WEBHOOK_URL,
      data: {
        ...validatedData,
        timestamp: new Date().toISOString(),
        source: "website_contact_form",
      },
    })

    // Send the data to the webhook
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...validatedData,
          timestamp: new Date().toISOString(),
          source: "website_contact_form",
        }),
      })

      // Log the response status
      console.log(`Webhook response status: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        // Try to get more details about the error
        let errorDetails = ""
        try {
          const errorText = await response.text()
          errorDetails = errorText
        } catch (e) {
          errorDetails = "Could not extract error details"
        }

        console.error(`Webhook error response: ${response.status} ${response.statusText}`, errorDetails)
        return {
          success: false,
          message: `Erro ao enviar mensagem: ${response.status} ${response.statusText}`,
        }
      }

      // Success case
      return { success: true, message: "Mensagem enviada com sucesso! Entraremos em contato em breve." }
    } catch (error) {
      console.error("Network error when sending to webhook:", error)
      return {
        success: false,
        message: "Erro de conexão ao enviar mensagem. Por favor, tente novamente.",
      }
    }
  } catch (error) {
    console.error("Error in contact form submission:", error)

    if (error instanceof z.ZodError) {
      // Return validation errors
      return {
        success: false,
        errors: error.errors.reduce(
          (acc, curr) => {
            acc[curr.path[0]] = curr.message
            return acc
          },
          {} as Record<string, string>,
        ),
      }
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido ao enviar formulário",
    }
  }
}
