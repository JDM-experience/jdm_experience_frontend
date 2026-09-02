import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Col, Row, Typography } from 'antd';
import { CalendarOutlined, CarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { TourCard } from '@/components/common/TourCard';
import { PageSpinner } from '@/components/common/PageSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { listTours } from '@/services/tourService';
import type { Tour } from '@/types/tour';

const FEATURES = [
  {
    icon: <CalendarOutlined style={{ fontSize: 42 }} />,
    title: 'Date-Based Booking',
    description: 'Pick a tour date and the system checks availability automatically.',
  },
  {
    icon: <CarOutlined style={{ fontSize: 42 }} />,
    title: 'Flexible Fleet',
    description: 'Browse tours using existing vehicle type categories and tour prices.',
  },
  {
    icon: <ClockCircleOutlined style={{ fontSize: 42 }} />,
    title: 'JST Cut-Off',
    description: 'Same-day reservations close after 5:00 PM Japan Standard Time.',
  },
];

export default function Home() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listTours({ status: 'AVAILABLE' })
      .then((results) => setTours([...results].sort((a, b) => b.id - a.id).slice(0, 8)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section
        style={{
          minHeight: '72vh',
          display: 'flex',
          alignItems: 'center',
          color: '#fff',
          backgroundImage: "linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,.45)), url('/images/hompage.JPG')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px', width: '100%' }}>
          <div style={{ maxWidth: 640 }}>
            <Typography.Title style={{ color: '#fff', fontSize: 48, fontWeight: 700 }}>
              Japan JDM Experience Tours
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#fff', fontSize: 18 }}>
              Book guided JDM tours by date for city errands, business trips, and weekend drives.
            </Typography.Paragraph>
            <a href="#fleet">
              <Button type="primary" size="large" style={{ background: '#000', borderColor: '#000' }}>
                Browse Tours
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section id="fleet" style={{ maxWidth: 1140, margin: '0 auto', padding: '64px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Typography.Title level={2}>Featured Tours</Typography.Title>
          <Typography.Text type="secondary">
            All vehicles are managed through the existing tour fleet system.
          </Typography.Text>
        </div>

        {loading ? (
          <PageSpinner />
        ) : tours.length === 0 ? (
          <EmptyState title="No tours found." />
        ) : (
          <Row gutter={[24, 24]}>
            {tours.map((tour) => (
              <Col key={tour.id} xs={24} sm={12} md={8} lg={6}>
                <TourCard tour={tour} />
              </Col>
            ))}
          </Row>
        )}
      </section>

      <section style={{ background: '#f8f8f8', padding: '48px 24px' }}>
        <Row gutter={[32, 32]} justify="center" style={{ maxWidth: 1140, margin: '0 auto', textAlign: 'center' }}>
          {FEATURES.map((feature) => (
            <Col key={feature.title} xs={24} md={8}>
              {feature.icon}
              <Typography.Title level={5} style={{ marginTop: 16 }}>
                {feature.title}
              </Typography.Title>
              <Typography.Text type="secondary">{feature.description}</Typography.Text>
            </Col>
          ))}
        </Row>
      </section>

      <div style={{ textAlign: 'center', padding: '0 24px 48px' }}>
        <Link to="/about">Learn more about our tours</Link>
      </div>
    </>
  );
}
