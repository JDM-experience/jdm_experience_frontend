import type { UserRole } from './user';

export interface AuditLog {
  id: number;
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
  role: UserRole | null;
  action: string;
  entity: string;
  entityId: number | null;
  metadata: unknown;
  createdAt: string;
}

export interface AuditLogFilter {
  userId?: number;
  role?: UserRole;
  action?: string;
  entity?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedAuditLogs {
  items: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
}
