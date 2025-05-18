import type React from "react"
import "@/app/globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"
import Script from "next/script"
import { GOOGLE_ADSENSE_CLIENT, GTM_ID } from "@/utils/constants"
import { CookieConsent } from "@/components/cookie-consent"
import { JulinhoAssistant } from "@/components/julinho-assistant"
import { AdController } from "@/components/ad-controller"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CorretorIA - Corretor de Texto Online Grátis com Inteligência Artificial",
  description:
    "Corrija textos em português com inteligência artificial. Identifica erros gramaticais, ortográficos e de pontuação automaticamente.",
  keywords:
    "corretor de texto, corretor ortográfico, correção gramatical, português, inteligência artificial, IA, corretor online, corretor grátis",
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
        <Script id="canonical-url" strategy="beforeInteractive">
          {`
            // Set canonical URL dynamically
            const link = document.createElement('link');
            link.rel = 'canonical';
            link.href = 'https://www.corretordetextoonline.com.br' + window.location.pathname + window.location.search;
            document.head.appendChild(link);
          `}
        </Script>

        {/* Structured Data for Corretor de Texto */}
        <Script id="structured-data-corretor" type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Corretor de Texto CorretorIA",
              "url": "https://www.corretordetextoonline.com.br",
              "description": "Corretor de texto online gratuito com inteligência artificial para corrigir erros de gramática, ortografia e estilo em português.",
              "applicationCategory": "UtilityApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "BRL"
              },
              "inLanguage": "pt-BR"
            }
          `}
        </Script>

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
        {/* Google AdSense - Script */}
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
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
          <CookieConsent />
          <JulinhoAssistant />
          <AdController />
        </ThemeProvider>
      </body>
    </html>
  )
}
