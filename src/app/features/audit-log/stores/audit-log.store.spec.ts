import { TestBed } from '@angular/core/testing';
import { AuditLogStore } from './audit-log.store';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

interface MockPage {
  items: readonly {
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
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

describe('AuditLogStore', () => {
  let store: AuditLogStore;
  let mockAuditLogService: { list: ReturnType<typeof vi.fn> };

  const mockPage: MockPage = {
    items: [
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
      {
        id: 'audit-2',
        at: '2024-01-15T09:15:00Z',
        actorId: 'u-sales',
        actorName: 'sales',
        actorRole: 'sales',
        action: 'create_application',
        severity: 'info',
        entityType: 'application',
        entityId: 'app-1',
        entityName: 'Application 1',
        details: { note: 'Application created' },
        ipAddress: '192.168.1.2',
        userAgent: 'Mozilla/5.0',
      },
    ],
    total: 2,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  };

  beforeEach(() => {
    mockAuditLogService = {
      list: vi.fn().mockReturnValue(of(mockPage)),
    };

    TestBed.configureTestingModule({
      providers: [
        AuditLogStore,
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    });

    store = TestBed.inject(AuditLogStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should initialize with default query values', () => {
    expect(store.query()).toEqual({
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
  });

  it('should have predefined actions, severities, actors, and entities', () => {
    expect(store.actions.length).toBeGreaterThan(0);
    expect(store.severities.length).toBe(3);
    expect(store.actors.length).toBe(3);
    expect(store.entities.length).toBe(3);
  });

  it('should have canViewAuditLog computed as true', () => {
    expect(store.canViewAuditLog()).toBeTruthy();
  });

  it('should have columns defined', () => {
    const columns = store.columns();
    expect(columns.length).toBe(8);
    expect(columns[0].key).toBe('at');
    expect(columns[0].header).toBe('Timestamp');
    expect(columns[1].key).toBe('actorName');
    expect(columns[1].header).toBe('Actor');
  });

  describe('patch', () => {
    it('should update query with partial values', () => {
      store.patch({ action: 'create_user', page: 1 });
      const query = store.query();
      expect(query.action).toBe('create_user');
      expect(query.page).toBe(1);
      expect(query.pageSize).toBe(10);
    });

    it('should reset page to 1 when not provided', () => {
      store.query.set({ ...store.query(), page: 5 });
      store.patch({ action: 'login' });
      expect(store.query().page).toBe(1);
    });
  });

  describe('setAction', () => {
    it('should update action and reset page', () => {
      store.query.set({ ...store.query(), page: 3 });
      store.setAction('create_user');
      expect(store.query().action).toBe('create_user');
      expect(store.query().page).toBe(1);
    });
  });

  describe('setSeverity', () => {
    it('should update severity and reset page', () => {
      store.query.set({ ...store.query(), page: 3 });
      store.setSeverity('warning');
      expect(store.query().severity).toBe('warning');
      expect(store.query().page).toBe(1);
    });
  });

  describe('onSort', () => {
    it('should update sort, dir and reset page', () => {
      store.onSort({ sort: 'actorName', dir: 'asc' });
      expect(store.query().sort).toBe('actorName');
      expect(store.query().dir).toBe('asc');
      expect(store.query().page).toBe(1);
    });

    it('should default dir to desc when empty', () => {
      store.onSort({ sort: 'at', dir: '' });
      expect(store.query().sort).toBe('at');
      expect(store.query().dir).toBe('desc');
    });
  });

  describe('onPage', () => {
    it('should update page and pageSize', () => {
      store.onPage({ page: 2, pageSize: 25 });
      expect(store.query().page).toBe(2);
      expect(store.query().pageSize).toBe(25);
    });
  });

  describe('filter constants', () => {
    it('should have correct action list', () => {
      const expectedActions = [
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
      expect(store.actions).toEqual(expectedActions);
    });

    it('should have correct severity list', () => {
      expect(store.severities).toEqual(['info', 'warning', 'error']);
    });

    it('should have correct actor list', () => {
      expect(store.actors.map(a => a.name)).toEqual(['sales', 'reviewer', 'admin']);
    });

    it('should have correct entity list', () => {
      expect(store.entities).toEqual(['application', 'user', 'audit_log']);
    });
  });
});