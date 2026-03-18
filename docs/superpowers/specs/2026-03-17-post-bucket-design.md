# Post Bucket Feature Design

**Date:** 2026-03-17
**Feature:** Post Bucket - Staging Area for Post Ideas

---

## 1. Overview

A new **Post Bucket** section in the main dashboard sidebar that acts as a staging area for post ideas. Posts can be dragged from the bucket directly onto the ContentCalendar to visually schedule them for specific dates/times. **No automatic posting** - purely for visual/reference scheduling.

---

## 2. User Flow

1. **Add to Bucket:** Create new post idea → saved with `type: 'idea'` or `type: 'draft'` and no `scheduledFor` date
2. **View Bucket:** See all unscheduled posts in one dedicated view
3. **Drag to Calendar:** Drag a post → drop onto ContentCalendar day → modal opens to select time → post gets `scheduledFor` date
4. **Calendar View:** Scheduled posts appear in ContentCalendar alongside other scheduled posts (read-only visual reference, no auto-post)

---

## 3. UI/UX Specification

### 3.1 Sidebar Integration

- Add new navigation item: **"Post Bucket"** in the **"Planning"** section
- Position: After "Calendar" in the Planning group
- Icon: Inbox or Archive icon (from lucide-react)
- Label: "Post Bucket"

### 3.2 Post Bucket View Layout

```
┌─────────────────────────────────────────────────────────────┐
│  POST BUCKET                              [+ Add Post]      │
│  ────────────────  Filter: [All] [Ideas] [Drafts]         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐  │
│  │ [Platform] [Status]                                  │  │
│  │ Post content preview...                              │  │
│  │                                                     │  │
│  │ [Strategy tag if exists]                            │  │
│  │                                    [Drag Handle] ──► │  │
│  │                                                     │  │
│  │ [Edit] [Delete]                    [Push to Calendar]│  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ [Platform] [Status]                                  │  │
│  │ Post content preview...                              │  │
│  │ ...                                                 │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Components

**PostBucketView:**
- Header with title and "Add Post" button
- Filter tabs: All | Ideas | Drafts
- Search input to find posts
- List of draggable post cards
- Each card shows: platform icons, content preview, type badge, edit/delete actions, drag handle

**Post Card:**
- Draggable (using @dnd-kit)
- Shows platform (Twitter/LinkedIn/Instagram icons)
- Content snippet (truncated to 3 lines)
- Type badge: "Idea" or "Draft"
- Edit button → opens modal to edit content
- Delete button → removes post
- "Push to Calendar" button → opens time picker modal

**Time Picker Modal:**
- Appears when dropping on calendar OR clicking "Push to Calendar"
- Date display (the day selected)
- Time selector (dropdown with 15-min intervals)
- "Schedule" button to confirm

### 3.4 Drag & Drop Behavior

- **Source:** Post Bucket - all posts are draggable
- **Target:** ContentCalendar - any day cell is a drop zone
- **On Drop:**
  1. Open time picker modal with selected date pre-filled
  2. User selects time
  3. Save `scheduledFor` to post
  4. Post moves from "unscheduled" to "scheduled"
  5. Refresh both views

### 3.5 Visual Design

- **Bucket View:** Similar styling to SocialHubView Inspiration Bucket
- **Cards:** Dark surface background, subtle border, hover glow effect
- **Drag State:** Card lifts and rotates slightly when dragging
- **Drop Zone:** Calendar days highlight when dragging over them

---

## 4. Data Model

### Post Schema (Existing - No Changes Needed)

The existing Post model already supports this feature:

```typescript
{
  content: string;           // Post content
  platforms: string[];        // ["twitter", "linkedin", "instagram"]
  type: 'idea' | 'draft';    // idea = bucket, draft = production
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledFor?: Date;       // When scheduled (calendar)
  // ... other fields
}
```

### New API Endpoints

No new API endpoints needed - existing `/api/posts` and `/api/posts/[id]` handle all operations.

---

## 5. Technical Implementation

### 5.1 New Component: PostBucketView

- Location: `src/components/PostBucketView.tsx`
- Dependencies: `@dnd-kit/core`, `@dnd-kit/sortable` (already in project)
- Fetch: GET `/api/posts?type=idea,draft&status=draft` (unscheduled posts)

### 5.2 Integration Points

1. **Sidebar:** Add "post-bucket" to linkSections in page.tsx
2. **ContentCalendar:** Make days droppable zones for posts
3. **State Management:** Use existing posts state or add new state for bucket posts

### 5.3 Component Props

```typescript
interface PostBucketViewProps {
  // Uses existing Post interface from SocialHubView
}
```

---

## 6. Out of Scope (v1)

- **Auto-posting:** No cron jobs or scheduled posting
- **Recurring posts:** Not in initial version
- **Multi-platform scheduling:** Just visual placement
- **Notifications:** No reminders for scheduled posts

---

## 7. Acceptance Criteria

1. ✅ "Post Bucket" appears in sidebar under Planning section
2. ✅ Clicking "Post Bucket" shows all unscheduled posts (no scheduledFor date)
3. ✅ Users can add new posts directly to bucket
4. ✅ Users can edit existing posts in bucket
5. ✅ Users can delete posts from bucket
6. ✅ Posts can be dragged from bucket to calendar
7. ✅ Dropping on calendar opens time picker
8. ✅ Selecting time saves scheduledFor date to post
9. ✅ Scheduled posts appear on Calendar view
10. ✅ Filter tabs work (All | Ideas | Drafts)
11. ✅ No auto-posting happens - purely visual scheduling

---

## 8. Related Components

- `SocialHubView` - existing inspiration bucket (will coexist)
- `ContentCalendar` - target for drag-and-drop
- `Post` model - already has all needed fields
