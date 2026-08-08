import { Link } from 'react-router-dom';
import { Button, Col, Row, Typography } from 'antd';

export default function About() {
  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '64px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', marginBottom: 48 }}>
        <Typography.Title level={2}>About Our Tours</Typography.Title>
        <Typography.Paragraph style={{ fontSize: 18 }}>
          Welcome to Japan JDM Experience, where we offer private Tokyo night drives that immerse you in Japan&apos;s
          legendary car culture.
        </Typography.Paragraph>
      </div>

      <Row gutter={[40, 32]} align="middle" style={{ marginBottom: 48 }}>
        <Col xs={24} md={12}>
          <img src="/images/itinerary.png" alt="Tour fleet" style={{ width: '100%', maxHeight: 480, objectFit: 'contain', borderRadius: 8 }} />
        </Col>
        <Col xs={24} md={12}>
          <Typography.Title level={3}>Our Mission</Typography.Title>
          <Typography.Paragraph>
            Ride in iconic JDM cars like the Nissan GT-R R35 and Nissan Skyline ER34 as we take you to famous
            automotive destinations including Daikoku PA, A-PIT AUTOBACS, Rainbow Bridge, Tokyo Tower, and Shibuya
            Crossing.
            <br />
            <br />
            Whether you&apos;re a dedicated JDM enthusiast or simply looking for a unique Tokyo adventure, our goal is
            to provide a safe, personalized, and unforgettable experience filled with incredible cars, stunning city
            views, and lasting memories.
          </Typography.Paragraph>
          <Link to="/tours">
            <Button type="primary">Browse Tours</Button>
          </Link>
        </Col>
      </Row>

      <Row gutter={[40, 32]} align="middle">
        <Col xs={24} md={{ span: 12, order: 2 }}>
          <img src="/images/Parkinglot.JPG" alt="Tour support team" style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 8 }} />
        </Col>
        <Col xs={24} md={{ span: 12, order: 1 }}>
          <Typography.Title level={3}>Contact Us</Typography.Title>
          <Typography.Paragraph>
            Experience Tokyo.
            <br />
            Experience JDM.
            <br />
            Experience the Legend.
          </Typography.Paragraph>
          <Link to="/contact">
            <Button>Contact Us</Button>
          </Link>
        </Col>
      </Row>
    </div>
  );
}
