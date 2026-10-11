import { HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { handledInline } from '../interceptors/http-error.interceptor';
import { AuditLogEntry, AuditLogQuery, Page } from '../models/application.model';
import { ApiService } from '../api/api-service';

@Injectable({ providedIn: 'root' })
export class AuditLogService extends ApiService {
  list(query: AuditLogQuery): Observable<Page<any>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('pageSize', query.pageSize)
      .set('sort', query.sort)
      .set('dir', query.dir);
    if (query.q) params = params.set('q', query.q);
    if (query.action) params = params.set('action', query.action);
    if (query.actorId) params = params.set('actorId', query.actorId);
    if (query.severity) params = params.set('severity', query.severity);
    if (query.startDate) params = params.set('startDate', query.startDate);
    if (query.endDate) params = params.set('endDate', query.endDate);
    return this.get<any>('/audit-logs', { params, context: handledInline() });
  }
}