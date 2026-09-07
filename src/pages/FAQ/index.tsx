import { useEffect, useState } from 'react';
import { Collapse, Typography } from 'antd';
import { PageSpinner } from '@/components/common/PageSpinner';
import { getFaqs } from '@/services/settingsService';
import type { Faq } from '@/types/settings';

/** Content is edited from admin Website Settings > FAQs, not hardcoded here -- see FaqTab in
 *  src/pages/admin/Settings. An unpublished FAQ is simply omitted (the backend only returns
 *  published ones), matching how an unset social link hides its icon or an empty policy is
 *  omitted from the Policy page. */
export default function FAQ() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFaqs()
      .then(setFaqs)
      .catch(() => setFaqs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div style={{ background: '#1C2333', borderBottom: '1px solid #303849', color: '#fff', padding: '64px 24px', textAlign: 'center' }}>
        <Typography.Title level={2} style={{ color: '#fff' }}>
          Frequently Asked Questions
        </Typography.Title>
        <Typography.Text style={{ color: 'rgba(255,255,255,0.75)' }}>
          Answers to common questions about booking and joining a tour.
        </Typography.Text>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
        {loading ? (
          <PageSpinner />
        ) : faqs.length === 0 ? (
          <Typography.Paragraph type="secondary" style={{ textAlign: 'center' }}>
            No FAQs published yet.
          </Typography.Paragraph>
        ) : (
          <Collapse
            defaultActiveKey={[faqs[0]?.id]}
            items={faqs.map((faq) => ({
              key: faq.id,
              label: <Typography.Text strong>{faq.question}</Typography.Text>,
              children: <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>{faq.answer}</Typography.Paragraph>,
            }))}
          />
        )}
      </div>
    </>
  );
}
