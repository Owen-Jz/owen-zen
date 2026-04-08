'use client';

import { useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  error?: Error | null;
}

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'An error occurred while loading this content.',
  onRetry,
  error
}: ErrorStateProps) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry) return;
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center p-8 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <AlertCircle size={24} className="text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-200 mb-2">{title}</h3>
      {message && (
        <p className="text-sm text-gray-500 max-w-sm mb-4">{message}</p>
      )}
      {error && (
        <p className="text-xs text-gray-600 font-mono mb-4 max-w-md">
          {error.message}
        </p>
      )}
      {onRetry && (
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl font-medium hover:bg-surface-hover transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={isRetrying ? 'animate-spin' : ''} />
          {isRetrying ? 'Retrying...' : 'Try Again'}
        </button>
      )}
    </motion.div>
  );
};
