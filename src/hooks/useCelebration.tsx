'use client';

import { useState, useCallback, useMemo } from 'react';
import CelebrationOverlay from '../components/consistency-graph/CelebrationOverlay';

export type CelebrationType = 'day' | 'week';

export function useCelebration() {
  const [show, setShow] = useState(false);
  const [type, setType] = useState<CelebrationType | null>(null);

  const triggerCelebration = useCallback((celebrationType: CelebrationType) => {
    setType(celebrationType);
    setShow(true);
  }, []);

  const dismiss = useCallback(() => {
    setShow(false);
  }, []);

  const overlay = useMemo(
    () => (
      <CelebrationOverlay
        show={show}
        type={type ?? 'day'}
        onComplete={dismiss}
      />
    ),
    [show, type, dismiss]
  );

  return { show, type, triggerCelebration, dismiss, overlay };
}