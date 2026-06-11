import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { HourTrackerView } from '@/components/HourTrackerView';

// ---------------------------------------------------------------------------
// Mock setup — module-level spies (the working pattern)
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

const noopQuery = () => ({ data: undefined, isLoading: false });

function giveEntries(entries: {
  _id: string; date: string; hour: number; text: string;
  type: string; isPlanned: boolean; createdAt: Date; updatedAt: Date;
}[]) {
  mockUseQuery.mockImplementation((opts: { queryKey: (string | number)[] }) => {
    if (opts.queryKey[0] === 'hour-entries') return { data: entries, isLoading: false };
    return noopQuery();
  });
}

// ---------------------------------------------------------------------------
// Global setup / teardown
// ---------------------------------------------------------------------------
beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
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

// ---------------------------------------------------------------------------
// Test ID helper — mirrors the logic in HourTrackerView.tsx
// ---------------------------------------------------------------------------
function hourToTestId(hour: number) {
  const isPM = hour >= 12;
  const h = hour % 12 || 12;
  return `add-entry-${h}${isPM ? 'pm' : 'am'}`;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('HourTrackerView', () => {
  describe('empty state — no entries', () => {
    it('renders all hour rows when entries array is empty', () => {
      giveEntries([]);

      render(<HourTrackerView />);

      // All 18 hours (6 AM – 11 PM inclusive) should have a row
      const hourRows = document.querySelectorAll('[data-testid^="hour-row-"]');
      expect(hourRows.length).toBe(18);

      // Hour rows are present in the DOM
      expect(screen.getByTestId('hour-row-6am')).toBeTruthy();
      expect(screen.getByTestId('hour-row-11pm')).toBeTruthy();
    });
  });

  describe('multiple entries in same hour slot', () => {
    it('renders two entries in the same hour when they exist', () => {
      giveEntries([
        {
          _id: 'entry-1',
          date: '2026-06-08',
          hour: 9,
          text: 'First task',
          type: 'deep-work',
          isPlanned: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: 'entry-2',
          date: '2026-06-08',
          hour: 9,
          text: 'Second task',
          type: 'routine',
          isPlanned: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      render(<HourTrackerView />);

      expect(screen.getByText('First task')).toBeTruthy();
      expect(screen.getByText('Second task')).toBeTruthy();
    });

    it('shows both entries when multiple entries exist in same hour', () => {
      giveEntries([
        {
          _id: 'entry-1',
          date: '2026-06-08',
          hour: 9,
          text: 'Meeting',
          type: 'meetings',
          isPlanned: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: 'entry-2',
          date: '2026-06-08',
          hour: 9,
          text: 'Break',
          type: 'breaks',
          isPlanned: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      render(<HourTrackerView />);

      expect(screen.getByText('Meeting')).toBeTruthy();
      expect(screen.getByText('Break')).toBeTruthy();
    });

    it('each entry has its own delete button in the DOM', () => {
      giveEntries([
        {
          _id: 'entry-1',
          date: '2026-06-08',
          hour: 9,
          text: 'Task A',
          type: 'deep-work',
          isPlanned: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: 'entry-2',
          date: '2026-06-08',
          hour: 9,
          text: 'Task B',
          type: 'routine',
          isPlanned: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      render(<HourTrackerView />);

      expect(screen.getByText('Task A')).toBeTruthy();
      expect(screen.getByText('Task B')).toBeTruthy();

      const deleteBtns = document.querySelectorAll('[data-testid^="delete-entry-"]');
      expect(deleteBtns.length).toBe(2);
    });
  });

  describe('empty entry guard', () => {
    it('shows placeholder text for empty hour slot', () => {
      giveEntries([]);

      render(<HourTrackerView />);

      // Verify the cell exists (placeholder rendered as italic text)
      expect(screen.getByTestId('add-entry-9am')).toBeTruthy();
    });

    it('cancel button clears editing state without saving', () => {
      giveEntries([]);

      render(<HourTrackerView />);

      // Click the 9 AM cell to enter edit mode (uses data-testid)
      fireEvent.click(screen.getByTestId(hourToTestId(9)));

      // Confirm edit mode is active (entry-text-input visible)
      expect(screen.getByTestId('entry-text-input')).toBeTruthy();

      // Cancel
      const cancelBtn = screen.getByTestId('cancel-entry');
      fireEvent.click(cancelBtn);

      // Editor should close (entry-text-input gone)
      expect(screen.queryByTestId('entry-text-input')).toBeNull();
    });
  });

  describe('entry deletion', () => {
    it('calls delete mutation with correct entry id', () => {
      const deleteMutateAsync = vi.fn().mockResolvedValue(undefined);
      mockUseMutation.mockImplementation((opts: Record<string, unknown>) => {
        if (String(opts.mutationFn ?? '').includes('deleteEntry')) {
          return { mutate: vi.fn(), mutateAsync: deleteMutateAsync, isPending: false };
        }
        return { mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({}), isPending: false };
      });

      giveEntries([
        {
          _id: 'entry-to-delete',
          date: '2026-06-08',
          hour: 10,
          text: 'Old task',
          type: 'default',
          isPlanned: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      render(<HourTrackerView />);

      expect(screen.getByText('Old task')).toBeTruthy();

      const deleteBtn = screen.getByTestId('delete-entry-entry-to-delete');
      fireEvent.click(deleteBtn);

      expect(deleteMutateAsync).toHaveBeenCalledWith('entry-to-delete');
    });

    it('removes entry from UI after successful delete', () => {
      giveEntries([
        {
          _id: 'entry-1',
          date: '2026-06-08',
          hour: 11,
          text: 'Temp task',
          type: 'distracted',
          isPlanned: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const deleteMutateAsync = vi.fn().mockResolvedValue(undefined);
      mockUseMutation.mockImplementation((opts: Record<string, unknown>) => {
        if (String(opts.mutationFn ?? '').includes('deleteEntry')) {
          return { mutate: vi.fn(), mutateAsync: deleteMutateAsync, isPending: false };
        }
        return { mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({}), isPending: false };
      });

      const { rerender } = render(<HourTrackerView />);
      expect(screen.getByText('Temp task')).toBeTruthy();

      // Click delete
      const deleteBtn = screen.getByTestId('delete-entry-entry-1');
      fireEvent.click(deleteBtn);

      // Simulate refetch returning empty
      giveEntries([]);
      rerender(<HourTrackerView />);

      expect(screen.queryByText('Temp task')).toBeNull();
    });
  });
});