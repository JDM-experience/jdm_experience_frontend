import { useEffect, useState } from 'react';

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function computeCountdown(endAt: string): Countdown {
  const diff = new Date(endAt).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    expired: false,
  };
}

/**
 * Ticks every second off `endAt` -- a server-provided absolute ISO instant (e.g.
 * `tour.limitedOffer.endAt`), comparing it directly against the viewer's own clock. This is
 * timezone-agnostic by construction: both sides of the subtraction are absolute instants, so it
 * never needs to know or trust the viewer's local timezone. The countdown itself is never stored
 * anywhere -- always recomputed from the expiration timestamp on every tick (see the
 * Limited-Time Offer spec's "do not store the countdown" rule). Calls `onExpire` once, the
 * instant it crosses zero, so the caller can hide/refresh the promotion -- this is a UX nicety
 * only; the backend independently re-verifies the offer is still active at booking time.
 */
export function useCountdown(endAt: string | null | undefined, onExpire?: () => void): Countdown | null {
  const [countdown, setCountdown] = useState<Countdown | null>(endAt ? computeCountdown(endAt) : null);

  useEffect(() => {
    if (!endAt) {
      setCountdown(null);
      return;
    }
    setCountdown(computeCountdown(endAt));
    const interval = setInterval(() => {
      setCountdown((prev) => {
        const next = computeCountdown(endAt);
        if (next.expired && !prev?.expired) onExpire?.();
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endAt]);

  return countdown;
}

export function formatCountdown(c: Countdown): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(c.days)} : ${pad(c.hours)} : ${pad(c.minutes)} : ${pad(c.seconds)}`;
}
