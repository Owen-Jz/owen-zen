"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Edit2, Trash2, Clock, Calendar, Search, Twitter, Linkedin, Instagram, Loader2, Inbox, CalendarPlus } from "lucide-react";
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
  strategy?: string;
  createdAt: string;
}

type FilterType = 'all' | 'idea' | 'draft';

// Time slots with 15-minute granularity
const TIME_SLOTS = Array.from({ length: 96 }, (_, i) => {
  const hours = Math.floor(i / 4);
  const minutes = (i % 4) * 15;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
});

export const PostBucketView = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [schedulingPost, setSchedulingPost] = useState<Post | null>(null);

  // Form state for post
  const [content, setContent] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["twitter"]);
  const [strategy, setStrategy] = useState("");
  const [imageIdea, setImageIdea] = useState("");
  const [postType, setPostType] = useState<'idea' | 'draft'>('idea');

  // Form state for scheduling
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [scheduling, setScheduling] = useState(false);

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

  const openScheduleModal = (post: Post) => {
    setSchedulingPost(post);
    // Default to today
    const today = new Date().toISOString().split('T')[0];
    setScheduleDate(today);
    setScheduleTime("09:00");
    setIsScheduleModalOpen(true);
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

  const handleSchedule = async () => {
    if (!schedulingPost || !scheduleDate || !scheduleTime) return;

    setScheduling(true);
    try {
      const [hours, minutes] = scheduleTime.split(':').map(Number);
      const scheduledDateTime = new Date(scheduleDate);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      await fetch(`/api/posts/${schedulingPost._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledFor: scheduledDateTime.toISOString(),
          status: 'scheduled'
        })
      });

      setIsScheduleModalOpen(false);
      setSchedulingPost(null);
      fetchPosts();
    } catch (error) {
      console.error("Failed to schedule post", error);
    } finally {
      setScheduling(false);
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

                {/* Schedule Button */}
                <div className="pt-3 border-t border-border/50">
                  <button
                    onClick={() => openScheduleModal(post)}
                    className="w-full py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    <CalendarPlus size={14} />
                    Schedule to Calendar
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Post Modal */}
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

      {/* Schedule Modal */}
      <AnimatePresence>
        {isScheduleModalOpen && schedulingPost && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-border flex justify-between items-center bg-surface">
                <h3 className="text-lg font-bold text-white">Schedule Post</h3>
                <button onClick={() => setIsScheduleModalOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10"><X size={20} /></button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="text-xs uppercase font-bold text-gray-500 mb-2 block">Post Preview</label>
                  <p className="text-sm text-gray-300 bg-background p-3 rounded-lg line-clamp-2">
                    {schedulingPost.content}
                  </p>
                </div>

                <div>
                  <label className="text-xs uppercase font-bold text-gray-500 mb-2 block">Date</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase font-bold text-gray-500 mb-2 block">Time</label>
                  <select
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                  >
                    {TIME_SLOTS.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleSchedule}
                  disabled={scheduling || !scheduleDate}
                  className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {scheduling ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <CalendarPlus size={18} />
                      Schedule to Calendar
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
