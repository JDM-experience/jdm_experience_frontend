// Proxied through the real backend (GET /currency/currencies, GET /currency/convert) instead of
// calling Frankfurter.app directly from the browser -- the actual conversion math happens
// server-side (never trusted to React alone), matching the real-backend convention used
// elsewhere in this app.
import { httpClient } from './httpClient';
import type { ApiEnvelope } from '@/types/api';
import type { ExchangeRate } from '@/types/currency';

export async function getSupportedCurrencies(): Promise<Record<string, string>> {
  const res = await httpClient.get<ApiEnvelope<Record<string, string>>>('/currency/currencies');
  return res.data;
}

export async function convertCurrency(from: string, to: string, amount: number): Promise<ExchangeRate> {
  const params = new URLSearchParams({ from, to, amount: String(amount) });
  const res = await httpClient.get<ApiEnvelope<ExchangeRate>>(`/currency/convert?${params.toString()}`);
  return res.data;
}
