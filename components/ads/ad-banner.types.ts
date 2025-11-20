export interface Banner {
  id: string;
  src: string;
  alt: string;
  utmParams: {
    source: string;
    medium: string;
    campaign: string;
    content: string;
  };
}

export interface AdBannerProps {
  position?: "top" | "bottom" | "sidebar";
  variant?: "standard" | "responsive" | "inline";
  onClose?: () => void;
  adSlot?: string;
  forceShow?: boolean;
}
