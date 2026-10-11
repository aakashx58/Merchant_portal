/* eslint-disable @typescript-eslint/no-explicit-any -- dev-only mock parsing untyped request bodies */
import { HttpInterceptorFn } from '@angular/common/http';
import { expireAccessTokens, mockBackendInterceptor } from './mock-backend.interceptor';
import { mockToggles } from './mock-toggles';

(window as any).mock = { toggles: mockToggles, expireAccessTokens };

export const MOCK_INTERCEPTORS: HttpInterceptorFn[] = [mockBackendInterceptor];
