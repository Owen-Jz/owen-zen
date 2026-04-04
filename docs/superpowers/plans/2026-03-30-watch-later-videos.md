# Watch Later Videos — Persistence + Topic Tags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add MongoDB persistence and topic tags (Technology, Business, Communication) to the Watch Later Videos section, replacing local state with React Query + API calls.

**Architecture:** New `WatchLaterVideo` MongoDB model. CRUD API routes at `/api/watch-later`. `VideosSection` refactored to use React Query hooks instead of local state. Topic filter UI added alongside existing format filter.

**Tech Stack:** Next.js App Router, Mongoose, React Query (`@tanstack/react-query`), existing `extractVideoId()` helper reused.

---

## File Map

| File | Role |
|------|------|
| `src/models/WatchLaterVideo.ts` | New Mongoose model |
| `src/app/api/watch-later/route.ts` | GET all + POST create |
| `src/app/api/watch-later/[id]/route.ts` | PUT update + DELETE |
| `src/__tests__/api/watch-later.test.ts` | API route tests |
| `src/components/WatchLaterView.tsx` | VideosSection refactor + topic filter |

---

## Task 1: Create WatchLaterVideo Model

**Files:**
- Create: `src/models/WatchLaterVideo.ts`
- No test file (model integration tested via API tests)

- [ ] **Step 1: Create the model file**

```typescript
import mongoose from 'mongoose';

const WatchLaterVideoSchema = new mongoose.Schema({
  url: {
    type: String,
    required: [true, 'Please provide a YouTube URL.'],
  },
  title: {
    type: String,
    maxlength: [500, 'Title cannot be more than 500 characters'],
  },
  format: {
    type: String,
    enum: ['tutorial', 'entertainment', 'documentary', 'music', 'podcast', 'other'],
    default: 'other',
  },
  topics: {
    type: [String],
    enum: ['technology', 'business', 'communication'],
    default: [],
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.WatchLaterVideo || mongoose.model('WatchLaterVideo', WatchLaterVideoSchema);
```

- [ ] **Step 2: Commit**

```bash
git add src/models/WatchLaterVideo.ts
git commit -m "feat: add WatchLaterVideo mongoose model"
```

---

## Task 2: Create API Routes — GET and POST

**Files:**
- Create: `src/app/api/watch-later/route.ts`
- Test: `src/__tests__/api/watch-later.test.ts`

- [ ] **Step 1: Write API route tests**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/watch-later/route';
import { GET as GET_BY_ID, PUT, DELETE } from '@/app/api/watch-later/[id]/route';

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
    findOne: vi.fn().mockReturnThis(),
    findById: vi.fn().mockReturnThis(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
    deleteOne: vi.fn(),
  },
}));

const mockVideo = {
  _id: 'video1',
  url: 'https://www.youtube.com/watch?v=KmXfxcGhJDE',
  title: 'Test Video',
  format: 'tutorial',
  topics: ['technology'],
  createdAt: new Date(),
};

