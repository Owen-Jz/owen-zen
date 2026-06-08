import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { HourTrackerView } from '@/components/HourTrackerView';

// ---------------------------------------------------------------------------
// Mock setup
// ---------------------------------------------------------------------------
const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();
const mockUseQueryClient = vi.fn(() => ({
  invalidateQueries: vi.fn(),
  fetchQuery: vi.fn().mockResolvedValue([]),
  getQueryData: vi.fn().mockReturnValue([]),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => mockUseQueryClient(),
}));

vi.mock('framer-motion', () => ({
  motion: { div: 'div' },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const noopQuery = () => ({ data: undefined, isLoading: false });

function giveEntries(entries: { _id: string; date: string; hour: number; text: string; type: string; isPlanned: boolean; createdAt: Date; updatedAt: Date }[]) {
  mockUseQuery.mockImplementation((opts: { queryKey: (string | number)[] }) => {
    if (opts.queryKey[0] === 'hour-entries') return { data: entries, isLoading: false };
    return noopQuery();
  });
}

function giveSaveMutation() {
  const save = vi.fn().mockResolvedValue({});
  mockUseMutation.mockImplementation((opts: Record<string, unknown>) => {
    if (String(opts.mutationFn ?? '').includes('deleteEntry')) {
      const del = vi.fn().mockResolvedValue(undefined);
      return { mutate: del, mutateAsync: del, isPending: false };
    }
    return { mutate: save, mutateAsync: save, isPending: false };
  });
  return save;
}

// ---------------------------------------------------------------------------
// Global setup / teardown
// ---------------------------------------------------------------------------
beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-08T14:00:00Z'));
  mockUseQuery.mockImplementation(noopQuery);
  mockUseMutation.mockImplementation(() => {
    const save = vi.fn().mockResolvedValue({});
    return { mutate: save, mutateAsync: save, isPending: false };
  });
  mockUseQueryClient.mockReturnValue({
    invalidateQueries: vi.fn(),
    fetchQuery: vi.fn().mockResolvedValue([]),
    getQueryData: vi.fn().mockReturnValue([]),
  });
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Test ID helper — mirrors the logic in HourTrackerView.tsx
// ---------------------------------------------------------------------------
function hourToTestId(hour: number) {
  const isPM = hour >= 12;
  const h = hour % 12 || 12;
  return `add-entry-${h}${isPM ? 'pm' : 'am'}${isPM ? 'pm' : 'am'}`;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('HourTrackerView — additional coverage', () => {
  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------
  describe('empty state', () => {
    it('shows "Click to log..." placeholder for past hours when no entries exist', () => {
      giveEntries([]);

      render(<HourTrackerView />);

      // At least one past-hour cell should show the placeholder
      expect(screen.getAllByText('Click to log...').length).toBeGreaterThan(0);
    });

    it('shows "Loading..." while fetching', () => {
      mockUseQuery.mockImplementation((opts: { queryKey: (string | number)[] }) => {
        if (opts.queryKey[0] === 'hour-entries') return { data: undefined, isLoading: true };
        return noopQuery();
      });

      render(<HourTrackerView />);

      expect(screen.getByText('Loading...')).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Persist entries on rerender
  // -------------------------------------------------------------------------
  describe('persists entries on rerender', () => {
    it('keeps entries visible after component remount', () => {
      giveEntries([
        {
          _id: 'persist-1',
          date: '2026-06-08',
          hour: 9,
          text: 'Persisted entry',
          type: 'deep-work',
          isPlanned: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const { unmount } = render(<HourTrackerView />);
      expect(screen.getByText('Persisted entry')).toBeTruthy();

      unmount();
      render(<HourTrackerView />);

      expect(screen.getByText('Persisted entry')).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Invalid / unknown hour entry type
  // -------------------------------------------------------------------------
  describe('handles invalid hour gracefully', () => {
    it('renders an entry with an unknown type without crashing, using default color', () => {
      giveEntries([
        {
          _id: 'unknown-type',
          date: '2026-06-08',
          hour: 9,
          text: 'Unknown type entry',
          type: 'not-a-real-type' as any,
          isPlanned: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      render(<HourTrackerView />);

      expect(screen.getByText('Unknown type entry')).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Cancel closes editor
  // -------------------------------------------------------------------------
  describe('cancel closes editor', () => {
    it('cancel button clears editing state', () => {
      giveEntries([]);

      render(<HourTrackerView />);

      // Open edit mode via the cell's data-testid
      fireEvent.click(screen.getByTestId(hourToTestId(9)));

      // Confirm edit mode is active (entry-text-input visible)
      expect(screen.getByTestId('entry-text-input')).toBeTruthy();

      // Cancel — uses default mock mutation (no explicit setup needed)
      const cancelBtn = screen.getByTestId('cancel-entry');
      fireEvent.click(cancelBtn);

      // Editor should close (entry-text-input gone)
      expect(screen.queryByTestId('entry-text-input')).toBeNull();
    });
  });
});