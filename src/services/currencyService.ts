import type { ExchangeRate } from '@/types/currency';

// Frankfurter.app is a free, public third-party API (not the future Node backend), so
// this service calls `fetch` directly instead of following the mock/real facade split
// used by src/services/*.ts for tours/bookings/etc.

interface FrankfurterLatestResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

export async function getSupportedCurrencies(): Promise<Record<string, string>> {
  const response = await fetch('https://api.frankfurter.dev/v1/currencies');
  if (!response.ok) {
    throw new Error('Unable to load supported currencies.');
  }
  return (await response.json()) as Record<string, string>;
}

export async function getExchangeRate(from: string, to: string): Promise<ExchangeRate> {
  const url = new URL('https://api.frankfurter.dev/v1/latest');
  url.searchParams.set('from', from);
  url.searchParams.set('to', to);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Unable to load the exchange rate.');
  }

  const body = (await response.json()) as FrankfurterLatestResponse;
  const rate = body.rates[to];
  if (rate === undefined) {
    throw new Error(`No exchange rate is available for ${to}.`);
  }

  return { base: from, target: to, rate, date: body.date };
}
