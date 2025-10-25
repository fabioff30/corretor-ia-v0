import Script from "next/script"
import { GOOGLE_ADSENSE_CLIENT } from "@/utils/constants"
import type { Profile } from "@/types/supabase"

interface AdSenseLoaderProps {
  initialProfile: Profile | null
}

export function AdSenseLoader({ initialProfile }: AdSenseLoaderProps) {
  // Não carregar AdSense se o usuário é premium ou admin
  const isPremium = initialProfile?.plan_type === "pro" || initialProfile?.plan_type === "admin"

  if (isPremium) {
    console.log("AdSense bloqueado: usuário é premium/admin")
    return null
  }

  return (
    <>
      {/* Google AdSense - Script - Load only once */}
      <Script
        id="google-adsense"
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${GOOGLE_ADSENSE_CLIENT}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />

      {/* Initialize AdSense only once */}
      <Script id="adsense-init" strategy="afterInteractive">
        {`
          // Initialize adsbygoogle array only if it doesn't exist
          window.adsbygoogle = window.adsbygoogle || [];

          // Set up consent handling for AdSense
          function handleAdsenseConsent() {
            var adsenseConsent = localStorage.getItem('cookie-consent');
            if (adsenseConsent === 'accepted') {
              // User accepted personalized ads
              window.adsbygoogle.requestNonPersonalizedAds = 0;
            } else if (adsenseConsent === 'declined') {
              // User declined personalized ads
              window.adsbygoogle.requestNonPersonalizedAds = 1;
            }
          }

          // Handle initial consent
          handleAdsenseConsent();

          // Listen for consent changes
          window.addEventListener('storage', handleAdsenseConsent);
        `}
      </Script>
    </>
  )
}
