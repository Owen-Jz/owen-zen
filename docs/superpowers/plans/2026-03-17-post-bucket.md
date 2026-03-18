# Post Bucket Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new "Post Bucket" section in the sidebar that displays unscheduled posts and allows drag-and-drop scheduling to the ContentCalendar.

**Architecture:** Create a new PostBucketView component that fetches posts without scheduledFor dates. Use @dnd-kit for drag-and-drop to ContentCalendar. Integrate into existing page.tsx sidebar and routing.

**Tech Stack:** Next.js, React, @dnd-kit/core, @dnd-kit/sortable, lucide-react, MongoDB (existing Post model)

---

## File Structure

```
src/
├── components/
│   └── PostBucketView.tsx    (NEW - main component)
├── app/
│   └── page.tsx              (MODIFY - add sidebar link + routing)
```

---

## Task 1: Create PostBucketView Component

**Files:**
- Create: `src/components/PostBucketView.tsx`
- Reference: `src/components/SocialHubView.tsx` for Post interface and API patterns
- Reference: `src/components/ContentCalendar.tsx` for time picker modal pattern

- [ ] **Step 1: Create PostBucketView.tsx with basic structure**

```tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Edit2, Trash2, GripVertical, Clock, Calendar, Search, Filter, Twitter, Linkedin, Instagram, Send, Loader2, Inbox } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface Post {
  _id: string;
  content: string;
  platforms: string | string[];
  status: string;
  type: 'idea' | 'draft';
  source?: 'manual' | 'ai_curator';
  imageIdea?: string;
  imageUrl?: string;
  scheduledFor?: string;
  createdAt: string;
}

type FilterType = 'all' | 'idea' | 'draft';

export const PostBucketView = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // Form state
  const [content, setContent] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["twitter"]);
  const [strategy, setStrategy] = useState("");
  const [imageIdea, setImageIdea] = useState("");
  const [postType, setPostType] = useState<'idea' | 'draft'>('idea');

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/posts");
      const json = await res.json();
      if (json.success) {
        // Filter to only unscheduled posts (no scheduledFor)
        const unscheduled = json.data.filter((p: Post) => !p.scheduledFor);
        setPosts(unscheduled);
      }
    } catch (error) {
      console.error("Failed to fetch posts", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchesFilter = filter === 'all' || post.type === filter;
    const matchesSearch = post.content.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const openModal = (post?: Post) => {
    if (post) {
      setEditingPost(post);
      setContent(post.content);
      setPlatforms(Array.isArray(post.platforms) ? post.platforms : [post.platforms]);
      setStrategy(post.strategy || "");
      setImageIdea(post.imageIdea || "");
      setPostType(post.type);
    } else {
      setEditingPost(null);
      setContent("");
      setPlatforms(["twitter"]);
      setStrategy("");
      setImageIdea("");
      setPostType('idea');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      content,
      platforms,
      strategy,
      imageIdea,
      type: postType,
      status: "draft"
    };

    try {
      if (editingPost) {
        await fetch(`/api/posts/${editingPost._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setIsModalOpen(false);
      fetchPosts();
    } catch (error) {
      console.error("Failed to save post", error);
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    setPosts(posts.filter(p => p._id !== id));
    try {
      await fetch(`/api/posts/${id}`, { method: "DELETE" });
    } catch (e) {
      console.error("Failed to delete", e);
      fetchPosts();
    }
  };

  const togglePlatform = (p: string) => {
    if (platforms.includes(p)) {
      setPlatforms(platforms.filter(plat => plat !== p));
    } else {
      setPlatforms([...platforms, p]);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case "twitter": return <Twitter size={14} className="text-blue-400" />;
      case "linkedin": return <Linkedin size={14} className="text-blue-600" />;
      case "instagram": return <Instagram size={14} className="text-pink-500" />;
      default: return <div className="text-[10px] font-bold text-gray-500">{platform}</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-140px)]">
        <div className="text-gray-500">Loading posts...</div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto h-[calc(100vh-140px)] animate-in fade-in duration-500 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Inbox size={24} className="text-purple-400" />
            Post Bucket
          </h2>
          <p className="text-gray-400 text-sm">Staging area for unscheduled post ideas.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:brightness-110 transition-all text-sm font-medium"
        >
          <Plus size={16} /> Add Post
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 shrink-0">
        <div className="flex gap-2">
          {(['all', 'idea', 'draft'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all",
                filter === f
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  : "bg-surface border border-border text-gray-400 hover:text-white"
              )}
            >
              {f === 'all' ? 'All' : f + 's'}
            </button>
          ))}
        </div>
        <div className="flex-1 max-w-md relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:border-purple-500 outline-none"
          />
        </div>
        <div className="text-sm text-gray-500">
          {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Posts Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredPosts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-border rounded-xl">
            <Inbox size={40} className="mb-3 opacity-50" />
            <p className="text-sm">No posts in bucket.</p>
            <p className="text-xs mt-1">Add a post to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPosts.map((post) => (
              <motion.div
                key={post._id}
                layout
                className="bg-surface border border-border rounded-xl p-4 hover:border-purple-500/30 transition-all group"
                draggable
                onDragStart={(e) => {
                  (e as any).dataTransfer?.setData('application/json', JSON.stringify(post));
                  (e as any).dataTransfer.effectAllowed = 'move';
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1 p-1 bg-background rounded-lg border border-border">
                      {Array.isArray(post.platforms)
                        ? post.platforms.map(p => <span key={p}>{getPlatformIcon(p)}</span>)
                        : getPlatformIcon(post.platforms)
                      }
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                      post.type === 'idea' ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : "bg-primary/10 border-primary/20 text-primary"
                    )}>
                      {post.type}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal(post)} className="p-1.5 hover:bg-white/5 rounded text-gray-400"><Edit2 size={12} /></button>
                    <button onClick={() => deletePost(post._id)} className="p-1.5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded"><Trash2 size={12} /></button>
                  </div>
                </div>

                {/* Content */}
                <p className="text-sm text-gray-300 line-clamp-3 mb-3 leading-relaxed">
                  {post.content}
                </p>

                {/* Strategy */}
                {post.strategy && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3 bg-background p-2 rounded-lg">
                    <span className="truncate">{post.strategy}</span>
                  </div>
                )}

                {/* Drag hint */}
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <GripVertical size={14} className="cursor-grab" />
                    <span>Drag to calendar</span>
                  </div>
                  <span className="text-[10px] text-gray-600">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-border flex justify-between items-center bg-surface sticky top-0">
                <h3 className="text-lg font-bold text-white">
                  {editingPost ? "Edit Post" : "New Post"}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10"><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar space-y-5">
                {/* Type */}
                <div className="flex gap-2 p-1 bg-background rounded-xl border border-border">
                  <button
                    type="button"
                    onClick={() => setPostType('idea')}
                    className={cn("flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all", postType === 'idea' ? "bg-purple-500 text-white" : "text-gray-500 hover:text-white")}
                  >
                    Idea
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostType('draft')}
                    className={cn("flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all", postType === 'draft' ? "bg-primary text-white" : "text-gray-500 hover:text-white")}
                  >
                    Draft
                  </button>
                </div>

                {/* Platforms */}
                <div>
                  <label className="text-xs uppercase font-bold text-gray-500 mb-2 block">Platforms</label>
                  <div className="flex gap-2">
                    {["twitter", "linkedin", "instagram"].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePlatform(p)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${platforms.includes(p)
                          ? "bg-purple-500/20 border-purple-500 text-purple-400"
                          : "bg-background border-border text-gray-400 hover:text-gray-200"
                          }`}
                      >
                        {getPlatformIcon(p)}
                        <span className="capitalize">{p}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="text-xs uppercase font-bold text-gray-500 mb-2 block">
                    {postType === 'idea' ? 'Rough Notes / Idea' : 'Post Content'}
                  </label>
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder={postType === 'idea' ? "Saw a cool trend about..." : "What's on your mind?"}
                    className="w-full h-32 bg-background border border-border rounded-xl p-4 text-sm text-white focus:border-purple-500 outline-none resize-none"
                    required
                  />
                </div>

                {/* Strategy */}
                <div>
                  <label className="text-xs uppercase font-bold text-gray-500 mb-2 block">Strategy / Goal</label>
                  <input
                    type="text"
                    value={strategy}
                    onChange={e => setStrategy(e.target.value)}
                    placeholder="e.g. Viral Hook, Authority Building"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-white focus:border-purple-500 outline-none"
                  />
                </div>

                {/* Image Idea */}
                <div>
                  <label className="text-xs uppercase font-bold text-gray-500 mb-2 block">Visual Concept (Notes)</label>
                  <input
                    type="text"
                    value={imageIdea}
                    onChange={e => setImageIdea(e.target.value)}
                    placeholder="e.g. Screenshot of dashboard"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-white focus:border-purple-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all"
                >
                  {editingPost ? "Save Changes" : "Add to Bucket"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
```

- [ ] **Step 2: Test component renders**

Run: Start dev server and navigate to check if component is accessible
Expected: Component should render without errors

- [ ] **Step 3: Commit**

```bash
git add src/components/PostBucketView.tsx
git commit -m "feat: add PostBucketView component"
```

---

## Task 2: Add Sidebar Navigation Link

**Files:**
- Modify: `src/app/page.tsx`
  - Add Inbox import (line 6 - check if already imported)
  - Add "post-bucket" to linkSections (after "calendar" in Planning section)
  - Add dynamic import for PostBucketView
  - Add rendering for activeTab === "post-bucket"

- [ ] **Step 1: Check if Inbox icon is already imported**

Search line 6 for "Inbox" - it appears it is already there based on earlier grep result.

- [ ] **Step 2: Add dynamic import for PostBucketView**

Add after line 100 (after MealPlanView dynamic import):

```tsx
const PostBucketView = dynamic(() => import("@/components/PostBucketView").then(mod => ({ default: mod.PostBucketView })), {
  loading: () => <Loading />
});
```

- [ ] **Step 3: Add to linkSections**

In the Planning section (around line 220), add after calendar:

```tsx
{ id: "post-bucket", label: "Post Bucket", icon: Inbox },
```

- [ ] **Step 4: Add rendering for post-bucket tab**

After line 2596 (after ContentCalendar):

```tsx
{activeTab === "post-bucket" && <PostBucketView />}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add Post Bucket to sidebar navigation"
```

---

## Task 3: Enable Drag-and-Drop to ContentCalendar + Show Posts on Calendar

**Files:**
- Modify: `src/components/ContentCalendar.tsx`
  - Add state for posts from Post model
  - Fetch posts with scheduledFor from /api/posts
  - Add onDragOver and onDrop handlers
  - Add drop zone styling to calendar days
  - Display both ContentCalendarPosts AND Posts on calendar

**IMPORTANT ARCHITECTURE NOTE:**
ContentCalendar uses a separate ContentCalendarPost model. The Post model (used by SocialHub/PostBucket) is different. To show scheduled posts on the calendar:
1. Fetch Posts that have `scheduledFor` set from `/api/posts?scheduled=true`
2. Transform them to match ContentCalendar's display format
3. Display alongside native ContentCalendarPosts

- [ ] **Step 1: Add state and fetch for Posts**

Add to ContentCalendar component (around line 110):

```tsx
// Add state for Post model posts
const [posts, setPosts] = useState<any[]>([]);

// Fetch posts with scheduledFor from Post model
const fetchScheduledPosts = useCallback(async () => {
  try {
    const res = await fetch("/api/posts?scheduled=true");
    const json = await res.json();
    if (json.success) {
      setPosts(json.data);
    }
  } catch (error) {
    console.error("Failed to fetch scheduled posts:", error);
  }
}, []);

useEffect(() => {
  fetchScheduledPosts();
}, [fetchScheduledPosts]);
```

- [ ] **Step 2: Update API to support scheduled filter**

The `/api/posts` route needs to support filtering by scheduled status. Check if it does, or add the filter.

In `src/app/api/posts/route.ts`, add support for `?scheduled=true`:

```tsx
// In GET handler, add:
const scheduled = searchParams.get('scheduled');
if (scheduled === 'true') {
  query.scheduledFor = { $exists: true, $ne: null };
}
```

- [ ] **Step 3: Transform and merge posts with calendar data**

In getPostsForDate function (around line 220), add:

```tsx
// Transform Post model posts to calendar format
const scheduledPosts = posts.map(post => ({
  _id: `post-${post._id}`, // Prefix to distinguish from ContentCalendarPost
  network: Array.isArray(post.platforms) ? post.platforms[0] : post.platforms,
  caption: post.content,
  mediaUrls: post.imageUrl ? [{ url: post.imageUrl, type: "image" as const }] : [],
  notes: post.strategy || '',
  scheduledAt: post.scheduledFor,
  status: 'scheduled' as const,
  isFromBucket: true, // Mark as from Post Bucket
  originalPostId: post._id
}));

// Combine with native ContentCalendarPosts
const allPosts = [...nativePosts, ...scheduledPosts];
```

- [ ] **Step 4: Add drag event handlers to ContentCalendar**

Look for the calendar day rendering (around line 600-660 in ContentCalendar.tsx). The day cells need:
1. `onDragOver` to highlight the drop zone
2. `onDrop` to handle the post drop

Add to the calendar day div:

```tsx
onDragOver={(e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}}
onDrop={(e) => {
  e.preventDefault();
  const postData = e.dataTransfer.getData('application/json');
  if (postData) {
    try {
      const post = JSON.parse(postData);
      handlePostDrop(post, d);
    } catch (err) {
      console.error('Failed to parse dropped post', err);
    }
  }
}}
```

- [ ] **Step 5: Add handlePostDrop function**

Add to ContentCalendar component:

```tsx
const handlePostDrop = async (post: any, date: Date) => {
  // Open time picker modal with selected date
  setSelectedDate(date);
  setIsModalOpen(true);
  // Store the post to be scheduled
  setPendingSchedulePost(post);
};

// Add state for pending post (add with other useState)
const [pendingSchedulePost, setPendingSchedulePost] = useState<any>(null);
```

- [ ] **Step 6: Update the save logic to schedule dropped posts**

Modify the savePost function to handle scheduling from Post Bucket:

```tsx
// At start of savePost function, check for pendingSchedulePost
if (pendingSchedulePost) {
  // This is a post from the bucket being scheduled
  const postId = pendingSchedulePost._id;
  const [hours, minutes] = formData.scheduledTime.split(":").map(Number);
  const scheduledDate = new Date(selectedDate!);
  scheduledDate.setHours(hours, minutes, 0, 0);

  // Update the Post's scheduledFor field
  const res = await fetch(`/api/posts/${postId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scheduledFor: scheduledDate.toISOString(),
      status: 'scheduled'
    })
  });

  if (res.ok) {
    // Refresh both calendars and close modal
    await fetchScheduledPosts(); // Refresh posts
    await fetchPosts(); // Refresh native calendar posts
    setPendingSchedulePost(null);
    cancelEdit();
  }
  return;
}
```

- [ ] **Step 7: Commit**

```bash
git add src/components/ContentCalendar.tsx src/app/api/posts/route.ts
git commit -m "feat: add drag-and-drop from Post Bucket to Calendar"
```

---

## Task 4: Verify Integration

**Files:**
- Test: Navigate through the complete flow

- [ ] **Step 1: Test adding a post to bucket**

1. Go to Post Bucket
2. Click "Add Post"
3. Fill in content and select platform
4. Save
5. Verify post appears in grid

- [ ] **Step 2: Test drag to calendar**

1. In Post Bucket, drag a post card
2. Navigate to Calendar (or have both visible if possible)
3. Drop on a calendar day
4. Verify time picker opens
5. Select time and confirm
6. Verify post appears on calendar

- [ ] **Step 3: Test filter and search**

1. Add posts of different types (idea/draft)
2. Test filter buttons
3. Test search functionality

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: complete Post Bucket feature with drag-and-drop scheduling"
```

---

## Summary

This implementation adds:
1. **PostBucketView.tsx** - New component for managing unscheduled posts
2. **Sidebar integration** - Post Bucket appears in Planning section
3. **Drag-and-drop** - Posts can be dragged from bucket to calendar for visual scheduling

The feature does NOT include automatic posting - purely visual/reference scheduling as requested.
