import { useEffect, useState } from 'react';
import { Alert, Col, Row, Select, Spin, Typography } from 'antd';
import { getProducts } from '@/services/productService';
import { getForecast, DEFAULT_TOKYO_COORDINATES } from '@/services/weatherService';
import { describeWeatherCode } from '@/utils/weatherCodes';
import { formatTourDate } from '@/utils/bookingUtils';
import { getErrorMessage } from '@/utils/errors';
import type { Product } from '@/types/product';
import type { DailyForecast } from '@/types/weather';

/**
 * These tours are driving experiences without a single destination, so they don't fit a
 * "weather at the destination" lookup — only tours tied to an actual place are listed here.
 */
const EXCLUDED_FROM_WEATHER = new Set([
  'Weekend Business Errand Drive',
  'Nissan GT-R R35 Night Drive',
  'Nissan Skyline ER34 Experience',
]);

export default function Weather() {
  const [tours, setTours] = useState<Product[]>([]);
  const [selectedTourId, setSelectedTourId] = useState<number | undefined>(undefined);
  const [forecast, setForecast] = useState<DailyForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProducts()
      .then((results) => {
        const locations = results.filter((tour) => !EXCLUDED_FROM_WEATHER.has(tour.name));
        setTours(locations);
        setSelectedTourId(locations[0]?.id);
      })
      .catch(() => undefined); // Non-fatal — the forecast below still works against the Tokyo default location.
  }, []);

  useEffect(() => {
    const tour = tours.find((t) => t.id === selectedTourId);
    const latitude = tour?.latitude ?? DEFAULT_TOKYO_COORDINATES.latitude;
    const longitude = tour?.longitude ?? DEFAULT_TOKYO_COORDINATES.longitude;

    let cancelled = false;
    setLoading(true);
    setError(null);
    getForecast(latitude, longitude)
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
  }, [selectedTourId, tours]);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      <Typography.Title level={2}>Tour Destination Weather</Typography.Title>
      <Typography.Paragraph type="secondary">
        Forecasts are provided by Open-Meteo and typically cover the next 16 days.
      </Typography.Paragraph>

      <Select
        style={{ width: 320, marginBottom: 32 }}
        value={selectedTourId}
        onChange={setSelectedTourId}
        options={tours.map((tour) => ({ value: tour.id, label: tour.name }))}
        placeholder="Choose a location"
      />

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
                <div style={{ padding: 16, background: '#fafafa', borderRadius: 8, textAlign: 'center' }}>
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
