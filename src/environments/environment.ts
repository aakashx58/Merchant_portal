import { Environment } from './environment.model';

export const environment = {
  production: false,
  apiBaseUrl: '/api',
  mockBackend: true,
  logLevel: 'debug',
  tokenRefreshBufferMs: 30000,
  autoSaveDebounceMs: 1000,
  sessionTimeoutMs: 15 * 60 * 1000,
  maxFileSizeBytes: 5 * 1024 * 1024,
  allowedFileTypes: ['application/pdf', 'image/png', 'image/jpeg'],
} as const satisfies Environment;
