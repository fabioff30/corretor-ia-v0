/**
 * Bundle Activation Confirmation Email Template
 *
 * Sent after successful payment for CorretorIA + Julinho bundle
 * Includes CTA to chat with Julinho on WhatsApp
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
  const recipientName = name || "Usuário"
  const julinhoLink = `https://wa.me/${JULINHO_WHATSAPP}?text=Ol%C3%A1%20Julinho!%20Acabei%20de%20ativar%20meu%20plano%20Premium.`

  const subject = `Seu plano Premium está ativo! Conheça o Julinho`

  const htmlContent = `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Plano Premium Ativado - CorretorIA + Julinho</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">

          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding: 20px 0;">
              <img src="https://corretordetextoonline.com.br/logo-dark.png" alt="CorretorIA" width="180" style="display: block;" />
            </td>
          </tr>

          <!-- Success Badge -->
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table role="presentation" style="border-collapse: collapse;">
                <tr>
                  <td style="background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; padding: 12px 28px; border-radius: 50px; font-weight: bold; font-size: 14px; letter-spacing: 1px;">
                    ✓ PLANO PREMIUM ATIVADO
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Card -->
          <tr>
            <td style="background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; border: 1px solid rgba(34, 197, 94, 0.3); padding: 40px 30px;">

              <!-- Greeting -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="color: #ffffff; font-size: 24px; font-weight: bold; line-height: 1.4; padding-bottom: 20px;">
                    Parabéns, ${recipientName}!
                  </td>
                </tr>
                <tr>
                  <td style="color: #a1a1aa; font-size: 16px; line-height: 1.6; padding-bottom: 30px;">
                    Seu plano <strong style="color: #22c55e;">CorretorIA Premium + Julinho Premium</strong> foi ativado com sucesso!
                    Agora você tem acesso ilimitado aos dois produtos.
                  </td>
                </tr>
              </table>

              <!-- What's included -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background: rgba(255, 255, 255, 0.05); border-radius: 12px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #ffffff; font-size: 16px; font-weight: bold; margin: 0 0 15px 0;">
                      O que você pode fazer agora:
                    </p>
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #d4d4d8; font-size: 14px;">
                          ✅ Correções ilimitadas no CorretorIA
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #d4d4d8; font-size: 14px;">
                          ✅ Textos de até 20.000 caracteres
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #d4d4d8; font-size: 14px;">
                          ✅ Análise de estilo e tom avançada
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #d4d4d8; font-size: 14px;">
                          ✅ Mensagens ilimitadas com o Julinho no WhatsApp
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #d4d4d8; font-size: 14px;">
                          ✅ Sem anúncios em toda a plataforma
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Julinho CTA -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, rgba(37, 211, 102, 0.15), rgba(37, 211, 102, 0.05)); border-radius: 12px; border: 1px solid rgba(37, 211, 102, 0.3); margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px; text-align: center;">
                    <p style="color: #25D366; font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">
                      💬 Conheça o Julinho!
                    </p>
                    <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 20px 0;">
                      Seu assistente de correção está pronto para te ajudar no WhatsApp.
                      Envie qualquer texto e receba correções instantâneas!
                    </p>
                    <a href="${julinhoLink}"
                       style="display: inline-block; background: linear-gradient(135deg, #25D366, #128C7E); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: bold; font-size: 16px;">
                      Conversar com Julinho →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- CorretorIA CTA -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td align="center">
                    <a href="https://corretordetextoonline.com.br/dashboard?utm_source=email&utm_medium=transactional&utm_campaign=bundle_activation"
                       style="display: inline-block; background: linear-gradient(135deg, #534BD1, #4338ca); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: bold; font-size: 16px;">
                      Acessar o CorretorIA →
                    </a>
                  </td>
                </tr>
              </table>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="color: #71717a; font-size: 13px; text-align: center;">
                    Seu preço promocional está travado enquanto a assinatura estiver ativa.
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 20px; text-align: center;">
              <p style="color: #71717a; font-size: 12px; margin: 0 0 10px 0;">
                Dúvidas? Responda este email ou entre em contato conosco.
              </p>
              <p style="color: #3f3f46; font-size: 11px; margin: 20px 0 0 0;">
                © 2025 CorretorIA. Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const textContent = `
Parabéns, ${recipientName}!

Seu plano CorretorIA Premium + Julinho Premium foi ativado com sucesso!
Agora você tem acesso ilimitado aos dois produtos.

O QUE VOCÊ PODE FAZER AGORA:
✅ Correções ilimitadas no CorretorIA
✅ Textos de até 20.000 caracteres
✅ Análise de estilo e tom avançada
✅ Mensagens ilimitadas com o Julinho no WhatsApp
✅ Sem anúncios em toda a plataforma

💬 CONHEÇA O JULINHO!
Seu assistente de correção está pronto para te ajudar no WhatsApp.
Envie qualquer texto e receba correções instantâneas!

👉 Conversar com Julinho: ${julinhoLink}

👉 Acessar o CorretorIA: https://corretordetextoonline.com.br/dashboard

Seu preço promocional está travado enquanto a assinatura estiver ativa.

---
Dúvidas? Responda este email ou entre em contato conosco.

© 2025 CorretorIA. Todos os direitos reservados.
`

  return {
    subject,
    htmlContent,
    textContent,
  }
}
