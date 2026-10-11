export const environment = {
  production: true,
  apiBaseUrl: '/api',
  mockBackend: false,
  logLevel: 'error',
  tokenRefreshBufferMs: 30000,
  autoSaveDebounceMs: 1000,
  sessionTimeoutMs: 15 * 60 * 1000,
  maxFileSizeBytes: 5 * 1024 * 1024,
  allowedFileTypes: ['application/pdf', 'image/png', 'image/jpeg'],
};