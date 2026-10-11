import { HttpRequest } from '@angular/common/http';
import { PermissionEnum } from '../../core/constants/permission.enum';
import { RoleEnum } from '../../core/constants/role.enum';
import { SensitiveField } from '../../core/models/application.model';
import { applications, isMasked, mask, MockUser, revealLog, userName, users } from '../mock-db';
import { can, canEdit, canSee, etag, fail, log, ok, Reply, touch } from '../mock-utils';
import { LoggerService } from '../../core/services/logger.service';

const decisions = new Map<string, Reply>();

export function handleApplicationsItem(
  req: HttpRequest<unknown>,
  path: string,
  user: MockUser,
  logger: LoggerService,
): Reply | null {
  const match = path.match(/^\/applications\/([^/]+)(?:\/(submit|decision|reveal|assignment))?$/);
  if (!match) return null; // Not an item route

  const app = applications.find((application) => application.id === match[1]);
  if (!app) return fail(404, 'Application not found');
  if (!canSee(user, app)) return fail(403, 'Forbidden');

  const body = (req.body ?? {}) as Record<string, any>;

  switch (`${req.method} ${match[2] ?? ''}`) {
    case 'GET ':
      return ok(mask(app), etag(app));

    case 'PUT ': {
      if (!canEdit(user, app)) return fail(403, 'Forbidden');
      if (app.status !== 'draft') return fail(409, 'Only drafts can be edited');
      if (req.headers.get('If-Match') !== `"${app.version}"`)
        return fail(412, 'Draft was changed elsewhere, reload and retry');
      const editable = [
        'businessName',
        'contactName',
        'email',
        'taxId',
        'accountNumber',
        'monthlyVolume',
        'documentType',
        'documentName',
      ] as const;
      for (const k of editable) {
        if (k in body && !(typeof body[k] === 'string' && isMasked(body[k])))
          (app as any)[k] = body[k];
      }
      return touch(app);
    }

    case 'POST submit':
      if (!canEdit(user, app)) return fail(403, 'Forbidden');
      if (app.status !== 'draft') return fail(409, 'Already submitted');
      if (app.taxId && applications.some((application) => application.id !== app.id && application.taxId === app.taxId))
        return fail(409, 'This application conflicts with an existing one');
      app.status = 'submitted';
      log(app, user, 'submitted');
      return touch(app);

    case 'PUT assignment': {
      if (!can(user, PermissionEnum.application_assign)) return fail(403, 'Forbidden');
      if (app.status !== 'submitted')
        return fail(409, 'Only submitted applications can be assigned');
      const assignee = users.find(
        (userItem) => userItem.id === body['assigneeId'] && userItem.roles.includes(RoleEnum.reviewer),
      );
      if (!assignee) return fail(400, 'Choose a valid reviewer');
      app.assigneeId = assignee.id;
      app.assigneeName = userName(assignee.id);
      log(app, user, 'assigned', { note: `Assigned to ${assignee.username}` });
      return touch(app);
    }

    case 'POST decision': {
      if (!can(user, PermissionEnum.application_review)) return fail(403, 'Forbidden');
      if (app.ownerId === user.id) return fail(403, 'You cannot review your own application');
      if (app.assigneeId !== user.id) return fail(403, 'This application is not assigned to you');
      const key = req.headers.get('Idempotency-Key');
      const previous = key && decisions.get(`${app.id}:${key}`);
      if (previous) return previous;
      if (app.status !== 'submitted') return fail(409, 'Not awaiting review');
      if (body['decision'] !== 'approved' && body['decision'] !== 'rejected')
        return fail(400, 'decision must be approved or rejected');
      if (!String(body['note'] ?? '').trim()) return fail(400, 'A note is required');
      if (!['low', 'medium', 'high'].includes(body['riskLevel']))
        return fail(400, 'A risk level is required');
      app.status = body['decision'];
      app.reviewNote = String(body['note']).trim();
      app.riskLevel = body['riskLevel'];
      log(app, user, body['decision'], { riskLevel: body['riskLevel'], note: app.reviewNote });
      const reply = touch(app);
      if (key) decisions.set(`${app.id}:${key}`, reply);
      return reply;
    }

    case 'POST reveal': {
      if (!can(user, PermissionEnum.sensitive_reveal)) return fail(403, 'Forbidden');
      const field = body['field'] as SensitiveField;
      if (field !== 'taxId' && field !== 'accountNumber') return fail(400, 'Unknown field');
      revealLog.push({
        userId: user.id,
        applicationId: app.id,
        field: field,
        at: new Date().toISOString(),
      });
      logger.info('[mock] sensitive reveal', revealLog.at(-1));
      return ok({ field: field, value: app[field] });
    }
  }
  return fail(405, 'Method not allowed');
}

