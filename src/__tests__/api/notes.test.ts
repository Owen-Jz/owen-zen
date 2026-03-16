import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST } from '@/app/api/notes/route';
import { GET as GET_BY_ID, PUT, DELETE } from '@/app/api/notes/[id]/route';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  __esModule: true,
  default: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/models/Note', () => ({
  __esModule: true,
  default: {
    find: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    create: vi.fn(),
    findOne: vi.fn().mockReturnThis(),
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn(),
  },
}));

describe('Notes API', () => {
  describe('GET /api/notes', () => {
    it('should return 400 if userId is missing', async () => {
      const request = new Request('http://localhost/api/notes');
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('User ID is required');
    });

    it('should return notes for valid userId', async () => {
      const mockNotes = [
        { _id: '1', title: 'Test Note', content: 'Content', userId: 'user1' },
        { _id: '2', title: 'Another Note', content: 'More content', userId: 'user1' },
      ];

      const Note = (await import('@/models/Note')).default;
      vi.mocked(Note.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(mockNotes),
        }),
      } as any);

      const request = new Request('http://localhost/api/notes?userId=user1');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockNotes);
    });

    it('should filter notes by archived status', async () => {
      const Note = (await import('@/models/Note')).default;
      vi.mocked(Note.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      const request = new Request('http://localhost/api/notes?userId=user1&archived=true');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should filter notes by pinned status', async () => {
      const Note = (await import('@/models/Note')).default;
      vi.mocked(Note.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      const request = new Request('http://localhost/api/notes?userId=user1&pinned=true');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/notes', () => {
    it('should return 400 if userId is missing', async () => {
      const request = new Request('http://localhost/api/notes', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test Note', content: 'Content' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('User ID is required');
    });

    it('should return 400 if title exceeds 200 characters', async () => {
      const longTitle = 'a'.repeat(201);
      const request = new Request('http://localhost/api/notes', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user1', title: longTitle }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('200 characters');
    });

    it('should return 400 if content exceeds 5000 characters', async () => {
      const longContent = 'a'.repeat(5001);
      const request = new Request('http://localhost/api/notes', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user1', content: longContent }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('5000 characters');
    });

    it('should create note with default title if not provided', async () => {
      const mockNote = { _id: '1', title: 'Untitled Note', content: '', userId: 'user1' };

      const Note = (await import('@/models/Note')).default;
      vi.mocked(Note.create as any).mockResolvedValue(mockNote);

      const request = new Request('http://localhost/api/notes', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user1' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.title).toBe('Untitled Note');
    });

    it('should create note with provided title and content', async () => {
      const mockNote = { _id: '1', title: 'My Note', content: 'Note content', userId: 'user1' };

      const Note = (await import('@/models/Note')).default;
      vi.mocked(Note.create as any).mockResolvedValue(mockNote);

      const request = new Request('http://localhost/api/notes', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user1', title: 'My Note', content: 'Note content' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockNote);
    });
  });
});

describe('Note [id] API', () => {
  describe('GET /api/notes/[id]', () => {
    it('should return 400 if userId is missing', async () => {
      const request = new Request('http://localhost/api/notes/123');
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: '123' }) });

      expect(response.status).toBe(400);
    });

    it('should return 404 if note not found', async () => {
      const Note = (await import('@/models/Note')).default;
      vi.mocked(Note.findOne).mockResolvedValue(null);

      const request = new Request('http://localhost/api/notes/123?userId=user1');
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: '123' }) });

      expect(response.status).toBe(404);
    });

    it('should return note if found', async () => {
      const mockNote = { _id: '123', title: 'Test', content: 'Content', userId: 'user1' };

      const Note = (await import('@/models/Note')).default;
      vi.mocked(Note.findOne).mockResolvedValue(mockNote);

      const request = new Request('http://localhost/api/notes/123?userId=user1');
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: '123' }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockNote);
    });
  });

  describe('PUT /api/notes/[id]', () => {
    it('should return 400 if userId is missing', async () => {
      const request = new Request('http://localhost/api/notes/123', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
      expect(response.status).toBe(400);
    });

    it('should return 400 if title exceeds limit', async () => {
      const longTitle = 'a'.repeat(201);
      const request = new Request('http://localhost/api/notes/123', {
        method: 'PUT',
        body: JSON.stringify({ userId: 'user1', title: longTitle }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
      expect(response.status).toBe(400);
    });

    it('should return 400 if content exceeds limit', async () => {
      const longContent = 'a'.repeat(5001);
      const request = new Request('http://localhost/api/notes/123', {
        method: 'PUT',
        body: JSON.stringify({ userId: 'user1', content: longContent }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
      expect(response.status).toBe(400);
    });

    it('should return 404 if note not found', async () => {
      const Note = (await import('@/models/Note')).default;
      vi.mocked(Note.findOneAndUpdate).mockResolvedValue(null);

      const request = new Request('http://localhost/api/notes/123', {
        method: 'PUT',
        body: JSON.stringify({ userId: 'user1', title: 'Updated' }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
      expect(response.status).toBe(404);
    });

    it('should update note successfully', async () => {
      const updatedNote = { _id: '123', title: 'Updated', content: 'New content', userId: 'user1' };

      const Note = (await import('@/models/Note')).default;
      vi.mocked(Note.findOneAndUpdate).mockResolvedValue(updatedNote);

      const request = new Request('http://localhost/api/notes/123', {
        method: 'PUT',
        body: JSON.stringify({ userId: 'user1', title: 'Updated', content: 'New content' }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(updatedNote);
    });

    it('should update isPinned status', async () => {
      const updatedNote = { _id: '123', isPinned: true, userId: 'user1' };

      const Note = (await import('@/models/Note')).default;
      vi.mocked(Note.findOneAndUpdate).mockResolvedValue(updatedNote);

      const request = new Request('http://localhost/api/notes/123', {
        method: 'PUT',
        body: JSON.stringify({ userId: 'user1', isPinned: true }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
      expect(response.status).toBe(200);
    });

    it('should update isArchived status', async () => {
      const updatedNote = { _id: '123', isArchived: true, userId: 'user1' };

      const Note = (await import('@/models/Note')).default;
      vi.mocked(Note.findOneAndUpdate).mockResolvedValue(updatedNote);

      const request = new Request('http://localhost/api/notes/123', {
        method: 'PUT',
        body: JSON.stringify({ userId: 'user1', isArchived: true }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /api/notes/[id]', () => {
    it('should return 400 if userId is missing', async () => {
      const request = new Request('http://localhost/api/notes/123', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '123' }) });
      expect(response.status).toBe(400);
    });

    it('should return 404 if note not found', async () => {
      const Note = (await import('@/models/Note')).default;
      vi.mocked(Note.findOneAndDelete).mockResolvedValue(null);

      const request = new Request('http://localhost/api/notes/123?userId=user1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '123' }) });
      expect(response.status).toBe(404);
    });

    it('should delete note successfully', async () => {
      const Note = (await import('@/models/Note')).default;
      vi.mocked(Note.findOneAndDelete).mockResolvedValue({ _id: '123' });

      const request = new Request('http://localhost/api/notes/123?userId=user1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '123' }) });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });
});