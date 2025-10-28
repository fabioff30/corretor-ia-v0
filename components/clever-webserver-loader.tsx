'use client'

import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { useEffect, useState } from 'react'

/**
 * CleverWebServer Analytics Loader
 * Carrega o script de analytics, exceto em rotas específicas
 */

// Rotas onde o CleverWebServer não deve aparecer
const BLOCKED_ROUTES = [
  '/premium',
  '/dashboard',
  '/oferta-especial',
]

export function CleverWebServerLoader() {
  const pathname = usePathname()
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    // Verificar se a rota atual está bloqueada
    const isBlocked = BLOCKED_ROUTES.some(route => {
      // Verificar rota exata e subrotas (ex: /dashboard/*)
      return pathname === route || pathname.startsWith(`${route}/`)
    })

    setShouldLoad(!isBlocked)

    if (isBlocked) {
      console.log(`CleverWebServer bloqueado na rota: ${pathname}`)
    }
  }, [pathname])

  // Não renderizar se estiver em rota bloqueada
  if (!shouldLoad) {
    return null
  }

  return (
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
  )
}
