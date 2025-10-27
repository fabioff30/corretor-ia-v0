interface TemplateContext {
  name?: string | null
}

const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.corretordetextoonline.com.br"

function sanitizeName(name?: string | null) {
  return name?.trim() || ""
}

export function welcomeEmailTemplate({ name }: TemplateContext) {
  const displayName = sanitizeName(name)
  const subject = "Bem-vindo ao CorretorIA!"

  const htmlContent = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="pt-BR">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
  </head>
  <body style='background-color:rgb(243,244,246);font-family:ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";padding-top:40px;padding-bottom:40px'>
    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:rgb(255,255,255);max-width:600px;margin-left:auto;margin-right:auto;padding:40px;border:1px solid rgb(229,231,235);border-radius:6px;">
      <tbody>
        <tr style="width:100%">
          <td>
            <h1 style="font-size:24px;font-weight:700;color:rgb(17,24,39);margin-bottom:24px;margin-top:0px">Bem-vindo ao CorretorIA! 🎉</h1>
            <p style="font-size:16px;color:rgb(55,65,81);line-height:24px;margin-bottom:16px;margin-top:0px">${displayName ? `Olá ${displayName},` : 'Olá,'}</p>
            <p style="font-size:16px;color:rgb(55,65,81);line-height:24px;margin-bottom:16px;margin-top:0px">Obrigado por criar sua conta no <strong>CorretorIA</strong>! Estamos muito felizes em ter você conosco. Agora você pode aproveitar nossos recursos de correção inteligente de texto.</p>

            <h2 style="font-size:20px;font-weight:600;color:rgb(17,24,39);margin-bottom:16px;margin-top:24px">O que você pode fazer:</h2>

            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:16px">
              <tbody>
                <tr>
                  <td>
                    <ul style="padding-left:18px;margin:0">
                      <li style="font-size:16px;color:rgb(55,65,81);line-height:24px;margin-bottom:8px"><strong>Correção de Texto:</strong> Corrija gramática, ortografia e pontuação com IA avançada</li>
                      <li style="font-size:16px;color:rgb(55,65,81);line-height:24px;margin-bottom:8px"><strong>Reescrita Inteligente:</strong> Melhore clareza, tom e estilo do seu texto</li>
                      <li style="font-size:16px;color:rgb(55,65,81);line-height:24px;margin-bottom:8px"><strong>Detector de IA:</strong> Identifique se um texto foi gerado por inteligência artificial</li>
                      <li style="font-size:16px;color:rgb(55,65,81);line-height:24px;margin-bottom:8px"><strong>Histórico de Correções:</strong> Acesse todas as suas correções anteriores</li>
                      <li style="font-size:16px;color:rgb(55,65,81);line-height:24px;margin-bottom:8px"><strong>Julinho IA:</strong> Assistente virtual para tirar dúvidas sobre português</li>
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>

            <p style="font-size:16px;color:rgb(55,65,81);line-height:24px;margin-bottom:16px;margin-top:0px">No plano gratuito, você tem limites de uso diários. Para acesso ilimitado e recursos exclusivos, considere fazer upgrade para o plano Premium quando precisar.</p>

            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;margin-top:24px">
              <tbody>
                <tr>
                  <td>
                    <a href="${appBaseUrl}" style="background-color:#534BD1;color:rgb(255,255,255);padding:12px 24px;border-radius:6px;font-size:16px;font-weight:500;text-decoration:none;box-sizing:border-box;display:inline-block;line-height:100%;max-width:100%;mso-padding-alt:0px" target="_blank" rel="noopener noreferrer">
                      <span style="display:inline-block;line-height:120%;mso-padding-alt:0px;mso-text-raise:9px">Começar a usar agora</span>
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>

            <p style="font-size:14px;color:rgb(107,114,128);line-height:20px;margin-bottom:16px;margin-top:0px">Se tiver dúvidas, responda este e‑mail ou escreva para: <a href="mailto:contato@corretordetextoonline.com.br" style="color:#534BD1;text-decoration:none">contato@corretordetextoonline.com.br</a></p>

            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-top:1px solid rgb(229,231,235);padding-top:24px;margin-top:32px">
              <tbody>
                <tr>
                  <td>
                    <p style="font-size:12px;color:rgb(156,163,175);line-height:16px;margin:0">© 2025 CorretorIA - Correção de texto inteligente em português<br />
                      Você está recebendo este e‑mail porque criou uma conta.<br />
                      <a href="${appBaseUrl}/account" style="color:rgb(156,163,175);text-decoration:underline" target="_blank">Gerenciar preferências</a>
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`

  const textContent = `Bem-vindo ao CorretorIA! 🎉

${displayName ? `Olá ${displayName},` : 'Olá,'}

Obrigado por criar sua conta no CorretorIA! Estamos muito felizes em ter você conosco.

O que você pode fazer:
- Correção de Texto: Corrija gramática, ortografia e pontuação com IA avançada
- Reescrita Inteligente: Melhore clareza, tom e estilo do seu texto
- Detector de IA: Identifique se um texto foi gerado por inteligência artificial
- Histórico de Correções: Acesse todas as suas correções anteriores
- Julinho IA: Assistente virtual para tirar dúvidas sobre português

No plano gratuito, você tem limites de uso diários. Para acesso ilimitado e recursos exclusivos, considere fazer upgrade para o plano Premium.

Começar a usar: ${appBaseUrl}

Se tiver dúvidas, escreva para: contato@corretordetextoonline.com.br

---
© 2025 CorretorIA - Correção de texto inteligente em português
Gerenciar preferências: ${appBaseUrl}/account`

  return { subject, htmlContent, textContent }
}

export function premiumUpgradeEmailTemplate({ name }: TemplateContext) {
  const displayName = sanitizeName(name)
  const subject = "Sua assinatura Premium está ativa! 🌟"

  const htmlContent = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="pt-BR">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
  </head>
  <body style='background-color:rgb(243,244,246);font-family:ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";padding-top:40px;padding-bottom:40px'>
    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:rgb(255,255,255);max-width:600px;margin-left:auto;margin-right:auto;padding:40px;border:1px solid rgb(229,231,235);border-radius:6px;">
      <tbody>
        <tr style="width:100%">
          <td>
            <h1 style="font-size:24px;font-weight:700;color:rgb(17,24,39);margin-bottom:24px;margin-top:0px">Parabéns! Você é Premium agora 🌟</h1>
            <p style="font-size:16px;color:rgb(55,65,81);line-height:24px;margin-bottom:16px;margin-top:0px">${displayName ? `Olá ${displayName},` : 'Olá,'}</p>
            <p style="font-size:16px;color:rgb(55,65,81);line-height:24px;margin-bottom:16px;margin-top:0px">Sua assinatura <strong>CorretorIA Premium</strong> está ativa e pronta para uso! Agora você tem acesso total aos nossos recursos mais avançados.</p>

            <h2 style="font-size:20px;font-weight:600;color:rgb(17,24,39);margin-bottom:16px;margin-top:24px">Seus benefícios Premium:</h2>

            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:16px">
              <tbody>
                <tr>
                  <td>
                    <ul style="padding-left:18px;margin:0">
                      <li style="font-size:16px;color:rgb(55,65,81);line-height:24px;margin-bottom:8px">✨ <strong>Correções ilimitadas</strong> - Use quantas vezes precisar, sem restrições diárias</li>
                      <li style="font-size:16px;color:rgb(55,65,81);line-height:24px;margin-bottom:8px">🔄 <strong>Reescritas ilimitadas</strong> - Melhore seus textos sem limites</li>
                      <li style="font-size:16px;color:rgb(55,65,81);line-height:24px;margin-bottom:8px">🤖 <strong>Análises de IA ilimitadas</strong> - Detecte conteúdo gerado por IA quantas vezes quiser</li>
                      <li style="font-size:16px;color:rgb(55,65,81);line-height:24px;margin-bottom:8px">📝 <strong>Histórico completo</strong> - Acesse todas as suas correções anteriores</li>
                      <li style="font-size:16px;color:rgb(55,65,81);line-height:24px;margin-bottom:8px">⚡ <strong>Processamento prioritário</strong> - Suas solicitações têm prioridade no sistema</li>
                      <li style="font-size:16px;color:rgb(55,65,81);line-height:24px;margin-bottom:8px">🚫 <strong>Sem anúncios</strong> - Experiência limpa e sem distrações</li>
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>

            <p style="font-size:16px;color:rgb(55,65,81);line-height:24px;margin-bottom:16px;margin-top:0px">Acesse agora mesmo o painel e aproveite todos os recursos Premium disponíveis para você!</p>

            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;margin-top:24px">
              <tbody>
                <tr>
                  <td>
                    <a href="${appBaseUrl}/dashboard" style="background-color:#534BD1;color:rgb(255,255,255);padding:12px 24px;border-radius:6px;font-size:16px;font-weight:500;text-decoration:none;box-sizing:border-box;display:inline-block;line-height:100%;max-width:100%;mso-padding-alt:0px" target="_blank" rel="noopener noreferrer">
                      <span style="display:inline-block;line-height:120%;mso-padding-alt:0px;mso-text-raise:9px">Acessar meu painel Premium</span>
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>

            <p style="font-size:14px;color:rgb(107,114,128);line-height:20px;margin-bottom:16px;margin-top:0px">Precisando de ajuda ou tem alguma dúvida? Responda este e‑mail ou escreva para: <a href="mailto:contato@corretordetextoonline.com.br" style="color:#534BD1;text-decoration:none">contato@corretordetextoonline.com.br</a></p>

            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-top:1px solid rgb(229,231,235);padding-top:24px;margin-top:32px">
              <tbody>
                <tr>
                  <td>
                    <p style="font-size:12px;color:rgb(156,163,175);line-height:16px;margin:0">© 2025 CorretorIA - Correção de texto inteligente em português<br />
                      Você está recebendo este e‑mail porque ativou uma assinatura Premium.<br />
                      <a href="${appBaseUrl}/dashboard/subscription" style="color:rgb(156,163,175);text-decoration:underline" target="_blank">Gerenciar assinatura</a>
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`

  const textContent = `Parabéns! Você é Premium agora 🌟

${displayName ? `Olá ${displayName},` : 'Olá,'}

Sua assinatura CorretorIA Premium está ativa e pronta para uso! Agora você tem acesso total aos nossos recursos mais avançados.

Seus benefícios Premium:
✨ Correções ilimitadas - Use quantas vezes precisar, sem restrições diárias
🔄 Reescritas ilimitadas - Melhore seus textos sem limites
🤖 Análises de IA ilimitadas - Detecte conteúdo gerado por IA quantas vezes quiser
📝 Histórico completo - Acesse todas as suas correções anteriores
⚡ Processamento prioritário - Suas solicitações têm prioridade no sistema
🚫 Sem anúncios - Experiência limpa e sem distrações

Acesse o painel: ${appBaseUrl}/dashboard

Precisando de ajuda? Escreva para: contato@corretordetextoonline.com.br

---
© 2025 CorretorIA - Correção de texto inteligente em português
Gerenciar assinatura: ${appBaseUrl}/dashboard/subscription`

  return { subject, htmlContent, textContent }
}

