"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Copy,
  Check,
  Clock,
  Image,
  Video,
  FileText,
  Plus,
  Trash2,
  Save,
  Edit2,
  AlertCircle,
  Loader2,
  Instagram,
  Twitter,
  Linkedin,
  Link2,
  PlusCircle,
  XCircle,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Types
type Network = "instagram" | "twitter" | "linkedin";
type PostStatus = "draft" | "scheduled" | "published" | "failed";

interface MediaUrl {
  url: string;
  type: "image" | "video";
  mimeType?: string;
}

interface ContentPost {
  _id: string;
  network: Network;
  caption: string;
  mediaUrls: MediaUrl[];
  notes: string;
  scheduledAt: string;
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  network: Network;
  caption: string;
  mediaUrls: MediaUrl[];
  notes: string;
  scheduledTime: string;
  status: PostStatus;
}

// Network colors
const NETWORK_COLORS: Record<Network, string> = {
  instagram: "bg-purple-500",
  twitter: "bg-blue-400",
  linkedin: "bg-cyan-500",
};

const NETWORK_BG_COLORS: Record<Network, string> = {
  instagram: "bg-purple-500/20 border-purple-500/50 text-purple-400",
  twitter: "bg-blue-400/20 border-blue-400/50 text-blue-400",
  linkedin: "bg-cyan-500/20 border-cyan-500/50 text-cyan-400",
};

const NETWORK_ICON_COMPONENTS: Record<Network, React.ReactNode> = {
  instagram: <Instagram size={14} />,
  twitter: <Twitter size={14} />,
  linkedin: <Linkedin size={14} />,
};

// Time slots with 15-minute granularity
const TIME_SLOTS = Array.from({ length: 96 }, (_, i) => {
  const hours = Math.floor(i / 4);
  const minutes = (i % 4) * 15;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
});

// Character limits
const CHARACTER_LIMITS: Record<Network, number> = {
  twitter: 2200,
  instagram: 10000,
  linkedin: 10000,
};

const getDefaultFormData = (date: Date): FormData => ({
  network: "instagram",
  caption: "",
  mediaUrls: [],
  notes: "",
  scheduledTime: "09:00",
  status: "draft",
});