describe('Watch Later API', () => {
  describe('GET /api/watch-later', () => {
    it('should return all videos sorted by createdAt desc', async () => {
      const WatchLaterVideo = (await import('@/models/WatchLaterVideo')).default;
      vi.mocked(WatchLaterVideo.find).mockReturnValue({
        sort: vi.fn().mockResolvedValue([mockVideo]),
      } as any);

      const request = new Request('http://localhost/api/watch-later');
      const response = await GET(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual([mockVideo]);
    });
  });

  describe('POST /api/watch-later', () => {
    it('should create a video with valid data', async () => {
      const WatchLaterVideo = (await import('@/models/WatchLaterVideo')).default;
      vi.mocked(WatchLaterVideo.create).mockResolvedValue(mockVideo);

      const request = new Request('http://localhost/api/watch-later', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://www.youtube.com/watch?v=KmXfxcGhJDE',
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

    it('should return 400 for invalid YouTube URL', async () => {
      const request = new Request('http://localhost/api/watch-later', {
        method: 'POST',
        body: JSON.stringify({ url: 'not-a-youtube-url', format: 'tutorial' }),
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/__tests__/api/watch-later.test.ts`
Expected: FAIL — routes don't exist yet

- [ ] **Step 3: Create the API route file**

```typescript
import dbConnect from "@/lib/db";
import WatchLaterVideo from "@/models/WatchLaterVideo";
import { NextResponse } from "next/server";

const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

export async function GET() {
  try {
    await dbConnect();
    const videos = await WatchLaterVideo.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: videos });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { url, title, format, topics } = body;

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ success: false, error: 'Invalid YouTube URL' }, { status: 400 });
    }

    const video = await WatchLaterVideo.create({
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: title || undefined,
      format: format || 'other',
      topics: topics || [],
    });

    return NextResponse.json({ success: true, data: video }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 400 });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/__tests__/api/watch-later.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/watch-later/route.ts src/__tests__/api/watch-later.test.ts
git commit -m "feat: add GET and POST /api/watch-later routes"
```

---

## Task 3: Create API Routes — PUT and DELETE

**Files:**
- Create: `src/app/api/watch-later/[id]/route.ts`
- Test additions to `src/__tests__/api/watch-later.test.ts`

- [ ] **Step 1: Add PUT and DELETE tests to existing test file**

Add to the existing `src/__tests__/api/watch-later.test.ts`:

```typescript
  describe('PUT /api/watch-later/[id]', () => {
    it('should update video format and topics', async () => {
      const WatchLaterVideo = (await import('@/models/WatchLaterVideo')).default;
      const updated = { ...mockVideo, format: 'podcast', topics: ['business'] };
      vi.mocked(WatchLaterVideo.findByIdAndUpdate).mockResolvedValue(updated);

      const request = new Request('http://localhost/api/watch-later/video1', {
        method: 'PUT',
        body: JSON.stringify({ format: 'podcast', topics: ['business'] }),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'video1' }) });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.format).toBe('podcast');
      expect(data.data.topics).toEqual(['business']);
    });

    it('should return 404 if video not found', async () => {
      const WatchLaterVideo = (await import('@/models/WatchLaterVideo')).default;
      vi.mocked(WatchLaterVideo.findByIdAndUpdate).mockResolvedValue(null);

      const request = new Request('http://localhost/api/watch-later/nonexistent', {
        method: 'PUT',
        body: JSON.stringify({ format: 'podcast' }),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'nonexistent' }) });
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/watch-later/[id]', () => {
    it('should delete a video', async () => {
      const WatchLaterVideo = (await import('@/models/WatchLaterVideo')).default;
      vi.mocked(WatchLaterVideo.findByIdAndDelete).mockResolvedValue(mockVideo);

      const request = new Request('http://localhost/api/watch-later/video1', { method: 'DELETE' });
      const response = await DELETE(request, { params: Promise.resolve({ id: 'video1' }) });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should return 404 if video not found', async () => {
      const WatchLaterVideo = (await import('@/models/WatchLaterVideo')).default;
      vi.mocked(WatchLaterVideo.findByIdAndDelete).mockResolvedValue(null);

      const request = new Request('http://localhost/api/watch-later/nonexistent', { method: 'DELETE' });
      const response = await DELETE(request, { params: Promise.resolve({ id: 'nonexistent' }) });
      expect(response.status).toBe(404);
    });
  });
```

Import `PUT` and `DELETE` at the top of the test file:
```typescript
import { GET as GET_BY_ID, PUT, DELETE } from '@/app/api/watch-later/[id]/route';
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/__tests__/api/watch-later.test.ts`
Expected: FAIL — route file doesn't exist yet

- [ ] **Step 3: Create the dynamic route file**

```typescript
import dbConnect from "@/lib/db";
import WatchLaterVideo from "@/models/WatchLaterVideo";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const { format, topics, title } = body;

    const video = await WatchLaterVideo.findByIdAndUpdate(
      id,
      { $set: { ...(format && { format }), ...(topics && { topics }), ...(title !== undefined && { title }) } },
      { new: true, runValidators: true }
    );

    if (!video) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: video });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const video = await WatchLaterVideo.findByIdAndDelete(id);

    if (!video) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 400 });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/__tests__/api/watch-later.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/watch-later/[id]/route.ts src/__tests__/api/watch-later.test.ts
git commit -m "feat: add PUT and DELETE /api/watch-later/[id] routes"
```

---

## Task 4: Refactor VideosSection — React Query + Topic Filter

**Files:**
- Modify: `src/components/WatchLaterView.tsx`

This is a large refactor. Read the full current file first, then apply the changes below.

Key changes:
1. Import `useQuery`, `useMutation`, `useQueryClient` from `@tanstack/react-query`
2. Replace local `useState<Video[]>` with `useQuery` fetching from `/api/watch-later`
3. Replace local `addVideo`/`deleteVideo`/`updateCategory` with `useMutation` calls + `queryClient.invalidateQueries`
4. Add `useState<string[]>` for selected topic filters
5. Add topic pill UI below format filter tabs
6. Client-side filter combining format + topic (AND logic on topics)
7. Remove hardcoded sample videos from state

The `VideosSection` component should look like this after refactor (imports + query/mutation setup):

```typescript
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ExternalLink, Play, ChevronDown } from "lucide-react";
// ... existing imports

