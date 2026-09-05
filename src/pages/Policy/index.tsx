import { useEffect, useState } from 'react';
import { Typography } from 'antd';
import { PageSpinner } from '@/components/common/PageSpinner';
import { getPolicies } from '@/services/settingsService';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import type { PolicyPage as PolicyPageData } from '@/types/settings';

/** Content is edited from admin Website Settings, not hardcoded here -- see PoliciesTab in
 *  src/pages/admin/Settings. A policy type nobody has written yet is simply omitted (the backend
 *  only returns configured ones), matching how an unset social link hides its icon. */
export default function Policy() {
  const [policies, setPolicies] = useState<PolicyPageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPolicies()
      .then(setPolicies)
      .catch(() => setPolicies([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div style={{ background: '#111', color: '#fff', padding: '64px 24px', textAlign: 'center' }}>
        <Typography.Title level={2} style={{ color: '#fff' }}>
          Store & Website Policies
        </Typography.Title>
        <Typography.Text style={{ color: 'rgba(255,255,255,0.75)' }}>
          Learn about our company, bookings, and website policies below.
        </Typography.Text>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
        {loading ? (
          <PageSpinner />
        ) : policies.length === 0 ? (
          <Typography.Paragraph type="secondary" style={{ textAlign: 'center' }}>
            Content coming soon.
          </Typography.Paragraph>
        ) : (
          policies.map((policy) => (
            <div key={policy.type} style={{ marginBottom: 32 }}>
              <Typography.Title level={4}>{policy.title}</Typography.Title>
              <div className="jdm-rich-text-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(policy.content) }} />
            </div>
          ))
        )}
      </div>
    </>
  );
}
