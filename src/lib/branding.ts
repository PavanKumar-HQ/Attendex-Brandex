export interface BrandingConfig {
  name: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  shortName: string;
  faviconUrl: string;
  supportEmail: string;
}

export const DEFAULT_BRANDING: BrandingConfig = {
  name: "Attendex",
  shortName: "Attendex",
  logoUrl: "/icons/icon-192.png",
  primaryColor: "#0f172a", // slate-900
  accentColor: "#2563eb",  // blue-600
  faviconUrl: "/favicon.ico",
  supportEmail: "support@attendex.com",
};

// This could eventually fetch from Supabase based on the URL or User's Org
export const getBranding = async (): Promise<BrandingConfig> => {
    // For now, return default. 
    // Logic can be added here to fetch from an 'organizations' table.
    return DEFAULT_BRANDING;
};
