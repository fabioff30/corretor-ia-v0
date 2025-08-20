import { Banner } from "./ad-banner.types";

export const banners: Banner[] = [
  {
    id: "banner-community",
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/banner%20corretoria-wW4zGq97ZLHQ1kXMgKVHbnkhOUgLXR.webp",
    alt: "Seja um Apoiador do CorretorIA - Junte-se aos nossos apoiadores e faça parte da comunidade que mantém o Corretor vivo. Cada contribuição conta!",
    utmParams: {
      source: "ad_banner",
      medium: "banner",
      campaign: "support_banner",
      content: "community",
    },
  },
  {
    id: "banner-error-warning",
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ad3%20corretoria-mhXUBXOCGjKU1zj1XCBOIOU7QQcnsx.webp",
    alt: "Você tem certeza de que esreveu isso direito? Um erro pode custar caro na sua imagem pessoal ou profissional. Não corra riscos: apoie o CorretorIA.",
    utmParams: {
      source: "ad_banner",
      medium: "banner",
      campaign: "support_banner",
      content: "error_warning",
    },
  },
  {
    id: "banner-opportunities",
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ad5-YvVMzAt1pJUAEAdULnyvuVdqjZgP8g.webp",
    alt: "Quantas oportunidades você já perdeu por erros bobos na escrita? Sua escrita diz muito sobre você. Apoie o CorretorIA e garanta textos sempre impecáveis.",
    utmParams: {
      source: "ad_banner",
      medium: "banner",
      campaign: "support_banner",
      content: "opportunities",
    },
  },
  {
    id: "banner-write-better",
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ad4%20corretoria-lQwzLLaPfe6oVZ5xCf0DfO3rjfA2me.webp",
    alt: "Escreva melhor, sem complicação. Doe e ajude o CorretorIA a continuar gratuito.",
    utmParams: {
      source: "ad_banner",
      medium: "banner",
      campaign: "support_banner",
      content: "write_better",
    },
  },
];
