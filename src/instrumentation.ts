import * as Sentry from '@sentry/nextjs';

// Server-side instrumentation
// This file is loaded once when the server starts

export function register() {
  // Initialize Sentry for server-side error tracking
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
      environment: 'production',
      sendDefaultPii: false,
    });
  }
}
