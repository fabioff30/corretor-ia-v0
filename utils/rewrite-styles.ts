/**
 * Rewrite Styles Configuration
 * Centralized definitions for all 12 rewrite styles (5 free + 7 premium)
 */

import {
  Briefcase,
  Heart,
  GraduationCap,
  Palette,
  Baby,
  Code,
  Newspaper,
  TrendingUp,
  BookOpen,
  Zap,
  Play,
  Mic,
  LucideIcon,
} from "lucide-react"

export type FreeRewriteStyle = "FORMAL" | "HUMANIZADO" | "ACADÊMICO" | "CRIATIVO" | "COMO_UMA_CRIANCA"
export type PremiumRewriteStyle = "TÉCNICO" | "JORNALÍSTICO" | "PUBLICITÁRIO" | "BLOG_POST" | "ROTEIRO_REELS" | "ROTEIRO_YOUTUBE" | "PALESTRA_APRESENTACAO"
export type RewriteStyle = FreeRewriteStyle | PremiumRewriteStyle

// Internal representation (lowercase with underscores for API compatibility)
export type RewriteStyleInternal = "formal" | "humanized" | "academic" | "creative" | "childlike" | "technical" | "journalistic" | "advertising" | "blog_post" | "reels_script" | "youtube_script" | "presentation"

export interface RewriteStyleDefinition {
  id: RewriteStyleInternal
  displayName: string
  label: string
  description: string
  icon: LucideIcon
  color: string // bg color
  iconColor: string // icon color
  badgeColor: string // badge color
  tier: "free" | "premium"
  usage: string // Uso
  tone: string // Tom
  length: string // Comprimento
  example: string // Exemplo
  benefits: string[]
  examples: string[]
}

// Mapping from display format to internal format for API
export const STYLE_DISPLAY_TO_INTERNAL: Record<RewriteStyle, RewriteStyleInternal> = {
  FORMAL: "formal",
  HUMANIZADO: "humanized",
  ACADÊMICO: "academic",
  CRIATIVO: "creative",
  COMO_UMA_CRIANCA: "childlike",
  TÉCNICO: "technical",
  JORNALÍSTICO: "journalistic",
  PUBLICITÁRIO: "advertising",
  BLOG_POST: "blog_post",
  ROTEIRO_REELS: "reels_script",
  ROTEIRO_YOUTUBE: "youtube_script",
  PALESTRA_APRESENTACAO: "presentation",
}

// Reverse mapping for internal to display format
export const STYLE_INTERNAL_TO_DISPLAY: Record<RewriteStyleInternal, RewriteStyle> = {
  formal: "FORMAL",
  humanized: "HUMANIZADO",
  academic: "ACADÊMICO",
  creative: "CRIATIVO",
  childlike: "COMO_UMA_CRIANCA",
  technical: "TÉCNICO",
  journalistic: "JORNALÍSTICO",
  advertising: "PUBLICITÁRIO",
  blog_post: "BLOG_POST",
  reels_script: "ROTEIRO_REELS",
  youtube_script: "ROTEIRO_YOUTUBE",
  presentation: "PALESTRA_APRESENTACAO",
}

