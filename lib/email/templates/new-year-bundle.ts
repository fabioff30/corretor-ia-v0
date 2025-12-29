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
    ? `🎆 ${recipientName}, a gente sentiu sua falta! Volta com 50% OFF?`
    : `🎆 Ei ${recipientName}! Última chance de 2025 - 50% OFF no CorretorIA + Julinho`

  // Dynamic opening based on user status - Tom pessoal e brincalhão
  const openingLine = isCancelled
    ? `Ei, sumiu pra onde? 😅 A gente tava com saudade aqui... E olha, resolvi te dar mais uma chance de voltar pro time com uma oferta especial de fim de ano.`
    : `Cara, eu não ia deixar 2025 acabar sem te dar uma última chance de parar de errar português de vez. 😅 Então preparei algo especial:`

  const htmlContent = `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Oferta de Fim de Ano - CorretorIA + Julinho</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">

          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding: 20px 0 30px 0;">
              <img src="https://corretordetextoonline.com.br/logo.png" alt="CorretorIA" width="160" style="display: block;" />
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 0 20px;">

              <!-- Greeting -->
              <p style="color: #1a1a1a; font-size: 18px; line-height: 1.6; margin: 0 0 20px 0;">
                E aí, <strong>${recipientName}</strong>! 👋
              </p>

              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.7; margin: 0 0 30px 0;">
                ${openingLine}
              </p>

              <!-- Offer Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; border: 2px solid #f59e0b; border-radius: 12px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px; text-align: center;">
                    <p style="color: #f59e0b; font-size: 14px; font-weight: bold; margin: 0 0 15px 0; letter-spacing: 1px;">
                      🎆 OFERTA DE FIM DE ANO
                    </p>

                    <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 20px 0;">
                      2 Produtos pelo Preço de 1
                    </p>

                    <p style="color: #6b7280; font-size: 14px; margin: 0 0 5px 0;">
                      📝 <strong>CorretorIA Premium</strong> + 💬 <strong>Julinho Premium</strong>
                    </p>

                    <p style="color: #9ca3af; font-size: 14px; text-decoration: line-through; margin: 15px 0 5px 0;">
                      De R$ 39,80/mês
                    </p>
                    <p style="color: #1a1a1a; font-size: 36px; font-weight: 900; margin: 0;">
                      R$ 19,90<span style="font-size: 14px; font-weight: normal; color: #6b7280;">/mês</span>
                    </p>
                    <p style="color: #22c55e; font-size: 14px; font-weight: bold; margin: 10px 0 0 0;">
                      50% OFF
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Benefits -->
              <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 15px 0;">
                O que você recebe:
              </p>

              <p style="color: #4a4a4a; font-size: 15px; line-height: 2; margin: 0 0 25px 0;">
                ✅ Correções ilimitadas no CorretorIA<br/>
                ✅ Mensagens ilimitadas no Julinho (WhatsApp)<br/>
                ✅ Até 20.000 caracteres por texto<br/>
                ✅ Sem anúncios<br/>
                ✅ Preço travado enquanto manter a assinatura
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                <tr>
                  <td align="center">
                    <a href="https://corretordetextoonline.com.br/oferta-fim-de-ano?utm_source=email&utm_medium=campaign&utm_campaign=fimdeano2025&utm_content=cta"
                       style="display: inline-block; background-color: #f59e0b; color: #000000; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                      BORA, QUERO ISSO! 🚀
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Urgency -->
              <p style="color: #dc2626; font-size: 14px; font-weight: 600; text-align: center; margin: 0 0 30px 0;">
                ⏰ Oferta válida até 01/01/2026 às 23:59
              </p>

              <!-- Signature -->
              <p style="color: #4a4a4a; font-size: 15px; line-height: 1.6; margin: 0 0 5px 0;">
                Um abraço,
              </p>
              <p style="color: #1a1a1a; font-size: 15px; font-weight: 600; margin: 0 0 3px 0;">
                Fábio
              </p>
              <p style="color: #9ca3af; font-size: 13px; margin: 0;">
                Criador do CorretorIA
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 40px 20px 20px 20px; text-align: center; border-top: 1px solid #e5e7eb; margin-top: 30px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0 0 10px 0;">
                Você está recebendo este email porque se cadastrou no CorretorIA.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                <a href="https://corretordetextoonline.com.br/preferencias" style="color: #6b7280;">Gerenciar preferências</a>
                &nbsp;|&nbsp;
                <a href="https://corretordetextoonline.com.br/descadastrar" style="color: #6b7280;">Descadastrar</a>
              </p>
              <p style="color: #d1d5db; font-size: 11px; margin: 15px 0 0 0;">
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
E aí, ${recipientName}! 👋

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

👉 BORA! Acesse agora: https://corretordetextoonline.com.br/oferta-fim-de-ano?utm_source=email&utm_medium=campaign&utm_campaign=fimdeano2025

⏰ Oferta válida até 01/01/2026 às 23:59

Um abraço,
Fábio
Criador do CorretorIA

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
