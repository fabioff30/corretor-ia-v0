// utils/banner-frequency.ts

export function canShowBanner(key: string, intervalMinutes = 30) {
  const lastShown = localStorage.getItem(key);
  if (!lastShown) return true;
  const diff = Date.now() - Number(lastShown);
  return diff > intervalMinutes * 60 * 1000;
}

export function setBannerShown(key: string) {
  localStorage.setItem(key, String(Date.now()));
}
