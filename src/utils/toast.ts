'use client';
import { toast } from 'sonner';

// Toast convenience functions
export const toastSuccess = (message: string) => toast.success(message, {
  duration: 4000,
  className: 'toast-success',
});

export const toastError = (message: string) => toast.error(message, {
  duration: 5000,
  className: 'toast-error',
});

export const toastWarning = (message: string) => toast.warning(message, {
  duration: 4000,
  className: 'toast-warning',
});

export const toastInfo = (message: string) => toast.info(message, {
  duration: 3000,
  className: 'toast-info',
});

export const toastPromise = <T>(
  promise: Promise<T>,
  messages: { loading: string; success: string; error: string }
) => toast.promise(promise, {
  loading: messages.loading,
  success: messages.success,
  error: messages.error,
});
