export interface Merchant {
  id: string;
  name: string;
  contactEmail?: string;
  isActive: boolean;
  apiKey?: string; // Should only be visible on creation or explicit regeneration
  apiSecret?: string; // Should only be visible on creation or explicit regeneration
  createdAt: string;
  updatedAt: string;
}

export interface CreateMerchantDto extends Partial<Merchant> {
  name: string;
}

export interface UpdateMerchantDto extends Partial<Merchant> {}