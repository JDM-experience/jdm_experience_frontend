// SUPER_ADMIN/ADMIN only -- enforced server-side.
import { httpClient } from './httpClient';
import type { ApiEnvelope } from '@/types/api';
import type { AuditLog, AuditLogFilter, PaginatedAuditLogs } from '@/types/auditLog';

function toQueryString(filter?: AuditLogFilter): string {
  if (!filter) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function listAuditLogs(filter?: AuditLogFilter): Promise<PaginatedAuditLogs> {
  const res = await httpClient.get<ApiEnvelope<PaginatedAuditLogs>>(`/audit-logs${toQueryString(filter)}`);
  return res.data;
}

export async function getAuditLog(id: number): Promise<AuditLog> {
  const res = await httpClient.get<ApiEnvelope<AuditLog>>(`/audit-logs/${id}`);
  return res.data;
}
