/**
 * Email template for gift buyer reward - 50% discount PIX
 * Sent to the person who bought the gift as a thank you
 */

export interface GiftBuyerRewardContext {
  buyerName: string
  recipientName: string
  planName: string
  discountedPrice: number
  originalPrice: number
  pixQrCodeBase64: string
  pixCopyPaste: string
  expiresAt: string // ISO date string
}

export function giftBuyerRewardEmailTemplate({
  buyerName,
  recipientName,
  planName,
  discountedPrice,
  originalPrice,
  pixQrCodeBase64,
  pixCopyPaste,
  expiresAt,
}: GiftBuyerRewardContext) {
  const expiresDate = new Date(expiresAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const formattedDiscount = discountedPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const formattedOriginal = originalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const subject = `🎁 Obrigado por presentear! Seu Premium com 50% OFF esta aqui`

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seu Desconto Especial</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #1a1a2e;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">

          <!-- Header with celebration -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <div style="font-size: 60px; margin-bottom: 10px;">🎉</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                Voce e incrivel, ${buyerName.split(' ')[0]}!
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 15px 0 0 0; font-size: 16px;">
                Obrigado por espalhar alegria neste Natal
              </p>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 40px 30px;">

              <!-- Thank you message -->
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Oi ${buyerName.split(' ')[0]}! 👋
              </p>

              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Seu presente de <strong>${planName}</strong> para <strong>${recipientName}</strong> foi enviado com sucesso!
                Temos certeza que ${recipientName.split(' ')[0]} vai adorar. 🎁
              </p>

              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                E porque voce e tao generoso(a), preparamos um <strong>presente especial so pra voce</strong>:
              </p>

              <!-- Discount Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 16px; padding: 30px; text-align: center;">
                    <div style="font-size: 18px; color: #fff; margin-bottom: 10px; font-weight: 600;">
                      🔥 SEU PREMIUM COM 50% OFF 🔥
                    </div>
                    <div style="font-size: 20px; color: rgba(255,255,255,0.8); text-decoration: line-through; margin-bottom: 5px;">
                      De ${formattedOriginal}
                    </div>
                    <div style="font-size: 48px; font-weight: 800; color: #fff; margin: 10px 0;">
                      ${formattedDiscount}
                    </div>
                    <div style="font-size: 14px; color: rgba(255,255,255,0.9); margin-bottom: 5px;">
                      Plano Anual Premium - 1 ano completo!
                    </div>
                  </td>
                </tr>
              </table>

              <!-- PIX QR Code -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                <tr>
                  <td style="background: #f8f9fa; border-radius: 16px; padding: 25px; text-align: center;">
                    <div style="font-size: 16px; color: #333; font-weight: 600; margin-bottom: 15px;">
                      📱 Pague com PIX
                    </div>
                    <div style="background: #fff; display: inline-block; padding: 15px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                      <img src="data:image/png;base64,${pixQrCodeBase64}" alt="QR Code PIX" width="200" height="200" style="display: block;">
                    </div>
                    <p style="color: #666; font-size: 13px; margin: 15px 0 0 0;">
                      Escaneie com o app do seu banco
                    </p>
                  </td>
                </tr>
              </table>

              <!-- PIX Copy Paste -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                <tr>
                  <td style="background: #e8f5e9; border: 2px dashed #4caf50; border-radius: 12px; padding: 15px; text-align: center;">
                    <div style="font-size: 12px; color: #2e7d32; margin-bottom: 8px; font-weight: 600;">
                      Ou copie o codigo PIX:
                    </div>
                    <div style="font-size: 11px; color: #333; word-break: break-all; font-family: monospace; background: #fff; padding: 10px; border-radius: 6px;">
                      ${pixCopyPaste}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Fun message -->
              <div style="background: #fff3e0; border-radius: 12px; padding: 20px; margin-bottom: 25px; border-left: 4px solid #ff9800;">
                <p style="color: #e65100; font-size: 14px; line-height: 1.6; margin: 0; font-style: italic;">
                  "Voce ja presenteou alguem com boa escrita... que tal garantir a sua tambem?
                  Afinal, quem corrige os outros nao pode sair por ai escrevendo 'concerteza'!" 😄
                </p>
              </div>

              <!-- Expiration warning -->
              <div style="text-align: center; margin-bottom: 20px;">
                <span style="background: #ffebee; color: #c62828; font-size: 13px; padding: 8px 16px; border-radius: 20px; font-weight: 600;">
                  ⏰ PIX valido ate ${expiresDate}
                </span>
              </div>

              <p style="color: #888; font-size: 12px; text-align: center; margin: 0;">
                Este PIX e exclusivo para voce. Apos o pagamento, seu plano sera ativado automaticamente!
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 13px; margin: 0 0 10px 0;">
                Com carinho da equipe CorretorIA ❤️
              </p>
              <p style="color: #aaa; font-size: 11px; margin: 0;">
                Voce recebeu este email porque comprou um presente no CorretorIA.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  const text = `
Voce e incrivel, ${buyerName.split(' ')[0]}!

Obrigado por espalhar alegria neste Natal!

Oi ${buyerName.split(' ')[0]}!

Seu presente de ${planName} para ${recipientName} foi enviado com sucesso!
Temos certeza que ${recipientName.split(' ')[0]} vai adorar.

E porque voce e tao generoso(a), preparamos um presente especial so pra voce:

🔥 SEU PREMIUM COM 50% OFF 🔥
De ${formattedOriginal} por apenas ${formattedDiscount}
Plano Anual Premium - 1 ano completo!

Para pagar, copie o codigo PIX abaixo e cole no app do seu banco:

${pixCopyPaste}

⏰ PIX valido ate ${expiresDate}

"Voce ja presenteou alguem com boa escrita... que tal garantir a sua tambem?
Afinal, quem corrige os outros nao pode sair por ai escrevendo 'concerteza'!" 😄

Este PIX e exclusivo para voce. Apos o pagamento, seu plano sera ativado automaticamente!

Com carinho da equipe CorretorIA
`

  return { subject, html, text }
}
