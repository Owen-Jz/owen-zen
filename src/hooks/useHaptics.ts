import { useCallback } from 'react';
import { hapticService } from '@/lib/hapticService';

export const useHaptics = () => {
  const impactLight = useCallback(() => hapticService.impactLight(), []);
  const impactMedium = useCallback(() => hapticService.impactMedium(), []);
  const impactHeavy = useCallback(() => hapticService.impactHeavy(), []);
  const success = useCallback(() => hapticService.success(), []);
  const warning = useCallback(() => hapticService.warning(), []);
  const error = useCallback(() => hapticService.error(), []);
  const selection = useCallback(() => hapticService.selection(), []);

  return {
    impactLight,
    impactMedium,
    impactHeavy,
    success,
    warning,
    error,
    selection,
  };
};
