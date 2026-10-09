export type ApplicationStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type SensitiveField = 'taxId' | 'accountNumber';

export interface Application {
  id: string;
  ownerId: string;
  status: ApplicationStatus;
  version: number;
  businessName: string;
  contactName: string;
  email: string;
  taxId: string;
  accountNumber: string;
  monthlyVolume: number;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
