import type React from "react"
import "@/app/globals.css"
import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Toaster } from "@/components/ui/toaster"
import Script from "next/script"
import { GTM_ID } from "@/utils/constants"
import { CookieConsent } from "@/components/cookie-consent"
import { JulinhoAssistant } from "@/components/julinho-assistant"
import { UserProvider } from "@/components/providers/user-provider"
import { AdSenseLoaderWithRoutes } from "@/components/ads/adsense-loader-with-routes"
import { CleverWebServerLoader } from "@/components/ads/clever-webserver-loader"
import { GoogleOneTap } from "@/components/google-one-tap"
import { createClient as createServerClient } from "@/lib/supabase/server"
import type { Profile } from "@/types/supabase"
import { GoogleAnalyticsWrapper } from "@/components/google-analytics-wrapper"
import { BlackFridayBanner } from "@/components/black-friday/black-friday-banner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CorretorIA - Corretor de Texto Online Grátis com Inteligência Artificial",
  description:
    "Corrija textos em português com inteligência artificial. Identifica erros gramaticais, ortográficos e de pontuação automaticamente.",
  keywords:
    "corretor de texto, corretor ortográfico, correção gramatical, português, inteligência artificial, IA, corretor online, corretor grátis",
  generator: 'v0.dev'
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()

  // ✅ Use getUser() instead of getSession() for server-side security
  // getUser() contacts Supabase Auth server to verify the user is authentic
  // getSession() only reads from cookies which could be tampered with
  // See: https://supabase.com/docs/guides/auth/server-side/nextjs
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let initialProfile: Profile | null = null

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profile) {
      initialProfile = profile as Profile
    }
  }

  // Get session for client-side hydration (UserProvider needs session.user)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        <meta name="facebook-domain-verification" content="hprarr6g4519byzssy18zrs0vqdzta" />
        <meta name="msvalidate.01" content="88A6557DF364B50282E72FF4667CDC25" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="48x48" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/favicon.png" sizes="180x180" />
        <link rel="manifest" href="/manifest.json" />

        {/* Canonical URLs are handled by:
            1. Middleware (canonical.ts) - adds Link header
            2. Page metadata (alternates.canonical)
            No client-side script needed. */}

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

        {/* Structured Data for CorretorIA Premium Product */}
        <Script id="structured-data-product" type="application/ld+json">
          {`
            {
              "@context": "https://schema.org/",
              "@type": "Product",
              "name": "CorretorIA Premium",
              "image": "https://www.corretordetextoonline.com.br/og-home.png",
              "description": "Desbloqueie todo o potencial da correção de textos com IA. Correções ilimitadas, análise avançada e sem anúncios.",
              "brand": {
                "@type": "Brand",
                "name": "CorretorIA"
              },
              "offers": [
                {
                  "@type": "Offer",
                  "name": "Plano Mensal",
                  "price": "29.90",
                  "priceCurrency": "BRL",
                  "availability": "https://schema.org/InStock",
                  "url": "https://www.corretordetextoonline.com.br/premium",
                  "priceValidUntil": "2026-12-31"
                },
                {
                  "@type": "Offer",
                  "name": "Plano Anual",
                  "price": "238.80",
                  "priceCurrency": "BRL",
                  "availability": "https://schema.org/InStock",
                  "url": "https://www.corretordetextoonline.com.br/premium",
                  "priceValidUntil": "2026-12-31"
                }
              ],
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "1200"
              }
            }
          `}
        </Script>

        {/* Meta Pixel Code - lazyOnload para melhor performance inicial */}
        <Script id="meta-pixel" strategy="lazyOnload">
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

        {/* Google Analytics 4 - Carregado via @next/third-parties */}
        {/* A implementação foi movida para o componente GoogleAnalyticsWrapper */}
        {/* que respeita o consentimento de cookies do usuário */}

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

        {/* Hotjar Tracking Code for Corretor de Texto Online */}
        <Script id="hotjar-tracking" strategy="afterInteractive">
          {`
            // Verificar consentimento de cookies antes de inicializar o Hotjar
            function initializeHotjar() {
              var hotjarConsent = localStorage.getItem('cookie-consent');
              if (hotjarConsent === 'accepted') {
                (function(h,o,t,j,a,r){
                    h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                    h._hjSettings={hjid:6431343,hjsv:6};
                    a=o.getElementsByTagName('head')[0];
                    r=o.createElement('script');r.async=1;
                    r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                    a.appendChild(r);
                })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
              }
            }
            
            // Inicializar se já houver consentimento
            initializeHotjar();
            
            // Escutar mudanças no consentimento
            window.addEventListener('storage', initializeHotjar);
          `}
        </Script>

        {/* AdSense Loader - Ativo com controle de rotas */}
        <AdSenseLoaderWithRoutes initialProfile={initialProfile} />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
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

        <UserProvider initialUser={session?.user ?? null} initialProfile={initialProfile}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <BlackFridayBanner />
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1 pb-20 md:pb-0">{children}</main>
              <Footer />
              <MobileNav />
            </div>
            <Toaster />
            <CookieConsent />
            <JulinhoAssistant />
            <GoogleOneTap />
            <GoogleAnalyticsWrapper />
            {/* <CleverWebServerLoader /> */}
          </ThemeProvider>
        </UserProvider>      </body>
    </html>
  )
}
