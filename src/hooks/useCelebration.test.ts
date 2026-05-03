import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCelebration } from './useCelebration';

describe('useCelebration', () => {
  it('starts with show=false', () => {
    const { result } = renderHook(() => useCelebration());
    expect(result.current.show).toBe(false);
    expect(result.current.type).toBe(null);
  });

  it('sets show=true and type when triggerCelebration is called', () => {
    const { result } = renderHook(() => useCelebration());
    act(() => result.current.triggerCelebration('week'));
    expect(result.current.show).toBe(true);
    expect(result.current.type).toBe('week');
  });

  it('sets show=false after dismissal', () => {
    const { result } = renderHook(() => useCelebration());
    act(() => result.current.triggerCelebration('day'));
    act(() => result.current.dismiss());
    expect(result.current.show).toBe(false);
  });
});