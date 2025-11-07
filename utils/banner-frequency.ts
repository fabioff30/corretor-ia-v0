// utils/banner-frequency.ts

import { PainBanner } from "@/lib/api/response-normalizer"

export function canShowBanner(key: string, intervalMinutes = 30) {
  const lastShown = localStorage.getItem(key);
  if (!lastShown) return true;
  const diff = Date.now() - Number(lastShown);
  return diff > intervalMinutes * 60 * 1000;
}

export function setBannerShown(key: string) {
  localStorage.setItem(key, String(Date.now()));
}

/**
 * Check if a pain banner was dismissed in the current session
 * Uses sessionStorage so the flag is cleared when browser/tab is closed
 */
export function wasPainBannerDismissedThisSession(bannerId: PainBanner): boolean {
  if (typeof window === "undefined") return false
  try {
    const key = `corretoria:pain-banner-${bannerId}:dismissed-session`
    const dismissed = sessionStorage.getItem(key)
    return dismissed === "true"
  } catch (error) {
    console.warn("Error checking pain banner session storage:", error)
    return false
  }
}

/**
 * Mark a pain banner as dismissed for the current session
 * Uses sessionStorage so the user won't see it again until they close and reopen the browser
 */
export function markPainBannerDismissed(bannerId: PainBanner): void {
  if (typeof window === "undefined") return
  try {
    const key = `corretoria:pain-banner-${bannerId}:dismissed-session`
    sessionStorage.setItem(key, "true")
  } catch (error) {
    console.warn("Error setting pain banner session storage:", error)
  }
}
