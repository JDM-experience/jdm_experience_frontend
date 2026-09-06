export interface DailyForecast {
  date: string;
  weatherCode: number;
  tempMaxC: number;
  tempMinC: number;
  precipitationProbability: number | null;
  windSpeedMaxKmh: number | null;
}
