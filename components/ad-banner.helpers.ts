import { Banner } from "./ad-banner.types";

export function getUtmUrl(banner: Banner) {
  const { utmParams } = banner;
  return `/apoiar?utm_source=${utmParams.source}&utm_medium=${utmParams.medium}&utm_campaign=${utmParams.campaign}&utm_content=${utmParams.content}`;
}
