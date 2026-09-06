import { useEffect, useState } from 'react';
import { Alert, Col, Row, Spin, Typography } from 'antd';
import { getForecast } from '@/services/weatherService';
import { describeWeatherCode } from '@/utils/weatherCodes';
import { formatTourDate } from '@/utils/bookingUtils';
import { getErrorMessage } from '@/utils/errors';
import type { DailyForecast } from '@/types/weather';

/** All tours share one fixed physical location (see backend GET /weather) -- there is no
 *  per-tour location to pick between, so this is simply the forecast for that one location. */
export default function Weather() {
  const [forecast, setForecast] = useState<DailyForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getForecast()
      .then((days) => {
        if (!cancelled) setForecast(days);
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
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      <Typography.Title level={2}>Weather Forecast</Typography.Title>
      <Typography.Paragraph type="secondary">
        Forecast for the Japan JDM Experience location, provided by Open-Meteo and typically covering the next 16
        days.
      </Typography.Paragraph>

      {loading && <Spin size="large" />}
      {!loading && error && <Alert type="error" showIcon message={error} />}
      {!loading && !error && forecast.length === 0 && (
        <Typography.Text type="secondary">Weather information is not available right now.</Typography.Text>
      )}
      {!loading && !error && forecast.length > 0 && (
        <Row gutter={[16, 16]}>
          {forecast.map((day) => {
            const { icon, label } = describeWeatherCode(day.weatherCode);
            return (
              <Col key={day.date} xs={12} sm={8} md={6}>
                <div style={{ padding: 16, background: '#1C2333', border: '1px solid #303849', borderRadius: 8, textAlign: 'center' }}>
                  <Typography.Text strong style={{ display: 'block', marginBottom: 4 }}>
                    {formatTourDate(day.date)}
                  </Typography.Text>
                  <div style={{ fontSize: 28 }}>{icon}</div>
                  <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                    {label}
                  </Typography.Text>
                  <Typography.Text style={{ display: 'block', marginTop: 4 }}>
                    {Math.round(day.tempMaxC)}° / {Math.round(day.tempMinC)}°C
                  </Typography.Text>
                </div>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
}
