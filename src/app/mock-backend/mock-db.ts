import { RoleEnum } from '../core/constants/role.enum';
import { Application, HistoryEntry } from '../core/models/application.model';

export interface MockUser {
  id: string;
  username: string;
  password: string;
  roles: RoleEnum[];
}

export const users: MockUser[] = [
  { id: 'u-sales', username: 'sales', password: 'password', roles: [RoleEnum.sales] },
  { id: 'u-sales2', username: 'sales2', password: 'password', roles: [RoleEnum.sales] },
  { id: 'u-reviewer', username: 'reviewer', password: 'password', roles: [RoleEnum.reviewer] },
  { id: 'u-reviewer2', username: 'reviewer2', password: 'password', roles: [RoleEnum.reviewer] },
  { id: 'u-admin', username: 'admin', password: 'password', roles: [RoleEnum.admin] },
];

const load = (key: string) =>
  new Map<string, string>(JSON.parse(sessionStorage.getItem(key) ?? '[]'));

export const accessTokens = load('mock-access');
export const refreshTokens = load('mock-refresh');

export const saveTokens = () => {
  sessionStorage.setItem('mock-access', JSON.stringify([...accessTokens]));
  sessionStorage.setItem('mock-refresh', JSON.stringify([...refreshTokens]));
};

export const userName = (id: string) =>
  users.find((userItem) => userItem.id === id)?.username ?? id;

export const revealLog: { userId: string; applicationId: string; field: string; at: string }[] = [];

// Audit log entries
export const auditLogs = Array.from({ length: 200 }, (_, i) => {
  const actions = [
    'login',
    'logout',
    'create_application',
    'update_application',
    'submit_application',
    'assign_application',
    'review_application',
    'reveal_sensitive',
    'create_user',
    'update_user',
    'delete_user',
    'change_role',
    'view_application',
    'export_data',
  ];
  const severities = ['info', 'warning', 'error'];
  const actors = [
    { id: 'u-sales', name: 'sales', role: 'sales' },
    { id: 'u-sales2', name: 'sales2', role: 'sales' },
    { id: 'u-reviewer', name: 'reviewer', role: 'reviewer' },
    { id: 'u-reviewer2', name: 'reviewer2', role: 'reviewer' },
    { id: 'u-admin', name: 'admin', role: 'admin' },
  ];
  const entityTypes = ['application', 'user', 'audit_log'];

  const action = actions[Math.floor(Math.random() * actions.length)];
  const actor = actors[Math.floor(Math.random() * actors.length)];
  const severity = severities[Math.floor(Math.random() * severities.length)];
  const entityType = ['application', 'user', 'audit_log'][Math.floor(Math.random() * 3)];
  const entityId = `app-${Math.floor(Math.random() * 36) + 1}`;
  const daysAgo = Math.floor(Math.random() * 30);
  const at = new Date(Date.now() - Math.floor(Math.random() * 30 * 86400000)).toISOString();

  return {
    id: `audit-${i + 1}`,
    at: new Date(Date.now() - i * 86400000 - Math.random() * 86400000).toISOString(),
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: [
      'login',
      'logout',
      'create_application',
      'update_application',
      'submit_application',
      'assign_application',
      'review_application',
      'reveal_sensitive',
    ][Math.floor(Math.random() * 8)],
    severity: ['info', 'warning', 'error'][Math.floor(Math.random() * 3)],
    entityType: ['application', 'user', 'audit_log'][Math.floor(Math.random() * 3)],
    entityId: `app-${Math.floor(Math.random() * 36) + 1}`,
    entityName: `Entity ${Math.floor(Math.random() * 100)}`,
    details: { note: 'Sample audit log entry' },
    ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };
});

const statuses = ['draft', 'submitted', 'approved', 'rejected'] as const;
const names = ['Acme', 'Globex', 'Initech', 'Umbrella', 'Hooli', 'Stark', 'Wayne', 'Wonka'];

const seedHistory = (
  status: Application['status'],
  ownerId: string,
  assigneeId: string | null,
  at: string,
): HistoryEntry[] => {
  const entry = (
    actorId: string,
    action: HistoryEntry['action'],
    extra: Partial<HistoryEntry> = {},
  ): HistoryEntry => ({ at, actorId, actorName: userName(actorId), action, ...extra });

  const history = [entry(ownerId, 'created')];
  if (status === 'draft') return history;
  history.push(entry(ownerId, 'submitted'), entry('u-admin', 'assigned'));
  if (status === 'approved') {
    history.push(entry(assigneeId!, 'approved', { riskLevel: 'low', note: 'Documents verified' }));
  }
  if (status === 'rejected') {
    history.push(entry(assigneeId!, 'rejected', { riskLevel: 'high', note: 'Mismatched details' }));
  }
  return history;
};

export const applications: Application[] = Array.from({ length: 36 }, (_, i) => {
  const at = new Date(Date.now() - i * 86_400_000).toISOString();
  const status = statuses[i % 4];
  const ownerId = i % 3 === 0 ? 'u-sales2' : 'u-sales';
  const assigneeId =
    status === 'draft'
      ? null
      : status === 'submitted' && ((i - 1) / 4) % 2 === 1
        ? 'u-reviewer2'
        : 'u-reviewer';
  return {
    id: `app-${i + 1}`,
    ownerId,
    status,
    version: 1,
    businessName: `${names[i % names.length]} ${Math.floor(i / names.length) + 1} LLC`,
    contactName: `Contact ${i + 1}`,
    email: `contact${i + 1}@example.com`,
    taxId: `${100 + i}-${10 + (i % 80)}-${String(1000 + i * 7).slice(-4)}`,
    accountNumber: String(10_000_000 + i * 12_345),
    monthlyVolume: 5_000 + i * 1_250,
    documentType: i % 4 === 0 ? '' : 'business_license',
    documentName: i % 4 === 0 ? '' : 'license.pdf',
    assigneeId,
    assigneeName: assigneeId && userName(assigneeId),
    riskLevel: status === 'approved' ? 'low' : status === 'rejected' ? 'high' : undefined,
    history: seedHistory(status, ownerId, assigneeId, at),
    createdAt: at,
    updatedAt: at,
  };
});

const last4 = (value: string) => value.slice(-4);

export function mask(application: Application): Application {
  return {
    ...application,
    taxId: `***-**-${last4(application.taxId)}`,
    accountNumber: `****${last4(application.accountNumber)}`,
  };
}

export const isMasked = (value: string) => value.includes('*');
