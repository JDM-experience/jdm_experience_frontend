import { Link } from 'react-router-dom';
import { Layout, Typography } from 'antd';

const { Text } = Typography;

export function Footer() {
  return (
    <Layout.Footer style={{ background: '#111', color: '#fff', padding: '32px 24px' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: 24,
          maxWidth: 1140,
          margin: '0 auto',
        }}
      >
        <div style={{ maxWidth: 480 }}>
          <Typography.Title level={5} style={{ color: '#fff', marginTop: 0 }}>
            Japan JDM Experience
          </Typography.Title>
          <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
            Guided JDM tours with simple date-based reservations and clear availability, from Daikoku PA
            meetups to Tokyo night drives.
          </Text>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <Link to="/about" style={{ color: '#fff' }}>
            About
          </Link>
          <Link to="/contact" style={{ color: '#fff' }}>
            Contact
          </Link>
          <Link to="/policy" style={{ color: '#fff' }}>
            Policies
          </Link>
        </div>
      </div>
    </Layout.Footer>
  );
}
