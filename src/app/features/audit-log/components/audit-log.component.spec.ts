import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AuditLogComponent } from './audit-log.component';
import { AuditLogStore } from '../stores/audit-log.store';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AuditLogComponent', () => {
  let component: AuditLogComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<AuditLogComponent>>;
  let mockStore: {
    entries: () => readonly {
      id: string;
      at: string;
      actorId: string;
      actorName: string;
      actorRole: string;
      action: string;
      severity: string;
      entityType: string;
      entityId: string;
      entityName: string;
      details: Record<string, unknown>;
      ipAddress: string;
      userAgent: string;
    }[];
    total: () => number;
    loading: () => boolean;
    error: () => string | null;
    query: () => {
      page: number;
      pageSize: number;
      q: string;
      action: string;
      actorId: string;
      severity: string;
      startDate: string;
      endDate: string;
      sort: string;
      dir: string;
    };
    actions: readonly string[];
    severities: readonly string[];
    actors: readonly { id: string; name: string; role: string }[];
    entities: readonly string[];
    columns: () => readonly { key: string; header: string; sortable?: boolean }[];
    canViewAuditLog: () => boolean;
    startDate: () => Date | null;
    endDate: () => Date | null;
    setStartDate: ReturnType<typeof vi.fn>;
    setEndDate: ReturnType<typeof vi.fn>;
    search: FormControl;
    load: ReturnType<typeof vi.fn>;
    reload: ReturnType<typeof vi.fn>;
    onSort: ReturnType<typeof vi.fn>;
    onPage: ReturnType<typeof vi.fn>;
    setAction: ReturnType<typeof vi.fn>;
    setSeverity: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
  };

  const mockEntries = [
    {
      id: 'audit-1',
      at: '2024-01-15T10:30:00Z',
      actorId: 'u-admin',
      actorName: 'admin',
      actorRole: 'admin',
      action: 'create_user',
      severity: 'info',
      entityType: 'user',
      entityId: 'user-1',
      entityName: 'New User',
      details: { note: 'User created' },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    },
  ] as const;

  const mockQuery = {
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
  } as const;

  const mockColumns = [
    { key: 'at', header: 'Timestamp', sortable: true },
    { key: 'actorName', header: 'Actor', sortable: true },
    { key: 'actorRole', header: 'Role', sortable: true },
    { key: 'action', header: 'Action', sortable: true },
    { key: 'severity', header: 'Severity', sortable: true },
    { key: 'entityType', header: 'Entity Type', sortable: true },
    { key: 'entityName', header: 'Entity', sortable: true },
    { key: 'ipAddress', header: 'IP Address' },
  ] as const;

  beforeEach(() => {
    mockStore = {
      entries: () => mockEntries,
      total: () => 1,
      loading: () => false,
      error: () => null,
      query: () => mockQuery,
      actions: [
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
      ] as const,
      severities: ['info', 'warning', 'error'] as const,
      actors: [
        { id: 'u-sales', name: 'sales', role: 'sales' },
        { id: 'u-reviewer', name: 'reviewer', role: 'reviewer' },
        { id: 'u-admin', name: 'admin', role: 'admin' },
      ] as const,
      entities: ['application', 'user', 'audit_log'] as const,
      columns: () => mockColumns,
      canViewAuditLog: () => true,
      startDate: () => null,
      endDate: () => null,
      setStartDate: vi.fn(),
      setEndDate: vi.fn(),
      search: new FormControl(''),
      load: vi.fn(),
      reload: vi.fn(),
      onSort: vi.fn(),
      onPage: vi.fn(),
      setAction: vi.fn(),
      setSeverity: vi.fn(),
      patch: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [AuditLogComponent, ReactiveFormsModule],
      providers: [{ provide: AuditLogStore, useValue: mockStore }],
    });

    fixture = TestBed.createComponent(AuditLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should inject AuditLogStore', () => {
    // Access protected store via fixture using unknown cast
    const instance = fixture.componentInstance as unknown as { store: typeof mockStore };
    expect(instance.store).toBe(mockStore);
  });
});
