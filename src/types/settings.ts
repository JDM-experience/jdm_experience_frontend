export interface ContactSettings {
  locationName: string;
  address: string | null;
  latitude: number;
  longitude: number;
  timezone: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactHours: string | null;
  bookingCutoffHour: number;
}

export interface UpdateContactSettingsInput {
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  contactHours?: string;
}

export type SocialPlatform = 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK';

export interface SocialLink {
  id: number;
  platform: SocialPlatform;
  url: string;
  enabled: boolean;
  displayOrder: number;
}
