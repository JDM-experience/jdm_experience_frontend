// Proxied through the real backend (GET /weather) instead of calling Open-Meteo directly from the
// browser -- the backend owns the one fixed JDM Experience location (app_settings latitude/
// longitude) and caches the forecast, so this file now follows the same real-backend convention
// as tourService/bookingService rather than the old direct-fetch-to-a-third-party pattern.
import { httpClient } from './httpClient';
import type { ApiEnvelope } from '@/types/api';
import type { DailyForecast } from '@/types/weather';

export async function getForecast(): Promise<DailyForecast[]> {
  const res = await httpClient.get<ApiEnvelope<DailyForecast[]>>('/weather');
  return res.data;
}
