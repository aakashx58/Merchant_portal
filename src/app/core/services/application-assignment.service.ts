import { HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { handledInline } from '../interceptors/http-error.interceptor';
import { Application } from '../models/application.model';
import { ApiService } from '../api/api-service';

@Injectable({ providedIn: 'root' })
export class ApplicationAssignmentService extends ApiService {
  reviewers(): Observable<{ id: string; username: string }[]> {
    const params = new HttpParams().set('role', 'reviewer');
    return this.get<{ id: string; username: string }[]>('/users', { params });
  }

  assign(id: string, assigneeId: string): Observable<Application> {
    return this.put<Application>(`/applications/${id}/assignment`, { assigneeId }, { context: handledInline() });
  }
}