export const FREE_REWRITE_STYLES: RewriteStyleDefinition[] = [
  {
    id: "formal",
    displayName: "FORMAL",
    label: "Formal",
    description: "Linguagem séria, vocabulário preciso",
    icon: Briefcase,
    color: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
    iconColor: "text-blue-600 dark:text-blue-400",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    tier: "free",
    usage: "E-mails corporativos, relatórios, propostas comerciais",
    tone: "Respeitoso, linguagem técnica, estrutura clara",
    length: "Médio a longo",
    example: '"Solicitamos a sua consideração sobre a proposta anexada..."',
    benefits: ["Tom respeitoso", "Linguagem técnica", "Estrutura clara"],
    examples: ["E-mails corporativos", "Relatórios", "Propostas comerciais"],
  },
  {
    id: "humanized",
    displayName: "HUMANIZADO",
    label: "Humanizado",
    description: "Tom próximo, 1ª pessoa opcional, empatia",
    icon: Heart,
    color: "bg-rose-50 border-rose-200 dark:bg-rose-950 dark:border-rose-800",
    iconColor: "text-rose-600 dark:text-rose-400",
    badgeColor: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300",
    tier: "free",
    usage: "Posts em redes sociais, e-mails pessoais, mensagens",
    tone: "Conversacional, linguagem simples, conexão emocional",
    length: "Curto a médio",
    example: '"Ei! Achei incrível como você reescreveu isso..."',
    benefits: ["Tom conversacional", "Linguagem simples", "Conexão emocional"],
    examples: ["Posts em redes sociais", "E-mails pessoais", "Mensagens"],
  },
  {
    id: "academic",
    displayName: "ACADÊMICO",
    label: "Acadêmico",
    description: "Impessoal, termos técnicos, 3ª pessoa",
    icon: GraduationCap,
    color: "bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800",
    iconColor: "text-purple-600 dark:text-purple-400",
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    tier: "free",
    usage: "Artigos científicos, dissertações, pesquisas acadêmicas",
    tone: "Impessoal, argumentação sólida, rigor científico",
    length: "Longo",
    example: '"A análise dos dados revelou conclusões significativas..."',
    benefits: ["Linguagem técnica", "Argumentação sólida", "Estrutura acadêmica"],
    examples: ["Artigos científicos", "Dissertações", "Papers"],
  },
  {
    id: "creative",
    displayName: "CRIATIVO",
    label: "Criativo",
    description: "Metáforas originais, emojis moderados (máx. 3)",
    icon: Palette,
    color: "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800",
    iconColor: "text-orange-600 dark:text-orange-400",
    badgeColor: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    tier: "free",
    usage: "Conteúdo de marketing, histórias, descrições criativas",
    tone: "Envolvente, metáforas, tom inspirador",
    length: "Variável",
    example: '"Como um pássaro buscando novos horizontes..."',
    benefits: ["Linguagem envolvente", "Metáforas originais", "Tom inspirador"],
    examples: ["Conteúdo de marketing", "Histórias", "Descrições criativas"],
  },
  {
    id: "childlike",
    displayName: "COMO_UMA_CRIANCA",
    label: "Como uma Criança",
    description: "Frases curtas, palavras simples, tom lúdico",
    icon: Baby,
    color: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
    iconColor: "text-green-600 dark:text-green-400",
    badgeColor: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    tier: "free",
    usage: "Material educativo, explicações simples, conteúdo infantil",
    tone: "Lúdico, acessível, descontraído",
    length: "Curto a médio",
    example: '"A História é como um baú cheio de tesouro!"',
    benefits: ["Vocabulário simples", "Frases curtas", "Linguagem lúdica"],
    examples: ["Material educativo", "Explicações simples", "Conteúdo infantil"],
  },
]

