import type { DailyForecast } from '@/types/weather';

// Open-Meteo is a free, public third-party API (not the future Node backend), so this
// service calls `fetch` directly instead of following the mock/real facade split used
// by src/services/*.ts for tours/bookings/etc.

/** Fallback coordinates (central Tokyo) for tours without configured latitude/longitude. */
export const DEFAULT_TOKYO_COORDINATES = { latitude: 35.6762, longitude: 139.6503 };

interface OpenMeteoResponse {
  daily?: {
    time: string[];
    weathercode: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}

export async function getForecast(latitude: number, longitude: number): Promise<DailyForecast[]> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('daily', 'weathercode,temperature_2m_max,temperature_2m_min');
  url.searchParams.set('timezone', 'Asia/Tokyo');
  url.searchParams.set('forecast_days', '16');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Unable to fetch the weather forecast.');
  }

  const body = (await response.json()) as OpenMeteoResponse;
  const daily = body.daily;
  if (!daily) return [];

  return daily.time.map((date, index) => ({
    date,
    weatherCode: daily.weathercode[index],
    tempMaxC: daily.temperature_2m_max[index],
    tempMinC: daily.temperature_2m_min[index],
  }));
}
