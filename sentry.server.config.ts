import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Error sampling in production
  sampleRate: 1.0,

  // Enable debug mode in development
  debug: process.env.NODE_ENV !== 'production',

  // Environment
  environment: process.env.NODE_ENV,

  // Don't send personal data
  sendDefaultPii: false,

  // Ignore common noise
  ignoreErrors: [
    'ResizeObserver loop',
    'Non-Error promise rejection captured',
  ],

  // Breadcrumb settings
  maxBreadcrumbs: 50,

  // BeforeSend hook to sanitize errors
  beforeSend(event) {
    // Remove any potential sensitive data from request
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }
    // Don't send stack traces in production
    if (event.exception) {
      for (const exc of event.exception.values || []) {
        exc.stacktrace = undefined;
      }
    }
    return event;
  },
});
