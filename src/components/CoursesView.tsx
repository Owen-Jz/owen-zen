"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  GraduationCap,
  X,
  ChevronDown,
  BookOpen,
  Clock,
  CheckCircle2,
  PauseCircle,
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
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// ─── Types ────────────────────────────────────────────────────────────────────

type CourseStatus = "watching" | "completed" | "paused";

interface Course {
  _id: string;
  title: string;
  url?: string;
  platform?: string;
  thumbnail?: string;
  notes?: string;
  progress: number;
  status: CourseStatus;
  createdAt: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<CourseStatus, { label: string; color: string; icon: React.ReactNode }> = {
  watching: {
    label: "Watching",
    color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    icon: <BookOpen size={12} />,
  },
  completed: {
    label: "Completed",
    color: "bg-green-500/15 text-green-400 border-green-500/30",
    icon: <CheckCircle2 size={12} />,
  },
  paused: {
    label: "Paused",
    color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    icon: <PauseCircle size={12} />,
  },
};

type SortOption = "newest" | "title" | "progress";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "title", label: "Title" },
  { value: "progress", label: "Progress" },
];

// ─── Course Card ───────────────────────────────────────────────────────────────

const CourseCard = ({
  course,
  onEdit,
  onDelete,
}: {
  course: Course;
  onEdit: (course: Course) => void;
  onDelete: (id: string) => void;
}) => {
  const statusCfg = STATUS_CONFIG[course.status];
  const progressColor =
    course.progress === 100
      ? "bg-green-500"
      : course.progress === 0
        ? "bg-gray-500"
        : "bg-primary";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-all group"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-background">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        <div
          className={cn(
            "bg-primary/10 flex items-center justify-center",
            course.thumbnail ? "hidden" : ""
          )}
        >
          <GraduationCap size={24} className="text-primary" />
        </div>
        {course.url && (
          <a
            href={course.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
          >
            <div className="p-3 bg-primary rounded-full">
              <ExternalLink size={18} className="text-white" />
            </div>
          </a>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-snug line-clamp-2">
              {course.title}
            </h3>
            {course.url && (
              <a
                href={course.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1 text-xs text-gray-500 hover:text-primary transition-colors"
              >
                <ExternalLink size={11} />
                {course.platform || new URL(course.url).hostname.replace("www.", "")}
              </a>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => onEdit(course)}
              className="p-2 text-gray-500 hover:text-primary transition-colors"
              title="Edit"
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={() => onDelete(course._id)}
              className="p-2 text-gray-500 hover:text-red-500 transition-colors"
              title="Delete"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Platform badge */}
        {course.platform && (
          <Badge
            variant="outline"
            className="w-fit text-xs border-border text-gray-400"
          >
            {course.platform}
          </Badge>
        )}

        {/* Notes */}
        {course.notes && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
            {course.notes}
          </p>
        )}

        {/* Progress bar */}
        <div className="mt-auto pt-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5 font-medium">
            <span className="flex items-center gap-1">
              <Clock size={11} className="text-primary" /> Progress
            </span>
            <span>{course.progress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${course.progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={cn("h-full rounded-full", progressColor)}
            />
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center justify-between pt-1">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border",
              statusCfg.color
            )}
          >
            {statusCfg.icon}
            {statusCfg.label}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

const CourseCardSkeleton = () => (
  <div className="bg-surface border border-border rounded-2xl overflow-hidden">
    <div className="aspect-video bg-muted animate-pulse" />
    <div className="p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
        </div>
      </div>
      <div className="h-5 bg-muted rounded animate-pulse w-20" />
      <div className="space-y-1.5 pt-2">
        <div className="h-3 bg-muted rounded animate-pulse w-full" />
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-muted rounded-full animate-pulse w-1/2" />
        </div>
      </div>
    </div>
  </div>
);

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────

const CourseModal = ({
  course,
  onClose,
  onSave,
}: {
  course: Course | null;
  onClose: () => void;
  onSave: (course: Course) => void;
}) => {
  const [title, setTitle] = useState(course?.title || "");
  const [url, setUrl] = useState(course?.url || "");
  const [platform, setPlatform] = useState(course?.platform || "");
  const [notes, setNotes] = useState(course?.notes || "");
  const [progress, setProgress] = useState(course?.progress ?? 0);
  const [status, setStatus] = useState<CourseStatus>(course?.status || "watching");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);

    const payload = {
      title: title.trim(),
      url: url.trim() || undefined,
      platform: platform.trim() || undefined,
      notes: notes.trim() || undefined,
      progress,
      status,
    };

    try {
      const urlPath = course ? `/api/courses/${course._id}` : "/api/courses";
      const method = course ? "PUT" : "POST";

      const res = await fetch(urlPath, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        onSave(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{course ? "Edit Course" : "Add Course"}</DialogTitle>
        </DialogHeader>

        <form id="course-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Advanced TypeScript Patterns"
              required
            />
          </div>

          {/* URL */}
          <div className="space-y-1.5">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://udemy.com/course/..."
            />
          </div>

          {/* Platform */}
          <div className="space-y-1.5">
            <Label htmlFor="platform">Platform</Label>
            <Input
              id="platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder="Udemy, Coursera, YouTube..."
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Course notes, key takeaways..."
              className="w-full h-20 bg-background border border-input rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-ring"
            />
          </div>

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="progress">Progress</Label>
              <span className="text-sm text-muted-foreground font-medium">
                {progress}%
              </span>
            </div>
            <Slider
              id="progress"
              value={[progress]}
              onValueChange={(vals) => setProgress(Array.isArray(vals) ? vals[0] : vals)}
              min={0}
              max={100}
              step={5}
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as CourseStatus)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="watching">Watching</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="course-form"
            disabled={isSubmitting || !title.trim()}
          >
            {isSubmitting ? "Saving..." : course ? "Update" : "Add Course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = ({
  filter,
  onAdd,
}: {
  filter: CourseStatus | "all";
  onAdd: () => void;
}) => {
  const messages: Record<CourseStatus | "all", { title: string; body: string }> = {
    all: {
      title: "No courses yet",
      body: "Start tracking your learning journey by adding your first course.",
    },
    watching: {
      title: "Nothing in progress",
      body: "Start a course you're currently watching.",
    },
    completed: {
      title: "No completed courses",
      body: "Finish a course and it'll show up here.",
    },
    paused: {
      title: "No paused courses",
      body: "Paused courses will appear here.",
    },
  };

  const msg = messages[filter];

  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
        <GraduationCap size={24} className="text-gray-500" />
      </div>
      <p className="text-gray-400 text-lg mb-2">{msg.title}</p>
      <p className="text-gray-600 text-sm mb-6 max-w-sm mx-auto">{msg.body}</p>
      <Button onClick={onAdd} className="gap-2">
        <Plus size={16} /> Add Course
      </Button>
    </div>
  );
};

// ─── Main View ────────────────────────────────────────────────────────────────

export const CoursesView = () => {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<CourseStatus | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Fetch courses
  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ["courses"],
    queryFn: async () => {
      const res = await fetch("/api/courses");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<Course>) => {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ _id, ...data }: Partial<Course> & { _id: string }) => {
      const res = await fetch(`/api/courses/${_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
  });

  // Filter & sort
  const filtered = courses
    .filter((c) => statusFilter === "all" || c.status === statusFilter)
    .sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "progress") return b.progress - a.progress;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const counts: Record<CourseStatus | "all", number> = {
    all: courses.length,
    watching: courses.filter((c) => c.status === "watching").length,
    completed: courses.filter((c) => c.status === "completed").length,
    paused: courses.filter((c) => c.status === "paused").length,
  };

  const openAddModal = () => {
    setEditingCourse(null);
    setIsModalOpen(true);
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  const handleSave = (savedCourse: Course) => {
    if (editingCourse) {
      queryClient.setQueryData<Course[]>(["courses"], (old) =>
        old?.map((c) => (c._id === savedCourse._id ? savedCourse : c))
      );
    } else {
      queryClient.setQueryData<Course[]>(["courses"], (old) => [
        savedCourse,
        ...(old || []),
      ]);
    }
    setIsModalOpen(false);
    setEditingCourse(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this course?")) return;
    deleteMutation.mutate(id);
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        {/* Status filter tabs */}
        <div className="flex flex-wrap gap-2">
          {(["all", "watching", "completed", "paused"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-medium transition-all border",
                statusFilter === f
                  ? "bg-primary text-white border-primary"
                  : "border-border text-gray-400 hover:text-white hover:border-primary/40 bg-surface"
              )}
            >
              {f === "all" ? "All" : STATUS_CONFIG[f].label}
              <span className="ml-1.5 opacity-60">{counts[f]}</span>
            </button>
          ))}
        </div>

        {/* Sort & Add */}
        <div className="flex items-center gap-3">
          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as SortOption)}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={openAddModal} className="gap-2">
            <Plus size={16} /> Add Course
          </Button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CourseCardSkeleton />
          <CourseCardSkeleton />
          <CourseCardSkeleton />
        </div>
      ) : filtered.length > 0 ? (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filtered.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <EmptyState filter={statusFilter} onAdd={openAddModal} />
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <CourseModal
            course={editingCourse}
            onClose={() => {
              setIsModalOpen(false);
              setEditingCourse(null);
            }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
