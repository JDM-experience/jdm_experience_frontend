import dayjs from 'dayjs';
import { CURRENCY_SYMBOL } from '@/constants';

export function formatCurrency(amount: number): string {
  return `${CURRENCY_SYMBOL}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDateTime(isoLike: string): string {
  const parsed = dayjs(isoLike);
  return parsed.isValid() ? parsed.format('MMMM D, YYYY, h:mm A') : isoLike;
}
