import { HttpRequest } from '@angular/common/http';
import { PermissionEnum } from '../../core/constants/permission.enum';
import { auditLogs, MockUser } from '../mock-db';
import { can, Reply } from '../mock-utils';

export function handleAuditLogs(
  req: HttpRequest<unknown>,
  path: string,
  user: MockUser,
): Reply | null {
  if (path === '/audit-logs' && req.method === 'GET') {
    // Check permission
    if (!can(user, PermissionEnum.dashboard_counts)) {
      return { status: 403, body: { message: 'Forbidden' } };
    }

    const params = req.params;
    const page = Math.max(1, Number(params.get('page') ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(params.get('pageSize') ?? 10)));
    const query = params.get('q')?.toLowerCase();
    const action = params.get('action');
    const actorId = params.get('actorId');
    const severity = params.get('severity');
    const startDate = params.get('startDate');
    const endDate = params.get('endDate');
    const sort = (params.get('sort') ?? 'at') as keyof (typeof auditLogs)[0];
    const dir = params.get('dir') === 'asc' ? 1 : -1;

    let rows = [...auditLogs];

    // Apply filters
    if (query) {
      rows = rows.filter(
        (log) =>
          log.actorName.toLowerCase().includes(query) ||
          log.action.toLowerCase().includes(query) ||
          log.entityName?.toLowerCase().includes(query) ||
          log.entityType.toLowerCase().includes(query),
      );
    }

    if (action) {
      rows = rows.filter((log) => log.action === action);
    }

    if (actorId) {
      rows = rows.filter((log) => log.actorId === actorId);
    }

    if (severity) {
      rows = rows.filter((log) => log.severity === severity);
    }

    if (startDate) {
      const start = new Date(startDate).getTime();
      rows = rows.filter((log) => new Date(log.at).getTime() >= start);
    }

    if (endDate) {
      const end = new Date(endDate).getTime();
      rows = rows.filter((log) => new Date(log.at).getTime() <= end);
    }

    // Sort
    rows.sort((a, b) => {
      const aVal = a[sort]!;
      const bVal = b[sort]!;
      return aVal > bVal ? dir : aVal < bVal ? -dir : 0;
    });

    return {
      status: 200,
      body: {
        items: rows.slice((page - 1) * pageSize, page * pageSize),
        total: rows.length,
        page,
        pageSize,
      },
    };
  }

  return null;
}
