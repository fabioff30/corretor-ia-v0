/**
 * Christmas Gift Invitation Email Template
 * A festive email sent to gift recipients with their redemption code
 */

interface GiftInvitationContext {
  recipientName: string
  buyerName: string
  planName: string
  giftCode: string
  giftMessage?: string | null
  redeemUrl: string
  expiresAt: string
}

const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.corretordetextoonline.com.br'

export function giftInvitationEmailTemplate({
  recipientName,
  buyerName,
  planName,
  giftCode,
  giftMessage,
  redeemUrl,
  expiresAt,
}: GiftInvitationContext) {
  const subject = 'Voce recebeu um presente de Natal!'

  const htmlContent = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="pt-BR">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <style>
      @keyframes twinkle {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    </style>
  </head>
  <body style='background-color:#1a472a;font-family:ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";padding-top:40px;padding-bottom:40px;margin:0'>
    <!-- Snowflakes Header -->
    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;margin-left:auto;margin-right:auto;">
      <tbody>
        <tr>
          <td style="text-align:center;padding:20px 0;font-size:28px;letter-spacing:20px;">
            &#10052; &#10052; &#10052; &#10052; &#10052;
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Main Content Card -->
    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:rgb(255,255,255);max-width:600px;margin-left:auto;margin-right:auto;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.2);">
      <tbody>
        <tr style="width:100%">
          <td>
            <!-- Gift Icon Header -->
            <div style="background:linear-gradient(135deg, #c41e3a 0%, #8b0000 100%);padding:30px;text-align:center;">
              <div style="font-size:64px;margin-bottom:10px;">&#127873;</div>
              <h1 style="font-size:28px;font-weight:700;color:rgb(255,255,255);margin:0;">Feliz Natal, ${sanitizeName(recipientName)}!</h1>
            </div>

            <!-- Content -->
            <div style="padding:30px 40px;">
              <p style="font-size:18px;color:rgb(55,65,81);line-height:28px;margin-bottom:20px;margin-top:0px;text-align:center;">
                <strong>${sanitizeName(buyerName)}</strong> enviou um presente especial para voce!
              </p>

              ${giftMessage ? `
              <!-- Gift Message Box -->
              <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#fef3c7;border-radius:12px;padding:20px;margin:20px 0;border-left:4px solid #f59e0b;">
                <tbody>
                  <tr>
                    <td>
                      <p style="font-size:14px;color:#92400e;line-height:22px;margin:0;font-style:italic;">
                        "${sanitizeMessage(giftMessage)}"
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
              ` : ''}

              <!-- Plan Badge -->
              <div style="text-align:center;margin:30px 0;">
                <span style="display:inline-block;background:linear-gradient(135deg, #c41e3a 0%, #8b0000 100%);color:white;padding:12px 30px;border-radius:30px;font-weight:bold;font-size:16px;">
                  &#10024; ${planName} &#10024;
                </span>
              </div>

              <p style="font-size:16px;color:rgb(55,65,81);line-height:24px;margin-bottom:16px;margin-top:0px;text-align:center;">
                Voce ganhou acesso ao <strong>CorretorIA Premium</strong>!<br/>
                Corrija textos ilimitados com inteligencia artificial.
              </p>

              <!-- Gift Code Box -->
              <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#fffbeb;border:2px dashed #c41e3a;border-radius:12px;padding:20px;margin:25px 0;text-align:center;">
                <tbody>
                  <tr>
                    <td>
                      <p style="font-size:12px;color:#6b7280;margin:0 0 8px 0;text-transform:uppercase;letter-spacing:1px;">Seu codigo de presente:</p>
                      <p style="font-family:monospace;font-size:28px;color:#c41e3a;font-weight:bold;letter-spacing:3px;margin:0;">
                        ${giftCode}
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- CTA Button -->
              <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin:30px 0;text-align:center;">
                <tbody>
                  <tr>
                    <td>
                      <a href="${redeemUrl}" style="display:inline-block;background:linear-gradient(135deg, #c41e3a 0%, #8b0000 100%);color:rgb(255,255,255);padding:16px 40px;border-radius:30px;font-size:18px;font-weight:bold;text-decoration:none;box-shadow:0 4px 15px rgba(196,30,58,0.4);" target="_blank" rel="noopener noreferrer">
                        &#127876; Resgatar Meu Presente
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- What you get -->
              <h2 style="font-size:18px;font-weight:600;color:rgb(17,24,39);margin-bottom:16px;margin-top:30px;text-align:center;">O que voce vai ter acesso:</h2>

              <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px">
                <tbody>
                  <tr>
                    <td>
                      <ul style="padding-left:20px;margin:0;color:rgb(55,65,81);">
                        <li style="font-size:15px;line-height:26px;margin-bottom:6px;">&#10024; <strong>Correcoes ilimitadas</strong> de textos</li>
                        <li style="font-size:15px;line-height:26px;margin-bottom:6px;">&#128260; <strong>Reescritas ilimitadas</strong> com diferentes estilos</li>
                        <li style="font-size:15px;line-height:26px;margin-bottom:6px;">&#129302; <strong>Detector de IA</strong> ilimitado</li>
                        <li style="font-size:15px;line-height:26px;margin-bottom:6px;">&#128203; <strong>Historico completo</strong> de correcoes</li>
                        <li style="font-size:15px;line-height:26px;margin-bottom:0;">&#127775; <strong>Sem anuncios</strong></li>
                      </ul>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Expiration notice -->
              <p style="font-size:12px;color:#9ca3af;text-align:center;margin-top:30px;margin-bottom:0;">
                Este codigo e valido ate <strong>${expiresAt}</strong>
              </p>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Footer -->
    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;margin-left:auto;margin-right:auto;padding:30px 20px;">
      <tbody>
        <tr>
          <td style="text-align:center;">
            <p style="font-size:20px;margin:0 0 10px 0;">&#127876; Boas Festas! &#127876;</p>
            <p style="font-size:14px;color:rgba(255,255,255,0.8);margin:0;">
              CorretorIA - Seu assistente de escrita com IA
            </p>
            <p style="font-size:12px;color:rgba(255,255,255,0.6);margin:15px 0 0 0;">
              <a href="${appBaseUrl}" style="color:rgba(255,255,255,0.8);text-decoration:underline;">www.corretordetextoonline.com.br</a>
            </p>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Snowflakes Footer -->
    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;margin-left:auto;margin-right:auto;">
      <tbody>
        <tr>
          <td style="text-align:center;padding:10px 0;font-size:28px;letter-spacing:20px;">
            &#10052; &#10052; &#10052; &#10052; &#10052;
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`

  const textContent = `Feliz Natal, ${sanitizeName(recipientName)}!

${sanitizeName(buyerName)} enviou um presente especial para voce!

${giftMessage ? `Mensagem: "${sanitizeMessage(giftMessage)}"` : ''}

Voce ganhou: ${planName}

Acesse o CorretorIA Premium e corrija seus textos com inteligencia artificial!

Seu codigo de presente: ${giftCode}

Resgate em: ${redeemUrl}

O que voce vai ter acesso:
- Correcoes ilimitadas de textos
- Reescritas ilimitadas com diferentes estilos
- Detector de IA ilimitado
- Historico completo de correcoes
- Sem anuncios

Este codigo e valido ate: ${expiresAt}

Boas Festas!
CorretorIA - Seu assistente de escrita com IA

www.corretordetextoonline.com.br`

  return { subject, htmlContent, textContent }
}

/**
 * Sanitize name for display
 */
function sanitizeName(name?: string | null): string {
  if (!name) return ''
  // Remove any HTML tags and trim
  return name.replace(/<[^>]*>/g, '').trim()
}

/**
 * Sanitize message for display
 */
function sanitizeMessage(message?: string | null): string {
  if (!message) return ''
  // Remove any HTML tags, limit length, and trim
  return message.replace(/<[^>]*>/g, '').substring(0, 500).trim()
}
