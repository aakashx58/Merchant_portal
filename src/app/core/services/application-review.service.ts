import { HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { handledInline } from '../interceptors/http-error.interceptor';
import { Application, RiskLevel, SensitiveField } from '../models/application.model';
import { ApiService } from '../api/api-service';

@Injectable({ providedIn: 'root' })
export class ApplicationReviewService extends ApiService {
  reveal(id: string, field: SensitiveField): Observable<string> {
    return this.post<{ value: string }>(`/applications/${id}/reveal`, { field })
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
    return this.post<Application>(`/applications/${id}/decision`, { decision, riskLevel, note }, { headers, context: handledInline() });
  }
}