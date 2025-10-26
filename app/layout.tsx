import type React from "react"
import "@/app/globals.css"
import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"
import Script from "next/script"
import { GTM_ID } from "@/utils/constants"
import { CookieConsent } from "@/components/cookie-consent"
import { JulinhoAssistant } from "@/components/julinho-assistant"
import { UserProvider } from "@/components/providers/user-provider"
import { AdSenseLoader } from "@/components/adsense-loader"
import { GoogleOneTap } from "@/components/google-one-tap"
import { createClient as createServerClient } from "@/lib/supabase/server"
import type { Profile } from "@/types/supabase"

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
  const {
    data: { session },
  } = await supabase.auth.getSession()

  let initialProfile: Profile | null = null

  if (session?.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()

    if (profile) {
      initialProfile = profile as Profile
    }
  }

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="facebook-domain-verification" content="hprarr6g4519byzssy18zrs0vqdzta" />
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

        {/* Google Analytics 4 - gtag.js */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-ZR7B5DMLER"
          strategy="afterInteractive"
        />

        {/* Google Analytics 4 - Configuration */}
        <Script id="ga4-config" strategy="afterInteractive">
          {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          // Sempre inicializar o GA4 (necessário para gtag funcionar)
          gtag('config', 'G-ZR7B5DMLER', {
            page_path: window.location.pathname,
            send_page_view: true
          });

          console.log('[GA4] Google Analytics 4 inicializado - ID: G-ZR7B5DMLER');

          // Verificar consentimento para logging
          var ga4Consent = localStorage.getItem('cookie-consent');
          if (ga4Consent === 'accepted') {
            console.log('[GA4] Cookie consent: ACCEPTED - enviando eventos');
          } else if (ga4Consent === 'declined') {
            console.log('[GA4] Cookie consent: DECLINED - eventos não serão enviados');
          } else {
            console.log('[GA4] Cookie consent: NOT SET - eventos serão enviados');
          }
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

        {/* AdSense Loader - Conditional rendering based on user plan */}
        <AdSenseLoader initialProfile={initialProfile} />

        {/* CleverWebServer Script */}
        <Script id="clever-webserver" strategy="afterInteractive">
          {`
            (function (document, window) {
              var a, c = document.createElement("script"), f = window.frameElement;
              c.id = "CleverCoreLoader94925";
              c.src = "https://scripts.cleverwebserver.com/5e874cbae3c8b61578de0cb6869547be.js";
              c.async = true;
              c.type = "text/javascript";
              c.setAttribute("data-target", window.name || (f && f.getAttribute("id")));
              c.setAttribute("data-cfasync", "false");
              try {
                a = parent.document.getElementsByTagName("script")[0] || document.getElementsByTagName("script")[0];
              } catch (e) {
                a = false;
              }
              a || (a = document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]);
              a.parentNode.insertBefore(c, a);
            })(document, window);
          `}
        </Script>
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
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster />
            <CookieConsent />
            <JulinhoAssistant />
            <GoogleOneTap />
          </ThemeProvider>
        </UserProvider>
      </body>
    </html>
  )
}
