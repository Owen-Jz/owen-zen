// Haptic feedback patterns and service
type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const HAPTIC_PATTERNS: Record<HapticPattern, number[]> = {
  light: [10],
  medium: [20],
  heavy: [30],
  success: [10, 50, 10],
  warning: [20, 30, 20],
  error: [30, 30, 30],
  selection: [5],
};

export const hapticService = {
  trigger(pattern: HapticPattern): void {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    const patternValues = HAPTIC_PATTERNS[pattern];
    if (patternValues) {
      navigator.vibrate(patternValues);
    }
  },

  // Convenience methods
  impactLight: () => hapticService.trigger('light'),
  impactMedium: () => hapticService.trigger('medium'),
  impactHeavy: () => hapticService.trigger('heavy'),
  success: () => hapticService.trigger('success'),
  warning: () => hapticService.trigger('warning'),
  error: () => hapticService.trigger('error'),
  selection: () => hapticService.trigger('selection'),
};