export const ContentCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState<Network[]>(["instagram", "twitter", "linkedin"]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [calendarId, setCalendarId] = useState<string | null>(null);

  // State for Post model posts (from Post Bucket)
  const [bucketPosts, setBucketPosts] = useState<any[]>([]);
  const [pendingSchedulePost, setPendingSchedulePost] = useState<any>(null);

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(getDefaultFormData(new Date()));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>("");

  // Get month/year from URL or state
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  // Fetch posts for current month
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const networkParam = filters.length > 0 ? `&networks=${filters.join(",")}` : "";
      const res = await fetch(`/api/content-calendar?month=${month}&year=${year}${networkParam}`);
      const json = await res.json();
      if (json.success) {
        setPosts(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  }, [month, year, filters]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Fetch posts with scheduledFor from Post model
  const fetchBucketPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/posts?scheduled=true");
      const json = await res.json();
      if (json.success) {
        setBucketPosts(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch bucket posts:", error);
    }
  }, []);

  useEffect(() => {
    fetchBucketPosts();
  }, [fetchBucketPosts]);

  // Update URL when filters change
  useEffect(() => {
    const url = new URL(window.location.href);
    if (filters.length === 3) {
      url.searchParams.delete("networks");
    } else {
      url.searchParams.set("networks", filters.join(","));
    }
    window.history.replaceState({}, "", url.toString());
  }, [filters]);

  // Initialize or get calendar ID
  useEffect(() => {
    const initCalendar = async () => {
      try {
        const res = await fetch("/api/content-calendar/calendar", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const json = await res.json();

        if (json.success && json.data) {
          setCalendarId(json.data._id);
        } else {
          const createRes = await fetch("/api/content-calendar/calendar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          const createJson = await createRes.json();
          if (createJson.success) {
            setCalendarId(createJson.data._id);
          }
        }
      } catch (error) {
        console.error("Failed to initialize calendar:", error);
      }
    };

    initCalendar();
  }, []);

  // Calendar logic
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    const days: Date[] = [];
    let current = new Date(startDate);

    while (current <= lastDay || days.length % 7 !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const calendarDays = getDaysInMonth(currentDate);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Get posts for a specific date
  const getPostsForDate = useCallback((date: Date) => {
    const dateStr = date.toISOString().split("T")[0];

    // Native ContentCalendar posts
    const dayPosts = posts.filter((post) => {
      const postDate = new Date(post.scheduledAt).toISOString().split("T")[0];
      return postDate === dateStr;
    });

    // Transform Post model posts to calendar format
    const bucketPostsForDate = bucketPosts.filter((post) => {
      if (!post.scheduledFor) return false;
      const postDate = new Date(post.scheduledFor).toISOString().split("T")[0];
      return postDate === dateStr;
    }).map(post => ({
      _id: `bucket-${post._id}`,
      network: Array.isArray(post.platforms) ? post.platforms[0] : post.platforms,
      caption: post.content,
      mediaUrls: post.imageUrl ? [{ url: post.imageUrl, type: "image" as const }] : [],
      notes: post.strategy || '',
      scheduledAt: post.scheduledFor,
      status: 'scheduled' as const,
      isFromBucket: true,
      originalPostId: post._id
    }));

    // Combine both
    const allPosts = [...dayPosts, ...bucketPostsForDate];
    const networks = new Set<Network>(allPosts.map((p) => p.network));
    return { posts: allPosts, networks };
  }, [posts, bucketPosts]);

  // Get posts for selected date in modal
  const getSelectedDayPosts = useCallback((): ContentPost[] => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.toISOString().split("T")[0];

    // Native ContentCalendar posts
    const dayPosts = posts.filter((post) => {
      const postDate = new Date(post.scheduledAt).toISOString().split("T")[0];
      return postDate === dateStr;
    });

    // Bucket posts (Post model)
    const bucketPostsForDate = bucketPosts.filter((post) => {
      if (!post.scheduledFor) return false;
      const postDate = new Date(post.scheduledFor).toISOString().split("T")[0];
      return postDate === dateStr;
    }).map(post => ({
      _id: `bucket-${post._id}`,
      network: Array.isArray(post.platforms) ? post.platforms[0] : post.platforms,
      caption: post.content,
      mediaUrls: post.imageUrl ? [{ url: post.imageUrl, type: "image" as const }] : [],
      notes: post.strategy || '',
      scheduledAt: post.scheduledFor,
      status: 'scheduled' as const,
      createdAt: post.createdAt || new Date().toISOString(),
      updatedAt: post.updatedAt || new Date().toISOString(),
      isFromBucket: true,
      originalPostId: post._id
    }));

    return [...dayPosts, ...bucketPostsForDate];
  }, [selectedDate, posts, bucketPosts]);

  // Handle dropped post from Post Bucket
  const handlePostDrop = (post: any, date: Date) => {
    setSelectedDate(date);
    setPendingSchedulePost(post);
    setIsModalOpen(true);
    setIsEditing(true);
    setEditingPostId(null);
    setFormData(getDefaultFormData(date));
    setFormError(null);
  };

  // Navigation
  const nextMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  const prevMonth = () => {
    const prev = new Date(currentDate);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentDate(prev);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Filter handlers
  const toggleFilter = (network: Network) => {
    setFilters((prev) =>
      prev.includes(network)
        ? prev.filter((n) => n !== network)
        : [...prev, network]
    );
  };

  // Copy to clipboard
  const copyPost = async (post: ContentPost) => {
    const text = `${post.caption}\n\n${post.mediaUrls.map((m) => m.url).join("\n")}`;
    await navigator.clipboard.writeText(text);
    setCopiedId(post._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Format date for display
  const formatDateHeader = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Open modal for a specific date
  const openDayModal = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
    setIsEditing(false);
    setEditingPostId(null);
    setFormData(getDefaultFormData(date));
    setFormError(null);
  };

  // Start editing a post
  const startEditPost = (post: ContentPost) => {
    const postDate = new Date(post.scheduledAt);
    const timeStr = `${postDate.getHours().toString().padStart(2, "0")}:${postDate.getMinutes().toString().padStart(2, "0")}`;
    setFormData({
      network: post.network,
      caption: post.caption,
      mediaUrls: [...post.mediaUrls],
      notes: post.notes,
      scheduledTime: timeStr,
      status: post.status,
    });
    setEditingPostId(post._id);
    setIsEditing(true);
    setFormError(null);
  };

  // Start creating a new post
  const startNewPost = () => {
    if (!selectedDate) return;
    setFormData(getDefaultFormData(selectedDate));
    setEditingPostId(null);
    setIsEditing(true);
    setFormError(null);
  };

  // Cancel editing
  const cancelEdit = () => {
    setIsEditing(false);
    setEditingPostId(null);
    setFormData(getDefaultFormData(selectedDate || new Date()));
    setFormError(null);
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  };

  // Validate media URL
  const validateMediaUrl = (url: string): { valid: boolean; type: "image" | "video" } => {
    const lowerUrl = url.toLowerCase();
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    const videoExts = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];

    for (const ext of videoExts) {
      if (lowerUrl.includes(ext)) {
        return { valid: true, type: "video" };
      }
    }
    for (const ext of imageExts) {
      if (lowerUrl.includes(ext)) {
        return { valid: true, type: "image" };
      }
    }
    // Default to image if no extension match
    return { valid: true, type: "image" };
  };

  // Add media URL
  const addMediaUrl = (type: "image" | "video") => {
    const currentImages = formData.mediaUrls.filter(m => m.type === "image").length;
    const currentVideos = formData.mediaUrls.filter(m => m.type === "video").length;

    if (type === "image" && currentImages >= 10) {
      setFormError("Maximum 10 images allowed");
      return;
    }
    if (type === "video" && currentVideos >= 1) {
      setFormError("Maximum 1 video allowed");
      return;
    }

    setFormData(prev => ({
      ...prev,
      mediaUrls: [...prev.mediaUrls, { url: "", type }]
    }));
  };

  // Update media URL
  const updateMediaUrl = (index: number, url: string) => {
    const newMediaUrls = [...formData.mediaUrls];
    const validated = validateMediaUrl(url);
    newMediaUrls[index] = { ...newMediaUrls[index], url, type: validated.type };
    setFormData(prev => ({ ...prev, mediaUrls: newMediaUrls }));
  };

  // Remove media URL
  const removeMediaUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      mediaUrls: prev.mediaUrls.filter((_, i) => i !== index)
    }));
  };

  // Save post
  const savePost = async (isAutoSave = false) => {
    // Handle scheduling from Post Bucket
    if (pendingSchedulePost) {
      const postId = pendingSchedulePost._id;
      const [hours, minutes] = formData.scheduledTime.split(":").map(Number);
      const scheduledDate = new Date(selectedDate!);
      scheduledDate.setHours(hours, minutes, 0, 0);

      try {
        const res = await fetch(`/api/posts/${postId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scheduledFor: scheduledDate.toISOString(),
            status: 'scheduled'
          })
        });

        if (res.ok) {
          await fetchBucketPosts();
          setPendingSchedulePost(null);
          setIsModalOpen(false);
          setIsEditing(false);
        }
      } catch (error) {
        console.error("Failed to schedule post:", error);
        setFormError("Failed to schedule post");
      }
      return;
    }

    if (!calendarId || !selectedDate) return;

    // Validate
    if (!formData.caption.trim()) {
      if (!isAutoSave) setFormError("Caption is required");
      return;
    }
    if (formData.caption.length > CHARACTER_LIMITS[formData.network]) {
      if (!isAutoSave) setFormError(`Caption exceeds ${CHARACTER_LIMITS[formData.network]} characters for ${formData.network}`);
      return;
    }

    const currentData = JSON.stringify(formData);
    if (currentData === lastSavedRef.current) return;

    setSaving(true);
    setFormError(null);

    try {
      // Build scheduled date
      const [hours, minutes] = formData.scheduledTime.split(":").map(Number);
      const scheduledDate = new Date(selectedDate);
      scheduledDate.setHours(hours, minutes, 0, 0);

      const payload = {
        network: formData.network,
        caption: formData.caption,
        mediaUrls: formData.mediaUrls.filter(m => m.url.trim()),
        notes: formData.notes,
        scheduledAt: scheduledDate.toISOString(),
        status: formData.status,
        calendarId,
      };

      let res;
      if (editingPostId) {
        // Update existing
        res = await fetch(`/api/content-calendar/${editingPostId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new
        res = await fetch("/api/content-calendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();

      if (json.success) {
        lastSavedRef.current = currentData;
        await fetchPosts();
        if (!isAutoSave) {
          cancelEdit();
        }
      } else {
        if (!isAutoSave) setFormError(json.error || "Failed to save post");
      }
    } catch (error) {
      if (!isAutoSave) setFormError("Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  // Delete post
  const deletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    setDeleting(postId);
    try {
      const res = await fetch(`/api/content-calendar/${postId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        await fetchPosts();
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
    } finally {
      setDeleting(null);
    }
  };

  // Auto-save effect
  useEffect(() => {
    if (!isEditing || !formData.caption.trim()) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      savePost(true);
    }, 30000); // 30 seconds

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formData]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, date: Date, index: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openDayModal(date);
    }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-300">
      {/* Filter Bar */}
      <div className="flex items-center gap-4 p-4 border-b border-border bg-surface/30">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-bold text-gray-500 tracking-wider">Filter:</span>
          <div className="flex gap-2">
            {(["instagram", "twitter", "linkedin"] as Network[]).map((network) => (
              <label
                key={network}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all text-xs font-medium",
                  filters.includes(network)
                    ? NETWORK_BG_COLORS[network]
                    : "bg-surface border border-border text-gray-500 hover:border-gray-500"
                )}
              >
                <input
                  type="checkbox"
                  checked={filters.includes(network)}
                  onChange={() => toggleFilter(network)}
                  className="sr-only"
                />
                {NETWORK_ICON_COMPONENTS[network]}
                <span className="capitalize">{network}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
          <span className={cn(
            "w-2 h-2 rounded-full",
            loading ? "bg-yellow-500 animate-pulse" : "bg-green-500"
          )} />
          {posts.length} posts this month
        </div>
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface/50">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h2>
          <div className="flex gap-1 items-center bg-surface border border-border rounded-lg p-1">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={goToToday}
              className="text-xs font-bold uppercase px-3 py-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-all"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-border bg-surface/20">
        {weekDays.map((day, i) => (
          <div
            key={i}
            className="py-3 text-center text-[10px] font-black uppercase tracking-widest text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-hidden">
        {calendarDays.map((d, i) => {
          const { posts: dayPosts, networks } = getPostsForDate(d);
          const isToday = d.toDateString() === new Date().toDateString();
          const isCurrentMonth = d.getMonth() === currentDate.getMonth();
          const hasPosts = dayPosts.length > 0;

          return (
            <div
              key={i}
              tabIndex={0}
              role="gridcell"
              aria-label={`${formatDateHeader(d)}${hasPosts ? `, ${dayPosts.length} posts` : ""}`}
              onClick={() => openDayModal(d)}
              onKeyDown={(e) => handleKeyDown(e, d, i)}
              className={cn(
                "min-h-[100px] border border-border/30 p-2 transition-all cursor-pointer flex flex-col hover:bg-surface/10 focus:outline-none focus:ring-2 focus:ring-primary",
                isToday && "bg-primary/5 ring-1 ring-primary/30",
                !isCurrentMonth && "opacity-30 grayscale"
              )}
            >
              <div
                className={cn(
                  "text-right text-xs font-mono mb-2",
                  isToday ? "text-primary font-bold" : "text-gray-500"
                )}
              >
                {d.getDate()}
              </div>

              {/* Network bars */}
              {hasPosts && filters.length > 0 && (
                <div className="flex-1 flex flex-col gap-1">
                  {Array.from(networks)
                    .filter((network) => filters.includes(network))
                    .map((network) => {
                      const count = dayPosts.filter((p) => p.network === network).length;
                      return (
                        <div
                          key={network}
                          className={cn(
                            "h-1.5 rounded-full",
                            NETWORK_COLORS[network]
                          )}
                          title={`${network}: ${count} post${count > 1 ? "s" : ""}`}
                        />
                      );
                    })}

                  <div className="text-[10px] text-gray-500 mt-1">
                    {dayPosts.length} post{dayPosts.length !== 1 ? "s" : ""}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Day Detail Modal */}
      <AnimatePresence>
        {isModalOpen && selectedDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface border border-border w-full max-w-2xl min-w-[500px] max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-border bg-surface/50 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {formatDateHeader(selectedDate)}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {getSelectedDayPosts().length} post{getSelectedDayPosts().length !== 1 ? "s" : ""} scheduled
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <button
                      onClick={startNewPost}
                      className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:brightness-110 transition-all"
                    >
                      <Plus size={16} />
                      Add Post
                    </button>
                  )}
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                    aria-label="Close modal"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isEditing ? (
                  /* Edit/Create Form */
                  <div className="p-4 space-y-4">
                    {formError && (
                      <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                        {formError}
                      </div>
                    )}

                    {/* Network */}
                    <div>
                      <label className="block text-xs uppercase font-bold text-gray-500 mb-2">Social Network</label>
                      <div className="flex gap-2">
                        {(["instagram", "twitter", "linkedin"] as Network[]).map((network) => (
                          <button
                            key={network}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, network }))}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-sm font-medium",
                              formData.network === network
                                ? NETWORK_BG_COLORS[network]
                                : "border-border text-gray-400 hover:border-gray-500"
                            )}
                          >
                            {NETWORK_ICON_COMPONENTS[network]}
                            <span className="capitalize">{network}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Time & Status */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase font-bold text-gray-500 mb-2">Scheduled Time</label>
                        <select
                          value={formData.scheduledTime}
                          onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                          className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-white focus:border-primary outline-none"
                        >
                          {TIME_SLOTS.map((time) => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs uppercase font-bold text-gray-500 mb-2">Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as PostStatus }))}
                          className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-white focus:border-primary outline-none"
                        >
                          <option value="draft">Draft</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="published">Published</option>
                          <option value="failed">Failed</option>
                        </select>
                      </div>
                    </div>

                    {/* Caption */}
                    <div>
                      <label className="block text-xs uppercase font-bold text-gray-500 mb-2">
                        Caption
                        <span className="ml-2 text-gray-600">
                          ({formData.caption.length} / {CHARACTER_LIMITS[formData.network]})
                        </span>
                      </label>
                      <textarea
                        value={formData.caption}
                        onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                        placeholder="Write your caption here..."
                        rows={5}
                        className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:border-primary outline-none resize-none"
                      />
                    </div>

                    {/* Media URLs */}
                    <div>
                      <label className="block text-xs uppercase font-bold text-gray-500 mb-2">Media URLs</label>
                      <div className="space-y-2 mb-2">
                        {formData.mediaUrls.map((media, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg border flex-1",
                              media.type === "video" ? "border-yellow-500/50 bg-yellow-500/10" : "border-border"
                            )}>
                              {media.type === "video" ? <Video size={14} className="text-yellow-400" /> : <Image size={14} className="text-gray-400" />}
                              <input
                                type="url"
                                value={media.url}
                                onChange={(e) => updateMediaUrl(idx, e.target.value)}
                                placeholder={`Enter ${media.type} URL...`}
                                className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none text-sm"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeMediaUrl(idx)}
                              className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => addMediaUrl("image")}
                          disabled={formData.mediaUrls.filter(m => m.type === "image").length >= 10}
                          className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-gray-400 hover:border-gray-500 hover:text-white transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Image size={14} />
                          Add Image ({formData.mediaUrls.filter(m => m.type === "image").length}/10)
                        </button>
                        <button
                          type="button"
                          onClick={() => addMediaUrl("video")}
                          disabled={formData.mediaUrls.filter(m => m.type === "video").length >= 1}
                          className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-gray-400 hover:border-gray-500 hover:text-white transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Video size={14} />
                          Add Video ({formData.mediaUrls.filter(m => m.type === "video").length}/1)
                        </button>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-xs uppercase font-bold text-gray-500 mb-2">
                        Notes
                        <span className="ml-2 text-gray-600">({formData.notes.length}/1000)</span>
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value.slice(0, 1000) }))}
                        placeholder="Add any notes or reminders..."
                        rows={3}
                        className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:border-primary outline-none resize-none"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="flex-1 px-4 py-3 rounded-xl border border-border text-gray-400 hover:bg-white/5 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => savePost(false)}
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white hover:brightness-110 transition-all font-bold disabled:opacity-50"
                      >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {editingPostId ? "Update Post" : "Save Post"}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Posts List */
                  <div className="p-4 space-y-3">
                    {getSelectedDayPosts().length === 0 ? (
                      <div className="text-center py-10 text-gray-500">
                        <AlertCircle size={40} className="mx-auto mb-3 opacity-50" />
                        <p>No posts scheduled for this day</p>
                        <p className="text-xs mt-1">Click "Add Post" to create your first post</p>
                      </div>
                    ) : (
                      getSelectedDayPosts()
                        .filter((post) => filters.includes(post.network))
                        .map((post) => (
                          <motion.div
                            key={post._id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                              "border rounded-xl p-4 transition-all",
                              post.status === "failed" && "border-red-500/50 bg-red-500/5",
                              post.status === "published" && "border-green-500/50 bg-green-500/5",
                              post.status === "scheduled" && "border-yellow-500/50 bg-yellow-500/5",
                              post.status === "draft" && "border-border bg-surface/50"
                            )}
                          >
                            {/* Post Header */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
                                    NETWORK_BG_COLORS[post.network]
                                  )}
                                >
                                  {NETWORK_ICON_COMPONENTS[post.network]}
                                  <span className="capitalize">{post.network}</span>
                                </span>
                                <span
                                  className={cn(
                                    "px-2 py-1 rounded-full text-xs font-medium",
                                    post.status === "failed" && "bg-red-500/20 text-red-400",
                                    post.status === "published" && "bg-green-500/20 text-green-400",
                                    post.status === "scheduled" && "bg-yellow-500/20 text-yellow-400",
                                    post.status === "draft" && "bg-gray-500/20 text-gray-400"
                                  )}
                                >
                                  {post.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock size={12} />
                                {formatTime(post.scheduledAt)}
                              </div>
                            </div>

                            {/* Caption */}
                            <div className="mb-3">
                              <p className="text-sm text-gray-200 whitespace-pre-wrap line-clamp-4">
                                {post.caption}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {post.caption.length} / {CHARACTER_LIMITS[post.network]} characters
                              </p>
                            </div>

                            {/* Media */}
                            {post.mediaUrls.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {post.mediaUrls.slice(0, 4).map((media, idx) => (
                                  <div
                                    key={idx}
                                    className="relative w-16 h-16 rounded-lg overflow-hidden bg-black/50"
                                  >
                                    {media.type === "image" ? (
                                      <img
                                        src={media.url}
                                        alt={`Media ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Video size={16} className="text-gray-500" />
                                      </div>
                                    )}
                                    {media.type === "video" && (
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                        <Video size={16} className="text-white" />
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {post.mediaUrls.length > 4 && (
                                  <div className="w-16 h-16 rounded-lg bg-surface border border-border flex items-center justify-center text-xs text-gray-500">
                                    +{post.mediaUrls.length - 4}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Notes */}
                            {post.notes && (
                              <div className="mb-3 p-2 bg-black/20 rounded-lg">
                                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                                  <FileText size={12} />
                                  <span>Notes</span>
                                </div>
                                <p className="text-xs text-gray-400">{post.notes}</p>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-2 border-t border-border/50">
                              <button
                                onClick={() => startEditPost(post)}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors text-sm font-medium"
                              >
                                <Edit2 size={14} />
                                Edit
                              </button>
                              <button
                                onClick={() => copyPost(post)}
                                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border text-gray-400 hover:text-white hover:border-gray-500 transition-colors text-sm"
                              >
                                {copiedId === post._id ? <Check size={14} /> : <Copy size={14} />}
                              </button>
                              <button
                                onClick={() => deletePost(post._id)}
                                disabled={deleting === post._id}
                                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm disabled:opacity-50"
                              >
                                {deleting === post._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                              </button>
                            </div>
                          </motion.div>
                        ))
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContentCalendar;
