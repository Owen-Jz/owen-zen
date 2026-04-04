import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST } from '@/app/api/watch-later/route';
import { GET as GET_BY_ID, PUT, DELETE } from '@/app/api/watch-later/[id]/route';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  __esModule: true,
  default: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/models/WatchLaterVideo', () => ({
  __esModule: true,
  default: {
    find: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}));

describe('Watch Later API', () => {
  describe('GET /api/watch-later', () => {
    it('should return all videos sorted by createdAt descending', async () => {
      const mockVideos = [
        { _id: '1', url: 'https://www.youtube.com/watch?v=abc123', title: 'Video 1', format: 'tutorial', topics: ['technology'] },
        { _id: '2', url: 'https://www.youtube.com/watch?v=def456', title: 'Video 2', format: 'other', topics: [] },
      ];

      const WatchLaterVideo = (await import('@/models/WatchLaterVideo')).default;
      vi.mocked(WatchLaterVideo.find).mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockVideos),
      } as any);

      const request = new Request('http://localhost/api/watch-later');
      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockVideos);
    });

    it('should return empty array when no videos exist', async () => {
      const WatchLaterVideo = (await import('@/models/WatchLaterVideo')).default;
      vi.mocked(WatchLaterVideo.find).mockReturnValue({
        sort: vi.fn().mockResolvedValue([]),
      } as any);

      const request = new Request('http://localhost/api/watch-later');
      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });
  });

  describe('POST /api/watch-later', () => {
    it('should create video with valid YouTube URL', async () => {
      const mockVideo = {
        _id: '1',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Test Video',
        format: 'tutorial',
        topics: ['technology'],
      };

      const WatchLaterVideo = (await import('@/models/WatchLaterVideo')).default;
      vi.mocked(WatchLaterVideo.create as any).mockResolvedValue(mockVideo);

      const request = new Request('http://localhost/api/watch-later', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          title: 'Test Video',
          format: 'tutorial',
          topics: ['technology'],
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockVideo);
    });

    it('should create video with default values when optional fields not provided', async () => {
      const mockVideo = {
        _id: '1',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: '',
        format: 'other',
        topics: [],
      };

      const WatchLaterVideo = (await import('@/models/WatchLaterVideo')).default;
      vi.mocked(WatchLaterVideo.create as any).mockResolvedValue(mockVideo);

      const request = new Request('http://localhost/api/watch-later', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should return 400 for missing URL', async () => {
      const request = new Request('http://localhost/api/watch-later', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test Video' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('URL is required');
    });

    it('should return 400 for invalid YouTube URL', async () => {
      const request = new Request('http://localhost/api/watch-later', {
        method: 'POST',
        body: JSON.stringify({ url: 'https://not-a-youtube-url.com/video' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid YouTube URL');
    });

    it('should return 400 for non-YouTube URL', async () => {
      const request = new Request('http://localhost/api/watch-later', {
        method: 'POST',
        body: JSON.stringify({ url: 'https://vimeo.com/video/123' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid YouTube URL');
    });

    it('should normalize YouTube URL to standard format', async () => {
      const mockVideo = {
        _id: '1',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: '',
        format: 'other',
        topics: [],
      };

      const WatchLaterVideo = (await import('@/models/WatchLaterVideo')).default;
      vi.mocked(WatchLaterVideo.create as any).mockResolvedValue(mockVideo);

      // Test with youtu.be short URL
      const request = new Request('http://localhost/api/watch-later', {
        method: 'POST',
        body: JSON.stringify({ url: 'https://youtu.be/dQw4w9WgXcQ' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('PUT /api/watch-later/[id]', () => {
    it('should update format and topics and return updated video', async () => {
      const mockVideo = {
        _id: '1',
        url: 'https://www.youtube.com/watch?v=abc123',
        title: 'Test Video',
        format: 'tutorial',
        topics: ['technology'],
      };

      const updatedVideo = {
        ...mockVideo,
        format: 'entertainment',
        topics: ['business'],
      };

      const WatchLaterVideo = (await import('@/models/WatchLaterVideo')).default;
      vi.mocked(WatchLaterVideo.findByIdAndUpdate).mockResolvedValue(updatedVideo);

      const request = new Request('http://localhost/api/watch-later/1', {
        method: 'PUT',
        body: JSON.stringify({
          format: 'entertainment',
          topics: ['business'],
        }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(updatedVideo);
    });

    it('should return 404 for non-existent id', async () => {
      const WatchLaterVideo = (await import('@/models/WatchLaterVideo')).default;
      vi.mocked(WatchLaterVideo.findByIdAndUpdate).mockResolvedValue(null);

      const request = new Request('http://localhost/api/watch-later/nonexistent', {
        method: 'PUT',
        body: JSON.stringify({ format: 'tutorial' }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: 'nonexistent' }) });
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Video not found');
    });
  });

  describe('DELETE /api/watch-later/[id]', () => {
    it('should delete existing video and return 200', async () => {
      const mockVideo = {
        _id: '1',
        url: 'https://www.youtube.com/watch?v=abc123',
        title: 'Test Video',
        format: 'tutorial',
        topics: ['technology'],
      };

      const WatchLaterVideo = (await import('@/models/WatchLaterVideo')).default;
      vi.mocked(WatchLaterVideo.findByIdAndDelete).mockResolvedValue(mockVideo);

      const request = new Request('http://localhost/api/watch-later/1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockVideo);
    });

    it('should return 404 for non-existent id', async () => {
      const WatchLaterVideo = (await import('@/models/WatchLaterVideo')).default;
      vi.mocked(WatchLaterVideo.findByIdAndDelete).mockResolvedValue(null);

      const request = new Request('http://localhost/api/watch-later/nonexistent', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: 'nonexistent' }) });
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Video not found');
    });
  });
});
