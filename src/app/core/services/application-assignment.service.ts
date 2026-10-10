import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { handledInline } from '../interceptors/http-error.interceptor';
import { Application } from '../models/application.model';

@Injectable({ providedIn: 'root' })
export class ApplicationAssignmentService {
  private readonly http = inject(HttpClient);

  reviewers(): Observable<{ id: string; username: string }[]> {
    const params = new HttpParams().set('role', 'reviewer');
    return this.http.get<{ id: string; username: string }[]>('/api/users', { params });
  }

  assign(id: string, assigneeId: string): Observable<Application> {
    return this.http.put<Application>(
      `/api/applications/${id}/assignment`,
      { assigneeId },
      { context: handledInline() },
    );
  }
}

