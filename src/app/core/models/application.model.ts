export type ApplicationStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type RiskLevel = 'low' | 'medium' | 'high';
export type SensitiveField = 'taxId' | 'accountNumber';

export interface HistoryEntry {
  at: string;
  actorId: string;
  actorName: string;
  action: 'created' | 'submitted' | 'assigned' | 'approved' | 'rejected';
  riskLevel?: RiskLevel;
  note?: string;
}

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
  documentType: string;
  documentName: string;
  assigneeId: string | null;
  assigneeName: string | null;
  riskLevel?: RiskLevel;
  reviewNote?: string;
  history: HistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
