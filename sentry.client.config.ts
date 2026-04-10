import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Error sampling in production
  sampleRate: 1.0,

  // Enable debug mode in development
  debug: process.env.NODE_ENV !== 'production',

  // Replay errors in production
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Environment
  environment: process.env.NODE_ENV,

  // Don't send personal data
  sendDefaultPii: false,

  // Ignore common noise
  ignoreErrors: [
    'ResizeObserver loop',
    'Non-Error promise rejection captured',
    'Hydration mismatch',
  ],

  // Breadcrumb settings
  maxBreadcrumbs: 50,

  // BeforeSend hook to sanitize errors
  beforeSend(event) {
    // Remove any potential sensitive data
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }
    return event;
  },
});
