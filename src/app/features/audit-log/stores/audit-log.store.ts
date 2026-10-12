import { computed, inject, Injectable } from '@angular/core';
import { AuditLogEntry, AuditLogQuery } from '../../../core/models/application.model';
import { AuditLogService } from '../services/audit-log.service';
import { ListStore } from '../../../core/state';

@Injectable({ providedIn: 'root' })
export class AuditLogStore extends ListStore<AuditLogEntry, AuditLogQuery> {
  private readonly api = inject(AuditLogService);

  readonly actions = [
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
  ] as const;
  readonly severities = ['info', 'warning', 'error'] as const;
  readonly actors = [
    { id: 'u-sales', name: 'sales', role: 'sales' },
    { id: 'u-reviewer', name: 'reviewer', role: 'reviewer' },
    { id: 'u-admin', name: 'admin', role: 'admin' },
  ] as const;
  readonly entities = ['application', 'user', 'audit_log'] as const;

  /** Date-picker values: the query keeps ISO strings, the pickers need Date objects. */
  readonly startDate = computed(() => this.dateOf(this.query().startDate));
  readonly endDate = computed(() => this.dateOf(this.query().endDate));

  readonly entries = computed(() => this.data()?.items ?? []);
  readonly total = computed(() => this.data()?.total ?? 0);

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
    super(
      {
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
      },
      { sort: 'at', dir: 'desc' },
      'Failed to load audit log',
    );
    this.load();
  }

  protected fetch(query: AuditLogQuery) {
    return this.api.list(query);
  }

  setStartDate(date: Date | null) {
    this.patch({ startDate: date ? this.startOfDay(date).toISOString() : '' });
  }

  setEndDate(date: Date | null) {
    this.patch({ endDate: date ? this.endOfDay(date).toISOString() : '' });
  }

  setAction(action: string) {
    this.patch({ action });
  }

  setSeverity(severity: string) {
    this.patch({ severity });
  }

  private dateOf(iso: string) {
    return iso ? new Date(iso) : null;
  }

  private startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private endOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  }
}