const VIDEO_CATEGORY_CONFIG: Record<VideoCategory, { label: string; color: string }> = {
  tutorial: { label: "Tutorial", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  entertainment: { label: "Entertainment", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  documentary: { label: "Documentary", color: "bg-green-500/15 text-green-400 border-green-500/30" },
  music: { label: "Music", color: "bg-pink-500/15 text-pink-400 border-pink-500/30" },
  podcast: { label: "Podcast", color: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  other: { label: "Other", color: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
};

const TOPIC_CONFIG: Record<string, { label: string; color: string }> = {
  technology: { label: "Technology", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  business: { label: "Business", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  communication: { label: "Communication", color: "bg-violet-500/15 text-violet-400 border-violet-500/30" },
};

// extractVideoId and getDomain helpers stay the same

// VideoCard — add topic pills below category pill
// (add to existing VideoCard's content section, after category selector)
{
  video.topics.length > 0 && (
    <div className="flex flex-wrap gap-1.5">
      {video.topics.map((topic) => {
        const cfg = TOPIC_CONFIG[topic] ?? { label: topic, color: "bg-gray-500/15 text-gray-400 border-gray-500/30" };
        return (
          <span key={topic} className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${cfg.color}`}>
            {cfg.label}
          </span>
        );
      })}
    </div>
  )
}

// VideosSection — full refactor
const VideosSection = () => {
  const queryClient = useQueryClient();

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['watch-later-videos'],
    queryFn: async () => {
      const res = await fetch('/api/watch-later');
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
  });

  const addVideoMutation = useMutation({
    mutationFn: async (data: { url: string; title?: string; format: VideoCategory; topics?: string[] }) => {
      const res = await fetch('/api/watch-later', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watch-later-videos'] }),
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/watch-later/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watch-later-videos'] }),
  });

  const updateVideoMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; format?: VideoCategory; topics?: string[]; title?: string }) => {
      const res = await fetch(`/api/watch-later/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watch-later-videos'] }),
  });

  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoCategory, setNewVideoCategory] = useState<VideoCategory>("other");
  const [newVideoTopics, setNewVideoTopics] = useState<string[]>([]);
  const [formatFilter, setFormatFilter] = useState<VideoCategory | "all">("all");
  const [topicFilter, setTopicFilter] = useState<string[]>([]);

  const addVideo = () => {
    if (!newVideoUrl.trim()) return;
    const videoId = extractVideoId(newVideoUrl);
    if (!videoId) {
      alert("Invalid YouTube URL");
      return;
    }
    addVideoMutation.mutate({
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: newVideoTitle.trim() || undefined,
      format: newVideoCategory,
      topics: newVideoTopics,
    });
    setNewVideoUrl("");
    setNewVideoTitle("");
    setNewVideoCategory("other");
    setNewVideoTopics([]);
  };

  const deleteVideo = (id: string) => deleteVideoMutation.mutate(id);

  const updateFormat = (id: string, format: VideoCategory) =>
    updateVideoMutation.mutate({ id, format });

  const updateTopics = (id: string, topics: string[]) =>
    updateVideoMutation.mutate({ id, topics });

  // Toggle topic filter
  const toggleTopicFilter = (topic: string) => {
    setTopicFilter((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  // Filter: format + topic (AND)
  const filtered = videos.filter((v: any) => {
    const formatMatch = formatFilter === "all" || v.format === formatFilter;
    const topicMatch = topicFilter.length === 0 || topicFilter.every((t) => v.topics?.includes(t));
    return formatMatch && topicMatch;
  });

  const counts = {
    all: videos.length,
    tutorial: videos.filter((v: any) => v.format === "tutorial").length,
    entertainment: videos.filter((v: any) => v.format === "entertainment").length,
    documentary: videos.filter((v: any) => v.format === "documentary").length,
    music: videos.filter((v: any) => v.format === "music").length,
    podcast: videos.filter((v: any) => v.format === "podcast").length,
    other: videos.filter((v: any) => v.format === "other").length,
  };

  const topicCounts = {
    technology: videos.filter((v: any) => v.topics?.includes("technology")).length,
    business: videos.filter((v: any) => v.topics?.includes("business")).length,
    communication: videos.filter((v: any) => v.topics?.includes("communication")).length,
  };

  return (
    <div>
      {/* Add video form — add topics selector */}
      <div className="mb-8 bg-surface border border-border rounded-2xl p-6">
        <h2 className="text-base font-bold mb-4 flex items-center gap-2">
          <Play size={16} className="text-primary" /> Add YouTube Video
        </h2>
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addVideo()}
              placeholder="Paste YouTube URL..."
              className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
            />
            <button
              onClick={addVideo}
              disabled={addVideoMutation.isPending}
              className="px-6 py-3 bg-primary text-white rounded-xl hover:brightness-110 transition-all flex items-center gap-2 font-medium text-sm disabled:opacity-50"
            >
              <Plus size={16} />
              {addVideoMutation.isPending ? "Adding..." : "Add"}
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              value={newVideoTitle}
              onChange={(e) => setNewVideoTitle(e.target.value)}
              placeholder="Video title... optional"
              className="flex-1 min-w-[200px] bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
            />
            <select
              value={newVideoCategory}
              onChange={(e) => setNewVideoCategory(e.target.value as VideoCategory)}
              className="bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none text-gray-300"
            >
              {(Object.entries(VIDEO_CATEGORY_CONFIG) as [VideoCategory, typeof VIDEO_CATEGORY_CONFIG[VideoCategory]][]).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
          {/* Topic selector */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500 mr-1">Topics:</span>
            {Object.entries(TOPIC_CONFIG).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setNewVideoTopics((prev) =>
                  prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
                )}
                className={`inline-flex items-center text-xs px-3 py-1.5 rounded-full border transition-all ${
                  newVideoTopics.includes(key) ? val.color : "bg-transparent border-border text-gray-500"
                }`}
              >
                {newVideoTopics.includes(key) ? "✓ " : ""}{val.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Format filter — unchanged */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(["all", "tutorial", "entertainment", "documentary", "music", "podcast", "other"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFormatFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border ${
              formatFilter === f
                ? "bg-primary text-white border-primary"
                : "border-border text-gray-400 hover:text-white hover:border-primary/40 bg-surface"
            }`}
          >
            {f === "all" ? "All" : VIDEO_CATEGORY_CONFIG[f].label}
            <span className="ml-1.5 opacity-60">{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* Topic filter */}
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <span className="text-xs text-gray-500 mr-1">Topic:</span>
        {Object.entries(TOPIC_CONFIG).map(([key, val]) => (
          <button
            key={key}
            onClick={() => toggleTopicFilter(key)}
            className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
              topicFilter.includes(key) ? val.color : "border-border text-gray-500 hover:border-primary/40"
            }`}
          >
            {topicFilter.includes(key) ? "✓ " : ""}{val.label}
            <span className="opacity-60">({topicCounts[key]})</span>
          </button>
        ))}
        {topicFilter.length > 0 && (
          <button
            onClick={() => setTopicFilter([])}
            className="text-xs text-gray-500 hover:text-white px-2 py-1 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Loading / Grid / Empty */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Play size={24} className="text-gray-500" />
          </div>
          <p className="text-gray-400">Loading videos...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((video: any) => (
            <VideoCard
              key={video._id}
              video={{ ...video, id: video._id }}
              onDelete={deleteVideo}
              onCategoryChange={updateFormat}
              onTopicsChange={updateTopics}
              topicConfig={TOPIC_CONFIG}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
            <Play size={24} className="text-gray-500" />
          </div>
          <p className="text-gray-400 text-lg mb-2">No videos here</p>
          <p className="text-gray-600 text-sm">Add YouTube videos to watch later</p>
        </div>
      )}
    </div>
  );
};
```

**VideoCard changes:** Update signature to include `onTopicsChange` and `topicConfig`, and render topic pills:

```typescript
const VideoCard = ({
  video,
  onDelete,
  onCategoryChange,
  onTopicsChange,   // NEW
  topicConfig,      // NEW
}: {
  video: Video;
  onDelete: (id: string) => void;
  onCategoryChange: (id: string, category: VideoCategory) => void;
  onTopicsChange: (id: string, topics: string[]) => void;  // NEW
  topicConfig: Record<string, { label: string; color: string }>;  // NEW
}) => {
  // In the card content, add topic pills display:
  {video.topics?.length > 0 && (
    <div className="flex flex-wrap gap-1.5">
      {video.topics.map((topic: string) => {
        const cfg = topicConfig[topic] ?? { label: topic, color: "bg-gray-500/15 text-gray-400 border-gray-500/30" };
        return (
          <span key={topic} className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${cfg.color}`}>
            {cfg.label}
          </span>
        );
      })}
    </div>
  )}
};
```

- [ ] **Step 1: Modify WatchLaterView.tsx — apply all changes above**
- [ ] **Step 2: Run lint to check for errors**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Test manually — start dev server and verify**

Run: `npm run dev`
Navigate to the Watch Later section, add a video, refresh the page — it should persist.

- [ ] **Step 4: Commit**

```bash
git add src/components/WatchLaterView.tsx
git commit -m "feat: refactor VideosSection to use React Query with MongoDB persistence and topic tags"
```

---

## Spec Coverage Check

| Spec Requirement | Task |
|-----------------|------|
| WatchLaterVideo MongoDB model | Task 1 |
| GET /api/watch-later | Task 2 |
| POST /api/watch-later | Task 2 |
| PUT /api/watch-later/[id] | Task 3 |
| DELETE /api/watch-later/[id] | Task 3 |
| React Query refactor (VideosSection) | Task 4 |
| Topic filter UI (Technology, Business, Communication) | Task 4 |
| AND filter logic for multiple topics | Task 4 |
| Topic pills on VideoCard | Task 4 |
| Format filter tabs unchanged | Task 4 |
| Notes field per video | Not implemented (out of scope per spec) |
| Watch status tracking | Not implemented (out of scope per spec) |

The Movies section was explicitly out of scope. All Videos requirements are covered.
