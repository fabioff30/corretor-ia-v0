/**
 * New Year Bundle Promotion Email Template
 *
 * High-conversion email for the CorretorIA + Julinho bundle promotion
 */

interface NewYearBundleEmailParams {
  name?: string | null
  isFreePlan: boolean
  isCancelled: boolean
}

export function newYearBundleEmailTemplate({
  name,
  isFreePlan,
  isCancelled,
}: NewYearBundleEmailParams) {
  const recipientName = name || "Usuário"

  // Dynamic subject based on user status
  const subject = isCancelled
    ? `🎆 ${recipientName}, sentimos sua falta! Volte com 50% OFF`
    : `🎆 Oferta de Ano Novo: CorretorIA + Julinho por R$19,90/mês`

  // Dynamic opening based on user status
  const openingLine = isCancelled
    ? `Notamos que você não está mais usando o CorretorIA Premium. Que tal começar 2025 com uma oferta especial?`
    : `Preparamos uma oferta exclusiva de fim de ano para você começar 2025 escrevendo ainda melhor!`

  const htmlContent = `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Oferta de Fim de Ano - CorretorIA + Julinho</title>
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

          <!-- Special Offer Badge -->
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table role="presentation" style="border-collapse: collapse;">
                <tr>
                  <td style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; padding: 10px 24px; border-radius: 50px; font-weight: bold; font-size: 14px; letter-spacing: 1px;">
                    ✨ OFERTA ESPECIAL DE FIM DE ANO ✨
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Card -->
          <tr>
            <td style="background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; border: 1px solid rgba(245, 158, 11, 0.3); padding: 40px 30px;">

              <!-- Greeting -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="color: #ffffff; font-size: 16px; line-height: 1.6; padding-bottom: 20px;">
                    Olá, <strong>${recipientName}</strong>!
                  </td>
                </tr>
                <tr>
                  <td style="color: #a1a1aa; font-size: 16px; line-height: 1.6; padding-bottom: 30px;">
                    ${openingLine}
                  </td>
                </tr>
              </table>

              <!-- Bundle Offer -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background: rgba(245, 158, 11, 0.1); border-radius: 12px; border: 1px solid rgba(245, 158, 11, 0.2); margin-bottom: 30px;">
                <tr>
                  <td style="padding: 30px; text-align: center;">
                    <p style="color: #f59e0b; font-size: 18px; font-weight: bold; margin: 0 0 15px 0;">
                      2 Produtos pelo Preço de 1
                    </p>

                    <!-- Products -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                      <tr>
                        <td style="width: 50%; padding: 10px; vertical-align: top;">
                          <p style="color: #534BD1; font-weight: bold; margin: 0 0 5px 0;">📝 CorretorIA Premium</p>
                          <p style="color: #71717a; font-size: 12px; margin: 0;">Correção ilimitada no site</p>
                        </td>
                        <td style="width: 50%; padding: 10px; vertical-align: top;">
                          <p style="color: #22c55e; font-weight: bold; margin: 0 0 5px 0;">💬 Julinho Premium</p>
                          <p style="color: #71717a; font-size: 12px; margin: 0;">Correção via WhatsApp</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Pricing -->
                    <p style="color: #71717a; font-size: 14px; text-decoration: line-through; margin: 0;">
                      De R$ 39,80/mês
                    </p>
                    <p style="color: #ffffff; font-size: 48px; font-weight: 900; margin: 10px 0;">
                      R$ 19,90<span style="font-size: 16px; font-weight: normal; color: #71717a;">/mês</span>
                    </p>
                    <table role="presentation" style="margin: 0 auto;">
                      <tr>
                        <td style="background-color: rgba(34, 197, 94, 0.2); color: #22c55e; padding: 5px 15px; border-radius: 20px; font-size: 14px; font-weight: bold;">
                          50% OFF
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Benefits List -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                  <td style="color: #ffffff; font-size: 16px; font-weight: bold; padding-bottom: 15px;">
                    O que você recebe:
                  </td>
                </tr>
                <tr>
                  <td>
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #d4d4d8; font-size: 14px;">
                          ✅ Correções ilimitadas no CorretorIA
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #d4d4d8; font-size: 14px;">
                          ✅ Mensagens ilimitadas no Julinho
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #d4d4d8; font-size: 14px;">
                          ✅ Até 20.000 caracteres por texto
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #d4d4d8; font-size: 14px;">
                          ✅ Sem anúncios
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #d4d4d8; font-size: 14px;">
                          ✅ Preço travado enquanto manter a assinatura
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="https://corretordetextoonline.com.br/oferta-fim-de-ano?utm_source=email&utm_medium=campaign&utm_campaign=fimdeano2024&utm_content=cta"
                       style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: #000000; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: bold; font-size: 16px;">
                      QUERO APROVEITAR A OFERTA →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Urgency -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background: rgba(239, 68, 68, 0.1); border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.2);">
                <tr>
                  <td style="padding: 15px; text-align: center;">
                    <p style="color: #ef4444; font-size: 14px; font-weight: bold; margin: 0;">
                      ⏰ Oferta válida até 06/01/2025 às 23:59
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 20px; text-align: center;">
              <p style="color: #71717a; font-size: 12px; margin: 0 0 10px 0;">
                Você está recebendo este email porque se cadastrou no CorretorIA.
              </p>
              <p style="color: #52525b; font-size: 12px; margin: 0;">
                <a href="https://corretordetextoonline.com.br/preferencias" style="color: #52525b;">Gerenciar preferências</a>
                &nbsp;|&nbsp;
                <a href="https://corretordetextoonline.com.br/descadastrar" style="color: #52525b;">Descadastrar</a>
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
Olá, ${recipientName}!

${openingLine}

🎆 OFERTA ESPECIAL DE FIM DE ANO 🎆

2 Produtos pelo Preço de 1:
📝 CorretorIA Premium - Correção ilimitada no site
💬 Julinho Premium - Correção via WhatsApp

De R$ 39,80/mês por apenas R$ 19,90/mês (50% OFF!)

O que você recebe:
✅ Correções ilimitadas no CorretorIA
✅ Mensagens ilimitadas no Julinho
✅ Até 20.000 caracteres por texto
✅ Sem anúncios
✅ Preço travado enquanto manter a assinatura

👉 Acesse agora: https://corretordetextoonline.com.br/oferta-fim-de-ano?utm_source=email&utm_medium=campaign&utm_campaign=fimdeano2024

⏰ Oferta válida até 06/01/2025 às 23:59

---
Você está recebendo este email porque se cadastrou no CorretorIA.
Para descadastrar: https://corretordetextoonline.com.br/descadastrar

© 2025 CorretorIA. Todos os direitos reservados.
`

  return {
    subject,
    htmlContent,
    textContent,
  }
}
