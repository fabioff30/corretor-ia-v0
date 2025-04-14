import type React from "react"
import "@/app/globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"
import { BackgroundGradient } from "@/components/background-gradient"
import { FloatingEmailWidget } from "@/components/floating-email-widget"
import Script from "next/script"
import { CookieConsent } from "@/components/cookie-consent"
import { GOOGLE_ADSENSE_CLIENT, GTM_ID } from "@/utils/constants"
import { FloatingContactWidget } from "@/components/contact-dialog"
import { AdController } from "@/components/ad-controller"

const inter = Inter({ subsets: ["latin"] })

// Atualizar os metadados OpenGraph e Twitter com o novo domínio
export const metadata: Metadata = {
  title: "CorretorIA - Correção Inteligente de Textos em Português",
  description:
    "Corrija erros gramaticais, ortográficos e de estilo em seus textos em português com inteligência artificial.",
  openGraph: {
    title: "CorretorIA - Correção Inteligente de Textos em Português",
    description:
      "Corrija erros gramaticais, ortográficos e de estilo em seus textos em português com nossa ferramenta de inteligência artificial.",
    url: "https://www.corretordetextoonline.com.br",
    siteName: "CorretorIA",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/fotocorretoria-EpelXGexOh0tI1v5BSxZk9WJn2zVJW.png",
        width: 1200,
        height: 1200,
        alt: "CorretorIA - Correção de textos com IA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CorretorIA - Correção Inteligente de Textos em Português",
    description:
      "Corrija erros gramaticais, ortográficos e de estilo em seus textos em português com nossa ferramenta de inteligência artificial.",
    images: [
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/fotocorretoria-EpelXGexOh0tI1v5BSxZk9WJn2zVJW.png",
    ],
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="facebook-domain-verification" content="hprarr6g4519byzssy18zrs0vqdzta" />
        <meta name="google-adsense-account" content={GOOGLE_ADSENSE_CLIENT} />
        <link
          rel="icon"
          href="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/corretoria-DfN4vmv8uKDAmhlXjQNEQ2EACGGRep.png"
          type="image/png"
        />

        {/* Meta Pixel Code */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
           !function(f,b,e,v,n,t,s)
           {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
           n.callMethod.apply(n,arguments):n.queue.push(arguments)};
           if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
           n.queue=[];t=b.createElement(e);t.async=!0;
           t.src=v;s=b.getElementsByTagName(e)[0];
           s.parentNode.insertBefore(t,s)}(window, document,'script',
           'https://connect.facebook.net/en_US/fbevents.js');
           
           // Verificar consentimento de cookies antes de inicializar o pixel
           var pixelConsent = localStorage.getItem('cookie-consent');
           if (pixelConsent === 'accepted') {
             fbq('init', '698603379497206');
             fbq('track', 'PageView');
           }
         `}
        </Script>

        {/* Add the gtag function definition */}
        <Script id="gtag-definition" strategy="beforeInteractive">
          {`
           window.dataLayer = window.dataLayer || [];
           function gtag(){dataLayer.push(arguments);}
           gtag('js', new Date());
         `}
        </Script>

        {/* Google Tag Manager - Script */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
           window.dataLayer = window.dataLayer || [];
           (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
           new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
           j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
           'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
           })(window,document,'script','dataLayer','${GTM_ID}');
           
           // Verificar consentimento existente
           var gtmConsent = localStorage.getItem('cookie-consent');
           if (gtmConsent === 'declined') {
             window.dataLayer.push({'event': 'cookie_consent_declined'});
           }
         `}
        </Script>
        {/* Google AdSense - Script - PRESERVED FOR FUTURE INTEGRATION */}
        <Script
          id="google-adsense"
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${GOOGLE_ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        {/* Meta Pixel Code - noscript */}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=698603379497206&ev=PageView&noscript=1"
          />
        </noscript>

        {/* Google Tag Manager - noscript */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="relative min-h-screen flex flex-col mx-auto max-w-[1366px]">
            <BackgroundGradient />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <Toaster />
            {/* Primeiro o aviso de cookies, depois o widget de email */}
            <CookieConsent />
            <FloatingEmailWidget />
            <FloatingContactWidget position="bottom-right" />
            {/* Adicionar o novo componente AdController */}
            <AdController />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}


import './globals.css'