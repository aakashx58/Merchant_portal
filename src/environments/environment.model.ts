export interface Environment {
  production: boolean;
  apiBaseUrl: string;
  mockBackend: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  tokenRefreshBufferMs: number;
  autoSaveDebounceMs: number;
  sessionTimeoutMs: number;
  maxFileSizeBytes: number;
  allowedFileTypes: string[];
}