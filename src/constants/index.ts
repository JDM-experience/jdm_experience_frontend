import type { ThemeConfig } from 'antd';

/**
 * AntD ConfigProvider theme, applied once at the app root in `App.tsx`.
 *
 * `colorPrimary` is pure black, which has no AntD-computed lighter/darker shade to
 * contrast against on hover/active — so those states, plus the default (secondary)
 * button palette, are pinned explicitly here rather than left to AntD's derived defaults.
 */
export const ANTD_THEME: ThemeConfig = {
  token: {
    colorPrimary: '#000000',
    colorPrimaryHover: '#333333',
    colorPrimaryActive: '#000000',
    colorTextLightSolid: '#ffffff',
    colorBorder: '#8c8c8c',
    colorBorderSecondary: '#d9d9d9',
    borderRadius: 6,
    fontFamily: "'Segoe UI', Roboto, -apple-system, sans-serif",
  },
  components: {
    Button: {
      defaultColor: '#000000',
      defaultBorderColor: '#8c8c8c',
      defaultHoverColor: '#000000',
      defaultHoverBorderColor: '#000000',
      defaultActiveColor: '#000000',
      defaultActiveBorderColor: '#000000',
    },
  },
};

/** Percentage taken off the total when PROMO_CODE is applied at checkout. */
export const PROMO_CODE = 'DRIP10';
export const PROMO_DISCOUNT_RATE = 0.1;

/** Same-day reservations close after this hour, Japan Standard Time. */
export const BOOKING_CUTOFF_HOUR_JST = 17;

/**
 * Customers no longer pick a time — they only pick a date. CartItem/OrderItem.time
 * is still threaded through the booking pipeline (display + dedup key), so this
 * fixed default fills it instead of a customer-facing TimePicker.
 */
export const DEFAULT_BOOKING_TIME = '09:00';

export const IMAGE_BASE_PATH = '/images/';

export const CURRENCY_SYMBOL = '¥';

export interface ItineraryStop {
  label: string;
  latitude: number;
  longitude: number;
}

/** Every tour follows this same fixed pickup-to-drop-off route — shown on the tour itinerary map. */
export const TOUR_ITINERARY: ItineraryStop[] = [
  { label: 'Pickup — Tokyo', latitude: 35.687095568541054, longitude: 139.77244079344325 },
  { label: 'A-PIT Super Autobacs', latitude: 35.64207702971635, longitude: 139.80365935447102 },
  {
    label: 'Metropolitan Expressway Bayshore Route',
    latitude: 35.524421461945344,
    longitude: 139.7925098295954,
  },
  { label: 'Daikoku Parking Area', latitude: 35.46187885670312, longitude: 139.68053355446503 },
  { label: 'Rainbow Bridge', latitude: 35.63684447921012, longitude: 139.7630825779965 },
  { label: 'Tokyo Tower', latitude: 35.658702513789656, longitude: 139.74538998145843 },
];
