import { RoleEnum } from '../enums/role.enum';
import { Application, HistoryEntry } from '../models/application.model';

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

export const userName = (id: string) => users.find((u) => u.id === id)?.username ?? id;

export const revealLog: { userId: string; applicationId: string; field: string; at: string }[] = [];

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

const last4 = (v: string) => v.slice(-4);

export function mask(a: Application): Application {
  return {
    ...a,
    taxId: `***-**-${last4(a.taxId)}`,
    accountNumber: `****${last4(a.accountNumber)}`,
  };
}

export const isMasked = (v: string) => v.includes('*');
