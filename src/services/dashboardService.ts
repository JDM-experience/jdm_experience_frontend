// Calls the real Node.js backend directly. All sales/revenue/tour-performance aggregation happens
// server-side (see dashboard.service.ts) -- this page never receives raw booking rows, only the
// already-computed summary.
import { httpClient } from './httpClient';
import type { ApiEnvelope } from '@/types/api';
import type { DashboardFilter, DashboardSummary } from '@/types/dashboard';

export async function getDashboardSummary(filter?: DashboardFilter): Promise<DashboardSummary> {
  const params = new URLSearchParams();
  if (filter?.from) params.set('from', filter.from);
  if (filter?.to) params.set('to', filter.to);
  const query = params.toString();
  const res = await httpClient.get<ApiEnvelope<DashboardSummary>>(`/dashboard/summary${query ? `?${query}` : ''}`);
  return res.data;
}
