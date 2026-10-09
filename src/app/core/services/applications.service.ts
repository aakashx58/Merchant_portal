import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Application, ApplicationStatus, Page } from '../models/application.model';

export interface ApplicationQuery {
  page: number;
  pageSize: number;
  status: ApplicationStatus | '';
  q: string;
  sort: string;
  dir: 'asc' | 'desc';
}

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
    return this.http.get<Page<Application>>('/api/applications', { params });
  }
}
