import { HttpClient, HttpContext, HttpContextToken, HttpErrorResponse, HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError, timeout, timer } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RetryConfig {
  maxRetries: number;
  retryDelayMs: number;
  retryableStatuses: number[];
}

export interface TimeoutConfig {
  timeoutMs: number;
}

export const RETRY_CONFIG = new HttpContextToken<RetryConfig>(() => ({
  maxRetries: 3,
  retryDelayMs: 1000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
}));

export const TIMEOUT_CONFIG = new HttpContextToken<TimeoutConfig>(() => ({
  timeoutMs: 30000,
}));

export const SKIP_ERROR_HANDLING = new HttpContextToken<boolean>(() => false);

export function withRetry(config: Partial<RetryConfig> = {}) {
  return new HttpContext().set(RETRY_CONFIG, { ...RETRY_CONFIG.defaultValue, ...config });
}

export function withTimeout(config: Partial<TimeoutConfig> = {}) {
  return new HttpContext().set(TIMEOUT_CONFIG, { ...TIMEOUT_CONFIG.defaultValue, ...config });
}

export function skipErrorHandling() {
  return new HttpContext().set(SKIP_ERROR_HANDLING, true);
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  protected readonly http = inject(HttpClient);
  protected readonly baseUrl = environment.apiBaseUrl;

  protected get<T>(endpoint: string, options: {
    params?: HttpParams | Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>;
    headers?: HttpHeaders | Record<string, string>;
    context?: HttpContext;
  } = {}): Observable<T> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  protected post<T>(endpoint: string, body: unknown, options: {
    params?: HttpParams | Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>;
    headers?: HttpHeaders | Record<string, string>;
    context?: HttpContext;
  } = {}): Observable<T> {
    return this.request<T>('POST', endpoint, body, options);
  }

  protected put<T>(endpoint: string, body: unknown, options: {
    params?: HttpParams | Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>;
    headers?: HttpHeaders | Record<string, string>;
    context?: HttpContext;
  } = {}): Observable<T> {
    return this.request<T>('PUT', endpoint, body, options);
  }

  protected patch<T>(endpoint: string, body: unknown, options: {
    params?: HttpParams | Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>;
    headers?: HttpHeaders | Record<string, string>;
    context?: HttpContext;
  } = {}): Observable<T> {
    return this.request<T>('PATCH', endpoint, body, options);
  }

  protected delete<T>(endpoint: string, options: {
    params?: HttpParams | Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>;
    headers?: HttpHeaders | Record<string, string>;
    context?: HttpContext;
  } = {}): Observable<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  protected request<T>(
    method: string,
    endpoint: string,
    body: unknown | undefined,
    options: {
      params?: HttpParams | Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>;
      headers?: HttpHeaders | Record<string, string>;
      context?: HttpContext;
    } = {}
  ): Observable<T> {
    const { params, headers, context = new HttpContext() } = options;

    let httpParams = params instanceof HttpParams ? params : new HttpParams({ fromObject: params as any });
    let httpHeaders = headers instanceof HttpHeaders ? headers : new HttpHeaders(headers);

    const url = `${this.baseUrl}${endpoint}`;

    const request = this.http.request<T>(method, url, {
      body,
      params: httpParams,
      headers: httpHeaders,
      context,
    });

    return this.applyRetryAndTimeout(request, context);
  }

  private applyRetryAndTimeout<T>(source: Observable<T>, context: HttpContext): Observable<T> {
    const timeoutConfig = context.get(TIMEOUT_CONFIG);
    const retryConfig = context.get(RETRY_CONFIG);
    const skipErrorHandling = context.get(SKIP_ERROR_HANDLING);

    let observable = source;

    if (timeoutConfig.timeoutMs > 0) {
      observable = observable.pipe(timeout(timeoutConfig.timeoutMs));
    }

    if (retryConfig.maxRetries > 0) {
      observable = observable.pipe(
        retry({
          count: retryConfig.maxRetries,
          delay: (error, retryCount) => {
            if (error instanceof HttpErrorResponse && retryConfig.retryableStatuses.includes(error.status)) {
              return timer(retryConfig.retryDelayMs * retryCount);
            }
            return throwError(() => error);
          },
        })
      );
    }

    if (!skipErrorHandling) {
      observable = observable.pipe(
        catchError((error: HttpErrorResponse) => {
          return throwError(() => error);
        })
      );
    }

    return observable;
  }

  protected buildParams(params: Record<string, string | number | boolean | ReadonlyArray<string | number | boolean> | undefined>): HttpParams {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => httpParams = httpParams.append(key, String(v)));
        } else {
          httpParams = httpParams.set(key, String(value));
        }
      }
    }
    return httpParams;
  }
}