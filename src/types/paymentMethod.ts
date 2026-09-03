export interface PaymentMethod {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentMethodInput {
  name: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface UpdatePaymentMethodInput {
  name?: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}
