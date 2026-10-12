import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { handledInline } from '../interceptors/http-error.interceptor';
import { Application, ApplicationStatus, Page, StatusCounts } from '../models/application.model';
import { ApiService } from '../api/api.service';

export interface ApplicationQuery {
  page: number;
  pageSize: number;
  status: ApplicationStatus | '';
  q: string;
  sort: string;
  dir: 'asc' | 'desc';
}

export type DraftPayload = Pick<
  Application,
  | 'businessName'
  | 'contactName'
  | 'email'
  | 'taxId'
  | 'accountNumber'
  | 'monthlyVolume'
  | 'documentType'
  | 'documentName'
>;

@Injectable({ providedIn: 'root' })
export class ApplicationsService extends ApiService {
  list(query: ApplicationQuery): Observable<Page<Application>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('pageSize', query.pageSize)
      .set('sort', query.sort)
      .set('dir', query.dir);
    if (query.status) params = params.set('status', query.status);
    if (query.q) params = params.set('q', query.q);
    return this.get<Page<Application>>('/applications', { params, context: handledInline() });
  }

  counts(): Observable<StatusCounts> {
    return this.get<StatusCounts>('/applications/counts', { context: handledInline() });
  }

  getById(id: string): Observable<Application> {
    return this.get<Application>(`/applications/${id}`, { context: handledInline() });
  }
}
