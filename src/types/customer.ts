import type { User } from '@/types/user';

/** A CUSTOMER-role User merged with their optional travel profile (mirrors the real backend's
 *  toCustomerProfile() in customer.service.ts — GET/PUT /api/customers). Profile fields come back
 *  null until they've ever been edited (there may be no Customer row yet). */
export interface Customer extends User {
  phone: string | null;
  nationality: string | null;
  passportNumber: string | null;
  licenseNumber: string | null;
  licenseCountry: string | null;
  notes: string | null;
}

export interface UpdateCustomerProfileInput {
  phone?: string;
  nationality?: string;
  passportNumber?: string;
  licenseNumber?: string;
  licenseCountry?: string;
  notes?: string;
}
