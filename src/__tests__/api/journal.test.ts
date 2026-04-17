import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/journal/route';
import { DELETE } from '@/app/api/journal/[id]/route';
import Journal from '@/models/Journal';

vi.mock('@/lib/db', () => ({
  __esModule: true,
  default: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/models/Journal', () => ({
  __esModule: true,
  default: {
    find: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue([]),
    findOneAndUpdate: vi.fn(),
    deleteOne: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  // Reset to default mock chain
  vi.mocked(Journal.find).mockReturnValue({
    sort: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue([]),
  } as any);
  vi.mocked(Journal.findOneAndUpdate).mockResolvedValue(null);
  vi.mocked(Journal.deleteOne).mockResolvedValue({ deletedCount: 0 });
});

describe('Journal API', () => {
  describe('GET /api/journal', () => {
    it('returns entries for the given year', async () => {
      const mockEntries = [
        { _id: '1', date: '2024-03-15', text: 'Morning entry', slot: 'morning' },
        { _id: '2', date: '2024-03-16', text: 'Evening entry', slot: 'evening' },
      ];

      vi.mocked(Journal.find).mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockEntries),
      } as any);

      const request = new Request('http://localhost/api/journal?year=2024');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockEntries);
    });

    it('filters by slot=morning', async () => {
      const mockMorningEntries = [
        { _id: '1', date: '2024-03-15', text: 'Morning entry', slot: 'morning' },
      ];

      vi.mocked(Journal.find).mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockMorningEntries),
      } as any);

      const request = new Request('http://localhost/api/journal?year=2024&slot=morning');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockMorningEntries);
      expect(Journal.find).toHaveBeenCalledWith(
        expect.objectContaining({ slot: 'morning' })
      );
    });

    it('filters by slot=evening', async () => {
      const mockEveningEntries = [
        { _id: '2', date: '2024-03-16', text: 'Evening entry', slot: 'evening' },
      ];

      vi.mocked(Journal.find).mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockEveningEntries),
      } as any);

      const request = new Request('http://localhost/api/journal?year=2024&slot=evening');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockEveningEntries);
      expect(Journal.find).toHaveBeenCalledWith(
        expect.objectContaining({ slot: 'evening' })
      );
    });
  });

  describe('POST /api/journal', () => {
    it('creates a morning entry with slot: morning', async () => {
      const mockEntry = { _id: '1', date: '2024-03-15', text: 'Morning thoughts', slot: 'morning' };

      vi.mocked(Journal.findOneAndUpdate).mockResolvedValue(mockEntry);

      const request = new Request('http://localhost/api/journal', {
        method: 'POST',
        body: JSON.stringify({ date: '2024-03-15', text: 'Morning thoughts', slot: 'morning' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.slot).toBe('morning');
    });

    it('creates an evening entry with slot: evening', async () => {
      const mockEntry = { _id: '2', date: '2024-03-15', text: 'Evening thoughts', slot: 'evening' };

      vi.mocked(Journal.findOneAndUpdate).mockResolvedValue(mockEntry);

      const request = new Request('http://localhost/api/journal', {
        method: 'POST',
        body: JSON.stringify({ date: '2024-03-15', text: 'Evening thoughts', slot: 'evening' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.slot).toBe('evening');
    });

    it('defaults missing slot to evening when slot not provided', async () => {
      const mockEntry = { _id: '3', date: '2024-03-15', text: 'Some thoughts', slot: 'evening' };

      vi.mocked(Journal.findOneAndUpdate).mockResolvedValue(mockEntry);

      const request = new Request('http://localhost/api/journal', {
        method: 'POST',
        body: JSON.stringify({ date: '2024-03-15', text: 'Some thoughts' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.slot).toBe('evening');
    });

    it('returns 400 if date is missing', async () => {
      const request = new Request('http://localhost/api/journal', {
        method: 'POST',
        body: JSON.stringify({ text: 'Some thoughts' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('date is required');
    });
  });
});

describe('Journal [id] API', () => {
  describe('DELETE /api/journal/[id]', () => {
    it('deletes an entry successfully', async () => {
      vi.mocked(Journal.deleteOne).mockResolvedValue({ deletedCount: 1 });

      const request = new Request('http://localhost/api/journal/123', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '123' }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('returns 404 when entry not found', async () => {
      vi.mocked(Journal.deleteOne).mockResolvedValue({ deletedCount: 0 });

      const request = new Request('http://localhost/api/journal/123', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '123' }) });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Not found');
    });
  });
});
