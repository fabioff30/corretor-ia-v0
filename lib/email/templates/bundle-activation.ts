/**
 * Bundle Activation Confirmation Email Template
 *
 * Sent after successful payment for CorretorIA + Julinho bundle
 * Simple, personal email from Fábio
 */

interface BundleActivationEmailParams {
  name?: string | null
  whatsappPhone?: string | null
}

const JULINHO_WHATSAPP = "5584999401840"

export function bundleActivationEmailTemplate({
  name,
  whatsappPhone,
}: BundleActivationEmailParams) {
  const recipientName = name || "amigo(a)"
  const firstName = recipientName.split(' ')[0]
  const julinhoLink = `https://wa.me/${JULINHO_WHATSAPP}?text=Oi%20Julinho!%20Acabei%20de%20ativar%20meu%20plano%20Premium.`

  const subject = `${firstName}, seu acesso Premium tá liberado!`

  const htmlContent = `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Seu acesso Premium está liberado!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 560px; border-collapse: collapse;">

          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding: 0 0 30px 0;">
              <img src="https://corretordetextoonline.com.br/images/logo-corretoria.png" alt="CorretorIA" width="160" style="display: block;" />
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="background-color: #ffffff; border-radius: 12px; padding: 40px 35px;">

              <p style="color: #18181b; font-size: 18px; line-height: 1.7; margin: 0 0 20px 0;">
                E aí, ${firstName}!
              </p>

              <p style="color: #3f3f46; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
                Passando aqui rapidinho pra te avisar: <strong>seu acesso Premium tá liberado!</strong>
              </p>

              <p style="color: #3f3f46; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
                Agora você pode usar o CorretorIA e o Julinho sem limite nenhum. Correções ilimitadas, textos maiores, e o Julinho disponível 24h no seu WhatsApp pra te ajudar.
              </p>

              <p style="color: #3f3f46; font-size: 16px; line-height: 1.7; margin: 0 0 30px 0;">
                Pra começar a usar o Julinho, é só mandar um "oi" pra ele. Ele já tá te esperando!
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 10px 0 30px 0;">
                    <a href="${julinhoLink}"
                       style="display: inline-block; background-color: #25D366; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Falar com o Julinho no WhatsApp
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #3f3f46; font-size: 16px; line-height: 1.7; margin: 0 0 8px 0;">
                Qualquer dúvida, é só responder esse email que eu mesmo respondo.
              </p>

              <p style="color: #3f3f46; font-size: 16px; line-height: 1.7; margin: 0 0 0 0;">
                Valeu pela confiança!
              </p>

              <p style="color: #18181b; font-size: 16px; line-height: 1.7; margin: 25px 0 0 0;">
                Um abraço,<br/>
                <strong>Fábio</strong><br/>
                <span style="color: #71717a; font-size: 14px;">Criador do CorretorIA</span>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 25px 20px; text-align: center;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                © 2025 CorretorIA · corretordetextoonline.com.br
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const textContent = `E aí, ${firstName}!

Passando aqui rapidinho pra te avisar: seu acesso Premium tá liberado!

Agora você pode usar o CorretorIA e o Julinho sem limite nenhum. Correções ilimitadas, textos maiores, e o Julinho disponível 24h no seu WhatsApp pra te ajudar.

Pra começar a usar o Julinho, é só mandar um "oi" pra ele:
${julinhoLink}

Qualquer dúvida, é só responder esse email que eu mesmo respondo.

Valeu pela confiança!

Um abraço,
Fábio
Criador do CorretorIA

---
© 2025 CorretorIA · corretordetextoonline.com.br
`

  return {
    subject,
    htmlContent,
    textContent,
  }
}