export const PREMIUM_REWRITE_STYLES: RewriteStyleDefinition[] = [
  {
    id: "technical",
    displayName: "TÉCNICO",
    label: "Técnico",
    description: "Precisão e instruções claras para manuais e tutoriais",
    icon: Code,
    color: "bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800",
    iconColor: "text-slate-600 dark:text-slate-400",
    badgeColor: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300",
    tier: "premium",
    usage: "Manuais, documentação, tutoriais passo-a-passo",
    tone: "Objetivo, sequencial, preciso",
    length: "Médio a longo",
    example: '"1. Acesse o painel. 2. Clique em Configurações. 3. Selecione Salvar."',
    benefits: ["Precisão técnica", "Estrutura sequencial", "Clareza máxima"],
    examples: ["Manuais de usuário", "Documentação técnica", "Tutoriais passo-a-passo"],
  },
  {
    id: "journalistic",
    displayName: "JORNALÍSTICO",
    label: "Jornalístico",
    description: "Lead forte, pirâmide invertida com tom impactante",
    icon: Newspaper,
    color: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
    iconColor: "text-red-600 dark:text-red-400",
    badgeColor: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    tier: "premium",
    usage: "Notícias, press releases, comunicados de imprensa",
    tone: "Impactante, factual, direto",
    length: "Curto a médio",
    example: '"Empresa revoluciona setor com nova tecnologia de IA..."',
    benefits: ["Lead impactante", "Pirâmide invertida", "Tom jornalístico"],
    examples: ["Notícias", "Press releases", "Comunicados"],
  },
  {
    id: "advertising",
    displayName: "PUBLICITÁRIO",
    label: "Publicitário",
    description: "Persuasivo orientado à conversão com CTA claro",
    icon: TrendingUp,
    color: "bg-pink-50 border-pink-200 dark:bg-pink-950 dark:border-pink-800",
    iconColor: "text-pink-600 dark:text-pink-400",
    badgeColor: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
    tier: "premium",
    usage: "Anúncios, landing pages, campanhas de marketing",
    tone: "Benefit-driven, emotivo, persuasivo",
    length: "Curto",
    example: '"Aumente sua produtividade em 3x com nossa solução. Comece agora!"',
    benefits: ["Foco em benefícios", "Linguagem persuasiva", "CTA claro"],
    examples: ["Anúncios", "Landing pages", "Campanhas de marketing"],
  },
  {
    id: "blog_post",
    displayName: "BLOG_POST",
    label: "Blog Post",
    description: "Estrutura web-friendly com subtítulos e engajamento",
    icon: BookOpen,
    color: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800",
    iconColor: "text-amber-600 dark:text-amber-400",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
    tier: "premium",
    usage: "Artigos, guias, conteúdo SEO para blogs",
    tone: "Engajador, autorizado, informativo",
    length: "Longo (1000+ palavras)",
    example: '"## Por que Cursos Online Transformam Carreiras\n\nNos últimos anos..."',
    benefits: ["Estrutura SEO-friendly", "Subtítulos bem marcados", "Engajamento"],
    examples: ["Artigos para blogs", "Guias técnicos", "Conteúdo SEO"],
  },
  {
    id: "reels_script",
    displayName: "ROTEIRO_REELS",
    label: "Roteiro para Reels",
    description: "Hook em 3 segundos, ultra dinâmico para redes sociais",
    icon: Zap,
    color: "bg-indigo-50 border-indigo-200 dark:bg-indigo-950 dark:border-indigo-800",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    badgeColor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
    tier: "premium",
    usage: "Instagram Reels, TikTok, vídeos curtos",
    tone: "Coloquial, dinâmico, viral",
    length: "Ultra-curto (~30s)",
    example: '"[Hook] Você sabia que 90% das pessoas erram isso? 🤯 Veja a dica..."',
    benefits: ["Hook impactante", "Dinâmica rápida", "Viral-ready"],
    examples: ["Instagram Reels", "TikTok", "Vídeos curtos"],
  },
  {
    id: "youtube_script",
    displayName: "ROTEIRO_YOUTUBE",
    label: "Roteiro para YouTube",
    description: "Hook → Story → Desenvolvimento → CTA distribuído",
    icon: Play,
    color: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
    iconColor: "text-red-600 dark:text-red-400",
    badgeColor: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    tier: "premium",
    usage: "Scripts de vídeos long-form, YouTube, podcasts",
    tone: "Conversacional, storytelling, engajador",
    length: "Longo (5-20 min)",
    example: '"[Hook] E se eu disser que você vem fazendo errado... [Story] Quando comecei..."',
    benefits: ["Storytelling estruturado", "Múltiplos CTAs", "Retenção de audiência"],
    examples: ["Scripts YouTube", "Podcasts", "Vídeos long-form"],
  },
  {
    id: "presentation",
    displayName: "PALESTRA_APRESENTACAO",
    label: "Palestra/Apresentação",
    description: "Didático com pontos-chave marcados para slides",
    icon: Mic,
    color: "bg-cyan-50 border-cyan-200 dark:bg-cyan-950 dark:border-cyan-800",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    badgeColor: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
    tier: "premium",
    usage: "Apresentações, palestras, talks, conferências",
    tone: "Professoral, acessível, didático",
    length: "Variável",
    example: '"• Ponto-chave 1: Importância\n• Ponto-chave 2: Como aplicar\n• CTA: Próximos passos"',
    benefits: ["Formato para slides", "Pontos-chave claros", "Didático"],
    examples: ["Apresentações", "Palestras", "Conferências"],
  },
]

export const ALL_REWRITE_STYLES = [...FREE_REWRITE_STYLES, ...PREMIUM_REWRITE_STYLES]

export function getRewriteStyle(id: RewriteStyleInternal): RewriteStyleDefinition | undefined {
  return ALL_REWRITE_STYLES.find((style) => style.id === id)
}

export function isStyleFree(style: RewriteStyleInternal): boolean {
  return FREE_REWRITE_STYLES.some((s) => s.id === style)
}

export function isStylePremium(style: RewriteStyleInternal): boolean {
  return PREMIUM_REWRITE_STYLES.some((s) => s.id === style)
}

export function convertToApiFormat(style: RewriteStyleInternal): string {
  // Convert to CAPSLOCK format for API
  const displayStyle = STYLE_INTERNAL_TO_DISPLAY[style]
  return displayStyle.toUpperCase()
}
