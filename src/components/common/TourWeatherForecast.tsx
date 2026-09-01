import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Spin, Typography } from 'antd';
import { getForecast } from '@/services/weatherService';
import { describeWeatherCode } from '@/utils/weatherCodes';
import { getErrorMessage } from '@/utils/errors';

interface TourWeatherForecastProps {
  latitude: number;
  longitude: number;
  locationLabel: string;
  date: string;
}

export function TourWeatherForecast({ latitude, longitude, locationLabel, date }: TourWeatherForecastProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forecast, setForecast] = useState<{ weatherCode: number; tempMaxC: number; tempMinC: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setForecast(null);

    getForecast(latitude, longitude)
      .then((days) => {
        if (cancelled) return;
        const match = days.find((day) => day.date === date);
        setForecast(match ? { weatherCode: match.weatherCode, tempMaxC: match.tempMaxC, tempMinC: match.tempMinC } : null);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Unable to load the weather forecast.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, date]);

  return (
    <div style={{ marginTop: 16, padding: 16, background: '#fafafa', borderRadius: 8 }}>
      <Typography.Text strong>Weather in {locationLabel}</Typography.Text>
      <div style={{ marginTop: 8 }}>
        {loading && <Spin size="small" />}
        {!loading && error && <Alert type="error" showIcon message={error} />}
        {!loading && !error && forecast && (
          <Typography.Text>
            {describeWeatherCode(forecast.weatherCode).icon} {describeWeatherCode(forecast.weatherCode).label}
            {' — '}
            High: {Math.round(forecast.tempMaxC)}°C · Low: {Math.round(forecast.tempMinC)}°C
          </Typography.Text>
        )}
        {!loading && !error && !forecast && (
          <Typography.Text type="secondary">Weather information is not available for this date yet.</Typography.Text>
        )}
      </div>
      <Link to="/weather" style={{ fontSize: 12 }}>
        View extended forecast →
      </Link>
    </div>
  );
}
