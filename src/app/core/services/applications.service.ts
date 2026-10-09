import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { handledInline } from '../interceptors/http-error.interceptor';
import { Application, ApplicationStatus, Page } from '../models/application.model';

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
export class ApplicationsService {
  private readonly http = inject(HttpClient);

  list(query: ApplicationQuery): Observable<Page<Application>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('pageSize', query.pageSize)
      .set('sort', query.sort)
      .set('dir', query.dir);
    if (query.status) params = params.set('status', query.status);
    if (query.q) params = params.set('q', query.q);
    return this.http.get<Page<Application>>('/api/applications', {
      params,
      context: handledInline(),
    });
  }

  latestDraft(): Observable<Application | null> {
    const params = {
      status: 'draft',
      mine: true,
      sort: 'updatedAt',
      dir: 'desc',
      page: 1,
      pageSize: 1,
    };
    return this.http
      .get<Page<Application>>('/api/applications', { params, context: handledInline() })
      .pipe(map((page) => page.items[0] ?? null));
  }

  createDraft(): Observable<Application> {
    return this.http.post<Application>('/api/applications', {}, { context: handledInline() });
  }

  saveDraft(id: string, version: number, draft: DraftPayload): Observable<Application> {
    const headers = new HttpHeaders({ 'If-Match': `"${version}"` });
    return this.http.put<Application>(`/api/applications/${id}`, draft, {
      headers,
      context: handledInline(),
    });
  }

  submit(id: string): Observable<Application> {
    return this.http.post<Application>(
      `/api/applications/${id}/submit`,
      {},
      { context: handledInline() },
    );
  }

  taxIdAvailable(value: string, excludeId: string | null): Observable<{ available: boolean }> {
    const params = new HttpParams().set('value', value).set('exclude', excludeId ?? '');
    return this.http.get<{ available: boolean }>('/api/applications/check-tax-id', {
      params,
      context: handledInline(),
    });
  }
}
