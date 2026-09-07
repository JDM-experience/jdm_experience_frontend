import { Typography } from 'antd';
import { formatCountdown, useCountdown } from '@/hooks/useCountdown';

interface LimitedOfferTimerProps {
  endAt: string;
  onExpire?: () => void;
  size?: 'small' | 'default';
}

/** DD : HH : MM : SS, ticking from the server-provided `endAt` instant. Renders nothing once the
 *  countdown reaches zero -- the caller (TourCard/LimitedOfferCard/TourDetail) is expected to stop
 *  showing the offer as active at that point too, per the Limited-Time Offer spec. */
export function LimitedOfferTimer({ endAt, onExpire, size = 'default' }: LimitedOfferTimerProps) {
  const countdown = useCountdown(endAt, onExpire);
  if (!countdown || countdown.expired) return null;

  return (
    <div>
      <Typography.Text
        type="secondary"
        style={{ fontSize: size === 'small' ? 10 : 11, display: 'block', letterSpacing: 1, textTransform: 'uppercase' }}
      >
        Offer Ends In
      </Typography.Text>
      <Typography.Text strong style={{ fontFamily: 'monospace', fontSize: size === 'small' ? 14 : 18 }}>
        {formatCountdown(countdown)}
      </Typography.Text>
    </div>
  );
}
