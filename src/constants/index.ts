import { theme, type ThemeConfig } from 'antd';

/**
 * "Midnight Tokyo" -- AntD ConfigProvider theme, applied once at the app root in `App.tsx`.
 * Dark, automotive, JDM-red accent. Red is reserved for primary actions/active state only (Book
 * Now, Submit, Confirm, active nav) -- everything else uses white/light-gray text or the
 * semantic status colors below, per the agreed usage table.
 */
export const ANTD_THEME: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorBgBase: '#0F1117',
    colorBgContainer: '#1C2333',
    colorBgElevated: '#252D40',
    colorBgLayout: '#0F1117',
    colorPrimary: '#E03D36',
    colorPrimaryHover: '#C9322C',
    colorPrimaryActive: '#C9322C',
    colorTextBase: '#FFFFFF',
    colorText: '#FFFFFF',
    colorTextSecondary: '#AEB4C0',
    colorTextTertiary: '#8B93A5',
    colorBorder: '#303849',
    colorBorderSecondary: '#303849',
    colorSuccess: '#35B86B',
    colorWarning: '#F5A523',
    colorError: '#E03D36',
    colorTextLightSolid: '#ffffff',
    borderRadius: 6,
    fontFamily: "'Segoe UI', Roboto, -apple-system, sans-serif",
  },
  components: {
    Layout: {
      headerBg: '#0F1117',
      bodyBg: '#0F1117',
      footerBg: '#0F1117',
    },
    Button: {
      defaultColor: '#FFFFFF',
      defaultBorderColor: '#303849',
      defaultHoverColor: '#FFFFFF',
      defaultHoverBorderColor: '#E03D36',
      defaultActiveColor: '#FFFFFF',
      defaultActiveBorderColor: '#C9322C',
    },
    Card: {
      colorBgContainer: '#1C2333',
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
