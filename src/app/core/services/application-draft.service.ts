import { HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { handledInline } from '../interceptors/http-error.interceptor';
import { Application, Page } from '../models/application.model';
import { DraftPayload } from './applications.service';
import { ApiService } from '../api/api-service';

@Injectable({ providedIn: 'root' })
export class ApplicationDraftService extends ApiService {
  latestDraft(): Observable<Application | null> {
    const params = {
      status: 'draft',
      mine: true,
      sort: 'updatedAt',
      dir: 'desc',
      page: 1,
      pageSize: 1,
    };
    return this.get<Page<Application>>('/applications', { params, context: handledInline() })
      .pipe(map((page) => page.items[0] ?? null));
  }

  createDraft(): Observable<Application> {
    return this.post<Application>('/applications', {}, { context: handledInline() });
  }

  saveDraft(id: string, version: number, draft: DraftPayload): Observable<Application> {
    const headers = new HttpHeaders({ 'If-Match': `"${version}"` });
    return this.put<Application>(`/applications/${id}`, draft, { headers, context: handledInline() });
  }

  submit(id: string): Observable<Application> {
    return this.post<Application>(`/applications/${id}/submit`, {}, { context: handledInline() });
  }

  taxIdAvailable(value: string, excludeId: string | null): Observable<{ available: boolean }> {
    const params = new HttpParams().set('value', value).set('exclude', excludeId ?? '');
    return this.get<{ available: boolean }>('/applications/check-tax-id', { params, context: handledInline() });
  }
}