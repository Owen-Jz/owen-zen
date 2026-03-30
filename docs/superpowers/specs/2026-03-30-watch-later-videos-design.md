# Watch Later Videos — Persistence + Topic Tags

## Context

The `WatchLaterView` component has a Videos section that tracks YouTube videos. Currently it uses pure local React state — no MongoDB persistence. Videos survive only until page refresh.

The user wants:
1. **MongoDB persistence** — videos survive page refreshes
2. **Topic tags** — Technology, Business, Communication — as additional metadata
3. **Keep existing format categories** (Tutorial, Entertainment, Documentary, Music, Podcast, Other)
4. **Videos can have both** a topic and a format simultaneously
5. **AND filter logic** — selecting multiple topics narrows results (video must have all selected topics)

## Design

### Data Model

New model: `WatchLaterVideo`

```typescript
{
  _id: ObjectId,
  url: string,           // YouTube URL (required, validated)
  title?: string,        // optional display title override
  format: VideoCategory, // "tutorial" | "entertainment" | "documentary" | "music" | "podcast" | "other"
  topics: string[],      // subset of ["technology", "business", "communication"]
  createdAt: Date,
}
```

Video ID extraction from URL continues to work via existing `extractVideoId()` helper.

### API Routes

Follow the existing API pattern in the codebase (`src/app/api/[resource]/route.ts`):

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/watch-later` | List all videos (no params needed) |
| POST | `/api/watch-later` | Create video |
| PUT | `/api/watch-later/[id]` | Update video (format, topics, title) |
| DELETE | `/api/watch-later/[id]` | Delete video |

Response shape: `{ success: boolean, data?: any, error?: any }` with appropriate HTTP status codes.

Validation:
- `url` — must be valid YouTube URL (reuse `extractVideoId` to validate)
- `format` — must be one of the 6 valid categories
- `topics` — each must be one of: "technology", "business", "communication"

### VideosSection Refactor

Replace local `useState<Video[]>` with React Query (`useQuery`, `useMutation`) calling the API routes. Optimistic updates on mutations for smooth UX.

`addVideo` → POST mutation → invalidate list query
`deleteVideo` → DELETE mutation → invalidate list query
`updateFormat` → PUT mutation → invalidate list query
`updateTopics` → PUT mutation → invalidate list query

Existing sample data in local state is removed — component fetches from API on mount.

### Filter UI

**Format filter** — existing tabs unchanged (All / Tutorial / Entertainment / Documentary / Music / Podcast / Other).

**Topic filter** — new pill group below format tabs:
- Three pills: `[Technology]  [Business]  [Communication]`
- Toggle on/off on click
- Multiple can be active simultaneously

**Filter logic (AND):**
- Format filter narrows to format category (or all)
- Topic filter: if any topics selected, only show videos whose `topics` array contains **all** selected topics
- No topics selected = show all topics

Example: format "All" + topics ["Technology", "Business"] → only videos tagged with both Technology AND Business.

### Component Changes

`VideoCard` — add topic pills display below the category pill:
```
[Technology] [Business]
```
Clicking a topic pill on the card does NOT trigger filter — just display. The topic pill in the card footer is for visual confirmation only.

`VideosSection` — add topic filter state (`useState<string[]>`), topic toggle handler, pass topics to filter query or filter client-side (since all videos are fetched in one query, client-side filter is acceptable).

### File Changes

| File | Change |
|------|--------|
| `src/models/WatchLaterVideo.ts` | New model |
| `src/app/api/watch-later/route.ts` | GET + POST handlers |
| `src/app/api/watch-later/[id]/route.ts` | PUT + DELETE handlers |
| `src/components/WatchLaterView.tsx` | VideosSection refactor to React Query + topic filter |

## Out of Scope

- Movie section changes (keeps local state)
- Bulk import / export
- Video metadata auto-fetch (e.g., title from YouTube API) — title entered manually
- Changing video URL after creation (URL is immutable on update)
