interface Window {
  dataLayer: any[]
  gtag: (...args: any[]) => void
  fbq: (action: string, event: string, params?: any) => void
}
