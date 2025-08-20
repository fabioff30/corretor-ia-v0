// utils/track-banner-interaction.ts
import { canShowBanner, setBannerShown } from "@/utils/banner-frequency";

const INTERACTION_KEY = "ad-banner-interactions";

export function trackBannerInteraction() {
  let interactionCount = Number(localStorage.getItem(INTERACTION_KEY) || 0) + 1;
  localStorage.setItem(INTERACTION_KEY, String(interactionCount));
  if (interactionCount >= 3 && canShowBanner("ad-banner-engaged-last-shown", 60)) {
    window.dispatchEvent(new CustomEvent("showAdBanner", { detail: { reason: "engaged" } }));
    setBannerShown("ad-banner-engaged-last-shown");
    // Opcional: zera o contador para não mostrar repetido
    localStorage.setItem(INTERACTION_KEY, "0");
  }
}
