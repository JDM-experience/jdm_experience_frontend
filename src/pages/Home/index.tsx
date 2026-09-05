import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { Button, Card, Col, Row, Typography } from 'antd';
import {
  CalendarOutlined,
  CarOutlined,
  ClockCircleOutlined,
  CompassOutlined,
  DollarCircleOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { TourCard } from '@/components/common/TourCard';
import { TourItineraryMap } from '@/components/common/TourItineraryMap';
import { PageSpinner } from '@/components/common/PageSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { listTours } from '@/services/tourService';
import { BOOKING_CUTOFF_HOUR_JST, TOUR_ITINERARY } from '@/constants';
import type { Tour } from '@/types/tour';

const CUTOFF_LABEL = dayjs().hour(BOOKING_CUTOFF_HOUR_JST).minute(0).format('h:mm A');

const FEATURES = [
  {
    icon: <CalendarOutlined style={{ fontSize: 28 }} />,
    title: 'Date-Based Booking',
    description: 'Pick a tour date and the system checks availability automatically.',
    color: '#1677ff',
    bg: '#e6f4ff',
  },
  {
    icon: <CarOutlined style={{ fontSize: 28 }} />,
    title: 'Flexible Fleet',
    description: 'Browse tours using existing vehicle type categories and tour prices.',
    color: '#52c41a',
    bg: '#f6ffed',
  },
  {
    icon: <ClockCircleOutlined style={{ fontSize: 28 }} />,
    title: 'JST Cut-Off',
    description: `Same-day reservations close after ${CUTOFF_LABEL} Japan Standard Time.`,
    color: '#faad14',
    bg: '#fffbe6',
  },
];

const TRIP_INFO = [
  {
    icon: <ClockCircleOutlined style={{ fontSize: 22 }} />,
    title: 'Booking Cut-Off',
    description: `Same-day requests must be placed before ${CUTOFF_LABEL} JST — plan ahead for evening drives.`,
  },
  {
    icon: <EnvironmentOutlined style={{ fontSize: 22 }} />,
    title: "Tokyo Weather",
    description: 'Check the forecast for your tour date before you head out.',
    to: '/weather',
    linkLabel: 'View forecast',
  },
  {
    icon: <DollarCircleOutlined style={{ fontSize: 22 }} />,
    title: 'Pricing in JPY',
    description: 'All tours are priced in Japanese Yen — see an estimated conversion on any tour page.',
  },
];

export default function Home() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // No local sort needed -- the backend's default order (id desc, newest first) already
    // matches what this section wants; only the display-count truncation happens client-side.
    listTours({ status: 'AVAILABLE' })
      .then((results) => setTours(results.slice(0, 8)))
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
        <Row gutter={[32, 32]} justify="center" style={{ maxWidth: 1140, margin: '0 auto' }}>
          {FEATURES.map((feature) => (
            <Col key={feature.title} xs={24} md={8} style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: feature.bg,
                  color: feature.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                }}
              >
                {feature.icon}
              </div>
              <Typography.Title level={5} style={{ marginTop: 16 }}>
                {feature.title}
              </Typography.Title>
              <Typography.Text type="secondary">{feature.description}</Typography.Text>
            </Col>
          ))}
        </Row>
      </section>

      <section style={{ maxWidth: 1140, margin: '0 auto', padding: '64px 24px' }}>
        <Row gutter={[40, 32]} align="middle">
          <Col xs={24} md={12}>
            <Typography.Title level={2}>
              <CompassOutlined style={{ marginRight: 10 }} />
              Your Tokyo Route
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ fontSize: 16 }}>
              Every tour follows the same iconic pickup-to-drop-off route through Tokyo's car culture landmarks —
              here's what to expect before you book.
            </Typography.Paragraph>
            <Typography.Paragraph>
              <ol style={{ paddingLeft: 20, margin: 0 }}>
                {TOUR_ITINERARY.map((stop) => (
                  <li key={stop.label} style={{ marginBottom: 6 }}>
                    {stop.label}
                  </li>
                ))}
              </ol>
            </Typography.Paragraph>
            <Link to="/tours">
              <Button type="primary">Book This Route</Button>
            </Link>
          </Col>
          <Col xs={24} md={12}>
            <TourItineraryMap />
          </Col>
        </Row>
      </section>

      <section style={{ background: '#f8f8f8', padding: '56px 24px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>
            Plan Your Trip
          </Typography.Title>
          <Row gutter={[24, 24]}>
            {TRIP_INFO.map((info) => (
              <Col xs={24} md={8} key={info.title}>
                <Card style={{ height: '100%', borderRadius: 12 }}>
                  <Typography.Text style={{ color: '#000' }}>{info.icon}</Typography.Text>
                  <Typography.Title level={5} style={{ marginTop: 12, marginBottom: 8 }}>
                    {info.title}
                  </Typography.Title>
                  <Typography.Text type="secondary">{info.description}</Typography.Text>
                  {info.to && (
                    <div style={{ marginTop: 12 }}>
                      <Link to={info.to}>{info.linkLabel} →</Link>
                    </div>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        <Typography.Title level={4} style={{ marginBottom: 16 }}>
          Ready for your own JDM night drive?
        </Typography.Title>
        <Link to="/tours">
          <Button type="primary" size="large" style={{ marginRight: 12 }}>
            Browse Tours
          </Button>
        </Link>
        <Link to="/about">Learn more about our tours</Link>
      </div>
    </>
  );
}
