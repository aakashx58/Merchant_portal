import { HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { handledInline } from '../interceptors/http-error.interceptor';
import { User, Page } from '../models/user.model';
import { ApiService } from '../api/api-service';

export interface UserQuery {
  page: number;
  pageSize: number;
  q: string;
  role: string;
  sort: string;
  dir: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class UserService extends ApiService {
  list(query: UserQuery): Observable<Page<User>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('pageSize', query.pageSize)
      .set('sort', query.sort)
      .set('dir', query.dir);
    if (query.q) params = params.set('q', query.q);
    if (query.role) params = params.set('role', query.role);
    return this.get<Page<User>>('/users', { params, context: handledInline() });
  }

  getById(id: string): Observable<User> {
    return this.get<User>(`/users/${id}`, { context: handledInline() });
  }

  updateRole(id: string, role: string) {
    return this.patch<User>(`/users/${id}/role`, { role }, { context: handledInline() });
  }

  create(user: Partial<User>) {
    return this.post<User>('/users', user, { context: handledInline() });
  }

  remove(id: string) {
    return this.delete<void>(`/users/${id}`, { context: handledInline() });
  }
}