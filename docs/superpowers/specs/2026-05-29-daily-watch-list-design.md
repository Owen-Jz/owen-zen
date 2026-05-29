# Daily Watch List — Design Spec
**Date:** 2026-05-29

## Overview

A dedicated left sidebar section on the Owen Zen dashboard where the user can maintain a curated list of motivational/identity-affirming videos to watch every morning. No tracking, no streaks — just a clean, always-available playlist.

## Goals

- Give the user a single place to see and play their daily motivational videos
- Support YouTube and Instagram reel URLs
- Allow adding and removing videos without touching code

## Non-Goals

- Daily completion tracking or streaks
- Video categories or tags
- Watch history

## Architecture

### Data Model

New Mongoose model: `DailyVideo`

```typescript
{
  title: string        // user-provided label
  url: string          // original YouTube or Instagram URL
  platform: 'youtube' | 'instagram'  // derived on save
  embedId: string      // YouTube video ID or Instagram shortcode
  order: number        // display order
  createdAt: Date
}
```

### API Routes

- `GET  /api/daily-videos`       — fetch all videos ordered by `order`
- `POST /api/daily-videos`       — add a new video (extract embedId from URL)
- `DELETE /api/daily-videos/[id]` — remove a video

### Component

`src/components/DailyWatchList.tsx`

- Fetches videos via React Query
- Renders a responsive grid of embedded players
  - YouTube: standard `<iframe>` with `youtube.com/embed/:id`
  - Instagram: blockquote embed + Instagram embed script loaded once
- "Add Video" form at the top: URL input + title input + submit
- Delete (×) button on each video card
- Pre-seeded with the two provided Instagram reels on first load (handled via API seed or initial DB insert)

### Dashboard Integration

1. Add sidebar entry in `page.tsx` under an appropriate section (Routines or Tools)
2. Dynamic import of `DailyWatchList`
3. Conditional render: `{activeTab === "daily-watch-list" && <DailyWatchList />}`

## Pre-loaded Videos

| Title | URL |
|-------|-----|
| Who I Am — Reel 1 | https://www.instagram.com/reel/DYyLMbSz1wa/ |
| Who I Am — Reel 2 | https://www.instagram.com/reel/DVo8vmIjfLL/ |

## URL Parsing Logic

- **YouTube**: extract `v=` param or `/youtu.be/:id` shortlink → embedId
- **Instagram**: extract shortcode from `/reel/:shortcode/` → embedId

## Tech Notes

- Instagram embeds require `window.instgrm.Embeds.process()` after DOM insert; load the script once via `useEffect`
- Instagram embeds only work for public posts
- No auth required for either platform
