import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT } from '@/app/api/canvas/route';
import { POST } from '@/app/api/canvas/nodes/route';
import { DELETE } from '@/app/api/canvas/nodes/[id]/route';

vi.mock('@/lib/db', () => ({ default: vi.fn().mockResolvedValue(true) }));

vi.mock('@/models/Canvas', () => ({
  __esModule: true,
  default: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    create: vi.fn(),
  },
}));

describe('Canvas API', () => {
  describe('GET /api/canvas', () => {
    it('returns existing canvas', async () => {
      const mockCanvas = { _id: '1', viewport: { x: 0, y: 0, zoom: 1 }, nodes: [], edges: [] };
      const Canvas = (await import('@/models/Canvas')).default;
      vi.mocked(Canvas.findOne).mockResolvedValue(mockCanvas);

      const response = await GET();
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockCanvas);
    });

    it('creates default canvas if none exists', async () => {
      const Canvas = (await import('@/models/Canvas')).default;
      vi.mocked(Canvas.findOne).mockResolvedValue(null);
      vi.mocked(Canvas.create).mockResolvedValue({
        viewport: { x: 0, y: 0, zoom: 1 }, nodes: [], edges: [],
      } as any);

      const response = await GET();
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('PUT /api/canvas', () => {
    it('saves canvas state', async () => {
      const Canvas = (await import('@/models/Canvas')).default;
      vi.mocked(Canvas.findOneAndUpdate).mockResolvedValue({} as any);

      const body = {
        viewport: { x: 10, y: 20, zoom: 0.5 },
        nodes: [{ id: 'n1', type: 'idea', position: { x: 0, y: 0 }, data: { content: 'test', color: '#f97316', labels: [] } }],
        edges: [],
      };
      const response = await PUT(new Request('http://localhost/api/canvas', {
        method: 'PUT',
        body: JSON.stringify(body),
      }));
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });
});
