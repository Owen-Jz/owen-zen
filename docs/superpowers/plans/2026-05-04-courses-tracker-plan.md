# Courses Tracker — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standalone courses page at `/courses` with status filtering, sorting, and full CRUD via modal.

**Architecture:** React component with local state (no React Query needed for this scope), Framer Motion animations, Lucide icons. Page is lazy-loaded from the main dashboard's tab system.

**Tech Stack:** Next.js App Router, Tailwind CSS v4, Framer Motion, Lucide icons, shadcn/ui primitives (dialog, slider, badge, progress, select, button)

---

## File Inventory

| Action | File |
|--------|------|
| Create | `src/components/CoursesView.tsx` |
| Create | `src/app/courses/page.tsx` |
| Modify | `src/app/page.tsx:265` (add Courses link) |

API routes and Course model already exist — no changes needed.

---

## Task 1: CoursesView Component

**Files:**
- Create: `src/components/CoursesView.tsx`
- Test: none (manual verify)

- [ ] **Step 1: Create CoursesView.tsx**

```tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ExternalLink, Edit2, Trash2, Play, Check, Pause,
  SortAsc, Filter, X
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const cn = (...args: any[]) => clsx(twMerge(...args));

interface Course {
  _id: string;
  title: string;
  url: string;
  platform: string;
  notes: string;
  progress: number;
  status: "watching" | "completed" | "paused";
  createdAt: string;
}

type SortKey = "newest" | "title" | "progress";
type StatusFilter = "all" | "watching" | "completed" | "paused";

const STATUS_COLORS = {
  watching: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  paused: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const STATUS_LABELS = {
  watching: "Watching",
  completed: "Completed",
  paused: "Paused",
};

const EMPTY_FORM: Omit<Course, "_id" | "createdAt"> = {
  title: "",
  url: "",
  platform: "",
  notes: "",
  progress: 0,
  status: "watching",
};

export function CoursesView() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [form, setForm] = useState<Omit<Course, "_id" | "createdAt">>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    try {
      const res = await fetch("/api/courses");
      const json = await res.json();
      if (json.success) setCourses(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = courses
    .filter(c => filter === "all" || c.status === filter)
    .sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "progress") return a.progress - b.progress;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  function openAdd() {
    setEditingCourse(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(course: Course) {
    setEditingCourse(course);
    setForm({ title: course.title, url: course.url, platform: course.platform, notes: course.notes, progress: course.progress, status: course.status });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingCourse(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (editingCourse) {
        const res = await fetch(`/api/courses/${editingCourse._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const json = await res.json();
        if (json.success) {
          setCourses(prev => prev.map(c => c._id === editingCourse._id ? json.data : c));
          closeModal();
        }
      } else {
        const res = await fetch("/api/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const json = await res.json();
        if (json.success) {
          setCourses(prev => [json.data, ...prev]);
          closeModal();
        }
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this course?")) return;
    const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) setCourses(prev => prev.filter(c => c._id !== id));
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Courses</h1>
        <Button onClick={openAdd} className="gap-2">
          <Plus size={16} /> Add Course
        </Button>
      </div>

      {/* Filter + Sort Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-surface border border-white/5 rounded-lg p-1">
          {(["all", "watching", "completed", "paused"] as StatusFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm transition-colors capitalize",
                filter === f ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Sort */}
        <Select value={sort} onValueChange={(v: SortKey) => setSort(v)}>
          <SelectTrigger className="w-40">
            <SortAsc size={14} className="mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="progress">Progress</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          {filter === "all" ? "No courses yet" : `No ${filter} courses`}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map(course => (
              <CourseCard
                key={course._id}
                course={course}
                onEdit={() => openEdit(course)}
                onDelete={() => handleDelete(course._id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Edit Course" : "Add Course"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Course title"
              />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Platform</Label>
              <Input
                value={form.platform}
                onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                placeholder="Udemy, Coursera, YouTube..."
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Progress: {form.progress}%</Label>
              <Slider
                value={[form.progress]}
                onValueChange={([v]) => setForm(f => ({ ...f, progress: v }))}
                min={0}
                max={100}
                step={5}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v: Course["status"]) => setForm(f => ({ ...f, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="watching">Watching</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.title.trim()}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CourseCard({ course, onEdit, onDelete }: { course: Course; onEdit: () => void; onDelete: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="group relative bg-white/5 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors"
    >
      {/* Top row: platform + actions */}
      <div className="flex items-start justify-between mb-3">
        {course.platform && (
          <Badge variant="outline" className="text-xs">
            {course.platform}
          </Badge>
        )}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={onEdit} className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white">
            <Edit2 size={14} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-red-400">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-sm mb-2 line-clamp-2 leading-tight">{course.title}</h3>

      {/* URL */}
      {course.url && (
        <a
          href={course.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mb-3 truncate max-w-full"
        >
          <ExternalLink size={11} />
          <span className="truncate">{course.url.replace(/^https?:\/\//, "").split("/")[0]}</span>
        </a>
      )}

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-400">Progress</span>
          <span className="text-white font-medium">{course.progress}%</span>
        </div>
        <Progress value={course.progress} className="h-1.5" />
      </div>

      {/* Status */}
      <div className="flex items-center justify-between">
        <Badge className={cn("text-xs border", STATUS_COLORS[course.status])}>
          {STATUS_LABELS[course.status]}
        </Badge>
        {course.status === "watching" && <Play size={14} className="text-blue-400" />}
        {course.status === "completed" && <Check size={14} className="text-green-400" />}
        {course.status === "paused" && <Pause size={14} className="text-gray-400" />}
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify file is valid TypeScript**

No runtime step — code review only.

- [ ] **Step 3: Commit**

```bash
git add src/components/CoursesView.tsx
git commit -m "feat(courses): add CoursesView component with filter/sort/CRUD"
```

---

## Task 2: Courses Page

**Files:**
- Create: `src/app/courses/page.tsx`

- [ ] **Step 1: Create courses page**

```tsx
import { CoursesView } from "@/components/CoursesView";

export default function CoursesPage() {
  return <CoursesView />;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/courses/page.tsx
git commit -m "feat(courses): add /courses page route"
```

---

## Task 3: Add Courses to Sidebar

**Files:**
- Modify: `src/app/page.tsx:265`

- [ ] **Step 1: Add Courses link to sidebar**

In `src/app/page.tsx`, find the `linkSections` array. In the **Tools** section (around line 265), add a `courses` entry:

```tsx
{
  title: "Tools",
  links: [
    { id: "inbox", label: "The Inbox", icon: Inbox },
    { id: "sniper", label: "Sniper System", icon: Crosshair },
    { id: "finance", label: "Finance Tracker", icon: Wallet },
    { id: "leads", label: "Leads CRM", icon: Users },
    { id: "prompts", label: "Prompt Library", icon: MessageSquare },
    { id: "courses", label: "Courses", icon: BookOpen },  // ← add this
  ]
},
```

Also add `BookOpen` to the import from `lucide-react` at line 6 if not already present.

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(sidebar): add Courses link to Tools section"
```

---

## Verification

1. `npm run dev` — navigate to `http://localhost:3000/courses`
2. Click "Add Course" → fill form → save → card appears
3. Test filter tabs (All/Watching/Completed/Paused)
4. Test sort dropdown
5. Edit a course → change status/progress → save
6. Delete a course
7. Check sidebar → "Courses" link visible under Tools section