export function cancellationEmailTemplate({ name }: TemplateContext) {
  const displayName = sanitizeName(name)
  const subject = "Sua assinatura foi cancelada"

  const htmlContent = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="pt-BR">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
  </head>
  <body style='background-color:rgb(243,244,246);font-family:ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";padding-top:40px;padding-bottom:40px'>
    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:rgb(255,255,255);max-width:600px;margin-left:auto;margin-right:auto;padding:40px;border:1px solid rgb(229,231,235);border-radius:6px;">
      <tbody>
        <tr style="width:100%">
          <td>
            <h1 style="font-size:24px;font-weight:700;color:rgb(17,24,39);margin-bottom:24px;margin-top:0px">Sua assinatura foi cancelada</h1>
            <p style="font-size:16px;color:rgb(55,65,81);line-height:24px;margin-bottom:16px;margin-top:0px">${displayName ? `Olá ${displayName},` : 'Olá,'}</p>
            <p style="font-size:16px;color:rgb(55,65,81);line-height:24px;margin-bottom:16px;margin-top:0px">Confirmamos o cancelamento da sua assinatura <strong>CorretorIA Premium</strong>.</p>

            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:rgb(249,250,251);border-radius:8px;padding:20px;margin:24px 0;border:1px solid rgb(229,231,235)">
              <tbody>
                <tr>
                  <td>
                    <p style="font-size:16px;color:rgb(55,65,81);line-height:24px;margin:0"><strong>O que acontece agora:</strong></p>
                    <ul style="padding-left:18px;margin:12px 0 0 0">
                      <li style="font-size:16px;color:rgb(55,65,81);line-height:24px;margin-bottom:8px">Você continuará com acesso Premium até o <strong>fim do período já pago</strong></li>
                      <li style="font-size:16px;color:rgb(55,65,81);line-height:24px;margin-bottom:8px">Após o término, sua conta voltará automaticamente ao <strong>plano gratuito</strong></li>
                      <li style="font-size:16px;color:rgb(55,65,81);line-height:24px;margin-bottom:8px">Suas correções e histórico serão mantidos</li>
                      <li style="font-size:16px;color:rgb(55,65,81);line-height:24px;margin-bottom:0">Você pode reativar o Premium a qualquer momento</li>
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>

            <p style="font-size:16px;color:rgb(55,65,81);line-height:24px;margin-bottom:16px;margin-top:0px">Sentiremos sua falta! Se houver algo que possamos fazer para melhorar nossa plataforma, ficaríamos muito gratos em saber sua opinião. Sua experiência é importante para nós.</p>

            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;margin-top:24px">
              <tbody>
                <tr>
                  <td>
                    <a href="${appBaseUrl}/premium" style="background-color:#534BD1;color:rgb(255,255,255);padding:12px 24px;border-radius:6px;font-size:16px;font-weight:500;text-decoration:none;box-sizing:border-box;display:inline-block;line-height:100%;max-width:100%;mso-padding-alt:0px" target="_blank" rel="noopener noreferrer">
                      <span style="display:inline-block;line-height:120%;mso-padding-alt:0px;mso-text-raise:9px">Reativar Premium</span>
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>

            <p style="font-size:14px;color:rgb(107,114,128);line-height:20px;margin-bottom:16px;margin-top:0px">Quer nos dar um feedback? Responda este e‑mail ou escreva para: <a href="mailto:contato@corretordetextoonline.com.br" style="color:#534BD1;text-decoration:none">contato@corretordetextoonline.com.br</a></p>

            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-top:1px solid rgb(229,231,235);padding-top:24px;margin-top:32px">
              <tbody>
                <tr>
                  <td>
                    <p style="font-size:12px;color:rgb(156,163,175);line-height:16px;margin:0">© 2025 CorretorIA - Correção de texto inteligente em português<br />
                      Você está recebendo este e‑mail porque cancelou uma assinatura Premium.<br />
                      <a href="${appBaseUrl}/account" style="color:rgb(156,163,175);text-decoration:underline" target="_blank">Gerenciar preferências</a>
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`

  const textContent = `Sua assinatura foi cancelada

${displayName ? `Olá ${displayName},` : 'Olá,'}

Confirmamos o cancelamento da sua assinatura CorretorIA Premium.

O que acontece agora:
• Você continuará com acesso Premium até o fim do período já pago
• Após o término, sua conta voltará automaticamente ao plano gratuito
• Suas correções e histórico serão mantidos
• Você pode reativar o Premium a qualquer momento

Sentiremos sua falta! Se houver algo que possamos fazer para melhorar nossa plataforma, ficaríamos muito gratos em saber sua opinião.

Reativar Premium: ${appBaseUrl}/premium

Quer nos dar um feedback? Escreva para: contato@corretordetextoonline.com.br

---
© 2025 CorretorIA - Correção de texto inteligente em português
Gerenciar preferências: ${appBaseUrl}/account`

  return { subject, htmlContent, textContent }
}

export function passwordResetEmailTemplate({ name, resetLink }: TemplateContext & { resetLink: string }) {
  const displayName = sanitizeName(name)
  const subject = "Recupere sua senha no CorretorIA"

  const htmlContent = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="pt-BR">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
  </head>
  <body style='background-color:rgb(243,244,246);font-family:ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";padding-top:40px;padding-bottom:40px'>
    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:rgb(255,255,255);max-width:600px;margin-left:auto;margin-right:auto;padding:40px;border:1px solid rgb(229,231,235);border-radius:6px;">
      <tbody>
        <tr style="width:100%">
          <td>
            <h1 style="font-size:24px;font-weight:700;color:rgb(17,24,39);margin-bottom:24px;margin-top:0px">Recuperação de Senha</h1>
            <p style="font-size:16px;color:rgb(55,65,81);line-height:24px;margin-bottom:16px;margin-top:0px">${displayName ? `Olá ${displayName},` : 'Olá,'}</p>
            <p style="font-size:16px;color:rgb(55,65,81);line-height:24px;margin-bottom:16px;margin-top:0px">Recebemos uma solicitação para redefinir a senha da sua conta no <strong>CorretorIA</strong>.</p>

            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:rgb(254,249,195);border-radius:8px;padding:20px;margin:24px 0;border:1px solid rgb(250,204,21)">
              <tbody>
                <tr>
                  <td>
                    <p style="font-size:14px;color:rgb(113,63,18);line-height:20px;margin:0">⚠️ <strong>Importante:</strong> Este link expira em <strong>60 minutos</strong>. Se você não fez esta solicitação, pode ignorar este email com segurança.</p>
                  </td>
                </tr>
              </tbody>
            </table>

            <p style="font-size:16px;color:rgb(55,65,81);line-height:24px;margin-bottom:16px;margin-top:0px">Clique no botão abaixo para criar uma nova senha:</p>

            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;margin-top:24px">
              <tbody>
                <tr>
                  <td>
                    <a href="${resetLink}" style="background-color:#534BD1;color:rgb(255,255,255);padding:12px 24px;border-radius:6px;font-size:16px;font-weight:500;text-decoration:none;box-sizing:border-box;display:inline-block;line-height:100%;max-width:100%;mso-padding-alt:0px" target="_blank" rel="noopener noreferrer">
                      <span style="display:inline-block;line-height:120%;mso-padding-alt:0px;mso-text-raise:9px">Redefinir minha senha</span>
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>

            <p style="font-size:14px;color:rgb(107,114,128);line-height:20px;margin-bottom:8px;margin-top:24px">Se o botão não funcionar, copie e cole este link no seu navegador:</p>
            <p style="font-size:12px;color:rgb(107,114,128);line-height:18px;margin-bottom:16px;margin-top:0px;word-break:break-all;background-color:rgb(249,250,251);padding:12px;border-radius:4px;border:1px solid rgb(229,231,235)">${resetLink}</p>

            <p style="font-size:14px;color:rgb(107,114,128);line-height:20px;margin-bottom:16px;margin-top:24px">Se você não solicitou a recuperação de senha, sua conta permanece segura. Recomendamos alterar sua senha caso suspeite de acesso não autorizado.</p>

            <p style="font-size:14px;color:rgb(107,114,128);line-height:20px;margin-bottom:16px;margin-top:0px">Precisa de ajuda? Responda este e‑mail ou escreva para: <a href="mailto:contato@corretordetextoonline.com.br" style="color:#534BD1;text-decoration:none">contato@corretordetextoonline.com.br</a></p>

            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-top:1px solid rgb(229,231,235);padding-top:24px;margin-top:32px">
              <tbody>
                <tr>
                  <td>
                    <p style="font-size:12px;color:rgb(156,163,175);line-height:16px;margin:0">© 2025 CorretorIA - Correção de texto inteligente em português<br />
                      Este é um email automático de recuperação de senha.<br />
                      <a href="${appBaseUrl}/account" style="color:rgb(156,163,175);text-decoration:underline" target="_blank">Gerenciar preferências</a>
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`

  const textContent = `Recuperação de Senha

${displayName ? `Olá ${displayName},` : 'Olá,'}

Recebemos uma solicitação para redefinir a senha da sua conta no CorretorIA.

⚠️ IMPORTANTE: Este link expira em 60 minutos. Se você não fez esta solicitação, pode ignorar este email com segurança.

Use o link abaixo para criar uma nova senha:
${resetLink}

Se você não solicitou a recuperação de senha, sua conta permanece segura. Recomendamos alterar sua senha caso suspeite de acesso não autorizado.

Precisa de ajuda? Escreva para: contato@corretordetextoonline.com.br

---
© 2025 CorretorIA - Correção de texto inteligente em português
Gerenciar preferências: ${appBaseUrl}/account`

  return { subject, htmlContent, textContent }
}
