import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Typography } from 'antd';
import { PageSpinner } from '@/components/common/PageSpinner';
import { getAboutContent } from '@/services/settingsService';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import type { AboutContent } from '@/types/settings';

/** Content is edited from admin Website Settings, not hardcoded here -- see AboutUsTab in
 *  src/pages/admin/Settings. */
export default function About() {
  const [about, setAbout] = useState<AboutContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAboutContent()
      .then(setAbout)
      .catch(() => setAbout(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: '64px 24px' }}>
      <Typography.Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
        {about?.title ?? 'About Us'}
      </Typography.Title>

      {about?.content ? (
        <div className="jdm-rich-text-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(about.content) }} />
      ) : (
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center' }}>
          Content coming soon.
        </Typography.Paragraph>
      )}

      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <Link to="/tours">
          <Button type="primary" style={{ marginRight: 12 }}>
            Browse Tours
          </Button>
        </Link>
        <Link to="/contact">
          <Button>Contact Us</Button>
        </Link>
      </div>
    </div>
  );
}
