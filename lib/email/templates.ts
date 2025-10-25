interface TemplateContext {
  name?: string | null
}

const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.corretordetextoonline.com.br"

function sanitizeName(name?: string | null) {
  return name?.trim() || "CorretorIA"
}

export function welcomeEmailTemplate({ name }: TemplateContext) {
  const displayName = sanitizeName(name)
  const subject = "Bem-vindo ao CorretorIA!"
  const htmlContent = `
    <h1>Bem-vindo, ${displayName}!</h1>
    <p>Obrigado por criar sua conta no <strong>CorretorIA</strong>. Agora você pode corrigir textos, reescrever com IA e detectar conteúdo gerado por inteligência artificial.</p>
    <p>Explore os recursos do painel e, quando quiser desbloquear o máximo da plataforma, considere conhecer o plano Premium.</p>
    <p>Boas correções!<br/>Equipe CorretorIA</p>
  `
  const textContent = `Bem-vindo, ${displayName}!

Obrigado por criar sua conta no CorretorIA. Agora você pode corrigir textos, reescrever com IA e detectar conteúdo gerado por inteligência artificial.

Explore os recursos do painel e, quando quiser desbloquear o máximo da plataforma, considere conhecer o plano Premium.

Boas correções!
Equipe CorretorIA`

  return { subject, htmlContent, textContent }
}

export function premiumUpgradeEmailTemplate({ name }: TemplateContext) {
  const displayName = sanitizeName(name)
  const subject = "Sua assinatura Premium está ativa!"
  const htmlContent = `
    <h1>Parabéns, ${displayName}! 🌟</h1>
    <p>Sua assinatura <strong>CorretorIA Premium</strong> está ativa e pronta para uso.</p>
    <ul>
      <li>Correções, reescritas e análises ilimitadas</li>
      <li>Histórico inteligente com exportação</li>
      <li>Prioridade no processamento das suas solicitações</li>
    </ul>
    <p>Acesse agora mesmo o painel premium e aproveite todos os recursos: <a href="${appBaseUrl}/dashboard">abrir dashboard</a>.</p>
    <p>Precisando de ajuda? Responda este email ou fale com a gente em contato@corretordetextoonline.com.br.</p>
  `
  const textContent = `Parabéns, ${displayName}!

Sua assinatura CorretorIA Premium está ativa e pronta para uso.
- Correções, reescritas e análises ilimitadas
- Histórico inteligente com exportação
- Prioridade no processamento das suas solicitações

Acesse o painel: ${appBaseUrl}/dashboard

Se precisar de ajuda, responda este email ou fale com contato@corretordetextoonline.com.br.`

  return { subject, htmlContent, textContent }
}

export function cancellationEmailTemplate({ name }: TemplateContext) {
  const displayName = sanitizeName(name)
  const subject = "Sua assinatura foi cancelada"
  const htmlContent = `
    <h1>Até breve, ${displayName}</h1>
    <p>Confirmamos o cancelamento da sua assinatura <strong>CorretorIA Premium</strong>.</p>
    <p>Você continuará com acesso aos benefícios até o fim do período já pago. Depois disso, sua conta volta automaticamente ao plano gratuito.</p>
    <p>Esperamos te ver novamente em breve. Se houver algo que possamos fazer para melhorar, responda este email — sua opinião é muito importante para nós.</p>
  `
  const textContent = `Olá, ${displayName}.

Confirmamos o cancelamento da sua assinatura CorretorIA Premium. Você mantém os benefícios até o fim do período já pago. Depois disso, sua conta volta automaticamente ao plano gratuito.

Esperamos te ver novamente em breve. Se pudermos melhorar algo, responda este email.`

  return { subject, htmlContent, textContent }
}

export function passwordResetEmailTemplate({ name, resetLink }: TemplateContext & { resetLink: string }) {
  const displayName = sanitizeName(name)
  const subject = "Recupere sua senha no CorretorIA"
  const htmlContent = `
    <h1>Olá, ${displayName}</h1>
    <p>Recebemos uma solicitação para redefinir a sua senha no CorretorIA.</p>
    <p>Clique no botão abaixo para escolher uma nova senha. O link expira em 60 minutos.</p>
    <p style="margin: 24px 0;">
      <a href="${resetLink}" style="background:#4c1d95;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold;">Redefinir senha</a>
    </p>
    <p>Se você não fez esta solicitação, ignore este email.</p>
  `
  const textContent = `Olá, ${displayName}!

Recebemos uma solicitação para redefinir a sua senha no CorretorIA.
Use o link abaixo para escolher uma nova senha (válido por 60 minutos):
${resetLink}

Se você não fez esta solicitação, pode ignorar este email.`

  return { subject, htmlContent, textContent }
}
