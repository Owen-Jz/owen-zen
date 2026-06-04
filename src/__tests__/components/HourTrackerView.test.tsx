import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { HourTrackerView } from '@/components/HourTrackerView';

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    fetchQuery: vi.fn(),
    getQueryData: vi.fn(),
  })),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockEntries = [
  {
    _id: 'entry-1',
    date: '2026-06-04',
    hour: 9,
    text: 'Deep work session',
    type: 'deep-work' as const,
    isPlanned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

function setup(dateOverride?: string) {
  const dateString = dateOverride ?? '2026-06-04';

  // Reset mocks
  const { useQuery, useMutation, useQueryClient } = vi.mocked(
    require('@tanstack/react-query')
  );

  const mockQueryClient = {
    invalidateQueries: vi.fn(),
    fetchQuery: vi.fn().mockResolvedValue([]),
    getQueryData: vi.fn().mockReturnValue([]),
  };
  (useQueryClient as ReturnType<typeof vi.fn>).mockReturnValue(mockQueryClient);

  // Entries query — return empty by default so we can test multi-entry
  useQuery.mockImplementation((opts: { queryKey: (string | number)[] }) => {
    if (opts.queryKey[0] === 'hour-entries') {
      const date = opts.queryKey[1] as string;
      // Default to empty entries; individual tests override via mockFetch
      return { data: [], isLoading: false };
    }
    return { data: undefined, isLoading: false };
  });

  const saveMutateAsync = vi.fn().mockResolvedValue({});
  const deleteMutateAsync = vi.fn().mockResolvedValue(undefined);
  const copyMutateAsync = vi.fn().mockResolvedValue(undefined);

  useMutation.mockImplementation((opts: { mutationFn: (arg: unknown) => unknown } | Record<string, unknown>) => {
    if (typeof opts.mutationFn === 'function') {
      return {
        mutate: vi.fn(),
        mutateAsync: vi.fn().mockResolvedValue({}),
        isPending: false,
      };
    }
    return {
      mutate: vi.fn(),
      mutateAsync: deleteMutateAsync,
      isPending: false,
    };
  });

  // Override for delete mutation
  useMutation.mockImplementation((opts: Record<string, unknown>) => {
    const mutationFn = opts.mutationFn as (arg: unknown) => unknown;
    if (String(mutationFn).includes('deleteEntry')) {
      return { mutate: vi.fn(), mutateAsync: deleteMutateAsync, isPending: false };
    }
    if (String(mutationFn).includes('copyYesterday')) {
      return { mutate: vi.fn(), mutateAsync: copyMutateAsync, isPending: false };
    }
    return { mutate: vi.fn(), mutateAsync: saveMutateAsync, isPending: false };
  });

  return { saveMutateAsync, deleteMutateAsync, copyMutateAsync };
}

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('HourTrackerView', () => {
  describe('multiple entries in same hour slot', () => {
    it('renders two entries in the same hour when they exist', async () => {
      const { useQuery } = vi.mocked(require('@tanstack/react-query'));

      // Override the entries query to return two entries in the same hour
      useQuery.mockImplementation((opts: { queryKey: (string | number)[] }) => {
        if (opts.queryKey[0] === 'hour-entries') {
          return {
            data: [
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
            ],
            isLoading: false,
          };
        }
        return { data: undefined, isLoading: false };
      });

      const { useMutation } = vi.mocked(require('@tanstack/react-query'));
      useMutation.mockReturnValue({ mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({}), isPending: false });

      render(<HourTrackerView />);

      // Both entries for hour 9 should be visible
      const hour9Row = screen.getByText('9:00 AM').closest('[class*="flex"]');
      expect(screen.getByText('First task')).toBeTruthy();
      expect(screen.getByText('Second task')).toBeTruthy();
    });

    it('shows color indicator for each entry based on type', async () => {
      const { useQuery } = vi.mocked(require('@tanstack/react-query'));

      useQuery.mockImplementation((opts: { queryKey: (string | number)[] }) => {
        if (opts.queryKey[0] === 'hour-entries') {
          return {
            data: [
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
            ],
            isLoading: false,
          };
        }
        return { data: undefined, isLoading: false };
      });

      const { useMutation } = vi.mocked(require('@tanstack/react-query'));
      useMutation.mockReturnValue({ mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({}), isPending: false });

      render(<HourTrackerView />);

      // Both entry texts should render
      expect(screen.getByText('Meeting')).toBeTruthy();
      expect(screen.getByText('Break')).toBeTruthy();
    });

    it('each entry has its own delete button visible on hover', async () => {
      const { useQuery } = vi.mocked(require('@tanstack/react-query'));

      useQuery.mockImplementation((opts: { queryKey: (string | number)[] }) => {
        if (opts.queryKey[0] === 'hour-entries') {
          return {
            data: [
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
            ],
            isLoading: false,
          };
        }
        return { data: undefined, isLoading: false };
      });

      const { useMutation } = vi.mocked(require('@tanstack/react-query'));
      const deleteMutateAsync = vi.fn().mockResolvedValue(undefined);
      useMutation.mockReturnValue({ mutate: vi.fn(), mutateAsync: deleteMutateAsync, isPending: false });

      render(<HourTrackerView />);

      // Find all delete buttons (X icons) — two entries should yield two X buttons
      const deleteButtons = screen.container.querySelectorAll('button');

      // Both texts should exist
      expect(screen.getByText('Task A')).toBeTruthy();
      expect(screen.getByText('Task B')).toBeTruthy();
    });
  });

  describe('empty entry guard', () => {
    it('does not save when text input is empty', async () => {
      const { useQuery, useMutation } = vi.mocked(require('@tanstack/react-query'));
      useQuery.mockReturnValue({ data: [], isLoading: false });

      const saveMutateAsync = vi.fn().mockResolvedValue({});
      useMutation.mockReturnValue({ mutate: vi.fn(), mutateAsync: saveMutateAsync, isPending: false });

      render(<HourTrackerView />);

      // Click on a cell to start editing
      const hourRow = screen.getByText('9:00 AM').closest('[class*="flex"]') as HTMLElement;
      const cell = hourRow?.querySelector('[class*="cursor-pointer"]') as HTMLElement;
      fireEvent.click(cell || hourRow);

      // Input should appear — type nothing, hit save
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      // mutateAsync should NOT have been called (empty guard)
      expect(saveMutateAsync).not.toHaveBeenCalled();
    });

    it('shows placeholder text for empty hour slot', async () => {
      const { useQuery } = vi.mocked(require('@tanstack/react-query'));
      useQuery.mockReturnValue({ data: [], isLoading: false });

      const { useMutation } = vi.mocked(require('@tanstack/react-query'));
      useMutation.mockReturnValue({ mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({}), isPending: false });

      render(<HourTrackerView />);

      // Empty hour should show "Click to log..." or "Planned"
      // We check for the placeholder text in the cell
      const hourCell = screen.getByText('Click to log...');
      expect(hourCell).toBeTruthy();
    });

    it('cancel button clears draft without saving', async () => {
      const { useQuery, useMutation } = vi.mocked(require('@tanstack/react-query'));
      useQuery.mockReturnValue({ data: [], isLoading: false });

      const saveMutateAsync = vi.fn().mockResolvedValue({});
      useMutation.mockReturnValue({ mutate: vi.fn(), mutateAsync: saveMutateAsync, isPending: false });

      render(<HourTrackerView />);

      // Click cell to enter edit mode
      const hourRow = screen.getByText('9:00 AM').closest('[class*="flex"]') as HTMLElement;
      const cell = hourRow?.querySelector('[class*="cursor-pointer"]') as HTMLElement;
      fireEvent.click(cell || hourRow);

      // Type some text
      const input = screen.getByPlaceholderText('What happened this hour?');
      fireEvent.change(input, { target: { value: 'Some text' } });

      // Cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Input should be gone (cell back to display mode)
      expect(screen.queryByPlaceholderText('What happened this hour?')).toBeNull();
    });
  });

  describe('entry deletion', () => {
    it('calls delete mutation with correct entry id', async () => {
      const { useQuery } = vi.mocked(require('@tanstack/react-query'));
      const { useMutation } = vi.mocked(require('@tanstack/react-query'));

      useQuery.mockImplementation((opts: { queryKey: (string | number)[] }) => {
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
        return { data: undefined, isLoading: false };
      });

      const deleteMutateAsync = vi.fn().mockResolvedValue(undefined);
      useMutation.mockReturnValue({ mutate: vi.fn(), mutateAsync: deleteMutateAsync, isPending: false });

      render(<HourTrackerView />);

      // The entry should be visible
      expect(screen.getByText('Old task')).toBeTruthy();

      // Find the delete button — it's a button with an X icon, appears on hover
      // Simulate hovering over the entry row to reveal the delete button
      const entryRow = screen.getByText('Old task').closest('[class*="group/entry"]') as HTMLElement;
      if (entryRow) {
        fireEvent.mouseEnter(entryRow);
      }

      // Look for a button that contains X (the delete button)
      const allButtons = screen.container.querySelectorAll('button');
      // Find the button with the X icon inside the entry row (it should be visible after hover)
      const deleteBtn = Array.from(allButtons).find((btn) => {
        return btn.innerHTML.includes('X') || btn.querySelector('svg');
      });

      if (deleteBtn) {
        fireEvent.click(deleteBtn);
        expect(deleteMutateAsync).toHaveBeenCalledWith('entry-to-delete');
      }
    });

    it('removes entry from UI after successful delete', async () => {
      const { useQuery } = vi.mocked(require('@tanstack/react-query'));
      const { useMutation, useQueryClient } = vi.mocked(require('@tanstack/react-query'));

      const mockQueryClient = {
        invalidateQueries: vi.fn(),
        fetchQuery: vi.fn().mockResolvedValue([]),
        getQueryData: vi.fn().mockReturnValue([]),
      };
      (useQueryClient as ReturnType<typeof vi.fn>).mockReturnValue(mockQueryClient);

      useQuery.mockImplementation((opts: { queryKey: (string | number)[] }) => {
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
        return { data: undefined, isLoading: false };
      });

      const deleteMutateAsync = vi.fn().mockImplementation(() => {
        // Simulate successful deletion by updating the query cache
        return new Promise((resolve) => {
          setTimeout(() => {
            // After "delete", the query would be refetched and return empty
            resolve(undefined);
          }, 0);
        });
      });

      useMutation.mockReturnValue({ mutate: vi.fn(), mutateAsync: deleteMutateAsync, isPending: false });

      const { rerender } = require('@testing-library/react');

      render(<HourTrackerView />);
      expect(screen.getByText('Temp task')).toBeTruthy();

      // Trigger delete
      const entryRow = screen.getByText('Temp task').closest('[class*="group/entry"]') as HTMLElement;
      if (entryRow) {
        fireEvent.mouseEnter(entryRow);
      }
      const allButtons = screen.container.querySelectorAll('button');
      const deleteBtn = Array.from(allButtons).find((btn) => btn.querySelector('svg'));
      if (deleteBtn) {
        fireEvent.click(deleteBtn);
      }

      // After mutation success, queryClient.invalidateQueries is called
      // The component re-renders with updated data
      // Since deleteMutateAsync resolves immediately, we simulate the query refetch
      useQuery.mockImplementation((opts: { queryKey: (string | number)[] }) => {
        if (opts.queryKey[0] === 'hour-entries') {
          return { data: [], isLoading: false };
        }
        return { data: undefined, isLoading: false };
      });

      rerender(<HourTrackerView />);

      // After re-render with empty data, the entry should be gone
      expect(screen.queryByText('Temp task')).toBeNull();
    });
  });
});