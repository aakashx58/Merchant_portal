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

export type AuditAction = 
  | 'login' 
  | 'logout' 
  | 'create_application' 
  | 'update_application' 
  | 'submit_application' 
  | 'assign_application' 
  | 'review_application' 
  | 'reveal_sensitive' 
  | 'create_user' 
  | 'update_user' 
  | 'delete_user' 
  | 'change_role'
  | 'view_application' 
  | 'export_data';

export type AuditSeverity = 'info' | 'warning' | 'error';

export interface AuditLogEntry {
  id: string;
  at: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: AuditAction;
  severity: AuditSeverity;
  entityType: string;
  entityId?: string;
  entityName?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogQuery {
  page: number;
  pageSize: number;
  q: string;
  action: string;
  actorId: string;
  severity: string;
  startDate: string;
  endDate: string;
  sort: string;
  dir: 'asc' | 'desc';
}
