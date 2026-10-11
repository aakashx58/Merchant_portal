import { HttpRequest } from '@angular/common/http';
import { PermissionEnum } from '../../core/constants/permission.enum';
import { Application } from '../../core/models/application.model';
import { applications, mask, MockUser } from '../mock-db';
import { can, canSee, etag, fail, log, ok, Reply } from '../mock-utils';

export function handleApplicationsCollection(
  req: HttpRequest<unknown>,
  path: string,
  user: MockUser,
): Reply | null {
  if (path === '/applications' && req.method === 'GET') {
    if (
      !can(user, PermissionEnum.application_view_own) &&
      !can(user, PermissionEnum.application_view_assigned) &&
      !can(user, PermissionEnum.application_view_all)
    )
      return fail(403, 'Forbidden');
    const params = req.params;
    const page = Math.max(1, Number(params.get('page') ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(params.get('pageSize') ?? 10)));
    const status = params.get('status');
    const query = params.get('q')?.toLowerCase();
    const sort = (params.get('sort') ?? 'updatedAt') as keyof Application;
    const dir = params.get('dir') === 'asc' ? 1 : -1;

    const rows = applications
      .filter((application) => canSee(user, application))
      .filter((application) => params.get('mine') !== 'true' || application.ownerId === user.id)
      .filter((application) => !status || application.status === status)
      .filter(
        (application) =>
          !query || application.businessName.toLowerCase().includes(query) || application.contactName.toLowerCase().includes(query),
      )
      .sort((a, b) => (a[sort]! > b[sort]! ? dir : a[sort]! < b[sort]! ? -dir : 0));

    return ok({
      items: rows.slice((page - 1) * pageSize, page * pageSize).map(mask),
      total: rows.length,
      page,
      pageSize,
    });
  }

  if (path === '/applications' && req.method === 'POST') {
    if (!can(user, PermissionEnum.application_create)) return fail(403, 'Forbidden');
    const now = new Date().toISOString();
    const created: Application = {
      id: `app-${applications.length + 1}`,
      ownerId: user.id,
      status: 'draft',
      version: 1,
      businessName: '',
      contactName: '',
      email: '',
      taxId: '',
      accountNumber: '',
      monthlyVolume: 0,
      documentType: '',
      documentName: '',
      assigneeId: null,
      assigneeName: null,
      history: [],
      createdAt: now,
      updatedAt: now,
    };
    log(created, user, 'created');
    applications.push(created);
    return { status: 201, body: mask(created), headers: etag(created) };
  }

  if (path === '/applications/check-tax-id' && req.method === 'GET') {
    const taken = applications.some(
      (application) =>
        canSee(user, application) &&
        application.taxId === req.params.get('value') &&
        application.id !== req.params.get('exclude'),
    );
    return ok({ available: !taken });
  }

  return null;
}

