import { useEffect, useState } from 'react';
import { Alert, Typography } from 'antd';
import { PageSpinner } from '@/components/common/PageSpinner';
import { getPolicies } from '@/services/settingsService';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import { getErrorMessage } from '@/utils/errors';
import type { PolicyPage as PolicyPageData, PolicyType } from '@/types/settings';

const DOCUMENT_LABELS: Record<'TERMS' | 'PRIVACY', string> = {
  TERMS: 'Terms and Conditions',
  PRIVACY: 'Privacy Policy',
};

export default function PolicyDocument({ type }: { type: Extract<PolicyType, 'TERMS' | 'PRIVACY'> }) {
  const [policy, setPolicy] = useState<PolicyPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPolicies()
      .then((pages) => {
        if (!cancelled) setPolicy(pages.find((page) => page.type === type) ?? null);
      })
      .catch((reason) => {
        if (!cancelled) setError(getErrorMessage(reason, 'Unable to load this policy.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [type]);

  return (
    <>
      <div style={{ background: '#1C2333', borderBottom: '1px solid #303849', color: '#fff', padding: '48px 24px', textAlign: 'center' }}>
        <Typography.Title level={2} style={{ color: '#fff' }}>
          {policy?.title ?? DOCUMENT_LABELS[type]}
        </Typography.Title>
        {policy && (
          <Typography.Text style={{ color: 'rgba(255,255,255,0.75)' }}>
            Version {policy.version}
            {policy.effectiveAt ? ` · Effective ${new Date(policy.effectiveAt).toLocaleDateString()}` : ''}
          </Typography.Text>
        )}
      </div>
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        {loading ? (
          <PageSpinner />
        ) : error ? (
          <Alert type="error" showIcon message={error} />
        ) : !policy ? (
          <Alert
            type="info"
            showIcon
            message={`${DOCUMENT_LABELS[type]} has not been published yet.`}
            description="Please contact JDM Experience for more information."
          />
        ) : (
          <div className="jdm-rich-text-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(policy.content) }} />
        )}
      </main>
    </>
  );
}
