import { Spin, Typography } from 'antd';

export function PageSpinner({ tip }: { tip?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '100px 0',
      }}
    >
      <Spin size="large" />
      {tip && <Typography.Text type="secondary">{tip}</Typography.Text>}
    </div>
  );
}
