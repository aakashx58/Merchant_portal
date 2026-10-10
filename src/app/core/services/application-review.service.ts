import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { handledInline } from '../interceptors/http-error.interceptor';
import { Application, RiskLevel, SensitiveField } from '../models/application.model';

@Injectable({ providedIn: 'root' })
export class ApplicationReviewService {
  private readonly http = inject(HttpClient);

  reveal(id: string, field: SensitiveField): Observable<string> {
    return this.http
      .post<{ value: string }>(`/api/applications/${id}/reveal`, { field })
      .pipe(map((res) => res.value));
  }

  decide(
    id: string,
    decision: 'approved' | 'rejected',
    riskLevel: RiskLevel,
    note: string,
    idempotencyKey: string,
  ): Observable<Application> {
    const headers = new HttpHeaders({ 'Idempotency-Key': idempotencyKey });
    return this.http.post<Application>(
      `/api/applications/${id}/decision`,
      { decision, riskLevel, note },
      { headers, context: handledInline() },
    );
  }
}

