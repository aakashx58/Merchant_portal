import { Injectable, signal, computed, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { AuditLogQuery } from '../../../core/models/application.model';
import { DestroyRef } from '@angular/core';

function getRandomElement<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

@Injectable({ providedIn: 'root' })
export class AuditLogStore {
  private readonly destroyRef = inject(DestroyRef);

  readonly search = new FormControl('', { nonNullable: true });
  readonly actions = ['login', 'logout', 'create_application', 'update_application', 'submit_application', 'assign_application', 'review_application', 'reveal_sensitive', 'create_user', 'update_user', 'delete_user', 'change_role', 'view_application', 'export_data'] as const;
  readonly severities = ['info', 'warning', 'error'] as const;
  readonly actors = [
    { id: 'u-sales', name: 'sales', role: 'sales' },
    { id: 'u-reviewer', name: 'reviewer', role: 'reviewer' },
    { id: 'u-admin', name: 'admin', role: 'admin' },
  ] as const;
  readonly entities = ['application', 'user', 'audit_log'] as const;

  readonly query = signal<AuditLogQuery>({
    page: 1,
    pageSize: 10,
    q: '',
    action: '',
    actorId: '',
    severity: '',
    startDate: '',
    endDate: '',
    sort: 'at',
    dir: 'desc',
  });

  readonly entries = signal<Record<string, unknown>[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly canViewAuditLog = computed(() => true); // Will be refined based on permissions

  readonly columns = computed(() => [
    { key: 'at', header: 'Timestamp', sortable: true },
    { key: 'actorName', header: 'Actor', sortable: true },
    { key: 'actorRole', header: 'Role', sortable: true },
    { key: 'action', header: 'Action', sortable: true },
    { key: 'severity', header: 'Severity', sortable: true },
    { key: 'entityType', header: 'Entity Type', sortable: true },
    { key: 'entityName', header: 'Entity', sortable: true },
    { key: 'ipAddress', header: 'IP Address' },
  ]);

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);

    // Mock data for now
    setTimeout(() => {
      const mockEntries = this.generateMockEntries();
      this.entries.set(mockEntries);
      this.total.set(mockEntries.length);
      this.loading.set(false);
    }, 300);
  }

  reload() {
    this.load();
  }

  patch(partial: Partial<AuditLogQuery>) {
    this.query.update(q => ({ ...q, ...partial, page: partial.page ?? 1 }));
  }

  setAction(action: string) {
    this.patch({ action, page: 1 });
  }

  setSeverity(severity: string) {
    this.patch({ severity, page: 1 });
  }

  onSort({ sort, dir }: { sort: string; dir: 'asc' | 'desc' | '' }) {
    this.patch({ sort, dir: dir || 'desc', page: 1 });
  }

  onPage({ page, pageSize }: { page: number; pageSize: number }) {
    this.patch({ page, pageSize });
  }

  private generateMockEntries() {
    return Array.from({ length: 50 }, () => {
      const action = getRandomElement(this.actions);
      const actor = getRandomElement(this.actors);
      const severity = getRandomElement(this.severities);
      const entityType = getRandomElement(this.entities);
      const entityId = `app-${Math.floor(Math.random() * 36) + 1}`;
      const daysAgo = Math.floor(Math.random() * 30);

      return {
        id: `audit-${Date.now()}-${Math.random()}`,
        at: new Date(Date.now() - daysAgo * 86400000).toISOString(),
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action,
        severity,
        entityType,
        entityId,
        entityName: `Entity ${Math.floor(Math.random() * 100)}`,
        details: { note: 'Sample audit log entry' },
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      };
    });
  }
}