import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Spin, Typography } from 'antd';
import { getForecast } from '@/services/weatherService';
import { describeWeatherCode } from '@/utils/weatherCodes';
import { getErrorMessage } from '@/utils/errors';
import type { DailyForecast } from '@/types/weather';

interface TourWeatherForecastProps {
  /** The customer's selected tour date (YYYY-MM-DD). Open-Meteo only forecasts ~16 days out, so a
   *  date further out than that simply has no matching entry -- shown as "not available yet",
   *  never a fabricated/default value. */
  date: string;
}

/** Weather for the fixed JDM Experience location (see backend GET /weather) -- informational
 *  only, so a failure here never blocks the booking flow around it. */
export function TourWeatherForecast({ date }: TourWeatherForecastProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forecast, setForecast] = useState<DailyForecast | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setForecast(null);

    getForecast()
      .then((days) => {
        if (cancelled) return;
        setForecast(days.find((day) => day.date === date) ?? null);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Weather information is currently unavailable.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [date]);

  const weatherDescription = forecast ? describeWeatherCode(forecast.weatherCode) : null;

  return (
    <div style={{ marginTop: 16, padding: 16, background: '#252D40', border: '1px solid #303849', borderRadius: 8 }}>
      <Typography.Text strong>Weather for Your Tour</Typography.Text>
      <div>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {date}
        </Typography.Text>
      </div>
      <div style={{ marginTop: 8 }}>
        {loading && <Spin size="small" tip="Loading weather..." />}
        {!loading && error && <Alert type="error" showIcon message={error} />}
        {!loading && !error && forecast && weatherDescription && (
          <>
            <Typography.Text>
              {weatherDescription.icon} {weatherDescription.label}
              {' — '}
              High: {Math.round(forecast.tempMaxC)}°C · Low: {Math.round(forecast.tempMinC)}°C
            </Typography.Text>
            {(forecast.precipitationProbability !== null || forecast.windSpeedMaxKmh !== null) && (
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {forecast.precipitationProbability !== null && <>Rain probability: {Math.round(forecast.precipitationProbability)}% </>}
                  {forecast.windSpeedMaxKmh !== null && <>· Wind: {Math.round(forecast.windSpeedMaxKmh)} km/h</>}
                </Typography.Text>
              </div>
            )}
          </>
        )}
        {!loading && !error && !forecast && (
          <Typography.Text type="secondary">Weather forecast is not available for this date yet.</Typography.Text>
        )}
      </div>
      <Link to="/weather" style={{ fontSize: 12 }}>
        View extended forecast →
      </Link>
    </div>
  );
}
