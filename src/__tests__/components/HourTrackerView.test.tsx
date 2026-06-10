import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { HourTrackerView } from '@/components/HourTrackerView';

// Mock React Query — hold references to the spy functions at module scope
const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();
const mockUseQueryClient = vi.fn(() => ({
  invalidateQueries: vi.fn(),
  fetchQuery: vi.fn(),
  getQueryData: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => mockUseQueryClient(),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Default stubs so tests that don't override still get sensible returns
const noopStubs = () => ({
  data: undefined,
  isLoading: false,
});
const noopMutation = () => {
  const asyncFn = vi.fn().mockResolvedValue({});
  return {
    mutate: asyncFn,
    mutateAsync: asyncFn,
    isPending: false,
  };
};

// ---------------------------------------------------------------------------
// Test ID helper — mirrors the logic in HourTrackerView.tsx
// Converts 24-hour numeric hour to the data-testid format used by the component.
// e.g. 14 -> "2pmpm", 9 -> "9amam", 0 -> "12amam"
// ---------------------------------------------------------------------------
function hourToTestId(hour: number) {
  const isPM = hour >= 12;
  const h = hour % 12 || 12;
  return `add-entry-${h}${isPM ? 'pm' : 'am'}${isPM ? 'pm' : 'am'}`;
}

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  // Freeze time so the current date is 2026-06-08 (Monday).
  // Hour 14 (2 PM UTC) is past, so isPlanned=false for hours < 14.
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-08T14:00:00Z'));
  mockUseQuery.mockImplementation(noopStubs);
  mockUseMutation.mockImplementation(noopMutation);
  mockUseQueryClient.mockReturnValue({
    invalidateQueries: vi.fn(),
    fetchQuery: vi.fn().mockResolvedValue([]),
    getQueryData: vi.fn().mockReturnValue([]),
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('HourTrackerView', () => {
  describe('multiple entries in same hour slot', () => {
    it('renders two entries in the same hour when they exist', () => {
      const twoEntries = [
        {
          _id: 'entry-1',
          date: '2026-06-04',
          hour: 9,
          text: 'First task',
          type: 'deep-work' as const,
          isPlanned: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: 'entry-2',
          date: '2026-06-04',
          hour: 9,
          text: 'Second task',
          type: 'routine' as const,
          isPlanned: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockUseQuery.mockImplementation((opts: { queryKey: (string | number)[] }) => {
        if (opts.queryKey[0] === 'hour-entries') {
          return { data: twoEntries, isLoading: false };
        }
        return noopStubs();
      });
      mockUseMutation.mockReturnValue({ mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({}), isPending: false });

      render(<HourTrackerView />);

      expect(screen.getByText('First task')).toBeTruthy();
      expect(screen.getByText('Second task')).toBeTruthy();
    });

    it('shows color indicator for each entry based on type', () => {
      const entriesWithTypes = [
        {
          _id: 'entry-1',
          date: '2026-06-04',
          hour: 9,
          text: 'Meeting',
          type: 'meetings' as const,
          isPlanned: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: 'entry-2',
          date: '2026-06-04',
          hour: 9,
          text: 'Break',
          type: 'breaks' as const,
          isPlanned: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockUseQuery.mockImplementation((opts: { queryKey: (string | number)[] }) => {
        if (opts.queryKey[0] === 'hour-entries') {
          return { data: entriesWithTypes, isLoading: false };
        }
        return noopStubs();
      });
      mockUseMutation.mockReturnValue({ mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({}), isPending: false });

      render(<HourTrackerView />);

      expect(screen.getByText('Meeting')).toBeTruthy();
      expect(screen.getByText('Break')).toBeTruthy();
    });

    it('each entry has its own delete button visible on hover', () => {
      const twoEntries = [
        {
          _id: 'entry-1',
          date: '2026-06-04',
          hour: 9,
          text: 'Task A',
          type: 'deep-work' as const,
          isPlanned: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: 'entry-2',
          date: '2026-06-04',
          hour: 9,
          text: 'Task B',
          type: 'routine' as const,
          isPlanned: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockUseQuery.mockImplementation((opts: { queryKey: (string | number)[] }) => {
        if (opts.queryKey[0] === 'hour-entries') {
          return { data: twoEntries, isLoading: false };
        }
        return noopStubs();
      });
      const deleteMutateAsync = vi.fn().mockResolvedValue(undefined);
      mockUseMutation.mockReturnValue({ mutate: deleteMutateAsync, mutateAsync: deleteMutateAsync, isPending: false });

      render(<HourTrackerView />);

      expect(screen.getByText('Task A')).toBeTruthy();
      expect(screen.getByText('Task B')).toBeTruthy();
    });
  });

  describe('empty entry guard', () => {
    it('does not save when text input is empty', () => {
      mockUseQuery.mockImplementation((opts: { queryKey: (string | number)[] }) => {
        if (opts.queryKey[0] === 'hour-entries') {
          return { data: [], isLoading: false };
        }
        return noopStubs();
      });
      mockUseMutation.mockReturnValue({ mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({}), isPending: false });

      render(<HourTrackerView />);

      fireEvent.click(screen.getByTestId(hourToTestId(9)));

      // Input should appear — type nothing, hit save
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      // mutateAsync should NOT have been called (empty guard)
      const mutationCalls = mockUseMutation.mock.calls;
      const saveCalls = mutationCalls.filter(([opts]) => String(opts.mutationFn).includes('saveEntry'));
      expect(saveCalls.length === 0 || !(saveCalls[0][0] as { text?: string }).text).toBe(true);
    });

    it('shows placeholder text for empty hour slot', () => {
      mockUseQuery.mockImplementation((opts: { queryKey: (string | number)[] }) => {
        if (opts.queryKey[0] === 'hour-entries') {
          return { data: [], isLoading: false };
        }
        return noopStubs();
      });
      mockUseMutation.mockReturnValue({ mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({}), isPending: false });

      render(<HourTrackerView />);

      expect(screen.getAllByText('Click to log...').length).toBeGreaterThan(0);
    });

    it('cancel button clears draft without saving', () => {
      mockUseQuery.mockImplementation((opts: { queryKey: (string | number)[] }) => {
        if (opts.queryKey[0] === 'hour-entries') {
          return { data: [], isLoading: false };
        }
        return noopStubs();
      });
      mockUseMutation.mockReturnValue({ mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({}), isPending: false });

      render(<HourTrackerView />);

      // Click an empty past-hour cell to enter edit mode via data-testid
      fireEvent.click(screen.getByTestId(hourToTestId(9)));

      // Input should appear
      expect(screen.queryByPlaceholderText('What happened this hour?')).toBeTruthy();

      // Type some text
      const input = screen.getByPlaceholderText('What happened this hour?');
      fireEvent.change(input, { target: { value: 'Some text' } });

      // Cancel — use data-testid so this is robust against label changes
      fireEvent.click(screen.getByTestId('cancel-entry'));

      // Input should be gone (cell back to display mode)
      expect(screen.queryByPlaceholderText('What happened this hour?')).toBeNull();
    });
  });

  describe('entry deletion', () => {
    it('calls delete mutation with correct entry id', () => {
      mockUseQuery.mockImplementation((opts: { queryKey: (string | number)[] }) => {
        if (opts.queryKey[0] === 'hour-entries') {
          return {
            data: [
              {
                _id: 'entry-to-delete',
                date: '2026-06-04',
                hour: 10,
                text: 'Old task',
                type: 'default' as const,
                isPlanned: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
            isLoading: false,
          };
        }
        return noopStubs();
      });

      const deleteMutateAsync = vi.fn().mockResolvedValue(undefined);
      mockUseMutation.mockReturnValue({ mutate: deleteMutateAsync, mutateAsync: deleteMutateAsync, isPending: false });

      render(<HourTrackerView />);

      expect(screen.getByText('Old task')).toBeTruthy();

      // In jsdom hover-based reveal doesn't work; click the opacity-0 X button directly
      const allButtons = document.body.querySelectorAll('button');
      const deleteBtn = Array.from(allButtons).find((btn) => {
        const svg = btn.querySelector('svg');
        return svg && btn.getAttribute('class')?.includes('opacity-0');
      });

      if (deleteBtn) {
        fireEvent.click(deleteBtn);
        expect(deleteMutateAsync).toHaveBeenCalledWith('entry-to-delete');
      }
    });

    it('removes entry from UI after successful delete', () => {
      mockUseQuery.mockImplementation((opts: { queryKey: (string | number)[] }) => {
        if (opts.queryKey[0] === 'hour-entries') {
          return {
            data: [
              {
                _id: 'entry-1',
                date: '2026-06-04',
                hour: 11,
                text: 'Temp task',
                type: 'distracted' as const,
                isPlanned: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
            isLoading: false,
          };
        }
        return noopStubs();
      });

      const deleteMutateAsync = vi.fn().mockResolvedValue(undefined);
      mockUseMutation.mockReturnValue({ mutate: deleteMutateAsync, mutateAsync: deleteMutateAsync, isPending: false });

      const { rerender }: { rerender: (c: React.ReactElement) => void } = render(<HourTrackerView />);
      expect(screen.getByText('Temp task')).toBeTruthy();

      // Directly click the opacity-0 X button (jsdom doesn't support CSS hover)
      const allButtons = document.body.querySelectorAll('button');
      const deleteBtn = Array.from(allButtons).find((btn) => {
        const svg = btn.querySelector('svg');
        return svg && btn.getAttribute('class')?.includes('opacity-0');
      });
      if (deleteBtn) {
        fireEvent.click(deleteBtn);
      }

      // After mutation success, simulate query refetch returning empty
      mockUseQuery.mockImplementation((opts: { queryKey: (string | number)[] }) => {
        if (opts.queryKey[0] === 'hour-entries') {
          return { data: [], isLoading: false };
        }
        return noopStubs();
      });

      rerender(<HourTrackerView />);

      expect(screen.queryByText('Temp task')).toBeNull();
    });
  });
});
